"use client";

import Link from "next/link";

const FONT =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export default function InboxConnectV1() {
  return (
    <div
      className="min-h-[calc(100vh-49px)] bg-[#f5f7f6] px-6 py-10"
      style={{ fontFamily: FONT, letterSpacing: "-0.005em" }}
    >
      <VariantHeader />

      <div className="mx-auto max-w-[480px] space-y-10">
        <StageWrap label="Stage 1 · Initial State">
          <ModalShell>
            <ModalHeader />
            <div className="p-6">
              <FieldLabel>Email Address</FieldLabel>
              <input
                type="email"
                placeholder="you@yourcompany.com"
                className="mt-1.5 h-[40px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13.5px] text-[#04261c] outline-none transition-colors duration-150 ease-out focus:border-[#13644e]"
              />
              <p className="mt-2 text-[11.5px] text-[#9ca3af]">
                We'll Detect Your Mail Server Automatically.
              </p>
              <PrimaryButton disabled className="mt-6">
                Connect
              </PrimaryButton>
            </div>
          </ModalShell>
        </StageWrap>

        <StageWrap label="Stage 2 · Provider Detected, Password Field Revealed">
          <ModalShell>
            <ModalHeader />
            <div className="p-6">
              <FieldLabel>Email Address</FieldLabel>
              <div className="mt-1.5 flex h-[40px] w-full items-center gap-2 rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13.5px] text-[#04261c]">
                <span className="flex-1">bree@mossequitypartners.com</span>
                <CheckIcon />
              </div>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-[#13644e]">
                <DotIcon /> Detected Google Workspace
              </p>

              <div className="mt-5">
                <FieldLabel>App Password</FieldLabel>
                <input
                  type="password"
                  placeholder="●●●● ●●●● ●●●● ●●●●"
                  className="mt-1.5 h-[40px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13.5px] text-[#04261c] outline-none transition-colors duration-150 ease-out focus:border-[#13644e]"
                />
                <div className="mt-2 flex items-center justify-between text-[11.5px]">
                  <span className="text-[#6b7280]">
                    Google Requires A 16 Character App Password.
                  </span>
                  <a
                    href="#"
                    className="inline-flex cursor-pointer items-center gap-1 font-medium text-[#13644e] hover:underline"
                  >
                    Get App Password
                    <ExternalIcon />
                  </a>
                </div>
              </div>

              <PrimaryButton className="mt-6">Connect</PrimaryButton>
            </div>
          </ModalShell>
        </StageWrap>

        <StageWrap label="Stage 3 · Connected">
          <ModalShell>
            <ModalHeader />
            <div className="px-6 pb-6 pt-10 text-center">
              <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#e9f3ee] text-[#13644e]">
                <BigCheckIcon />
              </div>
              <div className="text-[16px] font-semibold tracking-[-0.01em] text-[#04261c]">
                Inbox Connected
              </div>
              <div className="mt-2 text-[13px] text-[#6b7280]">
                bree@mossequitypartners.com
              </div>
              <div className="mt-1 text-[12px] text-[#9ca3af]">
                Syncing 1,247 Messages
              </div>
              <PrimaryButton className="mt-7">Done</PrimaryButton>
            </div>
          </ModalShell>
        </StageWrap>
      </div>

      <VariantFooter prev="v5" next="v2" />
    </div>
  );
}

function VariantHeader() {
  return (
    <div className="mx-auto mb-10 max-w-[480px]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
        Variant V1
      </div>
      <h1 className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-[#04261c]">
        Progressive Column
      </h1>
      <p className="mt-1.5 text-[12.5px] text-[#6b7280]">
        Anchored to Linear. Single panel that grows downward. No step dots,
        no Next button. The form is the progress indicator.
      </p>
    </div>
  );
}

function VariantFooter({ prev, next }: { prev: string; next: string }) {
  return (
    <div className="mx-auto mt-12 flex max-w-[480px] items-center justify-between text-[12px]">
      <Link
        href={`/inbox-connect-mockups/${prev}`}
        className="cursor-pointer text-[#6b7280] hover:text-[#04261c]"
      >
        &larr; Previous Variant
      </Link>
      <Link
        href="/inbox-connect-mockups"
        className="cursor-pointer text-[#6b7280] hover:text-[#04261c]"
      >
        Back To Gallery
      </Link>
      <Link
        href={`/inbox-connect-mockups/${next}`}
        className="cursor-pointer text-[#6b7280] hover:text-[#04261c]"
      >
        Next Variant &rarr;
      </Link>
    </div>
  );
}

function StageWrap({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
        {label}
      </div>
      {children}
    </div>
  );
}

function ModalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04),0_8px_24px_rgba(15,23,41,0.06)]">
      {children}
    </div>
  );
}

function ModalHeader() {
  return (
    <div className="flex items-center justify-between border-b border-[#f0f1f3] px-6 py-4">
      <div className="text-[14px] font-semibold tracking-[-0.01em] text-[#04261c]">
        Add Inbox
      </div>
      <button
        type="button"
        className="inline-flex h-6 w-6 cursor-pointer items-center justify-center text-[#9ca3af] hover:text-[#04261c]"
        aria-label="Close"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11.5px] font-medium text-[#374151]">
      {children}
    </label>
  );
}

function PrimaryButton({
  children,
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex h-[40px] w-full cursor-pointer items-center justify-center rounded-[6px] bg-[#13644e] text-[13.5px] font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0d4b3a] disabled:cursor-not-allowed disabled:bg-[#e5e7eb] disabled:text-[#9ca3af] ${className}`}
    >
      {children}
    </button>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="#13644e"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BigCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden>
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DotIcon() {
  return (
    <svg viewBox="0 0 8 8" width="6" height="6" aria-hidden>
      <circle cx="4" cy="4" r="4" fill="#13644e" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden>
      <path
        d="M14 4h6v6M20 4l-9 9M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
