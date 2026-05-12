"use client";

import { useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { useConfirmedSurplus } from "./ConfirmedSurplusContext";
import { updateLeadField } from "../_actions";

function parseMoney(s: string): number | null {
  const cleaned = s.replace(/[^\d.]/g, "").trim();
  if (cleaned === "" || cleaned === ".") return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Fix VVVV2: the shared inline "Confirm Surplus" / "Edit" control used on both
// the metric strip and the Surplus Breakdown card. It reads/writes the confirmed
// surplus through ConfirmedSurplusContext so every figure on the lead page
// re-derives the instant it changes; the server action persists + revalidates
// afterward. No modal, no separate page — the input opens right on the card.
//
//   Unconfirmed: a clearly labelled petrol "Confirm Surplus" button. Opening it
//                pre-fills the input with the calculated surplus as a starting
//                point.
//   Confirmed:   a small, muted "Edit" link. Opening it pre-fills with the
//                current confirmed value.
export function SurplusConfirmControl({
  leadId,
  calculatedSurplus,
  size = "default",
}: {
  leadId: string;
  calculatedSurplus: number | null;
  size?: "default" | "compact";
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
    const seed = hasConfirmed ? confirmedSurplus : calculatedSurplus;
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
          className="w-[110px] rounded-md border border-petrol-500 bg-surface px-2 py-[3px] text-[14px] text-ink outline-none focus:ring-2 focus:ring-petrol-200"
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
        className="cursor-pointer text-[11px] text-gray-500 underline-offset-2 hover:text-petrol-700 hover:underline"
      >
        Edit
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-md border border-petrol-500 font-medium text-petrol-700 hover:bg-petrol-50",
        size === "compact" ? "px-2.5 py-[4px] text-[11px]" : "px-3 py-[5px] text-[12px]"
      )}
    >
      Confirm Surplus
    </button>
  );
}
