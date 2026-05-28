-- Playbook redesign: nested sub-steps + explicit apply rules.
--
-- Schema additions on research_templates:
--   apply_mode   - how a playbook auto-attaches to new imported leads
--                  ('manual' | 'all' | 'match'). Default 'match' keeps
--                  existing single-state templates functioning.
--   apply_states - array of US state codes when apply_mode = 'match'.
--                  Empty array + mode 'match' means no auto-apply.
--
-- The step JSONB shape on both research_templates.steps and
-- lead_research_templates.steps gains an optional `children: Step[]`
-- field. Flat playbooks (no children) remain valid and continue to
-- render as single-step parents.
--
-- A backfill seeds apply_states from the legacy `state` column so
-- existing single-state templates keep matching the same leads.

alter table public.research_templates
  add column if not exists apply_mode text not null default 'match'
    check (apply_mode in ('manual', 'all', 'match')),
  add column if not exists apply_states text[] not null default '{}'::text[];

update public.research_templates
   set apply_states = array[state]
 where state is not null
   and (apply_states is null or array_length(apply_states, 1) is null);

update public.research_templates
   set apply_mode = 'all'
 where state is null
   and apply_mode = 'match';

create index if not exists research_templates_apply_mode_idx
  on public.research_templates(apply_mode);
