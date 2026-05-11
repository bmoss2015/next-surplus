-- Fixes 64, 66, 36: three new org-scoped Settings tables.
--   * scripts                — saved call/SMS/email scripts (optionally per state)
--   * state_phone_numbers    — outbound phone number per US state (Twilio prep)
--   * research_templates     — ordered research checklists (optionally per state / sale type)
-- All three follow the standard org-scoped pattern: org_id default auth_org_id(),
-- RLS for authenticated where org_id = auth_org_id(), set_updated_at trigger.

-------------------------------------------------------------------------------
-- scripts
-------------------------------------------------------------------------------
create table scripts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade default auth_org_id(),
  name text not null,
  state text,
  channel text not null check (channel in ('Call','SMS','Email')) default 'Call',
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scripts_org_idx on scripts(org_id);

alter table scripts enable row level security;

create policy "scripts org read" on scripts for select to authenticated
  using (org_id = auth_org_id());
create policy "scripts org insert" on scripts for insert to authenticated
  with check (org_id = auth_org_id());
create policy "scripts org update" on scripts for update to authenticated
  using (org_id = auth_org_id()) with check (org_id = auth_org_id());
create policy "scripts org delete" on scripts for delete to authenticated
  using (org_id = auth_org_id());

create trigger scripts_updated_at before update on scripts
  for each row execute function set_updated_at();

-------------------------------------------------------------------------------
-- state_phone_numbers
-------------------------------------------------------------------------------
create table state_phone_numbers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade default auth_org_id(),
  state text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, state)
);

create index state_phone_numbers_org_idx on state_phone_numbers(org_id);

alter table state_phone_numbers enable row level security;

create policy "state_phone_numbers org read" on state_phone_numbers for select to authenticated
  using (org_id = auth_org_id());
create policy "state_phone_numbers org insert" on state_phone_numbers for insert to authenticated
  with check (org_id = auth_org_id());
create policy "state_phone_numbers org update" on state_phone_numbers for update to authenticated
  using (org_id = auth_org_id()) with check (org_id = auth_org_id());
create policy "state_phone_numbers org delete" on state_phone_numbers for delete to authenticated
  using (org_id = auth_org_id());

create trigger state_phone_numbers_updated_at before update on state_phone_numbers
  for each row execute function set_updated_at();

-------------------------------------------------------------------------------
-- research_templates
-------------------------------------------------------------------------------
-- state: US state code or NULL (= universal)
-- sale_type: 'TAX' | 'MTG' | NULL (= any)
-- steps: jsonb array of { "name": string, "url": string|null, "instructions": string|null } in display order
create table research_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade default auth_org_id(),
  name text not null,
  state text,
  sale_type text,
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index research_templates_org_idx on research_templates(org_id);

alter table research_templates enable row level security;

create policy "research_templates org read" on research_templates for select to authenticated
  using (org_id = auth_org_id());
create policy "research_templates org insert" on research_templates for insert to authenticated
  with check (org_id = auth_org_id());
create policy "research_templates org update" on research_templates for update to authenticated
  using (org_id = auth_org_id()) with check (org_id = auth_org_id());
create policy "research_templates org delete" on research_templates for delete to authenticated
  using (org_id = auth_org_id());

create trigger research_templates_updated_at before update on research_templates
  for each row execute function set_updated_at();

-- Seed one example research template per org (only if that org has none yet).
insert into research_templates (org_id, name, state, sale_type, steps)
select o.id, 'Georgia Mortgage', 'GA', 'MTG', $json$[
 {"name":"Public Notice Search","url":"https://georgiapublicnotice.com","instructions":"Search by last name and street number. Set date range to 6 months before sale date. Confirm owner name matches lead."},
 {"name":"Georgia Case Search","url":"https://publicaccess.courts.state.ga.us","instructions":"Search by county and owner last name. Look for foreclosure deed filed within past 2 years. Note case number."},
 {"name":"Obituary Search","url":"https://www.legacy.com","instructions":"Search owner full name. If deceased note date of death and any surviving family members. Mark lead owner status as Deceased if confirmed."}
]$json$::jsonb
from orgs o
where not exists (select 1 from research_templates rt where rt.org_id = o.id);
