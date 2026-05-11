create table research_step_progress (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade default auth_org_id(),
  lead_id uuid not null references leads(id) on delete cascade,
  template_id uuid not null,
  step_index int not null,
  status text not null default 'Not Started'
    check (status in ('Not Started','In Progress','Done','Blocked')),
  findings text,
  updated_at timestamptz not null default now(),
  unique (lead_id, template_id, step_index)
);
create index research_step_progress_lead_idx on research_step_progress(lead_id);
alter table research_step_progress enable row level security;
create policy "rsp org all" on research_step_progress for all to authenticated
  using (org_id = auth_org_id()) with check (org_id = auth_org_id());
create trigger rsp_updated_at before update on research_step_progress
  for each row execute function set_updated_at();
