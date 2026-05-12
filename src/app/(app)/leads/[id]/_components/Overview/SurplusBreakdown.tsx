"use client";

import type { LienRow } from "@/lib/leads/fetch-detail";
import { formatCurrency, formatCurrencyOrDash } from "@/lib/leads/format";
import { cn } from "@/lib/cn";
import { useConfirmedSurplus } from "../ConfirmedSurplusContext";
import { SurplusConfirmControl } from "../SurplusConfirm";

// Fix XXXX2: the Surplus Breakdown card, redesigned into two sections.
//
//   TOP — "Sale Data — For Reference Only": a tinted strip with Closing Bid /
//   Tax-Mortgage Payoff / Total Liens laid out as a compact horizontal row of
//   small label-over-value pairs. A 0 or null shows as "—", never "$0".
//
//   BOTTOM — Surplus (white, the visual weight of the card): Potential Surplus
//   with a "Per <source>" / "Calculated from Sale Data" subtext line; Confirmed
//   Surplus with the inline Confirm action (or "Manually Verified" + Edit once
//   set); then Recovery Fee / Attorney Fee; then Est. Net Payout with a
//   "Based on …" subtext. Confirming de-emphasises Potential and promotes
//   Confirmed. Every subtext line gets its own line with real top margin.

function SaleDataPoint({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <span className="text-[10px] font-medium uppercase tracking-[0.6px] text-gray-400">
        {label}
      </span>
      <span className="text-[14px] font-medium text-[#0f1729]">{formatCurrencyOrDash(value)}</span>
    </div>
  );
}

function potentialSourceLabel(
  basis: "source" | "computed" | "none",
  leadSource: string | null
): string {
  if (basis === "source") return leadSource ? `Per ${leadSource}` : "Per Lead Source";
  if (basis === "computed") return "Calculated from Sale Data";
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
  // PART 2 computed tier: closing bid − outstanding debt − junior liens.
  const computedSurplus =
    closingBid != null ? closingBid - (outstandingDebt ?? 0) - liensTotal : null;

  const potentialBasis: "source" | "computed" | "none" =
    sourceSurplus != null ? "source" : computedSurplus != null ? "computed" : "none";
  const potentialSurplus = sourceSurplus != null ? sourceSurplus : computedSurplus;
  const hasConfirmed = confirmedSurplus != null && confirmedSurplus !== 0;
  const activeSurplusValue = hasConfirmed ? (confirmedSurplus as number) : potentialSurplus ?? 0;
  const feeAmount = activeSurplusValue * (recoveryFeePercent / 100);
  const netPayout = feeAmount - attorneyCost;

  return (
    <div className="overflow-hidden rounded-[12px] border border-gray-200 bg-surface shadow-card">
      <div className="px-6 pt-6">
        <h3 className="section-subheader">Surplus Breakdown</h3>
      </div>

      {/* TOP — sale data, reference only, tinted */}
      <div className="mx-6 mt-3 rounded-md bg-gray-50 px-4 py-[14px]">
        <div className="mb-[12px] text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-400">
          Sale Data — For Reference Only
        </div>
        <div className="grid grid-cols-3 gap-4">
          <SaleDataPoint label="Closing Bid" value={closingBid} />
          <SaleDataPoint label="Tax / Mortgage Payoff" value={outstandingDebt} />
          <SaleDataPoint label="Total Liens" value={liensTotal} />
        </div>
      </div>

      {/* BOTTOM — surplus, white, the weight of the card */}
      <div className="px-6 pb-6 pt-5">
        {/* Potential Surplus */}
        <div className={cn(hasConfirmed && "opacity-55")}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[12px] font-semibold uppercase tracking-[0.5px] text-gray-500">
              Potential Surplus
            </span>
            <span className="text-[16px] font-semibold text-[#0f1729]">
              {potentialBasis === "none" ? "—" : formatCurrency(potentialSurplus)}
            </span>
          </div>
          <div className="mt-[6px] text-[11.5px] text-gray-400">
            {potentialSourceLabel(potentialBasis, leadSource)}
          </div>
        </div>

        {/* Confirmed Surplus */}
        <div className="mt-[20px]">
          <div className="flex items-baseline justify-between gap-4">
            <span
              className={cn(
                "uppercase tracking-[0.5px]",
                hasConfirmed
                  ? "text-[13px] font-bold text-petrol-700"
                  : "text-[12px] font-semibold text-gray-500"
              )}
            >
              Confirmed Surplus
            </span>
            <span
              className={cn(
                hasConfirmed
                  ? "text-[20px] font-bold text-[#0f1729]"
                  : "text-[16px] font-semibold text-gray-300"
              )}
            >
              {hasConfirmed ? formatCurrency(confirmedSurplus) : "—"}
            </span>
          </div>
          <div className="mt-[8px] flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
            {hasConfirmed && <span className="text-gray-400">Manually Verified</span>}
            <SurplusConfirmControl
              leadId={leadId}
              prefillSurplus={hasConfirmed ? confirmedSurplus : potentialSurplus}
              confirmLabel="Confirm"
            />
          </div>
        </div>

        <hr className="my-[20px] border-gray-200" />

        <div className="flex items-baseline justify-between gap-4 text-[13px]">
          <span className="text-gray-500">Recovery Fee</span>
          <span className="text-[#0f1729]">
            <span className="mr-3 text-gray-400">{recoveryFeePercent}%</span>
            {formatCurrency(feeAmount)}
          </span>
        </div>
        <div className="mt-[8px] flex items-baseline justify-between gap-4 text-[13px]">
          <span className="text-gray-500">Attorney Fee</span>
          <span className="text-[#0f1729]">{formatCurrency(attorneyCost)}</span>
        </div>

        <hr className="my-[20px] border-gray-200" />

        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[14px] font-bold uppercase tracking-[0.5px] text-[#0f1729]">
            Est. Net Payout
          </span>
          <span className="text-[18px] font-bold text-[#0f1729]">{formatCurrency(netPayout)}</span>
        </div>
        <div className="mt-[8px] text-[11.5px] text-gray-400">
          Based on {hasConfirmed ? "Confirmed Surplus" : "Potential Surplus"}
        </div>
      </div>
    </div>
  );
}
