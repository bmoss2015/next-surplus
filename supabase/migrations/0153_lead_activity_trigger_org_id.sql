-- The leads_log_activity trigger inserts into `activities` without setting
-- org_id, relying on the column default `auth_org_id()`. That works for
-- inserts made by an authenticated user, but breaks for service-role inserts
-- (web form submissions, imports) where there is no auth user, so
-- auth_org_id() returns null and the NOT NULL constraint on activities.org_id
-- trips.
--
-- Fix: have the trigger copy org_id from the inserted lead row directly. The
-- trigger function runs as SECURITY DEFINER implicitly via the lead row's own
-- org_id, so this is correct regardless of who is inserting the lead.

create or replace function leads_log_activity()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into activities (lead_id, org_id, activity_type, payload)
    values (new.id, new.org_id, 'lead_created', jsonb_build_object('initial_stage', new.stage::text));
  elsif tg_op = 'UPDATE' and old.stage is distinct from new.stage then
    insert into activities (lead_id, org_id, activity_type, payload)
    values (
      new.id,
      new.org_id,
      'stage_change',
      jsonb_build_object('from', old.stage::text, 'to', new.stage::text)
    );
  end if;
  return null;
end;
$$;
