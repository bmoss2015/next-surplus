-- Fix KKKKK: Recovery Type is derived from a per-state lookup, not entered by
-- hand. Fully populate recovery_type_lookup (the state + sale_type -> recovery
-- type table from migration 0073) for all 50 states, add a trigger that stamps
-- leads.recovery_type from it on insert and whenever state or sale_type changes
-- (falling back to 'unknown' when there is no rule), and backfill every lead.

-- ---------------------------------------------------------------------------
-- Mortgage-foreclosure rules (sale_type = 'MTG')
-- ---------------------------------------------------------------------------
insert into recovery_type_lookup (state, sale_type, recovery_type) values
  ('AL','MTG','judicial'),('CT','MTG','judicial'),('DE','MTG','judicial'),('FL','MTG','judicial'),
  ('HI','MTG','judicial'),('IL','MTG','judicial'),('IN','MTG','judicial'),('IA','MTG','judicial'),
  ('KS','MTG','judicial'),('KY','MTG','judicial'),('LA','MTG','judicial'),('ME','MTG','judicial'),
  ('MD','MTG','judicial'),('MA','MTG','judicial'),('MN','MTG','judicial'),('MO','MTG','judicial'),
  ('MT','MTG','judicial'),('NE','MTG','judicial'),('NJ','MTG','judicial'),('NM','MTG','judicial'),
  ('NY','MTG','judicial'),('ND','MTG','judicial'),('OH','MTG','judicial'),('OK','MTG','judicial'),
  ('PA','MTG','judicial'),('RI','MTG','judicial'),('SC','MTG','judicial'),('SD','MTG','judicial'),
  ('VT','MTG','judicial'),('WI','MTG','judicial'),
  ('AK','MTG','non_judicial'),('AZ','MTG','non_judicial'),('AR','MTG','non_judicial'),('CA','MTG','non_judicial'),
  ('CO','MTG','non_judicial'),('GA','MTG','non_judicial'),('ID','MTG','non_judicial'),('MI','MTG','non_judicial'),
  ('MS','MTG','non_judicial'),('NV','MTG','non_judicial'),('NH','MTG','non_judicial'),('NC','MTG','non_judicial'),
  ('OR','MTG','non_judicial'),('TN','MTG','non_judicial'),('TX','MTG','non_judicial'),('UT','MTG','non_judicial'),
  ('VA','MTG','non_judicial'),('WA','MTG','non_judicial'),('WY','MTG','non_judicial'),('WV','MTG','non_judicial')
on conflict (state, sale_type) do update set recovery_type = excluded.recovery_type;

-- ---------------------------------------------------------------------------
-- Tax-sale rules (sale_type = 'TAX'): judicial in NY, NJ, CT, IL, MA;
-- non-judicial in the other 45.
-- ---------------------------------------------------------------------------
insert into recovery_type_lookup (state, sale_type, recovery_type) values
  ('NY','TAX','judicial'),('NJ','TAX','judicial'),('CT','TAX','judicial'),('IL','TAX','judicial'),('MA','TAX','judicial'),
  ('AL','TAX','non_judicial'),('AK','TAX','non_judicial'),('AZ','TAX','non_judicial'),('AR','TAX','non_judicial'),
  ('CA','TAX','non_judicial'),('CO','TAX','non_judicial'),('DE','TAX','non_judicial'),('FL','TAX','non_judicial'),
  ('GA','TAX','non_judicial'),('HI','TAX','non_judicial'),('ID','TAX','non_judicial'),('IN','TAX','non_judicial'),
  ('IA','TAX','non_judicial'),('KS','TAX','non_judicial'),('KY','TAX','non_judicial'),('LA','TAX','non_judicial'),
  ('ME','TAX','non_judicial'),('MD','TAX','non_judicial'),('MI','TAX','non_judicial'),('MN','TAX','non_judicial'),
  ('MS','TAX','non_judicial'),('MO','TAX','non_judicial'),('MT','TAX','non_judicial'),('NE','TAX','non_judicial'),
  ('NV','TAX','non_judicial'),('NH','TAX','non_judicial'),('NM','TAX','non_judicial'),('NC','TAX','non_judicial'),
  ('ND','TAX','non_judicial'),('OH','TAX','non_judicial'),('OK','TAX','non_judicial'),('OR','TAX','non_judicial'),
  ('PA','TAX','non_judicial'),('RI','TAX','non_judicial'),('SC','TAX','non_judicial'),('SD','TAX','non_judicial'),
  ('TN','TAX','non_judicial'),('TX','TAX','non_judicial'),('UT','TAX','non_judicial'),('VT','TAX','non_judicial'),
  ('VA','TAX','non_judicial'),('WA','TAX','non_judicial'),('WV','TAX','non_judicial'),('WI','TAX','non_judicial'),
  ('WY','TAX','non_judicial')
on conflict (state, sale_type) do update set recovery_type = excluded.recovery_type;

-- ---------------------------------------------------------------------------
-- Auto-stamp leads.recovery_type from the lookup.
-- ---------------------------------------------------------------------------
create or replace function set_lead_recovery_type() returns trigger
language plpgsql as $$
declare v_rt recovery_type;
begin
  select recovery_type into v_rt
    from recovery_type_lookup
   where state = new.state and sale_type = new.sale_type;
  if v_rt is not null then
    new.recovery_type := v_rt;
  elsif new.recovery_type is null then
    new.recovery_type := 'unknown';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_lead_recovery_type on leads;
create trigger trg_set_lead_recovery_type
  before insert or update of state, sale_type on leads
  for each row execute function set_lead_recovery_type();

-- Backfill existing leads.
update leads l
   set recovery_type = r.recovery_type
  from recovery_type_lookup r
 where r.state = l.state
   and r.sale_type = l.sale_type
   and l.recovery_type is distinct from r.recovery_type;

update leads
   set recovery_type = 'unknown'
 where recovery_type is null;
