import {
  fetchOwnersWithContacts,
  type LeadDetailWithCounts,
} from "@/lib/leads/fetch-detail";
import { SurplusBreakdown } from "./Overview/SurplusBreakdown";
import { MailingAddresses } from "./Overview/MailingAddresses";

export async function OverviewTab({ lead }: { lead: LeadDetailWithCounts }) {
  const ownersAndContacts = await fetchOwnersWithContacts(lead.id);

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
        confirmedSurplus={lead.confirmed_surplus}
        recoveryFeePercent={lead.recovery_fee_percent}
        attorneyCost={lead.attorney_cost}
      />
      <MailingAddresses
        leadId={lead.id}
        initialAddresses={ownersAndContacts.contacts}
        owners={ownersAndContacts.owners}
      />
    </div>
  );
}
