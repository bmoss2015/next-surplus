"use client";

// Settings clone · Phase C.2 — Defaults wired to real data.
//
// Recovery fee %, attorney fee $, surplus floor $. Each saves on blur via
// updateAppSetting. The live-example hero updates as you type so you can
// preview the net before committing.

import { useState, useTransition } from "react";
import { updateAppSetting } from "@/app/(app)/settings/_actions";
import type { AppSettings } from "@/lib/settings/fetch";

function fmtMoney(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return Math.round(n).toLocaleString("en-US");
}

function parseMoney(s: string): number | null {
  const n = Number(s.replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function DefaultsSection({ initial }: { initial: AppSettings }) {
  const [feePct, setFeePct] = useState(
    String(initial.default_recovery_fee_percent ?? 33)
  );
  const [attorneyFee, setAttorneyFee] = useState(
    fmtMoney(initial.default_attorney_cost ?? 1500)
  );
  const [floor, setFloor] = useState(
    fmtMoney(initial.surplus_floor ?? 10000)
  );
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function save(
    key: "default_recovery_fee_percent" | "default_attorney_cost" | "surplus_floor",
    value: number | null
  ) {
    if (value == null || !Number.isFinite(value) || value < 0) return;
    startTransition(async () => {
      const res = await updateAppSetting(key, value);
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      setErrMsg(null);
      setSavedKey(key);
      window.setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 1500);
    });
  }

  return (
    <section id="panel-defaults" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Leads</a>
        <i className="icon icon-chevron-right" />
        <span>Defaults</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Defaults</h1>
          <p className="section-desc">
            Starting values applied to every new lead. Each lead can override
            these individually.
          </p>
        </div>
      </div>

      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Default Recovery Fee</div>
          <div className="pref-row-desc">
            Percentage of the estimated surplus you charge as the recovery fee
            on a new lead.
          </div>
        </div>
        <div className="field" style={{ width: 160 }}>
          <input
            className="input tabular has-suffix text-right"
            value={feePct}
            onChange={(e) => setFeePct(e.target.value)}
            onBlur={(e) => {
              const n = Number(e.target.value);
              save("default_recovery_fee_percent", Number.isFinite(n) ? n : null);
            }}
          />
          <span className="suffix">%</span>
        </div>
      </div>

      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Default Attorney Fee</div>
          <div className="pref-row-desc">
            Subtracted from the recovery fee when computing Estimated Net.
          </div>
        </div>
        <div className="field" style={{ width: 160 }}>
          <span className="prefix">$</span>
          <input
            className="input tabular has-prefix text-right"
            value={attorneyFee}
            onChange={(e) => setAttorneyFee(e.target.value)}
            onBlur={(e) => {
              const n = parseMoney(e.target.value);
              save("default_attorney_cost", n);
              if (n != null) setAttorneyFee(fmtMoney(n));
            }}
          />
        </div>
      </div>

      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Minimum Surplus Threshold</div>
          <div className="pref-row-desc">
            Leads with an estimated surplus under this amount are tagged Below
            Minimum. Soft warning only, you can still pursue them.
          </div>
        </div>
        <div className="field" style={{ width: 160 }}>
          <span className="prefix">$</span>
          <input
            className="input tabular has-prefix text-right"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            onBlur={(e) => {
              const n = parseMoney(e.target.value);
              save("surplus_floor", n);
              if (n != null) setFloor(fmtMoney(n));
            }}
          />
        </div>
      </div>

      {errMsg && (
        <div className="mt-3" style={{ color: "var(--danger)", fontSize: 12.5 }}>
          {errMsg}
        </div>
      )}
      {savedKey && (
        <div
          className="mt-3"
          style={{ color: "var(--success)", fontSize: 12.5 }}
        >
          Saved.
        </div>
      )}
    </section>
  );
}
