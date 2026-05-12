-- Fix JJJJ: Research tab overhaul.
--
-- Research checklists are now SNAPSHOTTED onto each lead the first time the
-- Research tab is opened. After that the steps belong to the lead, not the
-- Settings template — editing a template never rewrites work already done on an
-- existing lead, and a lead can carry several templates at once.
--
-- lead_research_templates.steps is a jsonb array of:
--   { "name": string, "url": string|null, "instructions": string|null,
--     "done": bool, "findings": string|null }
-- in display order.

create table lead_research_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade default auth_org_id(),
  lead_id uuid not null references leads(id) on delete cascade,
  source_template_id uuid,
  name text not null,
  steps jsonb not null default '[]'::jsonb,
  collapsed boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lead_research_templates_lead_idx on lead_research_templates(lead_id);

alter table lead_research_templates enable row level security;

create policy "lrt org all" on lead_research_templates for all to authenticated
  using (org_id = auth_org_id()) with check (org_id = auth_org_id());

create trigger lrt_updated_at before update on lead_research_templates
  for each row execute function set_updated_at();

-- Once a lead's checklists are snapshotted we never auto-load templates again.
alter table leads add column if not exists research_initialized boolean not null default false;

-- Migrate any existing per-step progress into per-lead snapshots.
do $$
declare r record;
begin
  for r in
    select distinct p.lead_id, p.template_id, l.org_id
    from research_step_progress p
    join leads l on l.id = p.lead_id
  loop
    insert into lead_research_templates (org_id, lead_id, source_template_id, name, steps)
    select
      r.org_id,
      r.lead_id,
      r.template_id,
      coalesce(t.name, 'Research'),
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'name', coalesce(s.value->>'name', ''),
              'url', s.value->>'url',
              'instructions', s.value->>'instructions',
              'done', coalesce((
                select pp.status = 'Done'
                from research_step_progress pp
                where pp.lead_id = r.lead_id
                  and pp.template_id = r.template_id
                  and pp.step_index = (s.ord - 1)
              ), false),
              'findings', (
                select pp.findings
                from research_step_progress pp
                where pp.lead_id = r.lead_id
                  and pp.template_id = r.template_id
                  and pp.step_index = (s.ord - 1)
              )
            )
            order by s.ord
          )
          from jsonb_array_elements(coalesce(t.steps, '[]'::jsonb)) with ordinality s(value, ord)
        ),
        '[]'::jsonb
      )
    from research_templates t
    where t.id = r.template_id;
  end loop;

  -- Any lead that already has research activity counts as initialized.
  update leads set research_initialized = true
  where id in (select lead_id from research_step_progress)
     or research_overall_findings is not null;
end $$;
