"use client";

import type { LienRow } from "@/lib/leads/fetch-detail";
import { formatCurrency } from "@/lib/leads/format";
import { useConfirmedSurplus } from "../ConfirmedSurplusContext";
import { SurplusConfirmControl } from "../SurplusConfirm";

// Fix VVVV2: the Surplus Breakdown card on the Overview tab. It ALWAYS shows
// both numbers, clearly labelled — "Calculated Surplus (Unverified)" and either
// the "Confirmed Surplus" amount or "Not Yet Confirmed" — and carries the
// "Confirm Surplus" action as a secondary entry point (same inline behaviour as
// the metric strip). The Est. Net Payout row uses the confirmed surplus when set
// and the calculated figure otherwise, and labels which one it's based on.
// Court Costs and Opening Bid do not appear or factor in. Calculated Surplus =
// Closing Bid − Tax / Mortgage Payoff − Total Liens.

const FIELD_LABEL = "text-[13px] font-normal text-[#64748b]";
const FIELD_VALUE = "text-[14px] font-medium text-[#0f1729]";

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[200px_1fr] items-center leading-[1.85]">
      <span className={FIELD_LABEL}>{label}</span>
      <span className={FIELD_VALUE}>{value}</span>
    </div>
  );
}

export function SurplusBreakdown({
  leadId,
  closingBid,
  outstandingDebt,
  liens,
  recoveryFeePercent,
  attorneyCost,
}: {
  leadId: string;
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
      <Row
        label={
          <>
            Calculated Surplus <span className="text-gray-400">(Unverified)</span>
          </>
        }
        value={formatCurrency(calculatedSurplus)}
      />
      <Row
        label="Confirmed Surplus"
        value={
          hasConfirmed ? (
            formatCurrency(confirmedSurplus)
          ) : (
            <span className="text-gray-400">Not Yet Confirmed</span>
          )
        }
      />
      <div className="grid grid-cols-[200px_1fr] items-center pb-1 leading-[1.85]">
        <span />
        <SurplusConfirmControl leadId={leadId} calculatedSurplus={calculatedSurplus} />
      </div>
      <Row label="Recovery Fee" value={`${recoveryFeePercent}% · ${formatCurrency(feeAmount)}`} />
      <Row label="Attorney Fee" value={formatCurrency(attorneyCost)} />
      <div className="mt-1 grid grid-cols-[200px_1fr] items-center border-t border-gray-200 pt-2 leading-[1.85]">
        <span className="text-[13px] font-semibold text-[#0f1729]">
          Est. Net Payout{" "}
          <span className="font-normal text-gray-400">
            ({hasConfirmed ? "Based On Confirmed" : "Based On Estimate"})
          </span>
        </span>
        <span className="text-[15px] font-bold text-[#0f1729]">{formatCurrency(netPayout)}</span>
      </div>
    </div>
  );
}
