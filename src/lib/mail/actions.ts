"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentProfile } from "@/lib/auth/current-user";
import {
  sendLetter,
  sendCheck,
  activeLetterProvider,
  activeCheckProvider,
} from ".";
import { renderMerge, type MergeContext } from "./merge";

// Server action — returns the total page count across a template's
// attachment PDFs so the modal can show a real "N pages per piece"
// figure in the cost estimate instead of guessing. We only count PDF
// pages (pdfjs-dist parses the file headers); Word docs return null
// because page count isn't knowable without rendering the doc.
export async function getMailTemplateAttachmentPageCount(
  templateId: string
): Promise<
  | { ok: true; pdf_pages: number; pdf_files: number }
  | { ok: false; error: string }
> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  const sb = await createClient();
  const { data: tpl } = await sb
    .from("mail_templates")
    .select("attachment_paths")
    .eq("id", templateId)
    .maybeSingle();
  if (!tpl) return { ok: false, error: "Template not found" };
  const paths = ((tpl.attachment_paths as string[] | null) ?? []).filter(
    (p) => p.toLowerCase().endsWith(".pdf")
  );
  if (paths.length === 0) {
    return { ok: true, pdf_pages: 0, pdf_files: 0 };
  }
  const admin = createServiceClient();
  let total = 0;
  for (const p of paths) {
    const dl = await admin.storage.from("mail-templates").download(p);
    if (dl.error || !dl.data) continue;
    const bytes = new Uint8Array(await dl.data.arrayBuffer());
    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      // Disable the worker — pdfjs's worker doesn't work in a Node
      // server-action context. Plain main-thread parse is fine for
      // page counting since we don't render any pages.
      (pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } })
        .GlobalWorkerOptions.workerSrc = "";
      const doc = await (
        pdfjs as unknown as {
          getDocument: (opts: { data: Uint8Array; useWorker: false }) => {
            promise: Promise<{ numPages: number }>;
          };
        }
      ).getDocument({ data: bytes, useWorker: false }).promise;
      total += doc.numPages ?? 0;
    } catch {
      // Skip on parse failure — better to undercount than to invent.
    }
  }
  return { ok: true, pdf_pages: total, pdf_files: paths.length };
}

// Server action — checks which fonts a template's docx references and
// flags any that aren't in our Gotenberg renderer's bundled font set.
// Used by the Mail Templates editor right after upload so the user gets
// an inline warning when their docx uses something like a designer-only
// font that won't render correctly in the PDF the printer receives.
export async function validateTemplateFonts(input: {
  template_id: string;
}): Promise<
  | {
      ok: true;
      fonts: string[];
      unsupported: string[];
    }
  | { ok: false; error: string }
> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  const sb = await createClient();
  const { data: tpl } = await sb
    .from("mail_templates")
    .select("id, docx_path")
    .eq("id", input.template_id)
    .maybeSingle();
  if (!tpl || !tpl.docx_path) {
    return { ok: true, fonts: [], unsupported: [] };
  }
  const admin = createServiceClient();
  const dl = await admin.storage
    .from("mail-templates")
    .download(tpl.docx_path as string);
  if (dl.error || !dl.data) {
    return {
      ok: false,
      error: `Could not load template: ${dl.error?.message ?? "unknown"}`,
    };
  }
  const buffer = Buffer.from(await dl.data.arrayBuffer());
  const { detectDocxFonts, isFontSupported } = await import("./fonts");
  const fonts = await detectDocxFonts(buffer);
  const unsupported = fonts.filter((f) => !isFontSupported(f));
  return { ok: true, fonts, unsupported };
}

// Server action — same check but for a freshly-uploaded docx path that
// hasn't been saved as a template row yet. Lets the upload flow surface
// font issues before the user clicks Save Template.
export async function validateDocxPathFonts(input: {
  docx_path: string;
}): Promise<
  | { ok: true; fonts: string[]; unsupported: string[] }
  | { ok: false; error: string }
> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  if (!input.docx_path || !input.docx_path.toLowerCase().endsWith(".docx")) {
    return { ok: true, fonts: [], unsupported: [] };
  }
  const admin = createServiceClient();
  const dl = await admin.storage
    .from("mail-templates")
    .download(input.docx_path);
  if (dl.error || !dl.data) {
    return {
      ok: false,
      error: `Could not load uploaded file: ${dl.error?.message ?? "unknown"}`,
    };
  }
  const buffer = Buffer.from(await dl.data.arrayBuffer());
  const { detectDocxFonts, isFontSupported } = await import("./fonts");
  const fonts = await detectDocxFonts(buffer);
  const unsupported = fonts.filter((f) => !isFontSupported(f));
  return { ok: true, fonts, unsupported };
}

// Server action — given a template and a recipient's contact-level merge
// context, returns the merged .docx as a base64 string. Called by the
// Send Mail modal's preview pane so the user sees the exact document the
// recipient will receive, with their name/address/case data filled in.
export async function previewMailMergeDocx(input: {
  template_id: string;
  recipient_merge_context: MergeContext;
}): Promise<
  | { ok: true; base64: string; kind: "pdf" | "html" }
  | { ok: false; error: string }
> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  const sb = await createClient();
  const { data: tpl } = await sb
    .from("mail_templates")
    .select("id, docx_path")
    .eq("id", input.template_id)
    .maybeSingle();
  if (!tpl || !tpl.docx_path) {
    return { ok: false, error: "Template not found or has no Word document" };
  }
  const { data: org } = await sb
    .from("orgs")
    .select(
      "name, legal_name, address_line1, address_line2, city, region, postal_code, country, signer_name, signer_title"
    )
    .eq("id", profile.orgId)
    .single();
  if (!org) return { ok: false, error: "Org settings missing" };
  const today = new Date();
  const fullCtx: MergeContext = {
    "sender.company_name": (org.name as string | null) ?? "",
    "sender.legal_name":
      (org.legal_name as string | null) ?? (org.name as string | null) ?? "",
    "sender.signer_name": (org.signer_name as string | null) ?? "",
    "sender.signer_title": (org.signer_title as string | null) ?? "",
    "sender.signature_image": "",
    "sender.address": [
      org.address_line1,
      org.address_line2,
      `${org.city}, ${org.region} ${org.postal_code}`,
    ]
      .filter(Boolean)
      .join("\n"),
    ...input.recipient_merge_context,
    "system.today": today.toLocaleDateString("en-US"),
    "system.today_long": today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
  const admin = createServiceClient();
  const dl = await admin.storage
    .from("mail-templates")
    .download(tpl.docx_path as string);
  if (dl.error || !dl.data) {
    return {
      ok: false,
      error: `Could not load template: ${dl.error?.message ?? "unknown"}`,
    };
  }
  const buffer = Buffer.from(await dl.data.arrayBuffer());
  const merged = await fillDocxTemplate(buffer, fullCtx);
  if (!merged.ok) return { ok: false, error: merged.error };
  // Convert the merged docx to a PDF via Gotenberg so the preview shows
  // pixel-accurate layout. Gotenberg uses LibreOffice headless — same
  // engine the printer uses for final rendering, so the preview matches
  // what gets mailed.
  //
  // SuperDoc was the previous fallback but its docx renderer mangled
  // custom fonts, so we removed it from the preview path (per Bree).
  // When Gotenberg isn't configured we now fall back to mammoth
  // (docx → HTML) which strips fancy formatting but at least surfaces
  // the merged text content instead of nothing.
  const gotenbergUrl = process.env.GOTENBERG_URL;
  if (!gotenbergUrl) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.convertToHtml({ buffer: merged.value });
      const wrapped = `<!doctype html><html><head><meta charset="utf-8"><style>
        body { font-family: Georgia, 'Times New Roman', serif; padding: 40px 60px; color: #0a0d14; }
        p { margin: 0 0 10px; line-height: 1.45; }
        h1, h2, h3 { font-weight: 600; margin: 16px 0 8px; }
        table { border-collapse: collapse; }
        td, th { border: 1px solid #ddd; padding: 6px 10px; }
      </style></head><body>${result.value}</body></html>`;
      return {
        ok: true,
        base64: Buffer.from(wrapped, "utf-8").toString("base64"),
        kind: "html",
      };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error
            ? `Preview render failed: ${err.message}`
            : "Preview render failed",
      };
    }
  }
  try {
    const fd = new FormData();
    fd.append(
      "files",
      new Blob([new Uint8Array(merged.value)], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
      "document.docx"
    );
    const res = await fetch(`${gotenbergUrl}/forms/libreoffice/convert`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Gotenberg PDF render failed: ${res.status} ${await res.text()}`,
      };
    }
    const pdfBytes = Buffer.from(await res.arrayBuffer());
    return { ok: true, base64: pdfBytes.toString("base64"), kind: "pdf" };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Gotenberg request failed: ${err.message}`
          : "Gotenberg request failed",
    };
  }
}

// Server action — render a preview of a previously-sent mail_job. For
// HTML-body sends, we already have the merged HTML stored on the
// mail_jobs row and just return it. For Word-template sends we
// reconstruct a minimal merge context (sender from the org, recipient
// from mail_jobs.recipient_* fields) and re-run the docxtemplater +
// Gotenberg/mammoth path used at send time. Lead-specific tokens are
// best-effort: if a lead_id is on the row, we refetch the lead and
// surface the case identifier + estimated surplus. Templates that lean
// heavily on niche lead fields may show [Missing: ...] placeholders;
// that's the trade-off for not storing the rendered PDF at send time.
export async function previewMailJob(input: {
  mail_job_id: string;
}): Promise<
  | { ok: true; kind: "html"; html: string; recipient_name: string }
  | { ok: true; kind: "pdf"; base64: string; recipient_name: string }
  | { ok: false; error: string }
> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  const sb = await createClient();

  // Try the select with rendered_pdf_path first (migration 0131
  // applied). Fall back to the legacy select if the column isn't
  // there yet — keeps the page working during the brief window
  // between code deploy and migration apply.
  let job:
    | (Record<string, unknown> & { rendered_pdf_path?: string | null })
    | null = null;
  const withCache = await sb
    .from("mail_jobs")
    .select(
      "id, lead_id, template_id, recipient_name, recipient_address_line1, recipient_address_line2, recipient_city, recipient_state, recipient_postal_code, body_html, rendered_pdf_path"
    )
    .eq("id", input.mail_job_id)
    .maybeSingle();
  if (withCache.error) {
    const fallback = await sb
      .from("mail_jobs")
      .select(
        "id, lead_id, template_id, recipient_name, recipient_address_line1, recipient_address_line2, recipient_city, recipient_state, recipient_postal_code, body_html"
      )
      .eq("id", input.mail_job_id)
      .maybeSingle();
    job = fallback.data;
  } else {
    job = withCache.data;
  }
  if (!job) return { ok: false, error: "Mail job not found" };

  // Cache hit: rendered PDF already sits in storage from send time.
  // Skipped when the column isn't there yet (migration 0131 pending).
  const cachedPath = (job.rendered_pdf_path as string | null | undefined) ?? null;
  if (cachedPath) {
    const admin = createServiceClient();
    const dl = await admin.storage.from("mail-renders").download(cachedPath);
    if (!dl.error && dl.data) {
      const buf = Buffer.from(await dl.data.arrayBuffer());
      return {
        ok: true,
        kind: "pdf",
        base64: buf.toString("base64"),
        recipient_name: (job.recipient_name as string | null) ?? "",
      };
    }
  }

  // HTML-body path: we stored the merged HTML at send time. Just hand
  // it back. The modal renders it in a sandboxed iframe.
  const storedBody = (job.body_html as string | null) ?? "";
  if (storedBody.trim().length > 0) {
    return {
      ok: true,
      kind: "html",
      html: storedBody,
      recipient_name: (job.recipient_name as string | null) ?? "",
    };
  }

  // Word-template path with no cached PDF: re-render through the same
  // docxtemplater + Gotenberg/mammoth pipeline previewMailMergeDocx
  // uses. Reconstruct the merge context as best we can.
  const templateId = job.template_id as string | null;
  if (!templateId) {
    return {
      ok: false,
      error: "No stored body and no template — cannot render preview",
    };
  }

  // Pull a fresh lead context so case-specific merge tokens have values.
  let leadContext: MergeContext = {};
  const leadId = job.lead_id as string | null;
  if (leadId) {
    const { data: lead } = await sb
      .from("leads")
      .select("lead_id, address, city, state, postal_code, estimated_surplus, attorney_name")
      .eq("id", leadId)
      .maybeSingle();
    if (lead) {
      leadContext = {
        "lead.case_id": (lead.lead_id as string | null) ?? "",
        "lead.address": (lead.address as string | null) ?? "",
        "lead.city": (lead.city as string | null) ?? "",
        "lead.state": (lead.state as string | null) ?? "",
        "lead.postal_code": (lead.postal_code as string | null) ?? "",
        "lead.estimated_surplus": (lead.estimated_surplus as number | null) ?? "",
        "lead.attorney": (lead.attorney_name as string | null) ?? "",
      };
    }
  }

  // Recipient context — pulled from the mail_jobs row, since the
  // original merge_context isn't persisted.
  const recipientName = (job.recipient_name as string | null) ?? "";
  const [firstName, ...rest] = recipientName.split(/\s+/);
  const recipientContext: MergeContext = {
    "contact.full_name": recipientName,
    "contact.first_name": firstName ?? "",
    "contact.last_name": rest.join(" "),
    "contact.line1": (job.recipient_address_line1 as string | null) ?? "",
    "contact.line2": (job.recipient_address_line2 as string | null) ?? "",
    "contact.city": (job.recipient_city as string | null) ?? "",
    "contact.state": (job.recipient_state as string | null) ?? "",
    "contact.postal_code": (job.recipient_postal_code as string | null) ?? "",
  };

  const preview = await previewMailMergeDocx({
    template_id: templateId,
    recipient_merge_context: { ...recipientContext, ...leadContext },
  });
  if (!preview.ok) return { ok: false, error: preview.error };
  return {
    ok: true,
    kind: preview.kind,
    base64: preview.kind === "pdf" ? preview.base64 : "",
    html:
      preview.kind === "html"
        ? Buffer.from(preview.base64, "base64").toString("utf-8")
        : "",
    recipient_name: recipientName,
  } as
    | { ok: true; kind: "html"; html: string; recipient_name: string }
    | { ok: true; kind: "pdf"; base64: string; recipient_name: string };
}

// Fetches the rendered check PDF for a mail_job from Lob and returns
// it as base64 so the client can display it in an iframe without
// exposing the Lob URL or our API key. Only valid for mail_jobs where
// include_check=true and provider="lob" — older click2mail rows or
// non-check pieces return an error.
export async function previewCheckJob(input: {
  mail_job_id: string;
}): Promise<
  | { ok: true; base64: string; recipient_name: string }
  | { ok: false; error: string }
> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  const sb = await createClient();
  const { data: job } = await sb
    .from("mail_jobs")
    .select(
      "id, provider, provider_id, include_check, tracking_url, recipient_name"
    )
    .eq("id", input.mail_job_id)
    .maybeSingle();
  if (!job) return { ok: false, error: "Mail job not found" };
  if (!job.include_check) {
    return { ok: false, error: "This piece doesn't have a check attached" };
  }

  // Sample seeded rows have provider_id starting with "sample_" and
  // a fake USPS tracking URL stored on tracking_url (not a real
  // check PDF URL). Detect them and surface a specific message
  // instead of failing the proxy fetch.
  const providerId = (job.provider_id as string | null) ?? "";
  if (providerId.startsWith("sample_")) {
    return {
      ok: false,
      error: "Sample data, no check preview is available.",
    };
  }

  // Stub provider (sent without a real provider configured) won't
  // have a real check PDF either.
  if (job.provider === "stub") {
    return {
      ok: false,
      error: "Check preview isn't available for this piece.",
    };
  }

  const checkUrl = (job.tracking_url as string | null) ?? null;
  if (!checkUrl) {
    return {
      ok: false,
      error: "Check preview isn't ready yet. Try again in a minute.",
    };
  }
  try {
    // Provider's check URL is signed and short-lived; proxy through
    // the server so the browser never hits a provider-branded host.
    // Send the API key as a Bearer token in case the URL requires
    // it (some providers gate even signed URLs behind auth).
    const apiKey = process.env.LOB_API_KEY ?? "";
    const headers: Record<string, string> = {};
    if (apiKey) {
      const encoded = Buffer.from(`${apiKey}:`).toString("base64");
      headers.Authorization = `Basic ${encoded}`;
    }
    const res = await fetch(checkUrl, { method: "GET", headers });
    if (!res.ok) {
      console.error(
        "previewCheckJob fetch failed",
        res.status,
        await res.text().catch(() => "")
      );
      return {
        ok: false,
        error: "Couldn't load the check preview right now. Try again.",
      };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    // Pass the bytes through regardless of content-type — the iframe
    // on the client handles PDF, PNG, JPG. An over-strict content-
    // type check was previously rejecting valid responses.
    return {
      ok: true,
      base64: buf.toString("base64"),
      recipient_name: (job.recipient_name as string | null) ?? "",
    };
  } catch (err) {
    console.error("previewCheckJob threw", err);
    return {
      ok: false,
      error: "Couldn't load the check preview right now. Try again.",
    };
  }
}

// Renders HTML through Gotenberg's Chromium engine and counts pages.
// Used to detect the > 6-sheet USPS surcharge for HTML-body letters
// (without this, the cost would silently miss multi-page sends and
// margin would disappear on Lob's invoice). Returns null when
// Gotenberg isn't configured or the render fails — caller treats null
// as "I don't know" and skips the surcharge rather than over-charge.
async function countHtmlPagesViaGotenberg(
  html: string
): Promise<number | null> {
  const gotenbergUrl = process.env.GOTENBERG_URL;
  if (!gotenbergUrl) return null;
  try {
    const fd = new FormData();
    fd.append("files", new Blob([html], { type: "text/html" }), "index.html");
    const res = await fetch(`${gotenbergUrl}/forms/chromium/convert/html`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) return null;
    const pdfBytes = Buffer.from(await res.arrayBuffer());
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    (pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } })
      .GlobalWorkerOptions.workerSrc = "";
    const doc = await (
      pdfjs as unknown as {
        getDocument: (opts: { data: Uint8Array; useWorker: false }) => {
          promise: Promise<{ numPages: number }>;
        };
      }
    ).getDocument({ data: new Uint8Array(pdfBytes), useWorker: false })
      .promise;
    return doc.numPages ?? null;
  } catch {
    return null;
  }
}

// Renders [filled docx, ...attachments] into a single merged PDF using
// Gotenberg's libreoffice/convert endpoint with `merge=true`. The
// attachments may be PDFs (pass-through) or docx files (LibreOffice
// converts them). Returned PDF is the exact file Lob will print.
//
// Requires GOTENBERG_URL — without it, file-template sends can't run
// (we have no other docx → PDF pipeline). Surface a clear server-config
// error so the operator sees what's missing.
async function renderDocxAndAttachmentsToPdf(
  cover: { name: string; buffer: Buffer },
  attachments: Array<{ name: string; buffer: Buffer; contentType: string }>
): Promise<{ ok: true; value: Buffer } | { ok: false; error: string }> {
  const gotenbergUrl = process.env.GOTENBERG_URL;
  if (!gotenbergUrl) {
    return {
      ok: false,
      error:
        "Server is missing GOTENBERG_URL — required to send Word document templates. Contact support.",
    };
  }
  try {
    const fd = new FormData();
    fd.append(
      "files",
      new Blob([new Uint8Array(cover.buffer)], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
      // Gotenberg uses the filename's lexical order to determine merge
      // order, so prefix with a zero-padded index to guarantee the cover
      // page comes first and each attachment follows in array order.
      `00_${cover.name}`
    );
    attachments.forEach((a, i) => {
      fd.append(
        "files",
        new Blob([new Uint8Array(a.buffer)], { type: a.contentType }),
        `${String(i + 1).padStart(2, "0")}_${a.name}`
      );
    });
    fd.append("merge", "true");
    const res = await fetch(`${gotenbergUrl}/forms/libreoffice/convert`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const raw = await res.text();
      console.error("Gotenberg merge failed", res.status, raw);
      return {
        ok: false,
        error: `Document render failed (Gotenberg ${res.status}). Try again or simplify the template.`,
      };
    }
    const pdfBytes = Buffer.from(await res.arrayBuffer());
    return { ok: true, value: pdfBytes };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Document render failed: ${err.message}`
          : "Document render failed",
    };
  }
}

// Runs docxtemplater against a Word doc buffer using a MergeContext that
// uses dotted keys (e.g. "contact.first_name"). docxtemplater expects
// nested data by default; we configure it to read flat dotted keys so the
// same context object works for both HTML and Word paths.
async function fillDocxTemplate(
  buffer: Buffer,
  ctx: MergeContext
): Promise<{ ok: true; value: Buffer } | { ok: false; error: string }> {
  try {
    const PizZip = (await import("pizzip")).default;
    const DocxtemplaterMod = await import("docxtemplater");
    const Docxtemplater =
      (DocxtemplaterMod as unknown as { default: typeof DocxtemplaterMod })
        .default ?? DocxtemplaterMod;
    const zip = new PizZip(buffer);
    // Build flat string data — keys are literal dotted strings like
    // "contact.first_name". The custom parser below looks them up
    // verbatim instead of treating the dot as nested-object access.
    // Verified via direct docxtemplater test: nested-object + default
    // parser silently returned null for every token (rendered blank);
    // flat keys + literal-key parser resolves correctly.
    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(ctx)) {
      data[k] = v == null ? "" : String(v);
    }
    const doc = new (Docxtemplater as unknown as new (
      zip: unknown,
      opts: unknown
    ) => {
      render(data: Record<string, string>): void;
      getZip(): { generate(opts: { type: string }): Buffer };
    })(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{", end: "}" },
      nullGetter: () => "",
      parser: (tag: string) => ({
        get: (scope: Record<string, string>) => scope?.[tag],
      }),
    });
    doc.render(data);
    return { ok: true, value: doc.getZip().generate({ type: "nodebuffer" }) };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Word template merge failed: ${err.message}`
          : "Word template merge failed",
    };
  }
}

export type RecipientInput = {
  // At least one of relative_id / lead_party_id / lead_id should be set to
  // give the row an anchor; recipient_name/address are required regardless.
  relative_id?: string | null;
  lead_party_id?: string | null;
  lead_id?: string | null;
  // The contacts.id of the mailing-address contact row this recipient
  // was picked from. Lets sendMail flip the mailed flag + bump
  // mail_count by direct primary-key match instead of fuzzy line1
  // matching. Optional for backwards compat.
  contact_id?: string | null;
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  merge_context: MergeContext;
};

export type SendMailInput = {
  recipients: RecipientInput[];
  template_id?: string | null;
  body_html: string; // raw template body — merge fields rendered per recipient
  mail_class: "standard" | "first_class" | "certified";
  // Print in color (extra cost per piece). Default off — sender opts in
  // per send from the modal.
  color?: boolean;
  include_check?: boolean;
  check_amount_cents?: number | null;
  check_memo?: string | null;
  bank_account_id?: string | null;
  // Idempotency key from the client. The Send button mints a uuid at
  // open time and passes it on every submit. If the same key shows up
  // twice (double-click, retried fetch, refresh-while-sending), the
  // server returns the original batch's result instead of doing the
  // work twice and billing the customer twice.
  idempotency_key?: string | null;
};

export type SendMailResult =
  | {
      ok: true;
      batch_id: string;
      job_ids: string[];
      provider_letter: "click2mail" | "lob" | "stub";
      provider_check: "lob" | "stub";
    }
  | { ok: false; error: string };

// Server action — sends a letter (or letter+check) to N recipients in one
// shot. Creates one mail_jobs row per recipient sharing a batch_id, and a
// matching `mail_sent` activity row on each related lead.
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };

  // Idempotency check — if the same client key was already submitted in
  // the last 5 minutes, return the original batch's job_ids. Prevents
  // double-billing on a double-click, a retried fetch, or a refresh
  // while the first request was still in flight. The batch_id column is
  // used as the storage key because mail_jobs already groups by batch.
  if (input.idempotency_key) {
    const sb = await createClient();
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: existing } = await sb
      .from("mail_jobs")
      .select("id, batch_id, provider")
      .eq("batch_id", input.idempotency_key)
      .gte("created_at", fiveMinAgo)
      .order("created_at", { ascending: true });
    if (existing && existing.length > 0) {
      return {
        ok: true,
        batch_id: existing[0].batch_id as string,
        job_ids: existing.map((r) => r.id as string),
        provider_letter:
          ((existing[0].provider as string | null) ?? "stub") as
            | "click2mail"
            | "lob"
            | "stub",
        provider_check: "lob",
      };
    }
  }
  if (input.recipients.length === 0) {
    return { ok: false, error: "Pick at least one recipient" };
  }
  const body = input.body_html.trim();

  // Resolve the template (if any) upfront. A template with a docx_path
  // means we're sending file-based mail (Word + optional PDF attachments
  // merged via C2M's /documents/create2), which doesn't need the
  // body_html field at all. HTML-mode templates and ad-hoc body-only
  // sends still require body to be non-empty.
  let templateRow: {
    id: string;
    docx_path: string | null;
    attachment_paths: string[];
  } | null = null;
  if (input.template_id) {
    const sbForTemplate = await createClient();
    const { data: tpl } = await sbForTemplate
      .from("mail_templates")
      .select("id, docx_path, attachment_paths")
      .eq("id", input.template_id)
      .maybeSingle();
    if (tpl) {
      templateRow = {
        id: tpl.id as string,
        docx_path: (tpl.docx_path as string | null) ?? null,
        attachment_paths: (tpl.attachment_paths as string[] | null) ?? [],
      };
    }
  }
  const isFileTemplate = Boolean(templateRow?.docx_path);

  if (!isFileTemplate && !body) {
    return { ok: false, error: "Body is required" };
  }
  // Docx + check is supported now that the docx → Gotenberg → PDF
  // pipeline produces a clean PDF that Lob's /v1/checks endpoint
  // accepts as the check_bottom (letter side of the check). Before
  // the migration off Click2Mail this combination wasn't possible.

  if (input.include_check) {
    if (!input.bank_account_id) {
      return { ok: false, error: "Pick a bank account for the check" };
    }
    if (!input.check_amount_cents || input.check_amount_cents <= 0) {
      return { ok: false, error: "Check amount must be greater than zero" };
    }
  }

  const sb = await createClient();

  // Pull the org's return address + signer for from_ snapshot.
  const { data: org } = await sb
    .from("orgs")
    .select(
      "name, legal_name, email, phone, website, address_line1, address_line2, city, region, postal_code, country, signer_name, signer_title, signature_image_path"
    )
    .eq("id", profile.orgId)
    .single();
  // Load SaaS-wide pricing config. customer_pricing → cost_cents (what we
  // charge the customer). wholesale_pricing → provider_cost_cents (what
  // Lob actually bills us). Single global config, applies to every org.
  const { data: pricingCfg } = await sb
    .from("app_pricing_config")
    .select("customer_mail_pricing_cents, wholesale_pricing_cents")
    .eq("id", 1)
    .maybeSingle();
  const customerPricing = (pricingCfg?.customer_mail_pricing_cents as
    | import("./types").LobPricing
    | null) ?? undefined;
  const wholesalePricing = (pricingCfg?.wholesale_pricing_cents as
    | import("./types").LobPricing
    | null) ?? undefined;
  if (
    !org ||
    !org.address_line1 ||
    !org.city ||
    !org.region ||
    !org.postal_code
  ) {
    return {
      ok: false,
      error: "Complete the Company Address in Settings before sending mail",
    };
  }
  if (!org.name || !String(org.name).trim()) {
    return {
      ok: false,
      error: "Set your Company Name in Settings before sending mail",
    };
  }
  // Resolve the signature image (if uploaded) to a long-lived signed URL so
  // the printer can fetch it during HTML→PDF rendering. 30 days is well past
  // any realistic print SLA. The merge field expands to a ready-to-render
  // <img> tag — empty string when no signature is set, so the {{...}} token
  // collapses cleanly in the template instead of rendering "[Missing: ...]".
  const signaturePath = (org.signature_image_path as string | null) ?? null;
  // HTML comment (not empty string) so renderMerge doesn't flag this optional
  // field as "[Missing: ...]" when no signature is uploaded.
  let signatureImgTag = "<!-- no signature -->";
  if (signaturePath) {
    const admin = createServiceClient();
    const { data: signed } = await admin.storage
      .from("signatures")
      .createSignedUrl(signaturePath, 60 * 60 * 24 * 30);
    if (signed?.signedUrl) {
      signatureImgTag = `<img src="${signed.signedUrl}" alt="Signature" style="max-height:60px;max-width:200px;display:inline-block;" />`;
    }
  }

  const senderContext: MergeContext = {
    "sender.company_name": (org.name as string | null) ?? "",
    "sender.legal_name":
      (org.legal_name as string | null) ?? (org.name as string | null) ?? "",
    "sender.signer_name": (org.signer_name as string | null) ?? "",
    "sender.signer_title": (org.signer_title as string | null) ?? "",
    "sender.signature_image": signatureImgTag,
    "sender.address": [
      org.address_line1,
      org.address_line2,
      `${org.city}, ${org.region} ${org.postal_code}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };

  // If a bank account is selected, look up its Lob ID (we use the FK on the
  // mail_jobs row, but Lob's API expects the bnk_xxx).
  let lobBankAccountId: string | null = null;
  if (input.include_check && input.bank_account_id) {
    const { data: bank } = await sb
      .from("mail_bank_accounts")
      .select("lob_bank_account_id, status")
      .eq("id", input.bank_account_id)
      .single();
    if (!bank || !bank.lob_bank_account_id) {
      return { ok: false, error: "Bank account not found" };
    }
    if (bank.status !== "verified") {
      return {
        ok: false,
        error: "Verify the bank account before sending checks",
      };
    }
    lobBankAccountId = bank.lob_bank_account_id as string;
  }

  // For file templates, fetch the Word doc + each attachment ONCE up
  // front. The Word doc is the only thing re-merged per recipient (via
  // docxtemplater); attachments are passed through unchanged so we can
  // reuse the same buffers across the batch.
  let docxTemplate: { name: string; buffer: Buffer } | null = null;
  const attachmentFiles: Array<{
    name: string;
    buffer: Buffer;
    contentType: string;
  }> = [];
  if (isFileTemplate && templateRow?.docx_path) {
    const admin = createServiceClient();
    const docxDl = await admin.storage
      .from("mail-templates")
      .download(templateRow.docx_path);
    if (docxDl.error || !docxDl.data) {
      return {
        ok: false,
        error: `Could not load Word template: ${docxDl.error?.message ?? "unknown"}`,
      };
    }
    docxTemplate = {
      name: `letter-${randomUUID()}.docx`,
      buffer: Buffer.from(await docxDl.data.arrayBuffer()),
    };
    for (const attachPath of templateRow.attachment_paths) {
      const dl = await admin.storage.from("mail-templates").download(attachPath);
      if (dl.error || !dl.data) {
        return {
          ok: false,
          error: `Could not load attachment ${attachPath}: ${dl.error?.message ?? "unknown"}`,
        };
      }
      const isPdf = attachPath.toLowerCase().endsWith(".pdf");
      attachmentFiles.push({
        name: attachPath.split("/").pop() ?? attachPath,
        buffer: Buffer.from(await dl.data.arrayBuffer()),
        contentType: isPdf
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
    }
  }

  // Count total sheets for the over-6 USPS surcharge gate. Cover sheet
  // (HTML body or Word doc) = 1; each PDF attachment contributes its
  // page count. The same value is used for every recipient in the batch
  // since the rendered piece is the same shape per recipient.
  let totalSheets = 1;
  if (isFileTemplate && attachmentFiles.length > 0) {
    for (const f of attachmentFiles) {
      if (f.contentType === "application/pdf") {
        try {
          const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
          (pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } })
            .GlobalWorkerOptions.workerSrc = "";
          const doc = await (
            pdfjs as unknown as {
              getDocument: (opts: { data: Uint8Array; useWorker: false }) => {
                promise: Promise<{ numPages: number }>;
              };
            }
          ).getDocument({
            data: new Uint8Array(f.buffer),
            useWorker: false,
          }).promise;
          totalSheets += doc.numPages ?? 0;
        } catch {
          // Parse failure — leave the contribution at 0 rather than
          // invent a count. Surcharge may be missed for this attachment
          // but better than inflating it.
        }
      }
    }
  }

  // For HTML body letters (no file template), Lob renders the HTML to a
  // PDF at print time. To detect the over-6-sheet surcharge we render
  // the merged body via Gotenberg ourselves before send and count pages
  // on the resulting PDF. Done ONCE for the first recipient's context;
  // we assume page count is stable across recipients (recipient name
  // variations don't typically change page break behavior).
  //
  // Skipped when Gotenberg isn't configured — the surcharge would just
  // not apply, customer pays the base rate, we eat the loss on Lob's
  // invoice. Fine for low-volume and dev.
  if (!isFileTemplate && body && input.recipients.length > 0) {
    const previewToday = new Date();
    const firstCtx: MergeContext = {
      ...senderContext,
      ...input.recipients[0].merge_context,
      "system.today": previewToday.toLocaleDateString("en-US"),
      "system.today_long": previewToday.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
    const firstHtml = wrapBodyHtml(renderMerge(body, firstCtx));
    const htmlPages = await countHtmlPagesViaGotenberg(firstHtml);
    if (htmlPages !== null && htmlPages > totalSheets) {
      totalSheets = htmlPages;
    }
  }

  // Use the client's idempotency key as the batch id so a re-submission
  // with the same key (caught by the early-return guard up top) maps
  // back to the same batch. Falls back to a fresh uuid when the client
  // didn't pass one (older callers).
  const batchId = input.idempotency_key ?? randomUUID();
  const jobIds: string[] = [];
  const today = new Date();

  for (const recipient of input.recipients) {
    const ctx: MergeContext = {
      ...senderContext,
      ...recipient.merge_context,
      "system.today": today.toLocaleDateString("en-US"),
      "system.today_long": today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
    // For HTML body templates, render merge tokens into the HTML string
    // up front. File-template sends use the same `ctx` but apply the
    // merge to the Word doc via docxtemplater further down.
    const rendered = isFileTemplate ? "" : renderMerge(body, ctx);

    const correlationId = randomUUID();
    const sendInput = {
      to: {
        name: recipient.name,
        line1: recipient.line1,
        line2: recipient.line2 ?? null,
        city: recipient.city,
        state: recipient.state,
        postal_code: recipient.postal_code,
        country: recipient.country ?? "US",
      },
      from: {
        name: (org.name as string | null) ?? "",
        line1: org.address_line1 as string,
        line2: (org.address_line2 as string | null) ?? null,
        city: org.city as string,
        state: org.region as string,
        postal_code: org.postal_code as string,
        country: (org.country as string | null) ?? "US",
      },
      body_html: wrapBodyHtml(rendered),
      mail_class: input.mail_class,
      color: input.color === true,
      correlation_id: correlationId,
      // customer_pricing = what we charge this org's customer. Stored on
      // mail_jobs.cost_cents and used by reports as revenue.
      // wholesale_pricing = what Lob (or C2M) actually charges us. Stored
      // on mail_jobs.provider_cost_cents and used for margin reporting.
      customer_pricing: customerPricing,
      wholesale_pricing: wholesalePricing,
      // Pass the sheet count so lob.ts can add the > 6-sheet surcharge
      // to both the customer charge and the wholesale cost when this
      // piece pushes past USPS's first-class weight tier.
      total_sheets: totalSheets,
    };

    let send;
    // PDF buffer captured here when the docx path runs, so we can
    // cache the rendered file in storage AFTER the mail_jobs row
    // exists (we need the row id to key the storage path).
    let renderedPdfBuffer: Buffer | null = null;
    if (isFileTemplate && docxTemplate) {
      // File-template path:
      //   1. docxtemplater fills the Word doc with this recipient's
      //      merge context.
      //   2. Gotenberg's libreoffice/convert merges [filled docx,
      //      ...attachments] into one PDF (LibreOffice converts docx
      //      and merges with the PDF attachments in a single round
      //      trip via `merge=true`).
      //   3. The merged PDF is uploaded to Lob (either /v1/letters
      //      OR /v1/checks if include_check) via multipart.
      //   4. The same PDF is cached in Supabase storage so View
      //      Letter / View Check open instantly without re-rendering.
      const docxBuffer = await fillDocxTemplate(docxTemplate.buffer, ctx);
      if (!docxBuffer.ok) {
        send = { ok: false as const, error: docxBuffer.error };
      } else {
        const merged = await renderDocxAndAttachmentsToPdf(
          { name: docxTemplate.name, buffer: docxBuffer.value },
          attachmentFiles
        );
        if (!merged.ok) {
          send = { ok: false as const, error: merged.error };
        } else {
          renderedPdfBuffer = merged.value;
          if (input.include_check && lobBankAccountId) {
            // Docx + check: same PDF goes as the check_bottom on
            // Lob /v1/checks.
            send = await sendCheck({
              ...sendInput,
              body_html: "",
              file_pdf: merged.value,
              amount_cents: input.check_amount_cents as number,
              memo: input.check_memo ?? null,
              bank_account_id: lobBankAccountId,
            });
          } else {
            send = await sendLetter({
              ...sendInput,
              // Provider receives the rendered PDF; HTML body is ignored
              // when file_pdf is set. Keep body_html as empty so we don't
              // pay the cost of wrapping merged tokens we won't use.
              body_html: "",
              file_pdf: merged.value,
            });
          }
        }
      }
    } else if (input.include_check && lobBankAccountId) {
      send = await sendCheck({
        ...sendInput,
        amount_cents: input.check_amount_cents as number,
        memo: input.check_memo ?? null,
        bank_account_id: lobBankAccountId,
      });
    } else {
      send = await sendLetter(sendInput);
    }

    if (!send.ok) {
      // Synchronous provider rejections (bad address format, auth, rate
      // limit, etc.) don't persist to mail_jobs — the user gets the
      // error back in the modal and can fix and retry. Persisting these
      // as "failed" rows just clutters the dashboard with records the
      // user can't act on. Async failures from webhooks still update
      // the row's status to "failed" because by then there's something
      // real to track.
      return { ok: false, error: send.error };
    }

    const { data: inserted, error: insertErr } = await sb
      .from("mail_jobs")
      .insert({
        batch_id: batchId,
        lead_id: recipient.lead_id ?? null,
        relative_id: recipient.relative_id ?? null,
        lead_party_id: recipient.lead_party_id ?? null,
        template_id: input.template_id ?? null,
        recipient_name: recipient.name,
        recipient_address_line1: recipient.line1,
        recipient_address_line2: recipient.line2 ?? null,
        recipient_city: recipient.city,
        recipient_state: recipient.state,
        recipient_postal_code: recipient.postal_code,
        recipient_country: recipient.country ?? "US",
        from_name: (org.name as string | null) ?? "",
        from_address_line1: org.address_line1 as string,
        from_address_line2: (org.address_line2 as string | null) ?? null,
        from_city: org.city as string,
        from_state: org.region as string,
        from_postal_code: org.postal_code as string,
        from_country: (org.country as string | null) ?? "US",
        // Store the FULLY-WRAPPED HTML (margins, fonts) so View Letter
        // iframes render the same thing the printer mailed. Pre-wrap
        // rendering would otherwise show as an unstyled blob of merged
        // text in the thumbnail. For file-template sends, body_html
        // stays empty; previewMailJob re-renders via Gotenberg on demand.
        body_html: isFileTemplate ? "" : wrapBodyHtml(rendered),
        mail_class: input.mail_class,
        include_check: input.include_check ?? false,
        check_amount_cents: input.check_amount_cents ?? null,
        check_memo: input.check_memo ?? null,
        bank_account_id: input.bank_account_id ?? null,
        provider: send.provider,
        provider_id: send.provider_id,
        tracking_number: send.tracking_number,
        tracking_url: send.tracking_url,
        cost_cents: send.cost_cents,
        provider_cost_cents: send.provider_cost_cents,
        // Every fresh send starts as 'processing' (piece is at the
        // provider's print plant). The webhook flips status to
        // 'in_transit' on the provider's .mailed event. Earlier code
        // checked send.tracking_number on the create response and
        // upgraded to 'in_transit' immediately — but provider test
        // environments return a tracking_number eagerly which made
        // batch sends look mailed before they were. Consistent start
        // state = consistent UI labels across single and batch sends.
        status: "processing",
        sent_at: new Date().toISOString(),
        created_by: profile.id,
      })
      .select("id")
      .single();
    if (insertErr || !inserted) {
      // Lob already accepted the piece but our DB write failed. If we
      // leave it alone, customer gets charged for a piece we have no
      // record of. Best-effort cancel against Lob (only works within
      // their ~5-minute window) so the bill is reversed. Errors from
      // the cancel call are logged into the error string so an admin
      // can investigate, but we still return failure so the user knows
      // their send didn't go through.
      let cancelNote = "";
      if (send.provider === "lob" && send.provider_id) {
        const { lobCancelPiece } = await import("./lob");
        const cancel = await lobCancelPiece({
          kind: input.include_check ? "check" : "letter",
          provider_id: send.provider_id,
        });
        if (!cancel.ok) {
          cancelNote = ` Cancel attempt failed: ${cancel.error}. Contact support.`;
        } else {
          cancelNote = " Send was cancelled to avoid double-billing.";
        }
      }
      return {
        ok: false,
        error: `${insertErr?.message ?? "Failed to record mail job"}.${cancelNote}`,
      };
    }
    jobIds.push(inserted.id as string);
    const mailJobId = inserted.id as string;

    // Cache the rendered PDF (docx path only) in Supabase storage so
    // View Letter / View Check open instantly without re-rendering
    // through Gotenberg. Saves ~5s per repeat preview. Both the
    // bucket and the rendered_pdf_path column come from migration
    // 0131; this entire block is best-effort so the send still
    // succeeds if migration hasn't been applied yet.
    if (renderedPdfBuffer) {
      try {
        const admin = createServiceClient();
        const storagePath = `${profile.orgId}/${mailJobId}.pdf`;
        const up = await admin.storage
          .from("mail-renders")
          .upload(storagePath, renderedPdfBuffer, {
            contentType: "application/pdf",
            upsert: false,
          });
        if (!up.error) {
          await admin
            .from("mail_jobs")
            .update({ rendered_pdf_path: storagePath })
            .eq("id", mailJobId);
        }
      } catch {
        // Pre-migration: bucket or column missing. Preview falls
        // back to live re-render on demand.
      }
    }

    // Flip the contact's mailed flag + bump mail_count so the
    // Mailing Addresses chip on the lead Overview tab reflects
    // reality. Match by contact_id (primary key) when the modal
    // passed it through; fall back to fuzzy line1 ilike for old
    // call sites that didn't.
    if (recipient.contact_id) {
      const now = new Date().toISOString();
      await sb
        .from("contacts")
        .update({ mailed: true, mailed_at: now })
        .eq("id", recipient.contact_id);
      try {
        const { count: priorCount } = await sb
          .from("mail_jobs")
          .select("id", { count: "exact", head: true })
          .eq("lead_id", recipient.lead_id ?? "")
          .eq("recipient_address_line1", recipient.line1);
        await sb
          .from("contacts")
          .update({ mail_count: priorCount ?? 1 })
          .eq("id", recipient.contact_id);
      } catch {
        // mail_count column not yet present; the bump silently skipped.
      }
    } else if (recipient.lead_id && recipient.line1) {
      const baseFilter = sb
        .from("contacts")
        .update({ mailed: true, mailed_at: new Date().toISOString() })
        .eq("lead_id", recipient.lead_id)
        .eq("channel", "mailing_address")
        .ilike("value", `%${recipient.line1}%`);
      await baseFilter;
      try {
        const { count: priorCount } = await sb
          .from("mail_jobs")
          .select("id", { count: "exact", head: true })
          .eq("lead_id", recipient.lead_id)
          .eq("recipient_address_line1", recipient.line1);
        await sb
          .from("contacts")
          .update({ mail_count: priorCount ?? 1 })
          .eq("lead_id", recipient.lead_id)
          .eq("channel", "mailing_address")
          .ilike("value", `%${recipient.line1}%`);
      } catch {
        // mail_count column not yet present; the bump silently skipped.
      }
    }

    // No bell notification at send time — the activity row is the
    // sender-side record. Bell only fires on the terminal webhook
    // states (delivered / returned / failed).

    // Activity entry on the related lead (if any). Activities are scoped to
    // a lead — drops cleanly when no lead is attached.
    if (recipient.lead_id) {
      await sb.from("activities").insert({
        lead_id: recipient.lead_id,
        user_id: profile.id,
        activity_type: "mail_sent",
        payload: {
          mail_job_id: inserted.id,
          batch_id: batchId,
          template_id: input.template_id ?? null,
          recipient_name: recipient.name,
          recipient_address: [
            recipient.line1,
            recipient.line2,
            `${recipient.city}, ${recipient.state} ${recipient.postal_code}`,
          ]
            .filter(Boolean)
            .join(", "),
          mail_class: input.mail_class,
          include_check: input.include_check ?? false,
          check_amount_cents: input.check_amount_cents ?? null,
          tracking_url: send.tracking_url,
          tracking_number: send.tracking_number,
          provider: send.provider,
        },
      });
    }
  }

  revalidatePath("/mail");
  // Touch the affected lead pages so timelines refresh.
  const touchedLeads = new Set(
    input.recipients
      .map((r) => r.lead_id)
      .filter((x): x is string => typeof x === "string")
  );
  for (const id of touchedLeads) {
    revalidatePath(`/leads/${id}`);
  }

  return {
    ok: true,
    batch_id: batchId,
    job_ids: jobIds,
    provider_letter: activeLetterProvider() as "click2mail" | "lob" | "stub",
    provider_check: activeCheckProvider() as "lob" | "stub",
  };
}

// Wrap the merge-rendered body in a minimal HTML doc so the print engines
// produce a clean page. Inline styles only — most letter print pipelines
// drop <style> blocks. We do not include the signer signature image yet
// (storage upload deferred to v1.1).
function wrapBodyHtml(inner: string): string {
  // Convert paragraph breaks (double newlines) to <p> blocks and single
  // newlines to <br/> so the textarea-typed body renders with the same
  // whitespace the user typed. Handles both \n (Unix) and \r\n (Windows)
  // line endings. If the input already has <p> or <br> tags (template
  // HTML), we pass it through verbatim — the regex below only touches
  // plain-text segments.
  const norm = inner.replace(/\r\n/g, "\n");
  const hasHtmlBlocks = /<(p|div|br)\b/i.test(norm);
  const safeInner = hasHtmlBlocks
    ? norm.replace(/\n/g, "<br/>")
    : norm
        .split(/\n{2,}/)
        .map((para) => `<p>${para.replace(/\n/g, "<br/>")}</p>`)
        .join("");
  return `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #111; margin: 0.75in;">
<div>${safeInner}</div>
</body></html>`;
}
