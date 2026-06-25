-- Saved Lists + Telnyx Pricing + A2P 10DLC + Phone-Cost Snapshot
--
-- 1. saved_lists           — named filter combinations per org for repeat
--                            dialing (Texas Tax Sale, Pending Probate, etc).
--
-- 2. telnyx_pricing_settings — admin-configurable per-org markup rates.
--                              Mirrors the LobPricingSettings pattern.
--                              Cents stored, dollars in UI.
--
-- 3. a2p_brand_registrations — per-org A2P brand registration state and
--                              Telnyx brand_id. One row per org.
--
-- 4. a2p_campaign_registrations — per-org A2P campaign state and Telnyx
--                                 campaign_id. Tied to a brand row.
--
-- 5. phone_numbers          — add a few fields for compliance + cost
--                              snapshot (live Telnyx cost at purchase time).

-------------------------------------------------------------------------------
-- 1. saved_lists
-------------------------------------------------------------------------------
create table public.saved_lists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade default auth_org_id(),
  created_by uuid not null references auth.users(id) on delete cascade,

  -- Display name shown in the /dialer/setup Lead Source picker.
  name text not null,

  -- Snapshot of the filter combo at save time. Same JSONB shape as
  -- dialer_sessions.list_filter_snapshot so the picker can re-apply.
  filter_json jsonb not null default '{}'::jsonb,

  -- Set whenever a dialer session uses this list. Drives recency sort in
  -- the picker so popular lists float to the top.
  last_run_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saved_lists_org_idx on public.saved_lists(org_id);
create index saved_lists_recency_idx on public.saved_lists(org_id, last_run_at desc nulls last);

alter table public.saved_lists enable row level security;

create policy saved_lists_select on public.saved_lists
  for select using (org_id = auth_org_id());
create policy saved_lists_insert on public.saved_lists
  for insert with check (org_id = auth_org_id());
create policy saved_lists_update on public.saved_lists
  for update using (org_id = auth_org_id());
create policy saved_lists_delete on public.saved_lists
  for delete using (org_id = auth_org_id());

-------------------------------------------------------------------------------
-- 2. telnyx_pricing_settings
-------------------------------------------------------------------------------
-- One row per org. Markup-over-Telnyx-cost configuration. Set by Bree
-- (org admin) at the Workflow Minds umbrella level for now; future
-- multi-tenant pricing tiers will extend this.
create table public.telnyx_pricing_settings (
  org_id uuid primary key references public.orgs(id) on delete cascade,

  -- Current Telnyx cost as observed (refreshed by weekly cron + on each
  -- new purchase). Cents.
  telnyx_phone_monthly_cents int not null default 100,           -- $1.00
  telnyx_voice_outbound_per_min_cents numeric(8,4) not null default 0.7,    -- $0.007
  telnyx_sms_outbound_per_segment_cents numeric(8,4) not null default 0.5,  -- $0.005

  -- Customer-facing prices. Cents.
  customer_phone_monthly_cents int not null default 300,         -- $3.00
  customer_voice_outbound_per_min_cents numeric(8,4) not null default 2.0,    -- $0.02
  customer_sms_outbound_per_segment_cents numeric(8,4) not null default 2.0,  -- $0.02

  -- Quarterly cron pings GET /v2/available_phone_numbers and stamps the
  -- result here. Lets us alert on drift without forcing a re-pull on every
  -- settings page render.
  last_telnyx_price_check_at timestamptz,
  last_telnyx_price_drift_pct numeric(6,2),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.telnyx_pricing_settings enable row level security;

create policy telnyx_pricing_select on public.telnyx_pricing_settings
  for select using (org_id = auth_org_id());
create policy telnyx_pricing_insert on public.telnyx_pricing_settings
  for insert with check (org_id = auth_org_id());
create policy telnyx_pricing_update on public.telnyx_pricing_settings
  for update using (org_id = auth_org_id());

-------------------------------------------------------------------------------
-- 3. a2p_brand_registrations
-------------------------------------------------------------------------------
create table public.a2p_brand_registrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.orgs(id) on delete cascade default auth_org_id(),

  -- Telnyx-side brand identifier. Null until first submission.
  telnyx_brand_id text unique,

  -- Snapshot of submitted fields.
  company_legal_name text,
  ein text,
  vertical text default 'FINANCIAL',
  company_website text,
  privacy_policy_url text,
  terms_url text,
  authorized_rep_name text,
  authorized_rep_email text,
  authorized_rep_phone text,
  company_address_street text,
  company_address_city text,
  company_address_state text,
  company_address_postal_code text,
  company_address_country text default 'US',

  -- Lifecycle.
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'suspended')),
  rejection_reason text,
  vetting_tier text check (vetting_tier in ('standard', 'enhanced', 'sole_prop')),
  vetting_fee_cents int,

  submitted_at timestamptz,
  approved_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index a2p_brand_org_idx on public.a2p_brand_registrations(org_id);

alter table public.a2p_brand_registrations enable row level security;

create policy a2p_brand_select on public.a2p_brand_registrations
  for select using (org_id = auth_org_id());
create policy a2p_brand_insert on public.a2p_brand_registrations
  for insert with check (org_id = auth_org_id());
create policy a2p_brand_update on public.a2p_brand_registrations
  for update using (org_id = auth_org_id());

-------------------------------------------------------------------------------
-- 4. a2p_campaign_registrations
-------------------------------------------------------------------------------
create table public.a2p_campaign_registrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade default auth_org_id(),

  brand_id uuid not null references public.a2p_brand_registrations(id) on delete cascade,
  telnyx_campaign_id text unique,

  use_case text default 'CUSTOMER_CARE',
  description text,
  sample_messages text[] default '{}'::text[],
  opt_in_keywords text[] default '{}'::text[],
  opt_in_message text,
  opt_out_message text,
  help_message text,
  monthly_volume text default 'LOW',

  affiliate_marketing boolean not null default false,
  age_gated boolean not null default false,
  direct_lending boolean not null default false,

  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'in_mno_review', 'approved', 'rejected', 'suspended')),
  rejection_reason text,

  submitted_at timestamptz,
  approved_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index a2p_campaign_org_idx on public.a2p_campaign_registrations(org_id);
create index a2p_campaign_brand_idx on public.a2p_campaign_registrations(brand_id);

alter table public.a2p_campaign_registrations enable row level security;

create policy a2p_campaign_select on public.a2p_campaign_registrations
  for select using (org_id = auth_org_id());
create policy a2p_campaign_insert on public.a2p_campaign_registrations
  for insert with check (org_id = auth_org_id());
create policy a2p_campaign_update on public.a2p_campaign_registrations
  for update using (org_id = auth_org_id());

-------------------------------------------------------------------------------
-- 5. phone_numbers additions
-------------------------------------------------------------------------------
-- Track which campaign each number is tied to (for SMS routing).
alter table public.phone_numbers
  add column if not exists campaign_id uuid references public.a2p_campaign_registrations(id) on delete set null;

-- Snapshot of what Telnyx charged us at purchase time (vs the cents value
-- which is the live current cost). Lets us see if Telnyx raises prices.
alter table public.phone_numbers
  add column if not exists telnyx_cost_at_purchase_cents int;

-------------------------------------------------------------------------------
-- updated_at triggers
-------------------------------------------------------------------------------
create trigger set_updated_at_saved_lists
  before update on public.saved_lists
  for each row execute function public.set_updated_at();

create trigger set_updated_at_telnyx_pricing
  before update on public.telnyx_pricing_settings
  for each row execute function public.set_updated_at();

create trigger set_updated_at_a2p_brand
  before update on public.a2p_brand_registrations
  for each row execute function public.set_updated_at();

create trigger set_updated_at_a2p_campaign
  before update on public.a2p_campaign_registrations
  for each row execute function public.set_updated_at();
