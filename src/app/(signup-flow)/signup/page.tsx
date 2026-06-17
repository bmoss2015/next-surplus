"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signUp } from "./_actions";
import { LockupHorizontal } from "../../(mockups)/_components/BrandMark";
import { GoogleButton } from "../../(mockups)/_components/GoogleButton";

export default function SignupPage() {
  const [firmName, setFirmName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const allValid = Object.values(checks).every(Boolean);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signUp({ email, password, firmName });
      if (result.ok) {
        window.location.assign(result.checkoutUrl);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-[360px]">
        <div className="mb-10 flex justify-center">
          <LockupHorizontal size="md" />
        </div>

        <div className="mb-7 text-center">
          <h1 className="m-0 text-[20px] font-semibold tracking-[-0.02em] text-[#04261c]">
            Create Your Account
          </h1>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[#6b7280]">
            14 day free trial. $49 a month, locked for 12 months.
          </p>
        </div>

        <GoogleButton variant="outline" />

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#e5e7eb]" />
          <span className="text-[10px] uppercase tracking-[0.16em] text-[#9ca3af]">
            Or
          </span>
          <span className="h-px flex-1 bg-[#e5e7eb]" />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3.5">
          <Field
            label="Firm Name"
            value={firmName}
            onChange={setFirmName}
            autoFocus
          />
          <Field
            label="Work Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#6b7280]">
              Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[32px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none focus:border-[#13644e]"
              required
            />
            <div className="mt-1 grid grid-cols-4 gap-1.5">
              {[
                { ok: checks.length, label: "8 characters" },
                { ok: checks.upper, label: "Uppercase" },
                { ok: checks.digit, label: "Number" },
                { ok: checks.special, label: "Special" },
              ].map((c) => (
                <div key={c.label} className="flex flex-col gap-1">
                  <div
                    className={`h-[3px] rounded-full ${
                      c.ok ? "bg-[#13644e]" : "bg-[#e5e7eb]"
                    }`}
                  />
                  <span
                    className={`text-[10px] ${
                      c.ok ? "text-[#04261c]" : "text-[#9ca3af]"
                    }`}
                  >
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[12px] text-[#b91c1c]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending || !firmName || !email || !allValid}
            className="mt-2 inline-flex h-[34px] w-full items-center justify-center rounded-[6px] bg-[#04261c] text-[13px] font-medium text-white hover:bg-[#0d4b3a] disabled:opacity-50"
          >
            {pending ? "Creating Account" : "Continue To Checkout"}
          </button>
          <p className="mt-1 text-center text-[10.5px] leading-relaxed text-[#9ca3af]">
            Card required at signup. Cancel anytime during the trial.
          </p>
        </form>

        <div className="mt-8 text-center text-[12px] text-[#6b7280]">
          Have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[#04261c] hover:underline"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-10 flex justify-center gap-4 text-[10.5px] text-[#9ca3af]">
          <Link href="/terms" className="hover:text-[#04261c]">
            Terms
          </Link>
          <span aria-hidden>&middot;</span>
          <Link href="/privacy" className="hover:text-[#04261c]">
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-[#6b7280]">{label}</label>
      <input
        type={type}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[32px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none focus:border-[#13644e]"
      />
    </div>
  );
}
