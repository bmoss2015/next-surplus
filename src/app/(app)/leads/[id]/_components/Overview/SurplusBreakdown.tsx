"use client";

import type { LienRow } from "@/lib/leads/fetch-detail";
import { formatCurrency } from "@/lib/leads/format";
import { cn } from "@/lib/cn";
import { useConfirmedSurplus } from "../ConfirmedSurplusContext";

// Fix VVVV2 / WWWW2 / EEEEE / IIIII: the Surplus Breakdown card on the Overview
// tab — read-only in full (the confirmed surplus is edited only from the hero
// card; the attorney fee is edited on the Contacts tab). Court Costs and Opening
// Bid do not appear or factor in. Calculated Surplus = Closing Bid − Tax /
// Mortgage Payoff − Total Liens; when a Confirmed Surplus is set that row dims
// and strikes through to show it has been superseded. Est. Net Payout =
// (active surplus × recovery fee %) − attorney fee.

const FIELD_LABEL = "text-[13px] font-normal text-[#64748b]";
const FIELD_VALUE = "text-[14px] font-medium text-[#0f1729]";

function Row({
  label,
  value,
  superseded,
}: {
  label: string;
  value: string;
  superseded?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[170px_1fr] items-center leading-[1.85]",
        superseded && "opacity-50"
      )}
    >
      <span className={cn(FIELD_LABEL, superseded && "line-through")}>{label}</span>
      <span className={cn(FIELD_VALUE, superseded && "line-through")}>{value}</span>
    </div>
  );
}

export function SurplusBreakdown({
  closingBid,
  outstandingDebt,
  liens,
  recoveryFeePercent,
  attorneyCost,
}: {
  closingBid: number | null;
  outstandingDebt: number | null;
  liens: LienRow[];
  recoveryFeePercent: number;
  attorneyCost: number;
}) {
  const { confirmedSurplus } = useConfirmedSurplus();
  const liensTotal = liens.reduce((sum, l) => sum + (l.amount ?? 0), 0);
  const calculatedSurplus =
    closingBid != null ? closingBid - (outstandingDebt ?? 0) - liensTotal : null;
  const hasConfirmed = confirmedSurplus != null && confirmedSurplus !== 0;
  const surplusForMath = hasConfirmed ? (confirmedSurplus as number) : calculatedSurplus ?? 0;
  const feeAmount = surplusForMath * (recoveryFeePercent / 100);
  const netPayout = feeAmount - attorneyCost;

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <h3 className="section-subheader">Surplus Breakdown</h3>
      <Row label="Closing Bid" value={formatCurrency(closingBid)} />
      <Row label="Tax / Mortgage Payoff" value={formatCurrency(outstandingDebt)} />
      <Row label="Total Liens" value={formatCurrency(liensTotal)} />
      <Row label="Calculated Surplus" value={formatCurrency(calculatedSurplus)} superseded={hasConfirmed} />
      <Row
        label="Confirmed Surplus"
        value={hasConfirmed ? formatCurrency(confirmedSurplus) : "Not Confirmed"}
      />
      <Row label="Recovery Fee" value={`${recoveryFeePercent}% · ${formatCurrency(feeAmount)}`} />
      <Row label="Attorney Fee" value={formatCurrency(attorneyCost)} />
      <div className="mt-1 grid grid-cols-[170px_1fr] items-center border-t border-gray-200 pt-2 leading-[1.85]">
        <span className="text-[13px] font-semibold text-[#0f1729]">Est. Net Payout</span>
        <span className="text-[15px] font-bold text-[#0f1729]">{formatCurrency(netPayout)}</span>
      </div>
    </div>
  );
}
