-- Fix 1: Estimated Net Payout formula was computing the owner's take-home
-- (surplus minus our recovery fee minus attorney cost). The correct value is
-- OUR net: the recovery fee dollar amount minus the attorney cost.
--
--   recovery_fee_dollar_amount = estimated_surplus * (recovery_fee_percent / 100)
--   estimated_net_payout       = recovery_fee_dollar_amount - attorney_cost
--
-- estimated_surplus is itself a generated column, so its expression is inlined
-- here (a generated column cannot reference another generated column).
-- Labelled "Est. Net To You" in the UI. The owner take-home figure is not
-- surfaced anywhere.

alter table leads drop column estimated_net_payout;

alter table leads add column estimated_net_payout numeric(12,2) generated always as (
  (
    coalesce(closing_bid, 0)
    - coalesce(outstanding_debt, 0)
    - coalesce(court_costs, 0)
    - coalesce(junior_liens, 0)
  ) * (recovery_fee_percent / 100)
  - attorney_cost
) stored;
