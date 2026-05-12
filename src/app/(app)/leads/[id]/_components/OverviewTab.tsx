import type { LeadDetailWithCounts } from "@/lib/leads/fetch-detail";
import { SurplusBreakdown } from "./Overview/SurplusBreakdown";

// Fix KK: Overview is just the Surplus Breakdown card now — Mailing Addresses
// moved to the Contacts tab, and there is no research content here.
export function OverviewTab({ lead }: { lead: LeadDetailWithCounts }) {
  return (
    <div className="space-y-4">
      <SurplusBreakdown
        leadId={lead.id}
        closingBid={lead.closing_bid}
        openingBid={lead.opening_bid}
        outstandingDebt={lead.outstanding_debt}
        courtCosts={lead.court_costs}
        liens={lead.liens}
        estimatedSurplus={lead.estimated_surplus}
        recoveryFeePercent={lead.recovery_fee_percent}
        attorneyCost={lead.attorney_cost}
      />
    </div>
  );
}
