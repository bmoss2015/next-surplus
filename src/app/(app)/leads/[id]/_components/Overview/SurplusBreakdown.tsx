"use client";

import type { LienRow } from "@/lib/leads/fetch-detail";
import { formatCurrency, formatCurrencyOrDash } from "@/lib/leads/format";
import { cn } from "@/lib/cn";
import { useConfirmedSurplus } from "../ConfirmedSurplusContext";
import { SurplusConfirmControl } from "../SurplusConfirm";

// Fix CCCC3: the Surplus Breakdown card on the Overview tab. Three visual
// tiers: a light-petrol "Sale Data — for reference only" strip; the Potential /
// Confirmed Surplus rows (the loud part); then quieter Recovery / Attorney Fee
// rows; then the EST. NET PAYOUT line (the largest number on the card). Dividers
// step up in weight toward the bottom. A 0 / null in the Sale Data strip shows
// as "—", not "$0".

function SaleDataPoint({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <span className="text-xs uppercase tracking-wide text-[#6b7280]">{label}</span>
      <span className="text-sm font-medium text-[#111827]">{formatCurrencyOrDash(value)}</span>
    </div>
  );
}

// Fix CCCC3 PART 1: the source line under Potential Surplus.
function potentialSourceLabel(
  sourceSurplus: number | null,
  leadSource: string | null,
  computedAvailable: boolean
): string {
  if (sourceSurplus != null) {
    return leadSource ? `Estimated — Per ${leadSource}` : "Estimated — Manually Entered";
  }
  if (computedAvailable) return "Estimated — Calculated from Sale Data";
  return "No Surplus On File Yet";
}

export function SurplusBreakdown({
  leadId,
  leadSource,
  sourceSurplus,
  closingBid,
  outstandingDebt,
  liens,
  recoveryFeePercent,
  attorneyCost,
}: {
  leadId: string;
  leadSource: string | null;
  sourceSurplus: number | null;
  closingBid: number | null;
  outstandingDebt: number | null;
  liens: LienRow[];
  recoveryFeePercent: number;
  attorneyCost: number;
}) {
  const { confirmedSurplus } = useConfirmedSurplus();
  const liensTotal = liens.reduce((sum, l) => sum + (l.amount ?? 0), 0);
  // PART 2 / earlier: computed tier = closing bid − outstanding debt − liens.
  const computedSurplus =
    closingBid != null ? closingBid - (outstandingDebt ?? 0) - liensTotal : null;

  const potentialSurplus = sourceSurplus != null ? sourceSurplus : computedSurplus;
  const hasConfirmed = confirmedSurplus != null && confirmedSurplus !== 0;
  const activeSurplusValue = hasConfirmed ? (confirmedSurplus as number) : potentialSurplus ?? 0;
  const feeAmount = activeSurplusValue * (recoveryFeePercent / 100);
  const netPayout = feeAmount - attorneyCost;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0a3d4a]">
        Surplus Breakdown
      </h3>

      {/* SALE DATA — reference only */}
      <div className="rounded-md bg-[#f0f7f8] px-4 py-[14px]">
        <div className="mb-[12px] text-[10px] uppercase tracking-widest text-[#9ca3af]">
          Sale Data — For Reference Only
        </div>
        <div className="grid grid-cols-3 gap-4">
          <SaleDataPoint label="Closing Bid" value={closingBid} />
          <SaleDataPoint label="Tax / Mortgage Payoff" value={outstandingDebt} />
          <SaleDataPoint label="Total Liens" value={liensTotal} />
        </div>
      </div>

      <hr className="my-5 border-[#d1d5db]" />

      {/* POTENTIAL SURPLUS */}
      <div className={cn(hasConfirmed && "opacity-55")}>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm font-semibold uppercase tracking-wide text-[#0d6c7d]">
            Potential Surplus
          </span>
          <span className="text-2xl font-bold text-[#0a3d4a]">
            {potentialSurplus == null ? "—" : formatCurrency(potentialSurplus)}
          </span>
        </div>
        <div className="mt-1 text-xs text-[#6b7280]">
          {potentialSourceLabel(sourceSurplus, leadSource, computedSurplus != null)}
        </div>
      </div>

      {/* CONFIRMED SURPLUS */}
      <div className="mt-5">
        <div className="flex items-baseline justify-between gap-4">
          <span
            className={cn(
              "text-sm uppercase tracking-wide",
              hasConfirmed ? "font-semibold text-[#0d6c7d]" : "font-medium text-[#6b7280]"
            )}
          >
            Confirmed Surplus
          </span>
          {hasConfirmed && (
            <span className="text-2xl font-bold text-[#0a3d4a]">{formatCurrency(confirmedSurplus)}</span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {hasConfirmed && <span className="text-[#6b7280]">Manually Verified</span>}
          <SurplusConfirmControl
            leadId={leadId}
            prefillSurplus={hasConfirmed ? confirmedSurplus : potentialSurplus}
            confirmLabel="Confirm"
          />
        </div>
      </div>

      <hr className="my-5 border-[#d1d5db]" />

      {/* RECOVERY / ATTORNEY FEE — quieter */}
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="text-[#6b7280]">Recovery Fee</span>
        <span className="font-medium text-[#374151]">
          <span className="mr-3 text-[#9ca3af]">{recoveryFeePercent}%</span>
          {formatCurrency(feeAmount)}
        </span>
      </div>
      <div className="mt-[8px] flex items-baseline justify-between gap-4 text-sm">
        <span className="text-[#6b7280]">Attorney Fee</span>
        <span className="font-medium text-[#374151]">{formatCurrency(attorneyCost)}</span>
      </div>

      <hr className="my-5 border-t-2 border-[#0d6c7d]" />

      {/* EST. NET PAYOUT — the headline number */}
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-base font-bold uppercase tracking-wide text-[#0a3d4a]">
          Est. Net Payout
        </span>
        <span className="text-3xl font-bold text-[#0a3d4a]">{formatCurrency(netPayout)}</span>
      </div>
      <div className="mt-1 text-xs text-[#6b7280]">
        Based on {hasConfirmed ? "Confirmed Surplus" : "Potential Surplus"}
      </div>
    </div>
  );
}
