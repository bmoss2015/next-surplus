-- Dedup column for the Lob cron upcoming-rate announcement email.
-- Stores a stable JSON of the upcoming pricing block last sent so the
-- cron only emails when the announcement actually changes (and stops
-- spamming the operator every Monday while a known announcement is
-- still pending).

alter table app_pricing_config
  add column if not exists lob_last_announced_upcoming jsonb;
