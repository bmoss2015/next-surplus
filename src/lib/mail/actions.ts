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
  click2mailCreateMergedDocument,
  click2mailSendFromDocumentId,
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

// Server action — given a template and a recipient's contact-level merge
// context, returns the merged .docx as a base64 string. Called by the
// Send Mail modal's preview pane so the user sees the exact document the
// recipient will receive, with their name/address/case data filled in.
export async function previewMailMergeDocx(input: {
  template_id: string;
  recipient_merge_context: MergeContext;
}): Promise<
  | { ok: true; base64: string }
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
  return { ok: true, base64: merged.value.toString("base64") };
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
    // docxtemplater treats dots in {contact.first_name} as nested property
    // access, so flatten our dotted-key context into a nested object tree.
    const nested: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(ctx)) {
      const parts = k.split(".");
      let cur: Record<string, unknown> = nested;
      for (let i = 0; i < parts.length - 1; i++) {
        const seg = parts[i];
        if (
          cur[seg] == null ||
          typeof cur[seg] !== "object" ||
          Array.isArray(cur[seg])
        ) {
          cur[seg] = {};
        }
        cur = cur[seg] as Record<string, unknown>;
      }
      cur[parts[parts.length - 1]] = v == null ? "" : String(v);
    }
    const doc = new (Docxtemplater as unknown as new (
      zip: unknown,
      opts: unknown
    ) => {
      render(data: Record<string, unknown>): void;
      getZip(): { generate(opts: { type: string }): Buffer };
    })(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{", end: "}" },
      nullGetter: () => "",
    });
    doc.render(nested);
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
  if (isFileTemplate && input.include_check) {
    return {
      ok: false,
      error: "Word document templates cannot be combined with check sending yet",
    };
  }

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
  let attachmentFiles: Array<{
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

  const batchId = randomUUID();
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
    };

    let send;
    if (isFileTemplate && docxTemplate) {
      // File-template path: fill the Word doc per recipient with
      // docxtemplater, then upload [Word, ...PDFs] to C2M's create2
      // endpoint to get one merged documentId, then submit the job.
      const docxBuffer = await fillDocxTemplate(docxTemplate.buffer, ctx);
      if (!docxBuffer.ok) {
        send = { ok: false as const, error: docxBuffer.error };
      } else {
        const create = await click2mailCreateMergedDocument(correlationId, [
          {
            name: docxTemplate.name,
            buffer: docxBuffer.value,
            contentType:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          },
          ...attachmentFiles,
        ]);
        if (!create.ok) {
          send = { ok: false as const, error: create.error };
        } else {
          send = await click2mailSendFromDocumentId(create.documentId, {
            to: sendInput.to,
            mail_class: sendInput.mail_class,
            color: sendInput.color,
            correlation_id: sendInput.correlation_id,
          });
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
      // Persist a failed row so the user sees the error in the timeline.
      await sb.from("mail_jobs").insert({
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
        body_html: rendered,
        mail_class: input.mail_class,
        include_check: input.include_check ?? false,
        check_amount_cents: input.check_amount_cents ?? null,
        check_memo: input.check_memo ?? null,
        bank_account_id: input.bank_account_id ?? null,
        provider: input.include_check ? activeCheckProvider() : activeLetterProvider(),
        status: "failed",
        error_message: send.error,
        created_by: profile.id,
      });
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
        body_html: rendered,
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
        status: "queued",
        sent_at: new Date().toISOString(),
        created_by: profile.id,
      })
      .select("id")
      .single();
    if (insertErr || !inserted) {
      return {
        ok: false,
        error: insertErr?.message ?? "Failed to record mail job",
      };
    }
    jobIds.push(inserted.id as string);

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
  const safeInner = inner.replace(/\n/g, "<br/>");
  return `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #111; margin: 0.75in;">
<div>${safeInner}</div>
</body></html>`;
}
