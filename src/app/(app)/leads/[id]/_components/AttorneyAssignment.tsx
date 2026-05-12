"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { IconChevronDown, IconCheck } from "@tabler/icons-react";
import { updateLeadField } from "../_actions";
import type { AttorneyOption } from "@/lib/leads/fetch-detail";
import { cn } from "@/lib/cn";

export type { AttorneyOption };

function attorneySub(a: AttorneyOption): string | null {
  const state = a.states_covered[0] ?? null;
  const fee = a.default_cost != null ? `$${a.default_cost.toLocaleString()}` : null;
  const parts = [state, fee].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

// Fix VV: a custom Assigned Attorney dropdown — each option shows the attorney
// name plus their first covered state and default fee in a muted second line.
export function AttorneyAssignment({
  leadId,
  attorneys,
  currentAttorneyId,
}: {
  leadId: string;
  attorneys: AttorneyOption[];
  currentAttorneyId: string | null;
}) {
  const [value, setValue] = useState(currentAttorneyId ?? "");
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

  function change(next: string) {
    setValue(next);
    setOpen(false);
    startTransition(async () => {
      await updateLeadField(leadId, "attorney_id", next || null);
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
            onClick={() => change("")}
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
                onClick={() => change(a.id)}
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
    </div>
  );
}
