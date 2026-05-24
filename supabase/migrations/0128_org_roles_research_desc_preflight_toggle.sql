-- Three small adds to support the remaining UX work:
--
-- 1. org_custom_roles: explicit storage for custom contact-role labels
--    added from Settings (the old behavior only derived them from
--    lead_parties.custom_role_label, so you couldn't add a role
--    without first creating a contact on a lead).
--
-- 2. research_templates.description: nullable text field that was
--    missing from the schema; the research-template editor expects
--    one per Bree's recall.
--
-- 3. app_pricing_config.preflight_verify_enabled: owner-level toggle
--    that controls whether SendMailModal calls Lob /us_verifications
--    before each send. Default ON (current behavior). Owner can flip
--    off via the new Verification toggle in /owner > Customer Pricing
--    to absorb $0.05/send of margin instead of baking it into retail.

create table if not exists public.org_custom_roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade default auth_org_id(),
  label text not null,
  created_at timestamptz not null default now(),
  unique (org_id, label)
);
create index if not exists org_custom_roles_org_idx on public.org_custom_roles(org_id);

alter table public.org_custom_roles enable row level security;
create policy "org_custom_roles org read"
  on public.org_custom_roles for select to authenticated
  using (org_id = auth_org_id());
create policy "org_custom_roles org insert"
  on public.org_custom_roles for insert to authenticated
  with check (org_id = auth_org_id());
create policy "org_custom_roles org delete"
  on public.org_custom_roles for delete to authenticated
  using (org_id = auth_org_id() and auth_is_admin());

alter table public.research_templates
  add column if not exists description text;

alter table public.app_pricing_config
  add column if not exists preflight_verify_enabled boolean not null default true;

comment on column public.app_pricing_config.preflight_verify_enabled is
  'Owner toggle: when true, SendMailModal calls Lob /us_verifications before each send to catch undeliverable addresses inline. Each call costs ~$0.05 on Lob Developer tier. When false, skip the call and rely on Lob send-time validation.';
