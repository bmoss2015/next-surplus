-- Global app_settings table for v0 use. Per-user settings table stays
-- around for when auth lands. This singleton-style table holds the values
-- that the UI surfaces today.

create table app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table app_settings enable row level security;
create policy "app_settings: authenticated all"
  on app_settings for all to authenticated using (true) with check (true);

insert into app_settings (key, value) values
  ('default_recovery_fee_percent', '30'::jsonb),
  ('default_attorney_cost', '2500'::jsonb),
  ('surplus_floor', '35000'::jsonb)
on conflict (key) do nothing;

-- Update the below_floor trigger to read from app_settings instead of the
-- per-user settings table (which has no rows in v0).
create or replace function leads_compute_below_floor()
returns trigger
language plpgsql
as $$
declare
  user_floor numeric;
begin
  select (value::text)::numeric
    into user_floor
    from app_settings
   where key = 'surplus_floor'
   limit 1;

  if user_floor is null then
    user_floor := 35000;
  end if;

  new.below_floor := coalesce(new.estimated_surplus, 0) < user_floor;
  return new;
end;
$$;
