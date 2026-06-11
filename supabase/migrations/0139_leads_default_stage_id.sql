-- Fix 3/4: newly imported leads were saved with stage_id = NULL because
-- the importer never set the column. The kanban view filters by stage_id,
-- so those rows became invisible. Add a BEFORE INSERT trigger so any future
-- code path that forgets stage_id still ends up on the org's first open
-- stage, and backfill any existing rows that slipped through.

create or replace function set_lead_default_stage_id()
returns trigger
language plpgsql
as $$
begin
  if new.stage_id is null and new.org_id is not null then
    select id into new.stage_id
      from org_stages
     where org_id = new.org_id
       and is_active = true
     order by position asc
     limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists leads_default_stage_id_trg on leads;
create trigger leads_default_stage_id_trg
  before insert on leads
  for each row
  execute function set_lead_default_stage_id();

-- Backfill any existing leads that have no stage_id by assigning them to
-- the lowest-position active stage in their org. We do this in two passes
-- to mirror migration 0136: first try to match by name (legacy `stage`
-- enum), then fall back to the first open stage for any remaining rows.

update leads l
   set stage_id = s.id
  from org_stages s
 where l.stage_id is null
   and s.org_id = l.org_id
   and s.is_active = true
   and lower(replace(s.name, ' ', '_')) = l.stage::text;

update leads l
   set stage_id = sub.id
  from (
    select org_id, id,
           row_number() over (partition by org_id order by position asc) as rn
      from org_stages
     where is_active = true
  ) sub
 where l.stage_id is null
   and l.org_id = sub.org_id
   and sub.rn = 1;
