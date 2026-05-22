"use server";

import { revalidatePath } from "next/cache";
import { sendMail } from "@/lib/mail/actions";
import { fetchMailJob } from "@/lib/mail/fetch";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-user";

export type ResendInput = {
  jobId: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  // When true, also update the contact row (relative or lead_party) the
  // original piece was sent to, so the corrected address sticks on the
  // lead and future sends pull the right one.
  save_address_to_lead?: boolean;
};

export type ResendResult =
  | {
      ok: true;
      batch_id: string;
      job_ids: string[];
      address_saved_to: "relative" | "lead_party" | "none";
    }
  | { ok: false; error: string };

// Take a returned (or any) mail job, copy its body / template / class /
// check details, and re-send to a corrected address. The original job
// stays in the DB as historical record — the resend creates a brand new
// mail_jobs row linked to the same lead.
export async function resendMailJob(input: ResendInput): Promise<ResendResult> {
  const job = await fetchMailJob(input.jobId);
  if (!job) return { ok: false, error: "Job not found" };

  const trimmed = {
    line1: input.line1.trim(),
    city: input.city.trim(),
    state: input.state.trim().toUpperCase(),
    postal_code: input.postal_code.trim(),
  };
  if (!trimmed.line1 || !trimmed.city || !trimmed.state || !trimmed.postal_code) {
    return {
      ok: false,
      error: "Address Line 1, City, State, and ZIP are all required",
    };
  }

  // Pull the entity link of the original send so we know where to save
  // the corrected address. mail_jobs has relative_id and lead_party_id
  // alongside lead_id; those aren't on the fetchMailJob type, so query
  // direct.
  const sb = await createClient();
  const { data: linkRow } = await sb
    .from("mail_jobs")
    .select("relative_id, lead_party_id")
    .eq("id", input.jobId)
    .maybeSingle();
  const relativeId = (linkRow?.relative_id as string | null) ?? null;
  const leadPartyId = (linkRow?.lead_party_id as string | null) ?? null;

  // Compose the new mailing-address string the same way the rest of the
  // portal stores it on contacts.value — single line with line2 folded in.
  const addrLine = [
    trimmed.line1,
    input.line2?.trim() || null,
    `${trimmed.city}, ${trimmed.state} ${trimmed.postal_code}`,
  ]
    .filter(Boolean)
    .join(", ");

  let addressSavedTo: "relative" | "lead_party" | "none" = "none";
  if (input.save_address_to_lead) {
    if (relativeId) {
      addressSavedTo = await upsertMailingAddressContact(sb, {
        relative_id: relativeId,
        lead_party_id: null,
        lead_id: job.lead_id ?? null,
        recipient_label: job.recipient_name,
        value: addrLine,
      })
        ? "relative"
        : "none";
    } else if (leadPartyId) {
      addressSavedTo = await upsertMailingAddressContact(sb, {
        relative_id: null,
        lead_party_id: leadPartyId,
        lead_id: job.lead_id ?? null,
        recipient_label: job.recipient_name,
        value: addrLine,
      })
        ? "lead_party"
        : "none";
    }
    // If neither relative_id nor lead_party_id is set, we have nowhere
    // to attach the address — silently skip (the resend still goes).
  }

  const send = await sendMail({
    recipients: [
      {
        lead_id: job.lead_id ?? null,
        relative_id: relativeId,
        lead_party_id: leadPartyId,
        name: job.recipient_name,
        line1: trimmed.line1,
        line2: input.line2 ?? null,
        city: trimmed.city,
        state: trimmed.state,
        postal_code: trimmed.postal_code,
        country: "US",
        // Merge context for re-render — best effort, the original was
        // already merge-rendered into body_html, so for resends we just
        // pass the body as-is and skip token replacement.
        merge_context: {},
      },
    ],
    template_id: null,
    body_html: job.body_html ?? "",
    mail_class: job.mail_class,
    color: false,
    include_check: job.include_check,
    check_amount_cents: job.check_amount_cents ?? null,
    check_memo: job.check_memo ?? null,
    bank_account_id: job.bank_account_id ?? null,
  });
  if (!send.ok) return { ok: false, error: send.error };
  if (job.lead_id) revalidatePath(`/leads/${job.lead_id}`);
  return {
    ok: true,
    batch_id: send.batch_id,
    job_ids: send.job_ids,
    address_saved_to: addressSavedTo,
  };
}

// Best-effort upsert of a mailing_address contact for the given entity.
// Returns true if the row was inserted or updated, false on any error
// (we keep this non-fatal — the resend itself still proceeds even if
// the address persist fails).
async function upsertMailingAddressContact(
  sb: Awaited<ReturnType<typeof createClient>>,
  input: {
    relative_id: string | null;
    lead_party_id: string | null;
    lead_id: string | null;
    recipient_label: string;
    value: string;
  }
): Promise<boolean> {
  try {
    // Find the existing mailing_address contact for this entity.
    let q = sb
      .from("contacts")
      .select("id")
      .eq("channel", "mailing_address");
    if (input.relative_id) q = q.eq("relative_id", input.relative_id);
    else if (input.lead_party_id) q = q.eq("lead_party_id", input.lead_party_id);
    else return false;
    const { data: existing } = await q.maybeSingle();

    if (existing?.id) {
      const { error } = await sb
        .from("contacts")
        .update({ value: input.value })
        .eq("id", existing.id);
      return !error;
    }
    // No existing contact — insert one.
    const { error } = await sb.from("contacts").insert({
      channel: "mailing_address",
      value: input.value,
      relative_id: input.relative_id,
      lead_party_id: input.lead_party_id,
      lead_id: input.lead_id,
      notes: input.recipient_label,
    });
    return !error;
  } catch {
    return false;
  }
}

// Hard-delete a mail_jobs row. Used to clean up old failed records that
// pre-date the sync-failure-no-persist change, or to remove any record
// the user no longer wants to see. The activity row tied to the same
// piece (if any) is left in place because activities are historical
// truth — what happened on the lead doesn't unhappen.
export async function deleteMailJob(input: {
  jobId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  const sb = await createClient();
  const { error } = await sb.from("mail_jobs").delete().eq("id", input.jobId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mail");
  return { ok: true };
}
