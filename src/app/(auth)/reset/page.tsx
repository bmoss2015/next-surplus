"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  PasswordRequirements,
  passwordMeetsRequirements,
} from "@/Components/PasswordRequirements";
import { InlineError } from "@/Components/InlineError";

function postResetDestination(): string {
  if (typeof window === "undefined") return "/";
  const host = window.location.host;
  if (host === "nextsurplus.com" || host === "www.nextsurplus.com") {
    return "https://app.nextsurplus.com/";
  }
  return "/";
}

export default function ResetPage() {
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">(
    "checking"
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "invalid_link") {
      // Mount-time error gate: the auth callback redirected here with an
      // explicit invalid-link signal.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("invalid");
      return;
    }

    // The /auth/callback route has already exchanged the recovery code for a
    // session before redirecting here, so the only question is whether a session
    // actually exists. If not, the link was bad or expired.
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setStatus(data.user ? "ready" : "invalid");
    });

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passwordMeetsRequirements(password)) {
      setError("Password does not meet the requirements");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    startTransition(async () => {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) {
        setError(updateErr.message);
        return;
      }
      window.location.assign(postResetDestination());
    });
  }

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-petrol-500";

  if (status === "checking") {
    return <p className="text-[13px] text-gray-500">Verifying Reset Link…</p>;
  }

  if (status === "invalid") {
    return (
      <div className="space-y-3">
        <h1 className="m-0 text-[16px] font-medium tracking-tight text-ink">
          Reset Link Invalid Or Expired
        </h1>
        <p className="text-[12px] text-gray-500">
          This password reset link is no longer valid. Request a new one and try
          again.
        </p>
        <Link
          href="/forgot"
          className="text-[12px] text-petrol-500 hover:text-petrol-700"
        >
          Request New Reset Link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="m-0 text-[16px] font-medium tracking-tight text-ink">
        Set New Password
      </h1>
      <p className="text-[12px] text-gray-500">
        Choose a new password for your account.
      </p>
      <div>
        <label className="mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500">
          New Password
        </label>
        <input
          type="password"
          autoFocus
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        <PasswordRequirements password={password} />
      </div>
      <div>
        <label className="mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500">
          Confirm Password
        </label>
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </div>
      <InlineError message={error} />
      <button
        type="submit"
        disabled={pending || !password || !confirm}
        className="w-full rounded-md btn-primary px-3 py-2 text-[13px] font-medium text-white disabled:opacity-50"
      >
        {pending ? "Updating" : "Update Password"}
      </button>
      <div className="text-center text-[11px] text-gray-500">
        <Link href="/login" className="text-petrol-500 hover:text-petrol-700">
          Back to Sign In
        </Link>
      </div>
    </form>
  );
}
