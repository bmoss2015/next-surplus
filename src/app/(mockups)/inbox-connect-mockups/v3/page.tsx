"use client";

import Link from "next/link";

const FONT =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export default function InboxConnectV3() {
  return (
    <div
      className="min-h-[calc(100vh-49px)] bg-[#04261c] px-6 py-10"
      style={{ fontFamily: FONT, letterSpacing: "-0.005em" }}
    >
      <VariantHeader />

      <div className="mx-auto max-w-[520px] space-y-12">
        <StageWrap label="Stage 1 · Empty">
          <CommandShell>
            <FieldRow>
              <FieldIcon>
                <MailIcon />
              </FieldIcon>
              <FieldInput placeholder="Enter Your Email Address" />
              <FieldHint>↵</FieldHint>
            </FieldRow>
          </CommandShell>
          <HintBelow>
            Type your work email. We&apos;ll do the rest.
          </HintBelow>
        </StageWrap>

        <StageWrap label="Stage 2 · Detected, Password Reveals">
          <CommandShell>
            <FieldRow muted>
              <FieldIcon>
                <CheckIcon />
              </FieldIcon>
              <FieldStatic>bree@mossequitypartners.com</FieldStatic>
              <ProviderChip>Google Workspace</ProviderChip>
            </FieldRow>
            <Divider />
            <FieldRow active>
              <FieldIcon>
                <LockIcon />
              </FieldIcon>
              <FieldInput
                placeholder="Paste App Password"
                type="password"
              />
              <FieldHint>↵</FieldHint>
            </FieldRow>
          </CommandShell>
          <HintBelow>
            Google requires an app password.{" "}
            <a
              href="#"
              className="cursor-pointer font-medium text-[#9ed6b8] hover:underline"
            >
              Generate one in 20 seconds
            </a>
            .
          </HintBelow>
        </StageWrap>

        <StageWrap label="Stage 3 · Connected">
          <CommandShell>
            <div className="flex items-center gap-3 px-5 py-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#13644e]/20 text-[#9ed6b8]">
                <BigCheckIcon />
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-white">
                  Inbox Connected
                </div>
                <div className="mt-0.5 text-[12px] text-white/60">
                  bree@mossequitypartners.com · Syncing 1,247 Messages
                </div>
              </div>
              <button
                type="button"
                className="cursor-pointer rounded-[6px] border border-white/20 px-3 py-1.5 text-[12px] font-medium text-white transition-colors duration-150 ease-out hover:bg-white/10"
              >
                Open Inbox
              </button>
            </div>
          </CommandShell>
          <HintBelow>You can now read and send from Next Surplus.</HintBelow>
        </StageWrap>
      </div>

      <VariantFooter prev="v2" next="v4" />
    </div>
  );
}

function VariantHeader() {
  return (
    <div className="mx-auto mb-10 max-w-[520px]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
        Variant V3
      </div>
      <h1 className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-white">
        Magic Field
      </h1>
      <p className="mt-1.5 text-[12.5px] text-white/55">
        Anchored to Superhuman and Raycast. One input, no buttons, no chrome.
        Type your email, press Enter. Reads as a command palette. Distinctive
        power user feel. Could ship as a Cmd+K affordance on top of any base.
      </p>
    </div>
  );
}

function VariantFooter({ prev, next }: { prev: string; next: string }) {
  return (
    <div className="mx-auto mt-12 flex max-w-[520px] items-center justify-between text-[12px]">
      <Link
        href={`/inbox-connect-mockups/${prev}`}
        className="cursor-pointer text-white/55 hover:text-white"
      >
        &larr; Previous Variant
      </Link>
      <Link
        href="/inbox-connect-mockups"
        className="cursor-pointer text-white/55 hover:text-white"
      >
        Back To Gallery
      </Link>
      <Link
        href={`/inbox-connect-mockups/${next}`}
        className="cursor-pointer text-white/55 hover:text-white"
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
      <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/45">
        {label}
      </div>
      {children}
    </div>
  );
}

function CommandShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-white/15 bg-[#0a3d2d]/80 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur">
      {children}
    </div>
  );
}

function FieldRow({
  children,
  active = false,
  muted = false,
}: {
  children: React.ReactNode;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-5 py-4 ${
        active ? "bg-white/[0.04]" : ""
      } ${muted ? "opacity-80" : ""}`}
    >
      {children}
    </div>
  );
}

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center text-white/60">
      {children}
    </span>
  );
}

function FieldInput({
  placeholder,
  type = "text",
}: {
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/35 focus:outline-none"
    />
  );
}

function FieldStatic({ children }: { children: React.ReactNode }) {
  return <span className="flex-1 text-[14px] text-white">{children}</span>;
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-[4px] border border-white/20 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10.5px] text-white/55">
      {children}
    </kbd>
  );
}

function ProviderChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-white/15 bg-white/[0.04] px-2 py-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#9ed6b8]">
      {children}
    </span>
  );
}

function Divider() {
  return <div className="h-px w-full bg-white/10" />;
}

function HintBelow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 px-1 text-[11.5px] text-white/55">{children}</p>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m3 7 9 6 9-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 11V7a4 4 0 0 1 8 0v4"
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
        stroke="#9ed6b8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BigCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
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
