-- Customer-facing mail pricing for the SaaS.
--
-- Single global config: the SaaS operator (owner) sets retail rates that
-- every customer org pays. Distinct from the wholesale rates Lob/C2M
-- charge us. Per-org overrides are a future feature; v1 is one global
-- price list.
--
-- Singleton enforced by check constraint on id = 1. Owner edits via
-- /owner > Customer Pricing. Customer org admins read via Settings >
-- Mail > Your Pricing (RLS allows SELECT for any authenticated user
-- so customers can see what they pay).
--
-- wholesale_pricing_cents mirrors the cron-synced Lob published rates so
-- send-time provider-cost lookups have a single source of truth and don't
-- have to query an org row. The weekly cron writes both to here and to
-- the per-org orgs.lob_published_pricing_cents (for back-compat with the
-- existing Provider Costs read path).

create table public.app_pricing_config (
  id smallint primary key default 1,
  -- SaaS subscription fee charged to each customer org per month, cents.
  subscription_monthly_cents integer not null default 7900,
  -- Customer-facing mail rate schedule. JSONB shape matches LobPricing.
  -- Owner-editable. Seeded with the May 2026 verified-competitor
  -- recommendation ($1.25 B&W FC, etc).
  customer_mail_pricing_cents jsonb not null default jsonb_build_object(
    'tier_label', 'Standard',
    'check_base', 145,
    'check_extra_attachment_page', 30,
    'letter_first_class_bw', 125,
    'letter_first_class_color', 145,
    'letter_standard_bw', 99,
    'letter_standard_color', 118,
    'letter_certified_bw', 175,
    'letter_certified_color', 195,
    'letter_extra_page_bw', 15,
    'letter_extra_page_color', 30
  ),
  -- Wholesale rate snapshot (what Lob charges us). Read-only to UI;
  -- written by the weekly cron at /api/cron/lob-pricing-sync. Seed
  -- mirrors Lob's published Developer-tier rates as of 2026-05-22.
  wholesale_pricing_cents jsonb not null default jsonb_build_object(
    'tier_label', 'Lob Developer (published)',
    'check_base', 116,
    'check_extra_attachment_page', 22,
    'letter_first_class_bw', 103,
    'letter_first_class_color', 119,
    'letter_standard_bw', 81,
    'letter_standard_color', 97,
    'letter_certified_bw', 103,
    'letter_certified_color', 119,
    'letter_extra_page_bw', 10,
    'letter_extra_page_color', 20
  ),
  wholesale_last_checked_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint app_pricing_config_singleton check (id = 1)
);

-- Seed the single row.
insert into public.app_pricing_config (id) values (1) on conflict do nothing;

alter table public.app_pricing_config enable row level security;

-- Read: any authenticated user can read. Customer admins need this for
-- their Settings > Your Pricing view; the values shown to them are the
-- customer-facing rates, which is exactly what they're authorized to see.
create policy "app_pricing_config_select_all"
  on public.app_pricing_config for select to authenticated
  using (true);

-- Write: owner only.
create policy "app_pricing_config_update_owner"
  on public.app_pricing_config for update to authenticated
  using (auth_is_owner())
  with check (auth_is_owner());

create or replace function set_app_pricing_config_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger app_pricing_config_updated_at
  before update on public.app_pricing_config
  for each row execute function set_app_pricing_config_updated_at();

-- Per-piece provider cost recording on every mail_jobs row.
-- cost_cents was previously "what the org's rate schedule produced", now
-- semantically reframed as "what we billed the customer" (computed from
-- customer_mail_pricing_cents at send time). provider_cost_cents is new
-- and records what Lob or C2M actually charged us. Margin = cost_cents
-- minus provider_cost_cents.
alter table public.mail_jobs
  add column if not exists provider_cost_cents integer;

comment on column public.mail_jobs.cost_cents is
  'Customer-facing charge for this piece. Sum across rows = customer revenue.';
comment on column public.mail_jobs.provider_cost_cents is
  'Wholesale provider cost (Lob or C2M). Sum across rows = cost-to-Bree.';
comment on table public.app_pricing_config is
  'SaaS-wide customer pricing + provider wholesale snapshot. Singleton row enforced by id=1 check. Owner-editable; admins read-only.';
