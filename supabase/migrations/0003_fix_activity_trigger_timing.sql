-- Fix: leads_log_stage_change ran as BEFORE INSERT and tried to insert into
-- activities with new.id, but the lead row doesn't exist yet at BEFORE INSERT
-- time, so the FK from activities.lead_id failed.
--
-- Split the responsibility:
--   * BEFORE UPDATE: bump stage_changed_at when stage changes
--   * AFTER INSERT or UPDATE: write the activity log row (parent row now exists)

drop trigger if exists leads_log_stage_change_trg on leads;
drop function if exists leads_log_stage_change();

-- BEFORE UPDATE: bump stage_changed_at when stage changes.
-- Insert path doesn't need this — column defaults to now() on insert.
create or replace function leads_bump_stage_changed_at()
returns trigger
language plpgsql
as $$
begin
  if old.stage is distinct from new.stage then
    new.stage_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger leads_bump_stage_changed_at_trg
  before update of stage on leads
  for each row
  execute function leads_bump_stage_changed_at();

-- AFTER INSERT or UPDATE: log to activities. By this point the parent lead row
-- is committed-visible, so the FK is satisfied.
create or replace function leads_log_activity()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into activities (lead_id, activity_type, payload)
    values (new.id, 'lead_created', jsonb_build_object('initial_stage', new.stage::text));
  elsif tg_op = 'UPDATE' and old.stage is distinct from new.stage then
    insert into activities (lead_id, activity_type, payload)
    values (
      new.id,
      'stage_change',
      jsonb_build_object('from', old.stage::text, 'to', new.stage::text)
    );
  end if;
  return null;
end;
$$;

create trigger leads_log_activity_trg
  after insert or update on leads
  for each row
  execute function leads_log_activity();
