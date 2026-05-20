"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import {
  NOTIFICATION_PREFS,
  setMyNotificationPref,
  type NotificationPrefKey,
} from "../_notification-actions";

// Settings redesign — Notifications panel.
// New: per-event email toggles. Backed by user_notification_prefs table
// (created in migration 0115).

export function NotificationsSection({
  initial,
}: {
  initial: Record<string, boolean>;
}) {
  // Hydrate with defaults from NOTIFICATION_PREFS, overlaid with stored values.
  const seed: Record<string, boolean> = {};
  for (const p of NOTIFICATION_PREFS) {
    seed[p.key] = p.key in initial ? initial[p.key] : p.defaultOn;
  }
  const [state, setState] = useState(seed);
  const [, startTransition] = useTransition();

  function toggle(key: NotificationPrefKey, next: boolean) {
    setState((prev) => ({ ...prev, [key]: next }));
    startTransition(async () => {
      const res = await setMyNotificationPref(key, next);
      if (!res.ok) {
        // Roll back on failure.
        setState((prev) => ({ ...prev, [key]: !next }));
      }
    });
  }

  const activity = NOTIFICATION_PREFS.filter((p) => p.group === "activity");
  const digest = NOTIFICATION_PREFS.filter((p) => p.group === "digest");

  return (
    <div className="col-span-2 rounded-lg border border-gray-200 bg-surface p-6 shadow-card">
      <h2 className="section-subheader mb-0">Notifications</h2>
      <div className="mt-1 text-[12.5px] text-gray-500">
        Choose which events email you. We never email you about your own actions.
      </div>

      <div className="pref-section-h">Activity</div>
      {activity.map((p) => (
        <ToggleRow
          key={p.key}
          title={p.label}
          desc={p.desc}
          on={state[p.key]}
          onChange={(next) => toggle(p.key, next)}
        />
      ))}

      <div className="pref-section-h">Digests</div>
      {digest.map((p) => (
        <ToggleRow
          key={p.key}
          title={p.label}
          desc={p.desc}
          on={state[p.key]}
          onChange={(next) => toggle(p.key, next)}
        />
      ))}
    </div>
  );
}

function ToggleRow({
  title,
  desc,
  on,
  onChange,
}: {
  title: string;
  desc: string;
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="pref-row">
      <div className="min-w-0 flex-1">
        <div className="pref-row-title">{title}</div>
        <div className="pref-row-desc">{desc}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={cn(
          "relative inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer items-center rounded-full transition-colors",
          on ? "bg-petrol-500" : "bg-gray-300"
        )}
      >
        <span
          className={cn(
            "inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow transition-transform",
            on ? "translate-x-[18px]" : "translate-x-[2px]"
          )}
        />
      </button>
    </div>
  );
}
