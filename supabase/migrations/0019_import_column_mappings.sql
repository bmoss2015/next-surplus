-- Fix 9: remember column mappings between imports. Keyed by a normalized
-- signature of the detected CSV header row, so the next upload of the same
-- file format pre-fills the mapping. Org-scoped like everything else.

create table import_column_mappings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade default auth_org_id(),
  header_signature text not null,
  mapping jsonb not null,
  lead_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, header_signature)
);

create index import_column_mappings_org_idx on import_column_mappings(org_id);

create trigger import_column_mappings_updated_at before update on import_column_mappings
  for each row execute function set_updated_at();

alter table import_column_mappings enable row level security;

create policy "import_column_mappings org read" on import_column_mappings for select to authenticated
  using (org_id = auth_org_id());
create policy "import_column_mappings org insert" on import_column_mappings for insert to authenticated
  with check (org_id = auth_org_id());
create policy "import_column_mappings org update" on import_column_mappings for update to authenticated
  using (org_id = auth_org_id()) with check (org_id = auth_org_id());
create policy "import_column_mappings org delete" on import_column_mappings for delete to authenticated
  using (org_id = auth_org_id());
