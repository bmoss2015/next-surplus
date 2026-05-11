"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AcceptInvitePage() {
  const router = useRouter();
  // Instantiating the browser client also processes the invite tokens that
  // Supabase appended to the URL hash and establishes the session.
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">(
    "checking"
  );
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        setEmail(data.session.user.email ?? null);
        setStatus("ready");
      } else {
        setStatus("invalid");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    startTransition(async () => {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) {
        setError(updateErr.message);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-petrol-500";

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
        Welcome To Moss Equity Partners
      </h1>
      <p className="text-[12px] text-gray-500">
        {email ? <>You&rsquo;re joining as <span className="font-medium text-ink">{email}</span>. </> : null}
        Set a password to finish setting up your account. Must be at least 12
        characters.
      </p>
      <div>
        <label className="mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500">
          Password
        </label>
        <input
          type="password"
          autoFocus
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
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
      {error && (
        <div className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending || !password || !confirm}
        className="w-full rounded-md btn-primary px-3 py-2 text-[13px] font-medium text-white disabled:opacity-50"
      >
        {pending ? "Setting Up…" : "Finish Setup"}
      </button>
    </form>
  );
}
