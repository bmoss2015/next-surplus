"use client";

import { useState, useTransition } from "react";
import { updateAppSetting } from "../_actions";
import { CurrencyInput } from "@/components/CurrencyInput";
import type { AppSettings } from "@/lib/settings/fetch";

// Settings redesign — Defaults panel with a brand-gradient calc-hero showing
// the math flow (Surplus → Fee → Attorney → Net), then minimal pref-rows.

export function DefaultsSection({ initial }: { initial: AppSettings }) {
  const [feePct, setFeePct] = useState(
    String(initial.default_recovery_fee_percent)
  );
  const [attCost, setAttCost] = useState(initial.default_attorney_cost);
  const [, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function save(
    key: "default_recovery_fee_percent" | "default_attorney_cost" | "surplus_floor",
    value: number | null
  ) {
    if (value == null || !Number.isFinite(value)) return;
    setPending(true);
    startTransition(async () => {
      const result = await updateAppSetting(key, value);
      if (result.ok) setSavedAt(new Date().toLocaleTimeString());
      setPending(false);
    });
  }

  // Live preview values for the calc-hero ($50K surplus example).
  const surplus = 50000;
  const feeAmt = Math.round((surplus * (Number(feePct) || 0)) / 100);
  const net = feeAmt - (Number(attCost) || 0);

  const inputClass =
    "rounded-md border border-gray-200 bg-surface px-3 py-[8px] text-[13px] text-ink outline-none focus:border-petrol-500 tabular-nums text-right";

  return (
    <div className="col-span-2">
      

      <div className="calc-hero" style={{ marginTop: 18 }}>
        <div className="plan-hero-eyebrow">Live Example · $50,000 Surplus</div>
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <div className="calc-hero-step">
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.62)",
                marginBottom: 6,
              }}
            >
              Estimated Surplus
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: "#fff",
                letterSpacing: "-0.022em",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.1,
              }}
            >
              $50,000
            </div>
          </div>
          <div className="calc-hero-arrow">→</div>
          <div className="calc-hero-step">
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.62)",
                marginBottom: 6,
              }}
            >
              Recovery Fee ({feePct}%)
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: "#fff",
                letterSpacing: "-0.022em",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.1,
              }}
            >
              ${feeAmt.toLocaleString()}
            </div>
          </div>
          <div className="calc-hero-arrow">−</div>
          <div className="calc-hero-step">
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.62)",
                marginBottom: 6,
              }}
            >
              Attorney Fee
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: "#fff",
                letterSpacing: "-0.022em",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.1,
              }}
            >
              ${(Number(attCost) || 0).toLocaleString()}
            </div>
          </div>
          <div className="calc-hero-arrow">=</div>
          <div className="calc-hero-step calc-hero-step-total">
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.62)",
                marginBottom: 6,
              }}
            >
              Estimated Net
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: "#fff",
                letterSpacing: "-0.022em",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.1,
              }}
            >
              ${net.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="pref-row">
        <div className="min-w-0 flex-1">
          <div className="pref-row-title">Default Recovery Fee</div>
          <div className="pref-row-desc">Percentage of the estimated surplus charged as the recovery fee on a new lead.</div>
        </div>
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
            className="w-full bg-transparent text-right text-[12.5px] text-ink outline-none tabular-nums"
          />
          <span className="select-none text-[12.5px] text-gray-500">%</span>
        </div>
      </div>

      <div className="pref-row">
        <div className="min-w-0 flex-1">
          <div className="pref-row-title">Default Attorney Fee</div>
          <div className="pref-row-desc">Subtracted from the recovery fee when computing Estimated Net.</div>
        </div>
        <CurrencyInput
          value={attCost}
          onCommit={(n) => {
            setAttCost(n ?? 0);
            save("default_attorney_cost", n);
          }}
          prefix="$"
          align="left"
          className="w-32"
        />
      </div>

      <div className="pref-row">
        <div className="min-w-0 flex-1">
          <div className="pref-row-title">Minimum Surplus Threshold</div>
          <div className="pref-row-desc">
            Leads with an estimated surplus under this amount are tagged Below Minimum. Soft warning only — you can still pursue them.
          </div>
        </div>
        <CurrencyInput
          value={initial.surplus_floor}
          onCommit={(n) => save("surplus_floor", n)}
          prefix="$"
          align="left"
          className="w-32"
        />
      </div>

      <div className="mt-4 text-right text-[11px] text-gray-500">
        {pending
          ? "Saving"
          : savedAt
            ? `Saved at ${savedAt}`
            : "Click outside a field to save"}
      </div>
    </div>
  );
}
