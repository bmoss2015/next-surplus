-- Verification attempt tracking on mail_bank_accounts.
--
-- Lob locks out a bank account after 3 failed /verify calls (incorrect
-- micro-deposit amounts). Both the daily cron (Plaid Transactions auto
-- match) and the new manual-verify UI need to share an attempt count
-- so the cron doesn't burn the 3-try budget before the operator sees
-- their bank statement.
--
-- last_verify_error stores the most recent error string from Lob so the
-- UI can surface "amount mismatch" / "account locked" / etc.

alter table public.mail_bank_accounts
  add column if not exists verify_attempts integer not null default 0,
  add column if not exists last_verify_error text,
  add column if not exists last_verify_attempt_at timestamptz;

comment on column public.mail_bank_accounts.verify_attempts is
  'Total number of /bank_accounts/{id}/verify calls made against Lob for this row. Lob locks the row after 3 failed attempts. Cron stops auto-trying at 2 so the operator gets the third attempt manually.';
comment on column public.mail_bank_accounts.last_verify_error is
  'Most recent error string from Lob /verify. NULL once status flips to verified.';
comment on column public.mail_bank_accounts.last_verify_attempt_at is
  'Timestamp of the most recent verify attempt (auto or manual). Used by the UI to show "last checked X hours ago".';
