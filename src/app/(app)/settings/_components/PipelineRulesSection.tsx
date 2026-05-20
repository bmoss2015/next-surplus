"use client";

import { useState, useTransition } from "react";
import { setNeedsActionThreshold } from "../_actions";

// Settings redesign — Pipeline Rules.
// Single configurable inactivity threshold. Saves on blur.

export function PipelineRulesSection({ initial }: { initial: number | null }) {
  const [value, setValue] = useState(initial == null ? "" : String(initial));
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    const trimmed = value.trim();
    let days: number | null = null;
    if (trimmed) {
      const n = Number(trimmed);
      if (!Number.isInteger(n) || n < 1) {
        setError("Enter a whole number of days, or leave blank to disable.");
        return;
      }
      days = n;
    }
    startTransition(async () => {
      const result = await setNeedsActionThreshold(days);
      if (result.ok) {
        setSavedAt(new Date().toLocaleTimeString());
        setValue(days == null ? "" : String(days));
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="col-span-2">
      <h2 className="section-subheader mb-0">Pipeline Rules</h2>

      <div className="pref-row" style={{ paddingTop: 24 }}>
        <div className="min-w-0 flex-1">
          <div className="pref-row-title">Needs Action Threshold</div>
          <div className="pref-row-desc">
            Leads with no note, task, or stage change in this many days are automatically flagged Needs Action on the Daily Work board. Leave blank to disable.
          </div>
        </div>
        <div className="inline-flex w-44 items-center gap-2 rounded-md border border-gray-200 bg-surface px-2.5 py-[6px] focus-within:border-petrol-500">
          <input
            type="number"
            min={1}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={save}
            className="w-full bg-transparent text-right text-[12.5px] text-ink outline-none tabular-nums"
          />
          <span className="select-none text-[12.5px] text-gray-500">days</span>
        </div>
      </div>

      {error && <div className="mt-2 text-[11px] text-danger">{error}</div>}
      <div className="mt-2 text-right text-[11px] text-gray-500">
        {pending ? "Saving" : savedAt ? `Saved at ${savedAt}` : "Click outside the field to save"}
      </div>
    </div>
  );
}
