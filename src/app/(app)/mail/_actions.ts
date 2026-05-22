"use server";

import { sendMail } from "@/lib/mail/actions";
import { fetchMailJob } from "@/lib/mail/fetch";

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
