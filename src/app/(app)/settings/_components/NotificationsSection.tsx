"use client";

// Notifications panel — six per-event email toggles backed by
// user_notification_prefs. Wired into the global SettingsSaveBar so the
// flip-and-commit feels consistent with every other Settings panel.
// State is kept locally and dirty against the initial snapshot; Save
// upserts each changed pref in parallel; Discard reverts to the
// snapshot.

import { useCallback, useState } from "react";
import {
  NOTIFICATION_PREFS,
  type NotificationPrefKey,
} from "@/app/(app)/settings/_notification-prefs";
import { setMyNotificationPref } from "@/app/(app)/settings/_notification-actions";
import { useSaveBarSection } from "@/components/SettingsSaveBar";

export function NotificationsSection({
  initial,
}: {
  initial: Record<string, boolean>;
}) {
  const seed: Record<string, boolean> = {};
  for (const p of NOTIFICATION_PREFS) {
    seed[p.key] = p.key in initial ? initial[p.key] : p.defaultOn;
  }
  const [state, setState] = useState<Record<string, boolean>>(seed);

  // Dirty if any toggle no longer matches the initial seed.
  const dirty = NOTIFICATION_PREFS.some(
    (p) => Boolean(state[p.key]) !== Boolean(seed[p.key])
  );

  const save = useCallback(async () => {
    const changed = NOTIFICATION_PREFS.filter(
      (p) => Boolean(state[p.key]) !== Boolean(seed[p.key])
    );
    const results = await Promise.all(
      changed.map((p) => setMyNotificationPref(p.key, state[p.key]))
    );
    const firstErr = results.find((r) => !r.ok);
    if (firstErr && !firstErr.ok) {
      return { ok: false as const, error: firstErr.error };
    }
    return { ok: true as const };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const discard = useCallback(() => {
    setState(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  useSaveBarSection("settings-notifications", { isDirty: dirty, save, discard });

  function toggle(key: NotificationPrefKey, next: boolean) {
    setState((prev) => ({ ...prev, [key]: next }));
  }

  const activity = NOTIFICATION_PREFS.filter((p) => p.group === "activity");
  const digest = NOTIFICATION_PREFS.filter((p) => p.group === "digest");

  return (
    <section id="panel-notifications" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Account</a>
        <i className="icon icon-chevron-right" />
        <span>Notifications</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Notifications</h1>
          <p className="section-desc">
            Choose which events email you. We never email you about your own
            actions.
          </p>
        </div>
      </div>

      <div className="pref-section-h">Activity</div>
      {activity.map((p) => (
        <Row
          key={p.key}
          title={p.label}
          desc={p.desc}
          on={state[p.key]}
          onToggle={(next) => toggle(p.key, next)}
        />
      ))}

      <div className="pref-section-h">Digests</div>
      {digest.map((p) => (
        <Row
          key={p.key}
          title={p.label}
          desc={p.desc}
          on={state[p.key]}
          onToggle={(next) => toggle(p.key, next)}
        />
      ))}
    </section>
  );
}

function Row({
  title,
  desc,
  on,
  onToggle,
}: {
  title: string;
  desc: string;
  on: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <div className="pref-row">
      <div className="flex-1 min-w-0">
        <div className="pref-row-title">{title}</div>
        <div className="pref-row-desc">{desc}</div>
      </div>
      <div
        className={"toggle" + (on ? " on" : "")}
        onClick={() => onToggle(!on)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onToggle(!on);
        }}
      />
    </div>
  );
}
