-- estimated_net_payout was diverging from the value shown in the metric strip
-- because the generated column always computed from (closing_bid − debts), while
-- the UI uses a confirmed → source → computed hierarchy and ignores court_costs.
-- That meant searching for the displayed net-payout number never matched the
-- stored value. Realign the column to mirror MetricStripDetail.tsx exactly.
--
-- UI hierarchy (src/app/(app)/leads/[id]/_components/MetricStripDetail.tsx):
--   surplusForMath =
--     confirmed_surplus   if not null and != 0
--     else source_surplus if not null
--     else closing_bid − outstanding_debt − total_liens   (no court_costs)
--     else 0
--   net_payout = surplusForMath * (recovery_fee_percent / 100) − attorney_cost
--
-- A generated column cannot reference another generated column, so we inline.

alter table leads drop column estimated_net_payout;

alter table leads add column estimated_net_payout numeric(12,2) generated always as (
  (
    case
      when confirmed_surplus is not null and confirmed_surplus <> 0 then confirmed_surplus
      when source_surplus is not null then source_surplus
      when closing_bid is not null then
        coalesce(closing_bid, 0)
        - coalesce(outstanding_debt, 0)
        - coalesce(total_liens, 0)
      else 0
    end
  ) * (recovery_fee_percent / 100)
  - coalesce(attorney_cost, 0)
) stored;
