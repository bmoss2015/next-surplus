// Fix SS / Fix LLL: the single "active surplus" a lead's money math runs on.
// Priority:
//   1. confirmed_surplus  — if set and non-zero (county-verified)
//   2. estimated_surplus  — if a closing bid exists (closing bid − debt − costs − liens)
//   3. source_surplus     — if the lead source reported one
//   4. 0                  — fallback
export type SurplusBasis = "confirmed" | "estimated" | "source" | "none";

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
  if (lead.closing_bid != null) return { value: lead.estimated_surplus ?? 0, basis: "estimated" };
  const source = lead.source_surplus;
  if (source != null) return { value: source, basis: "source" };
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
    case "estimated":
      return "Based On Estimated Surplus";
    case "source":
      return "Based On Source Surplus";
    default:
      return "No Surplus On File Yet";
  }
}
