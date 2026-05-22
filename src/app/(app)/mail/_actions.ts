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
};

export type ResendResult =
  | { ok: true; batch_id: string; job_ids: string[] }
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

  const send = await sendMail({
    recipients: [
      {
        lead_id: job.lead_id ?? null,
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
  return { ok: true, batch_id: send.batch_id, job_ids: send.job_ids };
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

