"use client";

import { useRef, useState, useTransition } from "react";
import { updateLeadField } from "../../_actions";
import type { LienRow } from "@/lib/leads/fetch-detail";
import { formatCurrency } from "@/lib/leads/format";
import { cn } from "@/lib/cn";
import { INLINE_INPUT_CLASS } from "@/lib/inline-field";
import { useConfirmedSurplus } from "../ConfirmedSurplusContext";
import { SectionSubheader } from "../SectionSubheader";

function fmt(value: number | null | undefined): string {
  return formatCurrency(value);
}

// Fix IIII2 / MMMM2: the surplus numbers live in the metric strip; the lien
// inputs moved to the Property Info tab. This section is just the Fees
// breakdown — Total Liens (read-only computed), Recovery Fee $, and Attorney
// Cost (inline editable, Fix LLLL2). The recovery-fee dollar amount tracks the
// active surplus (confirmed when set, otherwise closing bid − debt − costs −
// liens).
export function SurplusBreakdown({
  leadId,
  closingBid,
  outstandingDebt,
  courtCosts,
  liens,
  recoveryFeePercent,
  attorneyCost,
}: {
  leadId: string;
  closingBid: number | null;
  outstandingDebt: number | null;
  courtCosts: number | null;
  liens: LienRow[];
  recoveryFeePercent: number;
  attorneyCost: number;
}) {
  const [attorneyCostVal, setAttorneyCostVal] = useState(attorneyCost);
  const { confirmedSurplus: confirmed } = useConfirmedSurplus();
  const [, startTransition] = useTransition();

  const liensTotal = liens.reduce((sum, l) => sum + (l.amount ?? 0), 0);

  // Fix LLLL2 / NNNN2: Attorney Cost is inline editable; the metric strip's
  // Est. Net Surplus updates on the next render after the server revalidates.
  function commitAttorneyCost(n: number) {
    if (n === attorneyCostVal) return;
    setAttorneyCostVal(n);
    startTransition(async () => {
      await updateLeadField(leadId, "attorney_cost", n);
    });
  }

  const calculatedSurplus =
    closingBid != null
      ? closingBid - (outstandingDebt ?? 0) - (courtCosts ?? 0) - liensTotal
      : null;
  const hasConfirmed = confirmed != null && confirmed !== 0;
  const surplusForMath = hasConfirmed ? (confirmed as number) : calculatedSurplus ?? 0;
  const feeAmount = surplusForMath * (recoveryFeePercent / 100);

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <h3 className="section-subheader">Surplus Breakdown</h3>
      <SectionSubheader>Fees</SectionSubheader>
      <Row label="Total Liens" value={fmt(liensTotal)} />
      <Row
        label="Recovery Fee"
        value={`${recoveryFeePercent}% · ${fmt(feeAmount)}`}
      />
      <MoneyEditRow
        label="Attorney Cost"
        value={attorneyCostVal}
        onCommit={commitAttorneyCost}
      />
    </div>
  );
}

// Field label / value typography (Fix AA): label 13px / 400 / #64748b,
// value 14px / 500 / #0f1729 — both clearly outranked by the SectionSubheader.
const FIELD_LABEL = "text-[13px] font-normal text-[#64748b]";
const FIELD_VALUE = "text-[14px] font-medium text-[#0f1729]";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[150px_1fr] items-center leading-[1.85]">
      <span className={FIELD_LABEL}>{label}</span>
      <span className={FIELD_VALUE}>{value}</span>
    </div>
  );
}

function parseMoney(s: string): number | null {
  const cleaned = s.replace(/[^\d.]/g, "").trim();
  if (cleaned === "" || cleaned === ".") return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Fix LLLL2: an inline-editable money row — display as text, click to edit,
// commit on blur / Enter, revert on Escape; uses the standardized input style.
function MoneyEditRow({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (n: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value ? String(value) : "");
  const cancelNext = useRef(false);

  function startEdit() {
    setText(value ? String(value) : "");
    setEditing(true);
  }
  function commit() {
    setEditing(false);
    if (cancelNext.current) {
      cancelNext.current = false;
      return;
    }
    onCommit(parseMoney(text) ?? 0);
  }

  return (
    <div className="grid grid-cols-[150px_1fr] items-center leading-[1.85]">
      <span className={FIELD_LABEL}>{label}</span>
      {editing ? (
        <input
          type="text"
          inputMode="decimal"
          autoFocus
          value={text}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              cancelNext.current = true;
              e.currentTarget.blur();
            }
          }}
          className={cn(INLINE_INPUT_CLASS, "w-[150px]")}
        />
      ) : (
        <button
          type="button"
          onClick={startEdit}
          title="Click To Edit"
          className="-ml-0.5 w-fit cursor-text rounded-[3px] px-0.5 text-left text-[14px] font-medium text-[#0f1729] hover:bg-petrol-50"
        >
          {formatCurrency(value)}
        </button>
      )}
    </div>
  );
}
