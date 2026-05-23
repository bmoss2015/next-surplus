"use client";

// Defaults panel — Recovery Fee %, Default Attorney Fee, Minimum Surplus
// Threshold. Wired into the global SettingsSaveBar so commits flow
// through the same bottom-right Save / Discard control as every other
// inline panel. Inputs are type="number" to block alphabetic characters.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAppSetting } from "@/app/(app)/settings/_actions";
import { useSaveBarSection } from "@/components/SettingsSaveBar";
import type { AppSettings } from "@/lib/settings/fetch";

export function DefaultsSection({ initial }: { initial: AppSettings }) {
  const router = useRouter();
  const initialFeePct = String(initial.default_recovery_fee_percent ?? 33);
  const initialAttorney = String(initial.default_attorney_cost ?? 1500);
  const initialFloor = String(initial.surplus_floor ?? 10000);

  const [feePct, setFeePct] = useState(initialFeePct);
  const [attorneyFee, setAttorneyFee] = useState(initialAttorney);
  const [floor, setFloor] = useState(initialFloor);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const dirty =
    feePct !== initialFeePct ||
    attorneyFee !== initialAttorney ||
    floor !== initialFloor;

  function parseField(s: string): number | null {
    const n = Number(String(s).trim());
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  }

  async function save() {
    const fp = parseField(feePct);
    const af = parseField(attorneyFee);
    const fl = parseField(floor);
    if (fp == null) return { ok: false as const, error: "Recovery fee must be a number" };
    if (af == null) return { ok: false as const, error: "Attorney fee must be a number" };
    if (fl == null) return { ok: false as const, error: "Surplus threshold must be a number" };

    const tasks: Promise<{ ok: boolean; error?: string }>[] = [];
    if (feePct !== initialFeePct) {
      tasks.push(updateAppSetting("default_recovery_fee_percent", fp));
    }
    if (attorneyFee !== initialAttorney) {
      tasks.push(updateAppSetting("default_attorney_cost", af));
    }
    if (floor !== initialFloor) {
      tasks.push(updateAppSetting("surplus_floor", fl));
    }
    const results = await Promise.all(tasks);
    const firstErr = results.find((r) => !r.ok);
    if (firstErr) {
      setErrMsg(firstErr.error ?? "Save failed");
      return { ok: false as const, error: firstErr.error ?? "Save failed" };
    }
    setErrMsg(null);
    router.refresh();
    return { ok: true as const };
  }

  function discard() {
    setFeePct(initialFeePct);
    setAttorneyFee(initialAttorney);
    setFloor(initialFloor);
    setErrMsg(null);
  }

  useSaveBarSection("settings-defaults", { isDirty: dirty, save, discard });

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
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="0.1"
            className="input tabular has-suffix text-right"
            value={feePct}
            onChange={(e) => setFeePct(e.target.value)}
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
            type="number"
            inputMode="numeric"
            min={0}
            step="1"
            className="input tabular has-prefix text-right"
            value={attorneyFee}
            onChange={(e) => setAttorneyFee(e.target.value)}
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
            type="number"
            inputMode="numeric"
            min={0}
            step="100"
            className="input tabular has-prefix text-right"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
          />
        </div>
      </div>

      {errMsg && (
        <div className="mt-3" style={{ color: "var(--danger)", fontSize: 12.5 }}>
          {errMsg}
        </div>
      )}
    </section>
  );
}
