"use client";

import Link from "next/link";
import { GoogleButton } from "./GoogleButton";

const FONT =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const BULLETS = [
  "Lead pipeline with custom stages",
  "Unified inbox for Gmail and Outlook",
  "Case tracking from lead to close",
  "Team access at no additional cost per user",
];

export function V16Layout({
  foundersRate,
}: {
  foundersRate: React.ReactNode;
}) {
  return (
    <div
      className="grid min-h-[calc(100vh-49px)] grid-cols-1 lg:grid-cols-[1.05fr_1fr]"
      style={{ fontFamily: FONT }}
    >
      <DarkPanel foundersRate={foundersRate} />
      <FormPanel />
    </div>
  );
}

function DarkPanel({ foundersRate }: { foundersRate: React.ReactNode }) {
  return (
    <div
      className="relative hidden flex-col justify-between overflow-hidden px-14 py-14 lg:flex"
      style={{
        background:
          "linear-gradient(155deg, #04261c 0%, #0a3d2d 55%, #0d4b3a 100%)",
      }}
    >
      <div />

      <div className="text-white">
        <h2 className="m-0 text-[44px] font-semibold leading-[1.06] tracking-[-0.02em]">
          The CRM For Surplus Recovery Firms.
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

      {foundersRate}
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
  return (
    <div className="relative flex items-center justify-center bg-white px-10 py-16">
      <div className="absolute left-10 top-10">
        <img
          src="/brand/03-lockup-horizontal-light.svg"
          alt="Next Surplus"
          style={{ height: 22, width: "auto", display: "block" }}
        />
      </div>

      <div className="w-full max-w-[380px]">
        <div className="mb-7">
          <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em] text-[#04261c]">
            Create Your Account
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#6b7280]">
            Founders Rate. $49 a month, price locked for 12 months. 14 day free trial.
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

        <form className="flex flex-col gap-4">
          <Field label="Firm Name" />
          <Field label="Work Email" type="email" />
          <PasswordField />
          <button
            type="submit"
            className="mt-2 inline-flex h-[40px] w-full items-center justify-center rounded-[6px] bg-[#13644e] text-[13.5px] font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0d4b3a]"
          >
            Continue To Checkout
          </button>
        </form>

        <div className="mt-8 text-[13px] text-[#6b7280]">
          Have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[#04261c] hover:underline"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = "text" }: { label: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11.5px] font-medium text-[#374151]">{label}</label>
      <input
        type={type}
        className="h-[38px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none transition-colors duration-150 ease-out focus:border-[#13644e]"
      />
    </div>
  );
}

function PasswordField() {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11.5px] font-medium text-[#374151]">Password</label>
      <input
        type="password"
        className="h-[38px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none transition-colors duration-150 ease-out focus:border-[#13644e]"
      />
      <p className="text-[11px] text-[#9ca3af]">12 characters or more.</p>
    </div>
  );
}
