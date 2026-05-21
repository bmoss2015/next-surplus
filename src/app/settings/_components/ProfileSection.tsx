"use client";

// Settings clone · Phase C.1 — Profile wired to real data.
//
// Receives the signed-in user's profile from the page (server) and renders
// the mockup's clean-hero + pref-row layout. First/Last/Email are editable
// and call updateMyProfile on Save. Time Zone is intentionally disabled
// here — that field needs migration 0115 (profiles.time_zone column) to
// land on staging before it can save anywhere.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMyProfile } from "@/app/(app)/settings/_actions";

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0 || (parts.length === 1 && parts[0] === ""))
    return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function initials(first: string, last: string): string {
  const a = first.trim().charAt(0).toUpperCase();
  const b = last.trim().charAt(0).toUpperCase();
  return a + b || "?";
}

export function ProfileSection({
  initial,
}: {
  initial: { fullName: string; email: string; isAdmin: boolean };
}) {
  const router = useRouter();
  const seed = splitName(initial.fullName);
  const [firstName, setFirstName] = useState(seed.first);
  const [lastName, setLastName] = useState(seed.last);
  const [email, setEmail] = useState(initial.email);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const dirty =
    `${firstName.trim()} ${lastName.trim()}`.trim() !== initial.fullName.trim() ||
    email.trim().toLowerCase() !== initial.email.trim().toLowerCase();
  const ready = firstName.trim() && lastName.trim() && email.trim();

  async function onSave() {
    setSaving(true);
    setErrMsg(null);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const res = await updateMyProfile(fullName, email.trim());
    setSaving(false);
    if (!res.ok) {
      setErrMsg(res.error);
      return;
    }
    router.refresh();
  }

  function onDiscard() {
    setFirstName(seed.first);
    setLastName(seed.last);
    setEmail(initial.email);
    setErrMsg(null);
  }

  return (
    <section id="panel-profile" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Account</a>
        <i className="icon icon-chevron-right" />
        <span className="text-ink-2">Profile</span>
      </div>

      <div className="clean-hero">
        <div className="clean-hero-avatar">{initials(firstName, lastName)}</div>
        <div className="flex-1 min-w-0">
          <div className="clean-hero-title">
            {firstName} {lastName}
          </div>
          <div className="clean-hero-meta">
            {email} · {initial.isAdmin ? "Admin" : "Member"}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm clean-hero-upload"
          disabled
          title="Avatar upload lands once migration 0115 applies to staging"
        >
          Upload Photo
        </button>
      </div>

      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">First Name</div>
        </div>
        <input
          className="input pref-row-input"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>
      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Last Name</div>
        </div>
        <input
          className="input pref-row-input"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Email</div>
          <div className="pref-row-desc">
            Used for sign-in and mention notifications.
          </div>
        </div>
        <input
          className="input pref-row-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Time Zone</div>
          <div className="pref-row-desc">
            Used for due-date display and daily digest delivery time.
          </div>
        </div>
        <select
          className="input pref-row-input"
          defaultValue="central"
          disabled
          title="Time zone storage lands with migration 0115"
        >
          <option value="central">(GMT-06:00) Central Time — Chicago</option>
          <option value="eastern">(GMT-05:00) Eastern Time — New York</option>
          <option value="mountain">(GMT-07:00) Mountain Time — Denver</option>
          <option value="pacific">(GMT-08:00) Pacific Time — Los Angeles</option>
        </select>
      </div>

      {(dirty || errMsg) && (
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!ready || saving}
            onClick={onSave}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={saving}
            onClick={onDiscard}
          >
            Discard
          </button>
          {errMsg && (
            <span style={{ color: "var(--danger)", fontSize: 12.5 }}>
              {errMsg}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
