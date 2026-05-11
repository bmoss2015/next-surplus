-- Fix 7: smart column mapping persistence. Replaces import_column_mappings.
-- A saved mapping is now keyed to the SELECTED LEAD SOURCE (not a header
-- signature), and also remembers the columns the user explicitly dismissed
-- for that source. On the next import that picks the same source, the wizard
-- skips the auto-map / unrecognized steps entirely.

create table import_source_mappings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade default auth_org_id(),
  lead_source text not null,
  mapping jsonb not null default '{}'::jsonb,
  dismissed_columns jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, lead_source)
);

create index import_source_mappings_org_idx on import_source_mappings(org_id);

create trigger import_source_mappings_updated_at before update on import_source_mappings
  for each row execute function set_updated_at();

alter table import_source_mappings enable row level security;

create policy "import_source_mappings org read" on import_source_mappings for select to authenticated
  using (org_id = auth_org_id());
create policy "import_source_mappings org insert" on import_source_mappings for insert to authenticated
  with check (org_id = auth_org_id());
create policy "import_source_mappings org update" on import_source_mappings for update to authenticated
  using (org_id = auth_org_id()) with check (org_id = auth_org_id());
create policy "import_source_mappings org delete" on import_source_mappings for delete to authenticated
  using (org_id = auth_org_id());

-- The old signature-keyed table had no data worth migrating.
drop table if exists import_column_mappings;
