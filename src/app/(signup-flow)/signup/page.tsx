"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signUp } from "./_actions";
import { createClient } from "@/lib/supabase/client";
import {
  PasswordRequirements,
  passwordMeetsRequirements,
} from "@/components/PasswordRequirements";
import { InlineError } from "@/components/InlineError";

const FONT =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const BULLETS = [
  "Lead pipeline with custom stages",
  "Unified inbox for Gmail and Outlook",
  "Case tracking from lead to close",
  "Team access at no additional cost per user",
];

export default function SignupPage() {
  return (
    <div
      className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]"
      style={{ fontFamily: FONT }}
    >
      <DarkPanel />
      <FormPanel />
    </div>
  );
}

function DarkPanel() {
  return (
    <div
      className="relative hidden flex-col justify-between overflow-hidden px-14 py-14 lg:flex"
      style={{
        background:
          "linear-gradient(150deg, #02100c 0%, #04261c 50%, #0a3d2d 100%)",
      }}
    >
      <div />

      <div className="text-white">
        <h2 className="m-0 text-[48px] font-semibold leading-[1.04] tracking-[-0.025em]">
          Built For Surplus Recovery.
        </h2>
        <p className="mt-5 max-w-[560px] text-[13px] leading-relaxed text-white/70">
          Pipeline, inbox, and mail in a single workspace built for
          surplus funds recovery.
        </p>

        <div className="mt-10 flex flex-col gap-3.5">
          {BULLETS.map((line) => (
            <Check key={line}>{line}</Check>
          ))}
        </div>
      </div>

      <FoundersRateBar />
    </div>
  );
}

function FoundersRateBar() {
  return (
    <div className="mt-12">
      <div className="h-px w-full bg-white/15" />
      <div className="mt-5 flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-semibold uppercase leading-none tracking-[0.22em] text-white/55">
            Founders Rate
          </span>
          <span className="text-[10px] font-semibold uppercase leading-none tracking-[0.22em] text-white/85">
            Limited Time Offer
          </span>
        </div>
        <div className="flex items-baseline gap-5">
          <span className="flex items-baseline gap-1.5">
            <span className="text-[34px] font-semibold leading-none tracking-[-0.02em] text-white">
              $49
            </span>
            <span className="text-[13px] leading-none text-white/60">/month</span>
          </span>
          <span className="text-[13px] leading-none text-white/75">
            Lock in your price for 12 months.
          </span>
        </div>
      </div>
    </div>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-[13px] leading-relaxed text-white">
      <svg
        width="16"
        height="16"
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden
        className="mt-0.5 flex-shrink-0"
      >
        <circle cx="9" cy="9" r="8" stroke="#4a9c75" strokeWidth="1.5" />
        <path
          d="M5.5 9.2L8 11.7L12.5 7"
          stroke="#4a9c75"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{children}</span>
    </div>
  );
}

function FormPanel() {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [googlePending, setGooglePending] = useState(false);

  const canSubmit =
    companyName.trim() && email.trim() && passwordMeetsRequirements(password);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signUp({ email, password, firmName: companyName });
      if (result.ok) {
        window.location.assign(result.checkoutUrl);
      } else {
        setError(result.error);
      }
    });
  }

  async function continueWithGoogle() {
    setError(null);
    setGooglePending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding/firm`,
        scopes: "openid email profile",
      },
    });
    if (error) {
      setError(error.message);
      setGooglePending(false);
    }
  }

  return (
    <div className="relative flex items-center justify-center bg-white px-10 py-16">
      <div className="absolute left-10 top-10">
        <BrandLockupInline />
      </div>

      <div className="w-full max-w-[380px]">
        <div className="mb-7">
          <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em] text-[#04261c]">
            Create Your Account
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#6b7280]">
            $49/month. 14 day free trial.
          </p>
        </div>

        <GoogleButton onClick={continueWithGoogle} pending={googlePending} />

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#e5e7eb]" />
          <span className="text-[10px] uppercase tracking-[0.16em] text-[#9ca3af]">
            Or
          </span>
          <span className="h-px flex-1 bg-[#e5e7eb]" />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field
            label="Company Name"
            value={companyName}
            onChange={setCompanyName}
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
            <label className="text-[11.5px] font-medium text-[#374151]">
              Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-[38px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none transition-colors duration-150 ease-out focus:border-[#13644e]"
            />
            <PasswordRequirements password={password} />
          </div>

          <InlineError message={error} />

          <button
            type="submit"
            disabled={pending || !canSubmit}
            className="mt-2 inline-flex h-[40px] w-full items-center justify-center rounded-[6px] bg-[#13644e] text-[13.5px] font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0d4b3a] disabled:opacity-50"
          >
            {pending ? "Creating Account" : "Continue To Checkout"}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-2 text-[13px] text-[#6b7280]">
          <span>Have An Account?</span>
          <Link
            href="/login"
            className="font-semibold text-[#04261c] hover:underline"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}

function BrandLockupInline() {
  return (
    <svg
      viewBox="0 0 460 80"
      width="184"
      height="32"
      aria-label="Next Surplus"
      style={{ display: "block" }}
    >
      <polygon points="40,26 54,40 40,54 26,40" fill="#ffffff" />
      <polygon points="40,26 54,40 40,40" fill="#13644e" />
      <polygon points="40,40 54,40 40,54" fill="#4a9c75" />
      <text
        x="90"
        y="56"
        fontFamily="Inter, 'Plus Jakarta Sans', system-ui, sans-serif"
        fontSize="42"
        fontWeight="500"
        fill="#04261c"
        letterSpacing="-0.5"
        wordSpacing="6"
      >
        Next Surplus
      </text>
    </svg>
  );
}

function GoogleButton({
  onClick,
  pending,
}: {
  onClick: () => void;
  pending: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex h-[40px] w-full items-center justify-center gap-2 rounded-[6px] border border-[#e5e7eb] bg-white text-[13.5px] font-medium text-[#04261c] transition-colors duration-150 ease-out hover:bg-[#f5f5f5] disabled:opacity-50"
    >
      <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden>
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
        />
        <path
          fill="#FBBC05"
          d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        />
      </svg>
      <span>{pending ? "Redirecting" : "Continue With Google"}</span>
    </button>
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
      <label className="text-[11.5px] font-medium text-[#374151]">{label}</label>
      <input
        type={type}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[38px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none transition-colors duration-150 ease-out focus:border-[#13644e]"
      />
    </div>
  );
}
