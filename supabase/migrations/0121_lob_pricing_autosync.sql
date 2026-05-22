-- Lob auto-refresh pricing tracking. Builds on 0120_lob_pricing_config.
--
-- Three new columns on orgs:
--
--   lob_published_pricing_cents — JSONB snapshot of the most recent
--     Lob Developer-tier published rates the cron job fetched. Used
--     to compare against orgs.lob_pricing_cents and detect when Lob
--     has changed their list pricing.
--
--   lob_pricing_auto_sync — when true, the cron job updates
--     lob_pricing_cents to match lob_published_pricing_cents on
--     every fetch. Set true for orgs paying published list rates;
--     leave false for orgs with custom enterprise contracts so the
--     cron only alerts on drift instead of overwriting.
--
--   lob_pricing_last_checked_at — when the cron last successfully
--     fetched + parsed Lob's published rates. Used by the Settings
--     UI to show "Last synced X days ago" and by the cron to skip
--     orgs that were just checked.

alter table public.orgs
  add column if not exists lob_published_pricing_cents jsonb,
  add column if not exists lob_pricing_auto_sync boolean not null default false,
  add column if not exists lob_pricing_last_checked_at timestamptz;

comment on column public.orgs.lob_published_pricing_cents is
  'Snapshot of Lob published Developer-tier rates as of last cron fetch. Comparison source for the auto-sync / drift-alert flow.';
comment on column public.orgs.lob_pricing_auto_sync is
  'When true, the weekly cron updates lob_pricing_cents to match Lob published rates. When false, only alerts on drift.';
comment on column public.orgs.lob_pricing_last_checked_at is
  'Timestamp of the most recent successful Lob pricing fetch by the cron.';
