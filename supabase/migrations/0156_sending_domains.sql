-- Customer Sending Domains (dedicated sending domain per org for outbound
-- email via AWS SES).
--
-- Each org can verify one or more domains they want to send "From:" mail as.
-- We provision a subdomain like send.{their_domain}, point AWS SES at it
-- for DKIM signing, and either (a) write DNS records directly via the user's
-- DNS provider API (Cloudflare, Vercel, GoDaddy via Domain Connect, etc.)
-- OR (b) ask the user to delegate the subdomain to our Route 53 hosted zone
-- with a single NS record (universal fallback that works on any DNS provider).
--
-- Once verified, the existing email send path routes outbound mail through
-- AWS SES with the user's domain in the From header. Recipients see mail
-- coming from the customer, not from us.
--
-- Tiers (set on insert, may change if user re-runs the wizard):
--   tier_a_direct      Cloudflare / Vercel direct API. 2 clicks.
--   tier_b_domain_connect  GoDaddy / IONOS / Domain.com / Web.com / Plesk. 3 clicks.
--   tier_c_delegation  Universal NS-record subdomain delegation. 5 clicks.
--   tier_d_manual      Last resort manual copy paste. Not surfaced today
--                       but kept as a fallback if delegation fails.

-------------------------------------------------------------------------------
-- 1. Table
-------------------------------------------------------------------------------
create table public.customer_sending_domains (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade default auth_org_id(),

  -- The user-facing domain. What they typed. ex: mossequitypartners.com
  domain text not null,

  -- The subdomain we actually verify with SES. Always send.{domain} today,
  -- column kept so we can change the convention later without a migration.
  subdomain text not null,

  -- Which automation tier we routed them through. Drives the wizard UI on
  -- re-verify and informs us how to clean up on delete.
  tier text not null
    check (tier in ('tier_a_direct', 'tier_b_domain_connect', 'tier_c_delegation', 'tier_d_manual')),

  -- The DNS provider we detected at the time of setup. ex: 'cloudflare',
  -- 'godaddy', 'namecheap', 'bluehost', 'unknown'. Stored for analytics and
  -- so we can show a friendly provider name in the UI.
  detected_provider text,

  -- Lifecycle. pending = wizard started, no records yet. verifying = records
  -- present, polling SES + DNS. verified = SES says DKIM matches. failed =
  -- timeout or hard error.
  status text not null default 'pending'
    check (status in ('pending', 'verifying', 'verified', 'failed')),

  -- AWS SES domain identity ARN. Populated on the first verification poll
  -- that succeeds.
  aws_ses_identity_arn text,

  -- Route 53 hosted zone we created for Tier C delegation. Null for other
  -- tiers. Tracked so we can delete the zone on disconnect to stop billing.
  route53_zone_id text,

  -- NS records the user must add at their DNS provider for Tier C. JSON
  -- array of strings like ["ns-123.awsdns-12.com", ...]. Frozen at create
  -- time so the user sees the same records on subsequent wizard runs.
  ns_records jsonb,

  -- Whatever DNS records we wrote directly via the provider API (Tier A/B).
  -- Used for cleanup on delete and for showing the user what we did.
  written_records jsonb,

  -- Operator notes / error context.
  last_error text,

  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (org_id, domain)
);

create index customer_sending_domains_org_id_idx on public.customer_sending_domains (org_id);
create index customer_sending_domains_status_idx on public.customer_sending_domains (status)
  where status in ('pending', 'verifying');

-------------------------------------------------------------------------------
-- 2. RLS
-------------------------------------------------------------------------------
alter table public.customer_sending_domains enable row level security;

create policy "sending_domains_select_own_org"
  on public.customer_sending_domains for select
  using (org_id = auth_org_id());

create policy "sending_domains_insert_own_org"
  on public.customer_sending_domains for insert
  with check (org_id = auth_org_id());

create policy "sending_domains_update_own_org"
  on public.customer_sending_domains for update
  using (org_id = auth_org_id())
  with check (org_id = auth_org_id());

create policy "sending_domains_delete_own_org"
  on public.customer_sending_domains for delete
  using (org_id = auth_org_id());

-------------------------------------------------------------------------------
-- 3. updated_at trigger
-------------------------------------------------------------------------------
create or replace function public.set_updated_at_customer_sending_domains()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_customer_sending_domains_updated_at
  before update on public.customer_sending_domains
  for each row execute function public.set_updated_at_customer_sending_domains();
