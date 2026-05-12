// Fix XXXX2: the single "active surplus" a lead's money math runs on. Three
// tiers, evaluated strictly in order:
//   1. confirmed_surplus  — set only by explicit user confirmation
//   2. source_surplus     — the figure the lead source reported on import
//   3. computed           — closing bid − outstanding debt − junior liens,
//                           used only when 1 and 2 are both null
//   (none)                — nothing on file → 0
export type SurplusBasis = "confirmed" | "source" | "computed" | "none";

export type SurplusInputs = {
  confirmed_surplus: number | null | undefined;
  estimated_surplus: number | null | undefined;
  closing_bid: number | null | undefined;
  source_surplus: number | null | undefined;
};

export function activeSurplus(lead: SurplusInputs): {
  value: number;
  basis: SurplusBasis;
} {
  const confirmed = lead.confirmed_surplus;
  if (confirmed != null && confirmed !== 0) return { value: confirmed, basis: "confirmed" };
  if (lead.source_surplus != null) return { value: lead.source_surplus, basis: "source" };
  if (lead.closing_bid != null) return { value: lead.estimated_surplus ?? 0, basis: "computed" };
  return { value: 0, basis: "none" };
}

// Fix EEEEE: Est. Net Payout = (active surplus × recovery fee %) − attorney
// cost. This is the company's take-home: the recovery fee earned, less what the
// attorney is paid.
export function activeNetPayout(
  lead: SurplusInputs & { recovery_fee_percent: number; attorney_cost: number }
): number {
  const value = activeSurplus(lead).value;
  return value * (lead.recovery_fee_percent / 100) - lead.attorney_cost;
}

export function surplusBasisLabel(basis: SurplusBasis): string {
  switch (basis) {
    case "confirmed":
      return "Based On Confirmed Surplus";
    case "source":
      return "Based On Source Surplus";
    case "computed":
      return "Based On Calculated Surplus";
    default:
      return "No Surplus On File Yet";
  }
}
