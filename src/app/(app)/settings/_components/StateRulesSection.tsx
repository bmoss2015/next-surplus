"use client";

import { useState, useTransition } from "react";
import { updateStateRule } from "../_actions";
import type { StateRuleRow } from "@/lib/settings/fetch";

export function StateRulesSection({ initial }: { initial: StateRuleRow[] }) {
  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-3">
        <h2 className="m-0 text-[14px] font-medium text-ink">State Rules</h2>
        <div className="mt-[2px] text-[11px] text-gray-500">
          Redemption period and filing window per state. SC has authoritative
          values. TN/PA are stubs — verify before relying on dates.
        </div>
      </div>
      <div className="space-y-3">
        {initial.map((row) => (
          <StateRuleEditor key={row.state} initial={row} />
        ))}
      </div>
    </div>
  );
}

function StateRuleEditor({ initial }: { initial: StateRuleRow }) {
  const [state] = useState(initial.state);
  const [stateName, setStateName] = useState(initial.state_name);
  const [redemption, setRedemption] = useState(
    initial.redemption_period_months != null
      ? String(initial.redemption_period_months)
      : ""
  );
  const [filing, setFiling] = useState(
    initial.filing_window_years != null
      ? String(initial.filing_window_years)
      : ""
  );
  const [custodian, setCustodian] = useState(initial.funds_custodian ?? "");
  const [recoveryType, setRecoveryType] = useState(
    initial.default_recovery_type ?? ""
  );
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await updateStateRule({
        state,
        state_name: stateName,
        redemption_period_months: redemption ? Number(redemption) : null,
        filing_window_years: filing ? Number(filing) : null,
        funds_custodian: custodian.trim() || null,
        default_recovery_type: recoveryType || null,
        notes: notes.trim() || null,
      });
      if (result.ok) {
        setSavedAt(new Date().toLocaleTimeString());
      }
    });
  }

  const inputClass =
    "rounded-md border border-gray-200 bg-surface px-2 py-[5px] text-[12px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";
  const isStub = (notes ?? "").includes("STUB");

  return (
    <div
      className={`rounded-md border ${
        isStub ? "border-warn-border bg-warn-bg/30" : "border-gray-200 bg-surface"
      } p-3`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-gray-150 px-2 py-[2px] font-mono text-[11px] font-medium text-ink">
          {state}
        </span>
        <input
          type="text"
          value={stateName}
          onChange={(e) => setStateName(e.target.value)}
          onBlur={save}
          className={`${inputClass} flex-1`}
        />
        {isStub && (
          <span className="rounded bg-warn-bg px-2 py-[2px] text-[10px] font-medium text-warn-strong">
            STUB
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Field label="Redemption (months)">
          <input
            type="number"
            min={0}
            value={redemption}
            onChange={(e) => setRedemption(e.target.value)}
            onBlur={save}
            className={inputClass}
          />
        </Field>
        <Field label="Filing window (years)">
          <input
            type="number"
            min={0}
            value={filing}
            onChange={(e) => setFiling(e.target.value)}
            onBlur={save}
            className={inputClass}
          />
        </Field>
        <Field label="Funds Custodian">
          <input
            type="text"
            value={custodian}
            onChange={(e) => setCustodian(e.target.value)}
            onBlur={save}
            className={inputClass}
          />
        </Field>
        <Field label="Default Recovery Type">
          <select
            value={recoveryType}
            onChange={(e) => setRecoveryType(e.target.value)}
            onBlur={save}
            className={inputClass}
          >
            <option value="">—</option>
            <option value="judicial">Judicial</option>
            <option value="non_judicial">Non Judicial</option>
          </select>
        </Field>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={save}
        rows={2}
        placeholder="Notes"
        className={`${inputClass} mt-2 w-full resize-y`}
      />
      <div className="mt-1 text-right text-[10.5px] text-gray-500">
        {pending ? "Saving" : savedAt ? `Saved at ${savedAt}` : " "}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-[2px] text-[10px] tracking-[0.4px] text-gray-500">
        {label}
      </div>
      {children}
    </div>
  );
}
