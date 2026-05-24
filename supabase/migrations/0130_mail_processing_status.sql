-- Add 'processing' to mail_jobs.status as a first-class status value.
--
-- Background: fresh sends used to insert status='queued' and the UI
-- derived a "Processing" label when status='queued' AND tracking_number
-- IS NULL. That worked for the dashboard pill but broke filters (the
-- status dropdown only knew the raw enum values), so "Processing" rows
-- still leaked into "In Transit" filter results. Promoting it to a real
-- status value makes filtering, bucketing, and webhook transitions all
-- consistent.
--
-- Lifecycle is now:
--   processing  -> piece is at Lob, being printed / handed to USPS
--   in_transit  -> Lob attached a tracking_number (mailed event fired)
--   delivered   -> USPS confirmed delivery
--   returned    -> piece came back undeliverable
--   failed      -> Lob couldn't print/mail it
--
-- 'queued' is retained in the check constraint for backwards compat with
-- any rows already at status='queued' (older sends). The webhook still
-- accepts queued; sendMail no longer writes it.

alter table public.mail_jobs
  drop constraint if exists mail_jobs_status_check;

alter table public.mail_jobs
  add constraint mail_jobs_status_check
  check (status in ('processing', 'queued', 'in_transit', 'delivered', 'returned', 'failed'));

-- Migrate existing rows that are "effectively processing" to the new
-- status: status='queued' AND no tracking_number means the piece is
-- still at Lob being printed. Once Lob's webhook fires .mailed and
-- attaches a tracking_number, the next migration of that row to
-- in_transit happens via the regular webhook handler.
update public.mail_jobs
  set status = 'processing'
  where status = 'queued'
    and tracking_number is null;
