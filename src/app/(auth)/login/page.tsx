"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "../_actions";

const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
const TEST_EMAIL = "info@mossyland.com";
const TEST_PASSWORD = "Anderson1028!$";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function attempt(emailValue: string, passwordValue: string) {
    setError(null);
    startTransition(async () => {
      const result = await signIn(emailValue, passwordValue);
      if (result.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    attempt(email, password);
  }

  function signInWithTestCreds() {
    setEmail(TEST_EMAIL);
    setPassword(TEST_PASSWORD);
    attempt(TEST_EMAIL, TEST_PASSWORD);
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
      {IS_PREVIEW && (
        <div className="space-y-1.5 pt-2">
          <button
            type="button"
            onClick={signInWithTestCreds}
            disabled={pending}
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Use Test Credentials
          </button>
          <p className="text-[10px] text-gray-400">Preview only. Signs in as {TEST_EMAIL}.</p>
        </div>
      )}
    </form>
  );
}
