"use client";

import { useState, useTransition } from "react";
import { changeMyPassword } from "../_actions";

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
    <div className="rounded-lg border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-4">
        <h2 className="section-subheader">Change Password</h2>
        <div className="mt-1 text-[12px] font-normal text-[#94a3b8]">
          Enter your current password to confirm it is you, then choose a new
          password of at least 8 characters.
        </div>
      </div>
      <form onSubmit={save} className="space-y-3" autoComplete="off">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-gray-500">
            Current Password
          </label>
          <input
            type={inputType}
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-gray-500">
            New Password
          </label>
          <input
            type={inputType}
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-gray-500">
            Confirm New Password
          </label>
          <input
            type={inputType}
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[12px] text-gray-500">
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
            className="cursor-pointer"
          />
          Show passwords
        </label>
        {msg && (
          <div
            className={`text-[12px] ${
              msg.kind === "ok" ? "text-success" : "text-danger"
            }`}
          >
            {msg.text}
          </div>
        )}
        <div className="flex justify-end pt-1">
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
