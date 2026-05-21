"use client";

import { useRef, useState, useTransition } from "react";
import { useConfirmedSurplus } from "./ConfirmedSurplusContext";
import { updateLeadField } from "../_actions";

function parseMoney(s: string): number | null {
  const cleaned = s.replace(/[^\d.]/g, "").trim();
  if (cleaned === "" || cleaned === ".") return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Fix XXXX2: the shared inline "Confirm Surplus" / "Edit" control used on both
// the metric strip and the Surplus Breakdown card. It reads/writes the confirmed
// surplus through ConfirmedSurplusContext so every figure on the lead page
// re-derives the instant it changes; the server action persists + revalidates
// afterward. No modal, no separate page — the input opens right on the card.
//
//   Unconfirmed: a small teal "Confirm Surplus" text link. Opening it pre-fills
//                the input with the current active surplus as a starting point.
//   Confirmed:   a small, muted "Edit" text link. Opening it pre-fills with the
//                current confirmed value.
export function SurplusConfirmControl({
  leadId,
  prefillSurplus,
  confirmLabel = "Confirm Surplus",
}: {
  leadId: string;
  // Seed for the input when confirming for the first time (the active surplus).
  prefillSurplus: number | null;
  confirmLabel?: string;
}) {
  const { confirmedSurplus, setConfirmedSurplus } = useConfirmedSurplus();
  const hasConfirmed = confirmedSurplus != null && confirmedSurplus !== 0;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  // Guards the input's blur handler so a Save click / Enter / Cancel / Escape
  // doesn't also fire commit() a second time when the input unmounts.
  const committedRef = useRef(false);
  const [, startTransition] = useTransition();

  function open() {
    committedRef.current = false;
    const seed = hasConfirmed ? confirmedSurplus : prefillSurplus;
    setText(seed != null ? String(seed) : "");
    setEditing(true);
  }
  function commit() {
    if (committedRef.current) return;
    committedRef.current = true;
    setEditing(false);
    const n = parseMoney(text);
    setConfirmedSurplus(n);
    startTransition(async () => {
      await updateLeadField(leadId, "confirmed_surplus", n);
    });
  }
  function discard() {
    committedRef.current = true; // guard the blur that follows the unmount
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[13px] text-gray-400">$</span>
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
              e.preventDefault();
              discard();
            }
          }}
          className="w-[120px] rounded-md border border-petrol-500 bg-surface px-2 py-[3px] text-[14px] text-ink outline-none focus:ring-2 focus:ring-petrol-200"
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            commit();
          }}
          className="cursor-pointer rounded-md bg-petrol-700 px-2.5 py-[4px] text-[11px] font-medium text-white hover:bg-petrol-500"
        >
          Save
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            discard();
          }}
          className="cursor-pointer rounded-md border border-gray-200 px-2 py-[4px] text-[11px] text-gray-500 hover:border-petrol-500"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (hasConfirmed) {
    return (
      <button
        type="button"
        onClick={open}
        className="cursor-pointer text-[11.5px] text-gray-500 underline-offset-2 hover:text-petrol-700 hover:underline"
      >
        Edit
      </button>
    );
  }
  // Fix CCCC3 PART 1: an actual outlined button, not plain text.
  return (
    <button
      type="button"
      onClick={open}
      className="cursor-pointer rounded border border-[#13644e] px-3 py-1 text-xs text-[#13644e] transition-colors hover:bg-[#13644e] hover:text-white"
    >
      {confirmLabel}
    </button>
  );
}
