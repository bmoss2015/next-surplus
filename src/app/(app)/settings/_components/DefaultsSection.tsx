"use client";

import { useState, useTransition } from "react";
import { updateAppSetting } from "../_actions";
import { CurrencyInput } from "@/components/CurrencyInput";
import type { AppSettings } from "@/lib/settings/fetch";

// Fix 60 — description text removed. % sits inside the input border, right
// aligned; $ sits inside the input border, left aligned with comma formatting.
// All three inputs are visually consistent. Each saves on blur.

export function DefaultsSection({ initial }: { initial: AppSettings }) {
  const [feePct, setFeePct] = useState(
    String(initial.default_recovery_fee_percent)
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(
    key: "default_recovery_fee_percent" | "default_attorney_cost" | "surplus_floor",
    value: number | null
  ) {
    if (value == null || !Number.isFinite(value)) return;
    startTransition(async () => {
      const result = await updateAppSetting(key, value);
      if (result.ok) setSavedAt(new Date().toLocaleTimeString());
    });
  }

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <h2 className="m-0 text-[14px] font-medium text-ink">Defaults</h2>
      <div className="mt-4 space-y-3">
        <Row label="Default Recovery Fee">
          {/* % inside the border, right aligned — CurrencyInput isn't ideal
              for percentages, so this is a small inline-adornment wrapper. */}
          <div className="inline-flex w-32 items-center gap-1 rounded-md border border-gray-200 bg-surface px-2.5 py-[6px] focus-within:border-petrol-500">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={feePct}
              onChange={(e) => setFeePct(e.target.value)}
              onBlur={(e) => {
                const n = Number(e.target.value);
                save("default_recovery_fee_percent", Number.isFinite(n) ? n : null);
              }}
              className="w-full bg-transparent text-right text-[12.5px] text-ink outline-none"
            />
            <span className="select-none text-[12.5px] text-gray-500">%</span>
          </div>
        </Row>
        <Row label="Default Attorney Cost">
          <CurrencyInput
            value={initial.default_attorney_cost}
            onCommit={(n) => save("default_attorney_cost", n)}
            prefix="$"
            align="left"
            className="w-32"
          />
        </Row>
        <Row
          label="Surplus Floor"
          hint="Below-floor warning threshold. Soft warning only — leads can still be pursued below this."
        >
          <CurrencyInput
            value={initial.surplus_floor}
            onCommit={(n) => save("surplus_floor", n)}
            prefix="$"
            align="left"
            className="w-32"
          />
        </Row>
      </div>
      <div className="mt-2 text-right text-[11px] text-gray-500">
        {pending
          ? "Saving"
          : savedAt
            ? `Saved At ${savedAt}`
            : "Click Outside A Field To Save"}
      </div>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <div className="text-[13px] text-ink">{label}</div>
        {hint && <div className="text-[11px] text-gray-500">{hint}</div>}
      </div>
      {children}
    </div>
  );
}
