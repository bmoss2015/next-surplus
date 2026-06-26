"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { IconChevronDown, IconCheck } from "@tabler/icons-react";
import { updateLeadField, assignAttorney } from "../_actions";
import type { AttorneyOption } from "@/lib/leads/fetch-detail";
import { CurrencyInput } from "@/Components/CurrencyInput";
import { formatCurrency } from "@/lib/leads/format";
import { cn } from "@/lib/cn";
import { INLINE_INPUT_CLASS } from "@/lib/inline-field";

export type { AttorneyOption };

function attorneySub(a: AttorneyOption): string | null {
  const state = a.states_covered[0] ?? null;
  const fee = a.default_cost != null ? `$${a.default_cost.toLocaleString()}` : null;
  const parts = [state, fee].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

// Fix VV / NNNN2 / HHHHH: a custom Assigned Attorney dropdown plus one always-
// visible, always-editable "Attorney Fee" field. Assigning an attorney fills
// the fee with their default — but only when the fee is still empty; an existing
// fee is never overwritten and there is no prompt. A muted "Default: $X" line
// below shows the assigned attorney's standard rate. Editing the fee writes
// only the lead's attorney_cost (never the attorney's standard rate) and the
// Surplus Breakdown / Est. Net Payout pick it up on the next render.
export function AttorneyAssignment({
  leadId,
  attorneys,
  currentAttorneyId,
  currentAttorneyCost,
}: {
  leadId: string;
  attorneys: AttorneyOption[];
  currentAttorneyId: string | null;
  currentAttorneyCost: number | null;
}) {
  const [value, setValue] = useState(currentAttorneyId ?? "");
  const [attorneyFee, setAttorneyFee] = useState<number | null>(currentAttorneyCost);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const selected = attorneys.find((a) => a.id === value) ?? null;
  const selectedDefault = selected?.default_cost ?? null;
  const feeIsEmpty = attorneyFee == null || attorneyFee === 0;

  function applyAssignment(attorneyId: string | null, applyDefault: boolean) {
    startTransition(async () => {
      const res = await assignAttorney(leadId, attorneyId, applyDefault);
      if (res.ok && res.attorneyCost != null) setAttorneyFee(res.attorneyCost);
    });
  }

  function pick(next: string) {
    setOpen(false);
    if (next === "") {
      setValue("");
      applyAssignment(null, false);
      return;
    }
    const a = attorneys.find((x) => x.id === next) ?? null;
    setValue(next);
    // Auto-fill the default fee only when there isn't one yet — never overwrite.
    applyAssignment(next, a?.default_cost != null && feeIsEmpty);
  }

  function commitFee(n: number | null) {
    const v = n ?? 0;
    if (v === (attorneyFee ?? 0)) return;
    setAttorneyFee(v);
    startTransition(async () => {
      await updateLeadField(leadId, "attorney_cost", v);
    });
  }

  return (
    <div ref={ref} className="relative w-[240px]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border bg-white px-2.5 py-[7px] text-left text-[12.5px] outline-none transition-colors disabled:opacity-60",
          open ? "border-[#13644e]" : "border-[#e2e8f0] hover:border-[#13644e]"
        )}
      >
        <span className="min-w-0 truncate">
          {selected ? (
            <span className="block truncate text-ink">{selected.name}</span>
          ) : (
            <span className="text-gray-500">Not Assigned</span>
          )}
          {selected && attorneySub(selected) && (
            <span className="block truncate text-[10.5px] text-gray-400">{attorneySub(selected)}</span>
          )}
        </span>
        <IconChevronDown size={14} stroke={1.75} className="shrink-0 text-gray-400" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-elevated">
          <button
            type="button"
            onClick={() => pick("")}
            className={cn(
              "flex w-full cursor-pointer items-center justify-between px-2.5 py-2 text-left text-[12.5px] hover:bg-[#f3f4f6]",
              value === "" ? "bg-[#f3f4f6] text-petrol-700" : "text-gray-500"
            )}
          >
            Not Assigned
            {value === "" && <IconCheck size={13} stroke={2} className="text-petrol-700" />}
          </button>
          {attorneys.map((a) => {
            const isSel = a.id === value;
            const sub = attorneySub(a);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => pick(a.id)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-2 px-2.5 py-2 text-left hover:bg-[#f3f4f6]",
                  isSel && "bg-[#f3f4f6]"
                )}
              >
                <span className="min-w-0">
                  <span className={cn("block truncate text-[12.5px]", isSel ? "text-petrol-700 font-medium" : "text-ink")}>
                    {a.name}
                  </span>
                  {sub && <span className="block truncate text-[10.5px] text-gray-400">{sub}</span>}
                </span>
                {isSel && <IconCheck size={13} stroke={2} className="shrink-0 text-petrol-700" />}
              </button>
            );
          })}
          {attorneys.length === 0 && (
            <div className="px-2.5 py-2 text-[12px] text-gray-400">No attorneys configured</div>
          )}
        </div>
      )}

      {/* Fix HHHHH: one always-visible, always-editable Attorney Fee for this
          lead. Editing it never touches the attorney's standard rate. */}
      <div className="mt-2">
        <label className="mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500">
          Attorney Fee
        </label>
        <CurrencyInput
          value={attorneyFee}
          onCommit={commitFee}
          prefix="$"
          align="left"
          placeholder="0"
          className={cn(INLINE_INPUT_CLASS, "inline-flex w-[160px] items-center gap-1")}
        />
        <div className="mt-1 text-[10.5px] text-gray-400">
          Default: {selectedDefault != null ? formatCurrency(selectedDefault) : "Not Set"}
        </div>
      </div>
    </div>
  );
}
