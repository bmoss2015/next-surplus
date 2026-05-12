"use client";

import { useRef, useState, useTransition } from "react";
import { IconCheck, IconPencil } from "@tabler/icons-react";
import { updateLeadField } from "../../_actions";
import type { LienRow } from "@/lib/leads/fetch-detail";
import { formatCurrency } from "@/lib/leads/format";
import { cn } from "@/lib/cn";
import { INLINE_INPUT_CLASS } from "@/lib/inline-field";
import { useConfirmedSurplus } from "../ConfirmedSurplusContext";

// Fix VVVV2 / WWWW2: the Surplus Breakdown card — read-only rows in a fixed
// order, with two exceptions: Confirmed Surplus (inline Confirm/Edit) and
// Attorney Cost (inline edit). Court Costs and Opening Bid no longer appear or
// factor into the math. Calculated Surplus = Closing Bid − Tax/Mortgage Payoff
// − Total Liens. Est. Net Payout = (Confirmed if set, else Calculated) −
// Recovery Fee $ − Attorney Cost. Edits to Confirmed Surplus propagate
// instantly via ConfirmedSurplusContext (server action persists in the
// background).

const FIELD_LABEL = "text-[13px] font-normal text-[#64748b]";
const FIELD_VALUE = "text-[14px] font-medium text-[#0f1729]";

function parseMoney(s: string): number | null {
  const cleaned = s.replace(/[^\d.]/g, "").trim();
  if (cleaned === "" || cleaned === ".") return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
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
  const [attorneyCostVal, setAttorneyCostVal] = useState(attorneyCost);
  const { confirmedSurplus, setConfirmedSurplus } = useConfirmedSurplus();
  const [, startTransition] = useTransition();

  const liensTotal = liens.reduce((sum, l) => sum + (l.amount ?? 0), 0);
  const calculatedSurplus =
    closingBid != null ? closingBid - (outstandingDebt ?? 0) - liensTotal : null;
  const hasConfirmed = confirmedSurplus != null && confirmedSurplus !== 0;
  const surplusForMath = hasConfirmed
    ? (confirmedSurplus as number)
    : calculatedSurplus ?? 0;
  const feeAmount = surplusForMath * (recoveryFeePercent / 100);
  // Fix EEEEE: Est. Net Payout = recovery fee $ − attorney cost.
  const netPayout = feeAmount - attorneyCostVal;

  function commitAttorneyCost(n: number) {
    if (n === attorneyCostVal) return;
    setAttorneyCostVal(n);
    startTransition(async () => {
      await updateLeadField(leadId, "attorney_cost", n);
    });
  }

  function commitConfirmedSurplus(n: number | null) {
    setConfirmedSurplus(n);
    startTransition(async () => {
      await updateLeadField(leadId, "confirmed_surplus", n);
    });
  }

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <h3 className="section-subheader">Surplus Breakdown</h3>
      <Row label="Closing Bid" value={formatCurrency(closingBid)} />
      <Row label="Tax / Mortgage Payoff" value={formatCurrency(outstandingDebt)} />
      <Row label="Total Liens" value={formatCurrency(liensTotal)} />
      <Row label="Calculated Surplus" value={formatCurrency(calculatedSurplus)} />
      <ConfirmedSurplusRow
        value={hasConfirmed ? (confirmedSurplus as number) : null}
        onCommit={commitConfirmedSurplus}
      />
      <Row
        label="Recovery Fee"
        value={`${recoveryFeePercent}% · ${formatCurrency(feeAmount)}`}
      />
      <MoneyEditRow
        label="Attorney Cost"
        value={attorneyCostVal}
        onCommit={commitAttorneyCost}
      />
      <div className="mt-1 grid grid-cols-[170px_1fr] items-center border-t border-gray-200 pt-2 leading-[1.85]">
        <span className="text-[13px] font-semibold text-[#0f1729]">Est. Net Payout</span>
        <span className="text-[15px] font-bold text-[#0f1729]">{formatCurrency(netPayout)}</span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[170px_1fr] items-center leading-[1.85]">
      <span className={FIELD_LABEL}>{label}</span>
      <span className={FIELD_VALUE}>{value}</span>
    </div>
  );
}

// Fix VVVV2: Confirmed Surplus — shows the value (or "Not Confirmed") plus a
// small Confirm / Edit action; clicking opens an inline currency input that
// commits on Enter / blur and reverts on Escape.
function ConfirmedSurplusRow({
  value,
  onCommit,
}: {
  value: number | null;
  onCommit: (n: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value != null ? String(value) : "");
  const cancelNext = useRef(false);

  function startEdit() {
    setText(value != null ? String(value) : "");
    setEditing(true);
  }
  function commit() {
    setEditing(false);
    if (cancelNext.current) {
      cancelNext.current = false;
      return;
    }
    onCommit(parseMoney(text));
  }

  return (
    <div className="grid grid-cols-[170px_1fr] items-center leading-[1.85]">
      <span className={FIELD_LABEL}>Confirmed Surplus</span>
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
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "text-[14px]",
              value != null ? "font-medium text-[#0f1729]" : "italic text-gray-400"
            )}
          >
            {value != null ? formatCurrency(value) : "Not Confirmed"}
          </span>
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-petrol-500 px-2 py-[2px] text-[10.5px] font-medium text-petrol-500 hover:bg-petrol-50"
          >
            {value != null ? (
              <>
                <IconPencil size={11} stroke={1.75} />
                Edit
              </>
            ) : (
              <>
                <IconCheck size={11} stroke={2} />
                Confirm
              </>
            )}
          </button>
        </span>
      )}
    </div>
  );
}

// Inline-editable money row — display as text, click to edit, commit on
// blur / Enter, revert on Escape; uses the standardized input style.
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
    <div className="grid grid-cols-[170px_1fr] items-center leading-[1.85]">
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
