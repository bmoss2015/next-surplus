"use client";

// Settings clone · Phase C.4 — Security wired to real data (password only).
//
// Calls changeMyPassword with current + new. Show Passwords toggle is
// local UI only; 2FA setup and Recovery Codes are out of scope until the
// Authenticator-app TOTP flow ships (Phase E+).

import { useState, useTransition } from "react";
import { changeMyPassword } from "@/app/(app)/settings/_actions";

export function SecuritySection() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [show, setShow] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const inputType = show ? "text" : "password";
  const ready =
    currentPw.length >= 1 &&
    newPw.length >= 12 &&
    confirmPw.length >= 12 &&
    newPw === confirmPw;

  function reset() {
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setErrMsg(null);
    setOkMsg(null);
  }

  function onSubmit() {
    setErrMsg(null);
    setOkMsg(null);
    if (newPw !== confirmPw) {
      setErrMsg("New passwords do not match.");
      return;
    }
    if (newPw.length < 12) {
      setErrMsg("New password must be at least 12 characters.");
      return;
    }
    startTransition(async () => {
      const res = await changeMyPassword(currentPw, newPw);
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      reset();
      setOkMsg("Password updated.");
    });
  }

  return (
    <section id="panel-password" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Account</a>
        <i className="icon icon-chevron-right" />
        <span>Security</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Security</h1>
          <p className="section-desc">
            Update your password and turn on two-factor authentication.
          </p>
        </div>
      </div>

      <div className="pref-section-h">Password</div>

      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Current Password</div>
        </div>
        <input
          className="input pref-row-input"
          type={inputType}
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>
      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">New Password</div>
          <div className="pref-row-desc">
            At least 12 characters. Mix letters, numbers, and symbols.
          </div>
        </div>
        <input
          className="input pref-row-input"
          type={inputType}
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          minLength={12}
          placeholder="At least 12 characters"
          autoComplete="new-password"
        />
      </div>
      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Confirm New Password</div>
        </div>
        <input
          className="input pref-row-input"
          type={inputType}
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          minLength={12}
          placeholder="Re-enter new password"
          autoComplete="new-password"
        />
      </div>
      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Show Passwords</div>
        </div>
        <div
          className={"toggle" + (show ? " on" : "")}
          onClick={() => setShow((s) => !s)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setShow((s) => !s);
          }}
        />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!ready || pending}
          onClick={onSubmit}
        >
          {pending ? "Updating…" : "Update Password"}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={pending}
          onClick={reset}
        >
          Cancel
        </button>
        {errMsg && (
          <span style={{ color: "var(--danger)", fontSize: 12.5 }}>
            {errMsg}
          </span>
        )}
        {okMsg && (
          <span style={{ color: "var(--success)", fontSize: 12.5 }}>
            {okMsg}
          </span>
        )}
      </div>

      <div className="pref-section-h">Two-Factor Authentication</div>
      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Authenticator App</div>
          <div className="pref-row-desc">
            Use 1Password, Authy, or Google Authenticator to generate a
            six-digit code each time you sign in.
          </div>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled
          title="TOTP flow ships in Phase E"
        >
          Set Up
        </button>
      </div>
      <div className="pref-row">
        <div className="flex-1 min-w-0">
          <div className="pref-row-title">Recovery Codes</div>
          <div className="pref-row-desc">
            One-time codes to sign in if you lose your authenticator.
            Available after you turn on 2FA.
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled
          style={{ opacity: 0.5 }}
        >
          Generate Codes
        </button>
      </div>
    </section>
  );
}
