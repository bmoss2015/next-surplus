-- Fix 2 (cont.): backfill below_floor for existing leads using the corrected
-- logic. The trigger only re-evaluates the flag when a sale-financial column
-- changes, so rows already in the table keep whatever the old `coalesce(...,0)`
-- logic gave them until touched. Recompute them now.

update leads l
set below_floor = case
  when l.closing_bid is null or l.closing_bid = 0 or l.estimated_surplus is null then null
  else l.estimated_surplus < coalesce(
    (select (value::text)::numeric from app_settings where key = 'surplus_floor' limit 1),
    35000
  )
end
where l.below_floor is distinct from case
  when l.closing_bid is null or l.closing_bid = 0 or l.estimated_surplus is null then null
  else l.estimated_surplus < coalesce(
    (select (value::text)::numeric from app_settings where key = 'surplus_floor' limit 1),
    35000
  )
end;
