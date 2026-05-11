"use client";

import { useState, useTransition } from "react";
import { updateLeadField } from "../_actions";

function asNumber(s: string): number | null {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export function RecoveryFeeField({
  leadId,
  initial,
}: {
  leadId: string;
  initial: number;
}) {
  const [text, setText] = useState(String(initial));
  const [saved, setSaved] = useState(initial);
  const [, startTransition] = useTransition();

  function commit() {
    const n = asNumber(text);
    if (n == null || n < 0 || n > 100) {
      setText(String(saved));
      return;
    }
    if (n === saved) return;
    setSaved(n);
    startTransition(async () => {
      await updateLeadField(leadId, "recovery_fee_percent", n);
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-surface px-3 py-2">
      <span className="text-[11px] tracking-[0.4px] text-gray-500">
        Recovery Fee
      </span>
      <span className="inline-flex items-center gap-1 rounded border border-petrol-100 bg-petrol-50 px-[6px] py-[1px]">
        <input
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="w-[44px] cursor-pointer bg-transparent text-right text-[12.5px] font-medium text-petrol-700 outline-none"
        />
        <span className="text-[12.5px] text-petrol-700">%</span>
      </span>
    </div>
  );
}
