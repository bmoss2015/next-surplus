-- Fix JJ: a lightweight org-scoped audit log for sensitive Settings actions.
-- Currently records team member role changes; admins write, the org reads.

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_org_id_idx on audit_log (org_id);

alter table audit_log enable row level security;

create policy "audit_log: org read" on audit_log
  for select to authenticated
  using (org_id = auth_org_id());

create policy "audit_log: admin insert" on audit_log
  for insert to authenticated
  with check (org_id = auth_org_id() and auth_is_admin());
