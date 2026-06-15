"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { completeInviteProfile } from "@/app/(app)/settings/_actions";

function splitName(fullName: string | null | undefined): {
  first: string;
  last: string;
} {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export default function AcceptInvitePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">(
    "checking"
  );
  const [email, setEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type");

    function applyUser(user: { email?: string | null; user_metadata?: Record<string, unknown> | null }) {
      setEmail(user.email ?? null);
      const metaName =
        (user.user_metadata?.full_name as string | undefined) ?? "";
      const { first, last } = splitName(metaName);
      setFirstName(first);
      setLastName(last);
    }

    if (tokenHash && type === "invite") {
      // Exchange the single-use invite token for a session belonging to the
      // invited user — this overrides any session already in the browser, so
      // the page reflects the invitee and not whoever sent the invite.
      supabase.auth
        .verifyOtp({ type: "invite", token_hash: tokenHash })
        .then(({ data, error: verifyErr }) => {
          if (cancelled) return;
          if (verifyErr || !data.user) {
            setStatus("invalid");
            return;
          }
          applyUser(data.user);
          setStatus("ready");
          // Drop the spent token from the URL so a refresh doesn't retry it.
          window.history.replaceState(null, "", "/accept-invite");
        });
    } else {
      // No token in the URL (e.g. a refresh after it was consumed) — fall back
      // to the session verifyOtp just established.
      supabase.auth.getUser().then(({ data }) => {
        if (cancelled) return;
        if (data.user) {
          applyUser(data.user);
          setStatus("ready");
        } else {
          setStatus("invalid");
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const namesReady =
    firstName.trim().length > 0 && lastName.trim().length > 0;
  const passwordsReady =
    password.length >= 12 && password === confirm;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!namesReady) {
      setError("First and last name are required");
      return;
    }
    if (password.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    startTransition(async () => {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) {
        setError(updateErr.message);
        return;
      }
      const res = await completeInviteProfile(fullName);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.location.assign("/");
    });
  }

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-petrol-500";
  const readOnlyClass =
    "w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-500 outline-none";
  const labelClass =
    "mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500";

  if (status === "checking") {
    return <p className="text-[13px] text-gray-500">Checking your invite…</p>;
  }

  if (status === "invalid") {
    return (
      <div className="space-y-3">
        <h1 className="m-0 text-[16px] font-medium tracking-tight text-ink">
          Invite Link Invalid Or Expired
        </h1>
        <p className="text-[12px] text-gray-500">
          This invite link is no longer valid. Ask an admin to send you a new one.
        </p>
        <Link href="/login" className="text-[12px] text-petrol-500 hover:text-petrol-700">
          Back To Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="m-0 text-[16px] font-medium tracking-tight text-ink">
        Welcome To Next Surplus
      </h1>
      <p className="text-[12px] text-gray-500">
        Confirm your name and set a password to finish setting up your account.
        Password must be at least 12 characters.
      </p>
      <div>
        <label className={labelClass}>Email</label>
        <input type="email" value={email ?? ""} readOnly className={readOnlyClass} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>First Name</label>
          <input
            type="text"
            autoFocus
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Last Name</label>
          <input
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Confirm Password</label>
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </div>
      {error && (
        <div className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending || !namesReady || !passwordsReady}
        className="w-full rounded-md btn-primary px-3 py-2 text-[13px] font-medium text-white disabled:opacity-50"
      >
        {pending ? "Setting Up…" : "Finish Setup"}
      </button>
    </form>
  );
}
