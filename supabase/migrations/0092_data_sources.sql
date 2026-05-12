-- Fix JJJJ2: org-scoped list of data sources for the Property Info "Data
-- Source" dropdown. Seeded with the standard presets; users can add custom ones
-- that persist for future leads.
create table data_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade default auth_org_id(),
  name text not null,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create index data_sources_org_idx on data_sources(org_id);

alter table data_sources enable row level security;

create policy "data_sources org all" on data_sources for all to authenticated
  using (org_id = auth_org_id()) with check (org_id = auth_org_id());

-- Seed the preset data sources for every org that has none yet.
insert into data_sources (org_id, name)
select o.id, v.name
from orgs o
cross join (values
  ('County Tax Sale'),
  ('Auction.com'),
  ('Bid4Assets'),
  ('Courthouse Steps'),
  ('RealAuction'),
  ('Manual Entry')
) as v(name)
where not exists (select 1 from data_sources d where d.org_id = o.id);
