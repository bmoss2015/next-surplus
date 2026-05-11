-- Fix 2: Below-floor flag.
--
-- It must be true only when estimated_surplus is genuinely below the
-- surplus_floor setting. The previous logic did `coalesce(estimated_surplus, 0)
-- < floor`, so any lead imported without a closing bid (surplus unknown ->
-- treated as 0) tripped the flag on incomplete data.
--
-- New behaviour: if closing_bid is null or zero (or surplus can't be derived),
-- leave below_floor NULL — "unknown", not "below". That means the column has
-- to allow nulls.

alter table leads alter column below_floor drop not null;
alter table leads alter column below_floor drop default;

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

  -- Null guard: incomplete import data -> flag stays NULL, not false/true.
  if new.closing_bid is null or new.closing_bid = 0 or new.estimated_surplus is null then
    new.below_floor := null;
  else
    new.below_floor := new.estimated_surplus < user_floor;
  end if;

  return new;
end;
$$;
