"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { IconChevronDown, IconCheck } from "@tabler/icons-react";
import { updateLeadField, assignAttorney } from "../_actions";
import type { AttorneyOption } from "@/lib/leads/fetch-detail";
import { CurrencyInput } from "@/components/CurrencyInput";
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

// Fix VV: a custom Assigned Attorney dropdown — each option shows the attorney
// name plus their first covered state and default fee in a muted second line.
// Fix NNNN2: assigning an attorney auto-fills the lead's attorney cost with the
// attorney's default (prompting before overwriting an existing value); an
// always-visible Attorney Fee Override input below the selector lets you change
// just this lead's cost without touching the attorney's standard rate.
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
  const [attorneyCost, setAttorneyCost] = useState<number | null>(currentAttorneyCost);
  const [open, setOpen] = useState(false);
  const [pendingOverride, setPendingOverride] = useState<AttorneyOption | null>(null);
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
  const hasExistingCost = attorneyCost != null && attorneyCost !== 0;

  function applyAssignment(attorneyId: string | null, applyDefault: boolean) {
    startTransition(async () => {
      const res = await assignAttorney(leadId, attorneyId, applyDefault);
      if (res.ok && res.attorneyCost != null) setAttorneyCost(res.attorneyCost);
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
    if (a && a.default_cost != null && hasExistingCost && next !== value) {
      // Don't overwrite an existing cost without confirmation.
      setPendingOverride(a);
      return;
    }
    setValue(next);
    applyAssignment(next, a?.default_cost != null);
  }

  function confirmOverride() {
    const a = pendingOverride;
    if (!a) return;
    setPendingOverride(null);
    setValue(a.id);
    applyAssignment(a.id, true);
  }
  function keepExisting() {
    const a = pendingOverride;
    if (!a) return;
    setPendingOverride(null);
    setValue(a.id);
    applyAssignment(a.id, false);
  }

  function commitOverrideCost(n: number | null) {
    const v = n ?? 0;
    if (v === (attorneyCost ?? 0)) return;
    setAttorneyCost(v);
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
          open ? "border-[#0d6c7d]" : "border-[#e2e8f0] hover:border-[#0d6c7d]"
        )}
      >
        <span className="min-w-0 truncate">
          {selected ? (
            <span className="block truncate text-ink">{selected.name}</span>
          ) : (
            <span className="text-gray-500">Not Assigned</span>
          )}
          {selected && attorneySub(selected) && (
            <span className="block truncate text-[10.5px] text-gray-400">
              {attorneySub(selected)}
            </span>
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
              "flex w-full cursor-pointer items-center justify-between px-2.5 py-2 text-left text-[12.5px] hover:bg-[#e0f2f7]",
              value === "" ? "bg-[#e0f2f7] text-petrol-700" : "text-gray-500"
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
                  "flex w-full cursor-pointer items-center justify-between gap-2 px-2.5 py-2 text-left hover:bg-[#e0f2f7]",
                  isSel && "bg-[#e0f2f7]"
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

      {/* Fix NNNN2: confirm before overwriting an existing attorney cost. */}
      {pendingOverride && (
        <div className="mt-2 rounded-md border border-warn-border bg-warn-bg p-2.5">
          <div className="text-[11.5px] leading-snug text-warn-strong">
            Override existing attorney cost of {formatCurrency(attorneyCost)} with{" "}
            {pendingOverride.name}&apos;s default of {formatCurrency(pendingOverride.default_cost)}?
          </div>
          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              onClick={keepExisting}
              disabled={pending}
              className="flex-1 cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-[5px] text-[11.5px] text-ink hover:border-petrol-500 disabled:opacity-50"
            >
              Keep Existing
            </button>
            <button
              type="button"
              onClick={confirmOverride}
              disabled={pending}
              className="btn-primary flex-1 cursor-pointer rounded-md px-2 py-[5px] text-[11.5px] font-medium disabled:opacity-50"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Fix NNNN2: per-lead Attorney Fee Override (always visible while an
          attorney is assigned). Editing this updates the lead only, never the
          attorney's standard rate in Settings. */}
      {value !== "" && !pendingOverride && (
        <div className="mt-2">
          <label className="mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500">
            Attorney Fee Override
          </label>
          <CurrencyInput
            value={attorneyCost}
            onCommit={commitOverrideCost}
            prefix="$"
            align="left"
            placeholder="0"
            className={cn(INLINE_INPUT_CLASS, "inline-flex w-[160px] items-center gap-1")}
          />
          <div className="mt-1 text-[10.5px] text-gray-400">
            Default: {selectedDefault != null ? formatCurrency(selectedDefault) : "Not Set"}
          </div>
        </div>
      )}
    </div>
  );
}
