"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestPasswordReset } from "../_actions";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(email);
      if (result.ok) {
        setSent(true);
      } else {
        setError(result.error);
      }
    });
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <h1 className="m-0 text-[16px] font-medium tracking-tight text-ink">
          Check your email
        </h1>
        <p className="text-[13px] text-gray-500">
          If an account exists for <strong>{email}</strong>, a reset link is on
          its way.
        </p>
        <Link
          href="/login"
          className="block w-full rounded-md border border-gray-200 bg-surface px-3 py-2 text-center text-[13px] text-ink hover:border-petrol-500"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="m-0 text-[16px] font-medium tracking-tight text-ink">
        Reset Password
      </h1>
      <p className="text-[12px] text-gray-500">
        Enter the email on your account. We&apos;ll send a link to reset your
        password.
      </p>
      <div>
        <label className="mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500">
          Email
        </label>
        <input
          type="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-gray-200 bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-petrol-500"
        />
      </div>
      {error && (
        <div className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending || !email}
        className="w-full rounded-md btn-primary px-3 py-2 text-[13px] font-medium text-white disabled:opacity-50"
      >
        {pending ? "Sending" : "Send Reset Link"}
      </button>
      <div className="text-center text-[11px] text-gray-500">
        <Link href="/login" className="text-petrol-500 hover:text-petrol-700">
          Back to Sign In
        </Link>
      </div>
    </form>
  );
}
