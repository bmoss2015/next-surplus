"use client";

// Settings clone · Phase E.3 — Profile fully wired.
//
// Avatar upload + time zone select are now live (migration 0118 landed
// the columns + storage buckets). First/Last/Email still write through
// updateMyProfile; time zone writes via setMyTimeZone on change; avatar
// uploads via uploadMyAvatar / removeMyAvatar.

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMyProfile } from "@/app/(app)/settings/_actions";
import { useSaveBarSection } from "@/Components/SettingsSaveBar";
import {
  uploadMyAvatar,
  removeMyAvatar,
  setMyTimeZone,
} from "@/app/(app)/settings/_upload-actions";

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

const TIME_ZONES: { value: string; label: string }[] = [
  { value: "America/New_York", label: "(GMT-05:00) Eastern Time — New York" },
  { value: "America/Chicago", label: "(GMT-06:00) Central Time — Chicago" },
  { value: "America/Denver", label: "(GMT-07:00) Mountain Time — Denver" },
  { value: "America/Los_Angeles", label: "(GMT-08:00) Pacific Time — Los Angeles" },
  { value: "America/Anchorage", label: "(GMT-09:00) Alaska Time — Anchorage" },
  { value: "Pacific/Honolulu", label: "(GMT-10:00) Hawaii — Honolulu" },
];

export function ProfileSection({
  initial,
}: {
  initial: {
    fullName: string;
    email: string;
    isAdmin: boolean;
    avatarUrl: string | null;
    timeZone: string | null;
  };
}) {
  const router = useRouter();
  const seed = splitName(initial.fullName);
  const [firstName, setFirstName] = useState(seed.first);
  const [lastName, setLastName] = useState(seed.last);
  const [email, setEmail] = useState(initial.email);
  const [timeZone, setTimeZone] = useState(
    initial.timeZone ?? "America/Chicago"
  );
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [, startTransition] = useTransition();

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
      return { ok: false as const, error: res.error };
    }
    router.refresh();
    return { ok: true as const };
  }

  function onDiscard() {
    setFirstName(seed.first);
    setLastName(seed.last);
    setEmail(initial.email);
    setErrMsg(null);
  }

  useSaveBarSection("settings-profile", {
    isDirty: dirty,
    save: async () => {
      if (!ready) return { ok: false, error: "First and last name + email are required" };
      return await onSave();
    },
    discard: onDiscard,
  });

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadMyAvatar(fd);
    setUploading(false);
    if (!res.ok) {
      setUploadErr(res.error);
      return;
    }
    router.refresh();
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onAvatarRemove() {
    setUploadErr(null);
    setUploading(true);
    const res = await removeMyAvatar();
    setUploading(false);
    if (!res.ok) {
      setUploadErr(res.error);
      return;
    }
    router.refresh();
  }

  function onTimeZoneChange(value: string) {
    setTimeZone(value);
    startTransition(async () => {
      await setMyTimeZone(value);
    });
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
        <div
          className="clean-hero-avatar"
          style={
            initial.avatarUrl
              ? {
                  backgroundImage: `url(${initial.avatarUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  color: "transparent",
                }
              : undefined
          }
        >
          {!initial.avatarUrl && initials(firstName, lastName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="clean-hero-title">
            {firstName} {lastName}
          </div>
          <div className="clean-hero-meta">
            {email} · {initial.isAdmin ? "Admin" : "Member"}
          </div>
        </div>
        <div className="clean-hero-upload flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            style={{ display: "none" }}
            onChange={onAvatarChange}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading
              ? "Uploading…"
              : initial.avatarUrl
                ? "Replace Photo"
                : "Upload Photo"}
          </button>
          {initial.avatarUrl && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={uploading}
              style={{ color: "var(--danger)" }}
              onClick={onAvatarRemove}
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {uploadErr && (
        <div style={{ color: "var(--danger)", fontSize: 12.5, marginTop: 8 }}>
          {uploadErr}
        </div>
      )}

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
          value={timeZone}
          onChange={(e) => onTimeZoneChange(e.target.value)}
        >
          {TIME_ZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* Inline Save / Discard removed — commits flow through the
          global SettingsSaveBar so the controls are reachable without
          scrolling. errMsg stays here for in-context feedback. */}
      {errMsg && (
        <div className="mt-6 text-[12.5px]" style={{ color: "var(--danger)" }}>
          {errMsg}
        </div>
      )}
    </section>
  );
}
