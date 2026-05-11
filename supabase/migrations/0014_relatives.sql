-- Relatives: heirs, spouses, and other family members who are not on the deed
-- but may be useful contacts for deceased / estate leads. Sits alongside
-- `owners` on a lead but is intentionally simpler (no deed/status semantics).

create table relatives (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade default auth_org_id(),
  lead_id uuid not null references leads(id) on delete cascade,
  full_name text not null,
  relationship text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index relatives_lead_id_idx on relatives(lead_id);
create index relatives_org_id_idx on relatives(org_id);

create trigger relatives_updated_at before update on relatives
  for each row execute function set_updated_at();

alter table relatives enable row level security;

create policy "relatives org read" on relatives for select to authenticated
  using (org_id = auth_org_id());
create policy "relatives org insert" on relatives for insert to authenticated
  with check (org_id = auth_org_id());
create policy "relatives org update" on relatives for update to authenticated
  using (org_id = auth_org_id()) with check (org_id = auth_org_id());
create policy "relatives org delete" on relatives for delete to authenticated
  using (org_id = auth_org_id() and auth_is_admin());
