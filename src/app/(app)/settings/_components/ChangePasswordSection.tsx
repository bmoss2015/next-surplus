"use client";

import { useState, useTransition } from "react";
import { changeMyPassword } from "../_actions";

// Settings redesign — formerly "Change Password", now positioned as the
// "Security" panel. Password change is functional; 2FA + recovery codes are
// laid out but disabled (Supabase Auth MFA wiring lands in a follow-up).
export function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );

  const newLongEnough = newPassword.length >= 8;
  const matches = newPassword.length > 0 && newPassword === confirmPassword;
  const ready =
    currentPassword.length > 0 &&
    newLongEnough &&
    matches &&
    newPassword !== currentPassword;

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!currentPassword) {
      setMsg({ kind: "err", text: "Enter your current password." });
      return;
    }
    if (!newLongEnough) {
      setMsg({ kind: "err", text: "New password must be at least 8 characters." });
      return;
    }
    if (!matches) {
      setMsg({ kind: "err", text: "New password and confirmation do not match." });
      return;
    }
    if (newPassword === currentPassword) {
      setMsg({
        kind: "err",
        text: "New password must be different from the current one.",
      });
      return;
    }
    startTransition(async () => {
      const res = await changeMyPassword(currentPassword, newPassword);
      if (res.ok) {
        setMsg({ kind: "ok", text: "Password updated." });
        reset();
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  const inputClass =
    "rounded-md border border-gray-200 bg-surface px-3 py-[8px] text-[13px] text-ink outline-none focus:border-petrol-500";
  const inputType = show ? "text" : "password";

  return (
    <div className="col-span-2 rounded-lg border border-gray-200 bg-surface p-6 shadow-card">
      <h2 className="section-subheader mb-0">Security</h2>

      <form onSubmit={save} autoComplete="off">
        <div className="pref-section-h">Password</div>
        <div className="pref-row">
          <div className="min-w-0 flex-1">
            <div className="pref-row-title">Current Password</div>
          </div>
          <input
            type={inputType}
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={`pref-row-input ${inputClass}`}
          />
        </div>
        <div className="pref-row">
          <div className="min-w-0 flex-1">
            <div className="pref-row-title">New Password</div>
            <div className="pref-row-desc">At least 8 characters. Mix letters, numbers, and symbols.</div>
          </div>
          <input
            type={inputType}
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`pref-row-input ${inputClass}`}
          />
        </div>
        <div className="pref-row">
          <div className="min-w-0 flex-1">
            <div className="pref-row-title">Confirm New Password</div>
          </div>
          <input
            type={inputType}
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`pref-row-input ${inputClass}`}
          />
        </div>
        <div className="pref-row">
          <div className="min-w-0 flex-1">
            <div className="pref-row-title">Show Passwords</div>
          </div>
          <label className="inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
              className="cursor-pointer"
            />
          </label>
        </div>

        <div className="pref-section-h">Two-Factor Authentication</div>
        <div className="pref-row">
          <div className="min-w-0 flex-1">
            <div className="pref-row-title">Authenticator App</div>
            <div className="pref-row-desc">
              Use 1Password, Authy, or Google Authenticator to generate a six-digit code each time you sign in.
            </div>
          </div>
          <button
            type="button"
            disabled
            className="rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-[12.5px] font-medium text-gray-500"
            title="Coming soon"
          >
            Set Up
          </button>
        </div>
        <div className="pref-row">
          <div className="min-w-0 flex-1">
            <div className="pref-row-title">Recovery Codes</div>
            <div className="pref-row-desc">
              One-time codes to sign in if you lose your authenticator. Available after you turn on 2FA.
            </div>
          </div>
          <button
            type="button"
            disabled
            className="rounded-md border border-transparent bg-transparent px-3 py-[6px] text-[12.5px] font-medium text-gray-400"
          >
            Generate Codes
          </button>
        </div>

        {msg && (
          <div
            className={`mt-3 text-[12px] ${
              msg.kind === "ok" ? "text-success" : "text-danger"
            }`}
          >
            {msg.text}
          </div>
        )}
        <div className="mt-4 flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={pending || !ready}
            className="cursor-pointer rounded-md btn-primary px-3 py-[7px] text-[13px] font-medium text-white disabled:opacity-50"
          >
            {pending ? "Updating" : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
