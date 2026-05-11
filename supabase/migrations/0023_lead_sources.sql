-- Fix 6: persisted lead-source list for the import wizard.
-- Org-scoped, like the other user-managed option tables. Seeded with the
-- standard three sources for every existing org; the wizard can append new
-- sources via the "Other -> add new" pattern.

create table lead_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade default auth_org_id(),
  name text not null,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create index lead_sources_org_idx on lead_sources(org_id);

alter table lead_sources enable row level security;

create policy "lead_sources org read" on lead_sources for select to authenticated
  using (org_id = auth_org_id());
create policy "lead_sources org insert" on lead_sources for insert to authenticated
  with check (org_id = auth_org_id());
create policy "lead_sources org update" on lead_sources for update to authenticated
  using (org_id = auth_org_id()) with check (org_id = auth_org_id());
create policy "lead_sources org delete" on lead_sources for delete to authenticated
  using (org_id = auth_org_id());

-- Seed the standard sources for every org.
insert into lead_sources (org_id, name)
select o.id, s.name
from orgs o
cross join (values ('Excess Elite'), ('Montgomery County'), ('Manual')) as s(name)
on conflict (org_id, name) do nothing;
