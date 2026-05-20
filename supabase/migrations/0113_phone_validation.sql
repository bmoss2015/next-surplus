-- Phone validation infrastructure
--
-- 1. Drop 'dnc' from the contact_status enum (data fix: move status='dnc' rows
--    to is_dnc=true + status='untested', then recreate enum without 'dnc' so
--    DNC lives only on the is_dnc boolean — single source of truth).
-- 2. Add validation metadata columns to contacts: when checked, by which
--    provider, raw response for audit. The existing `status` column stays as
--    the user-facing valid/invalid/untested indicator that the validator and
--    pencil-edit both write to.
-- 3. Add parallel status + validation columns to each of the 5 phone slots on
--    relatives so relatives' phones can be validated the same way.
-- 4. Create org_addon_usage table for tracking validation API call counts per
--    org per calendar month (powers the Billing meter).
-- 5. Create usage_alerts table to ensure each threshold notice (80/95/100%)
--    fires at most once per org per addon per month.

-- ---------------------------------------------------------------------------
-- 1. contact_status enum: drop 'dnc'
-- ---------------------------------------------------------------------------

update contacts
   set is_dnc = true, status = 'untested'
 where status = 'dnc';

create type contact_status_new as enum ('untested', 'valid', 'invalid');

alter table contacts alter column status drop default;
alter table contacts alter column status type contact_status_new
  using status::text::contact_status_new;
drop type contact_status;
alter type contact_status_new rename to contact_status;
alter table contacts alter column status set default 'untested';

-- ---------------------------------------------------------------------------
-- 2. Validation metadata on contacts
-- ---------------------------------------------------------------------------

alter table contacts add column if not exists validation_checked_at timestamptz;
alter table contacts add column if not exists validation_provider text;
alter table contacts add column if not exists validation_raw jsonb;

-- ---------------------------------------------------------------------------
-- 3. Status + validation columns on each of the 5 relative phone slots
-- ---------------------------------------------------------------------------

alter table relatives add column if not exists phone_status contact_status not null default 'untested';
alter table relatives add column if not exists phone_validation_checked_at timestamptz;
alter table relatives add column if not exists phone_validation_provider text;
alter table relatives add column if not exists phone_validation_raw jsonb;

alter table relatives add column if not exists phone_2_status contact_status not null default 'untested';
alter table relatives add column if not exists phone_2_validation_checked_at timestamptz;
alter table relatives add column if not exists phone_2_validation_provider text;
alter table relatives add column if not exists phone_2_validation_raw jsonb;

alter table relatives add column if not exists phone_3_status contact_status not null default 'untested';
alter table relatives add column if not exists phone_3_validation_checked_at timestamptz;
alter table relatives add column if not exists phone_3_validation_provider text;
alter table relatives add column if not exists phone_3_validation_raw jsonb;

alter table relatives add column if not exists phone_4_status contact_status not null default 'untested';
alter table relatives add column if not exists phone_4_validation_checked_at timestamptz;
alter table relatives add column if not exists phone_4_validation_provider text;
alter table relatives add column if not exists phone_4_validation_raw jsonb;

alter table relatives add column if not exists phone_5_status contact_status not null default 'untested';
alter table relatives add column if not exists phone_5_validation_checked_at timestamptz;
alter table relatives add column if not exists phone_5_validation_provider text;
alter table relatives add column if not exists phone_5_validation_raw jsonb;

-- ---------------------------------------------------------------------------
-- 4. org_addon_usage — one row per metered call (validation, etc.)
-- ---------------------------------------------------------------------------

create table org_addon_usage (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs(id) on delete cascade,
  addon_key text not null,                  -- e.g. 'phone_validation'
  units int not null default 1,
  unit_cost_cents int not null default 0,   -- 0 while on Veriphone Free tier
  period_month date not null,               -- first day of calendar month (e.g. 2026-05-01)
  metadata jsonb,                           -- { provider, phone_e164, result, ... }
  created_at timestamptz not null default now()
);

create index org_addon_usage_org_addon_month_idx
  on org_addon_usage(org_id, addon_key, period_month);

alter table org_addon_usage enable row level security;

create policy "org_addon_usage org read"
  on org_addon_usage for select to authenticated
  using (org_id = auth_org_id());

-- Writes happen via service-role server actions; no insert/update/delete
-- policy means authenticated users cannot write directly (service role
-- bypasses RLS and is the only writer).

-- ---------------------------------------------------------------------------
-- 5. usage_alerts — one row per (org, addon, threshold, month) once sent
-- ---------------------------------------------------------------------------

create table usage_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs(id) on delete cascade,
  addon_key text not null,
  threshold_pct int not null,               -- 80, 95, 100
  period_month date not null,
  sent_at timestamptz not null default now(),
  unique (org_id, addon_key, threshold_pct, period_month)
);

alter table usage_alerts enable row level security;

create policy "usage_alerts org read"
  on usage_alerts for select to authenticated
  using (org_id = auth_org_id());
