"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { sendLetter, sendCheck, activeLetterProvider, activeCheckProvider } from ".";
import { renderMerge, type MergeContext } from "./merge";

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
  if (!body) return { ok: false, error: "Body is required" };

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
    const rendered = renderMerge(body, ctx);

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

    const send = input.include_check && lobBankAccountId
      ? await sendCheck({
          ...sendInput,
          amount_cents: input.check_amount_cents as number,
          memo: input.check_memo ?? null,
          bank_account_id: lobBankAccountId,
        })
      : await sendLetter(sendInput);

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
