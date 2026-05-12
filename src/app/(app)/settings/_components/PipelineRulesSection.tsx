"use client";

import { useState, useTransition } from "react";
import { setNeedsActionThreshold } from "../_actions";

// Fix R: Pipeline Rules — one configurable inactivity threshold that drives
// automatic Needs Action flagging on the Daily Work board. Saves on blur.
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
        setError("Enter A Whole Number Of Days, Or Leave Blank To Disable.");
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
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <h2 className="m-0 text-[14px] font-medium text-ink">Pipeline Rules</h2>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="text-[13px] text-ink">Needs Action Threshold</div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={save}
            className="w-20 rounded-md border border-gray-200 bg-surface px-2.5 py-[6px] text-right text-[12.5px] text-ink outline-none focus:border-petrol-500"
          />
          <span className="select-none text-[12px] text-gray-500">days of no activity</span>
        </div>
      </div>
      <div className="mt-2 text-[11px] text-gray-500">
        Leads with no activity for this many days will automatically appear in
        Needs Action. Leave blank to disable automatic flagging.
      </div>
      {error && <div className="mt-2 text-[11px] text-danger">{error}</div>}
      <div className="mt-2 text-right text-[11px] text-gray-500">
        {pending
          ? "Saving"
          : savedAt
            ? `Saved At ${savedAt}`
            : "Click Outside The Field To Save"}
      </div>
    </div>
  );
}
