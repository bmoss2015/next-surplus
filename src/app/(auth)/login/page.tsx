"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "../_actions";

const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
const TESTER_EMAIL = "info@mossyland.com";
const TESTER_PASSWORD = "Anderson1028!$";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signIn(email, password);
      if (result.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function signInAsTester() {
    setError(null);
    startTransition(async () => {
      const result = await signIn(TESTER_EMAIL, TESTER_PASSWORD);
      if (result.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-surface px-3 py-2 text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";
  const labelClass =
    "mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500";

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="m-0 text-[16px] font-medium tracking-tight text-ink">
        Sign In
      </h1>
      {IS_PREVIEW && (
        <div className="rounded-md border border-petrol-200 bg-petrol-50 p-3 text-center">
          <button
            type="button"
            onClick={signInAsTester}
            disabled={pending}
            className="w-full cursor-pointer rounded-md btn-primary px-3 py-2 text-[13px] font-medium text-white disabled:opacity-50"
          >
            {pending ? "Signing in" : "Sign In As Tester"}
          </button>
          <div className="mt-2 text-[10.5px] text-petrol-700">
            Preview deployment. One click to sign in as the staging
            tester and land on the dashboard.
          </div>
        </div>
      )}
      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          autoFocus
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <label className={labelClass}>Password</label>
          <Link
            href="/forgot"
            className="text-[10px] text-petrol-500 hover:text-petrol-700"
          >
            Forgot?
          </Link>
        </div>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        disabled={pending || !email || !password}
        className="w-full rounded-md btn-primary px-3 py-2 text-[13px] font-medium text-white disabled:opacity-50"
      >
        {pending ? "Signing in" : "Sign In"}
      </button>
      <p className="text-center text-[11px] text-gray-500">
        New to Next Surplus?{" "}
        <Link
          href="/signup"
          className="text-petrol-500 hover:text-petrol-700"
        >
          Create Account
        </Link>
      </p>
    </form>
  );
}
