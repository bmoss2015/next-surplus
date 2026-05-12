"use client";

import { useRef, useState, useTransition } from "react";
import { IconCheck, IconPencil } from "@tabler/icons-react";
import { updateLeadField } from "../../_actions";
import { useConfirmedSurplus } from "../ConfirmedSurplusContext";
import { formatCurrency } from "@/lib/leads/format";
import { cn } from "@/lib/cn";
import { INLINE_INPUT_CLASS } from "@/lib/inline-field";

function parseMoney(s: string): number | null {
  const cleaned = s.replace(/[^\d.]/g, "").trim();
  if (cleaned === "" || cleaned === ".") return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Fix IIIII: the two hero cards at the top of the Overview tab — Est. Net Payout
// (dark petrol, dominant) and the active Surplus (lighter petrol tint). The
// Confirm / Edit link on the surplus card is the ONLY place the confirmed
// surplus is edited on Overview; saving flows through ConfirmedSurplusContext so
// every downstream figure re-derives instantly.
export function HeroSection({
  leadId,
  closingBid,
  outstandingDebt,
  totalLiens,
  recoveryFeePercent,
  attorneyCost,
}: {
  leadId: string;
  closingBid: number | null;
  outstandingDebt: number | null;
  totalLiens: number;
  recoveryFeePercent: number;
  attorneyCost: number;
}) {
  const { confirmedSurplus, setConfirmedSurplus } = useConfirmedSurplus();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const cancelNext = useRef(false);

  const calculatedSurplus =
    closingBid != null ? closingBid - (outstandingDebt ?? 0) - totalLiens : null;
  const hasConfirmed = confirmedSurplus != null && confirmedSurplus !== 0;
  const surplusForMath = hasConfirmed ? (confirmedSurplus as number) : calculatedSurplus ?? 0;
  const netPayout = surplusForMath * (recoveryFeePercent / 100) - attorneyCost;

  const surplusTitle = hasConfirmed ? "Confirmed Surplus" : "Calculated Surplus";
  const surplusValue = hasConfirmed ? (confirmedSurplus as number) : calculatedSurplus;
  const surplusSub = hasConfirmed ? "Manually Verified" : "Not Yet Confirmed";

  function startEdit() {
    setText(hasConfirmed ? String(confirmedSurplus) : "");
    setEditing(true);
  }
  function commit() {
    setEditing(false);
    if (cancelNext.current) {
      cancelNext.current = false;
      return;
    }
    const n = parseMoney(text);
    setConfirmedSurplus(n);
    startTransition(async () => {
      await updateLeadField(leadId, "confirmed_surplus", n);
    });
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Est. Net Payout — the dominant card. */}
      <div className="flex flex-col justify-between rounded-[12px] bg-gradient-to-br from-petrol-700 to-petrol-500 p-6 shadow-card">
        <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-white/80">
          Est. Net Payout
        </div>
        <div className="mt-3 text-[34px] font-semibold leading-none tracking-tight text-white">
          {formatCurrency(netPayout)}
        </div>
        <div className="mt-2 text-[11.5px] text-white/75">
          {recoveryFeePercent}% Recovery Fee Less Attorney Fee
        </div>
      </div>

      {/* Active Surplus — lighter petrol tint, with the Confirm / Edit link. */}
      <div className="flex flex-col justify-between rounded-[12px] bg-gradient-to-br from-petrol-50 to-petrol-100 p-6 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-petrol-700">
            {surplusTitle}
          </div>
          {!editing && (
            <button
              type="button"
              onClick={startEdit}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-petrol-500 px-2 py-[3px] text-[10.5px] font-medium text-petrol-700 hover:bg-white/50"
            >
              {hasConfirmed ? (
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
          )}
        </div>
        <div className="mt-3">
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
              className={cn(INLINE_INPUT_CLASS, "w-[180px] text-[24px]")}
            />
          ) : (
            <div className="text-[28px] font-semibold leading-none tracking-tight text-petrol-900">
              {formatCurrency(surplusValue)}
            </div>
          )}
        </div>
        <div className="mt-2 text-[11.5px] text-petrol-700/80">{surplusSub}</div>
      </div>
    </div>
  );
}
