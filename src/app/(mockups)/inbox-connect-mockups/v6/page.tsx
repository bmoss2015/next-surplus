"use client";

import Link from "next/link";

const FONT =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export default function InboxConnectV6() {
  return (
    <div
      className="min-h-[calc(100vh-49px)] bg-[#f5f7f6] px-6 py-10"
      style={{ fontFamily: FONT, letterSpacing: "-0.005em" }}
    >
      <VariantHeader />

      <div className="mx-auto max-w-[520px] space-y-12">
        <StageWrap label="Stage 1 · Initial">
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
                We&apos;ll detect your provider automatically.
              </p>
              <PrimaryButton disabled className="mt-6">
                Continue
              </PrimaryButton>
            </div>
          </ModalShell>
        </StageWrap>

        <StageWrap label="Stage 2 · Detected, Provider Disclosure + 2FA Pre Flight">
          <ModalShell>
            <ModalHeader />
            <div className="p-6">
              <FieldLabel>Email Address</FieldLabel>
              <div className="mt-1.5 flex h-[40px] w-full items-center gap-2 rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13.5px] text-[#04261c]">
                <span className="flex-1">bree@mossequitypartners.com</span>
                <DotIndicator />
              </div>

              <details className="mt-2 group">
                <summary className="flex cursor-pointer items-center gap-1.5 text-[11.5px] text-[#374151] hover:text-[#04261c]">
                  <span className="font-medium">Google Workspace</span>
                  <span className="text-[#9ca3af]">·</span>
                  <span>See What We&apos;ll Access</span>
                  <ChevronIcon />
                </summary>
                <div className="mt-2 rounded-[6px] border border-[#e5e7eb] bg-[#fafbfc] px-3 py-2.5 text-[11.5px] text-[#374151]">
                  <div className="flex flex-col gap-1.5">
                    <AccessRow>Inbox Threads</AccessRow>
                    <AccessRow>Sent Items</AccessRow>
                    <AccessRow>Attachments</AccessRow>
                    <AccessRow>Compose And Reply</AccessRow>
                  </div>
                </div>
              </details>

              <div className="mt-6 border-t border-[#f0f1f3] pt-5">
                <FieldLabel>Quick Check Before We Continue</FieldLabel>
                <p className="mt-1 text-[12px] leading-relaxed text-[#6b7280]">
                  Google requires 2 Step Verification before generating app
                  passwords. Have you turned it on for this Google account?
                </p>
                <div className="mt-3 flex gap-2">
                  <RadioPill checked>Yes, It&apos;s On</RadioPill>
                  <RadioPill>Not Sure</RadioPill>
                  <RadioPill>No</RadioPill>
                </div>
              </div>

              <PrimaryButton className="mt-6">
                Continue To App Password
              </PrimaryButton>
            </div>
          </ModalShell>
        </StageWrap>

        <StageWrap label="Stage 3 · While You&apos;re On Google">
          <ModalShell>
            <SubHeader title="Generating Your App Password" />
            <div className="p-6">
              <p className="text-[12.5px] leading-relaxed text-[#6b7280]">
                A new tab is now open at Google. Use the guide below. We&apos;ll
                watch for the password and paste it for you.
              </p>

              <VideoCard />

              <div className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
                Or Follow These Steps
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <StepCard
                  number="1"
                  caption="Click Create"
                  detail="Bottom of the page"
                  variant="create"
                />
                <StepCard
                  number="2"
                  caption="Name Is Pre Filled"
                  detail="Next Surplus"
                  variant="name"
                />
                <StepCard
                  number="3"
                  caption="Copy The Code"
                  detail="16 characters"
                  variant="copy"
                />
              </div>

              <ClipboardPill />

              <div className="mt-5">
                <FieldLabel>App Password</FieldLabel>
                <input
                  type="password"
                  placeholder="●●●● ●●●● ●●●● ●●●●"
                  className="mt-1.5 h-[40px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13.5px] text-[#04261c] outline-none transition-colors duration-150 ease-out focus:border-[#13644e]"
                />
                <a
                  href="#"
                  className="mt-2 inline-flex cursor-pointer items-center gap-1 text-[11.5px] font-medium text-[#13644e] hover:underline"
                >
                  Open Google App Passwords Again
                  <ExternalIcon />
                </a>
              </div>

              <PrimaryButton className="mt-6">Connect Inbox</PrimaryButton>
            </div>
          </ModalShell>
        </StageWrap>

        <StageWrap label="Stage 4 · Connected (Style C, No Tinted Backgrounds)">
          <ModalShell>
            <ModalHeader />
            <div className="px-6 pb-6 pt-8">
              <div className="flex items-center gap-2.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[#13644e]" />
                <span className="text-[15px] font-medium tracking-[-0.005em] text-[#04261c]">
                  Connected
                </span>
              </div>
              <div className="mt-3 text-[13px] text-[#04261c]">
                bree@mossequitypartners.com
              </div>
              <div className="text-[12px] text-[#6b7280]">
                Syncing 1,247 Messages In The Background
              </div>

              <div className="mt-7 flex gap-2">
                <button
                  type="button"
                  className="inline-flex h-[40px] flex-1 cursor-pointer items-center justify-center rounded-[6px] border border-[#e5e7eb] bg-white text-[13.5px] font-medium text-[#374151] transition-colors duration-150 ease-out hover:border-[#9ca3af]"
                >
                  Connect Another
                </button>
                <button
                  type="button"
                  className="inline-flex h-[40px] flex-1 cursor-pointer items-center justify-center rounded-[6px] bg-[#13644e] text-[13.5px] font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0d4b3a]"
                >
                  Go To Inbox
                </button>
              </div>
            </div>
          </ModalShell>
        </StageWrap>

        <StageWrap label="Stage 2 Alternate · User Picked No (2FA Off)">
          <ModalShell>
            <ModalHeader />
            <div className="p-6">
              <div className="rounded-[6px] border border-[#e5e7eb] bg-white px-4 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#04261c]" />
                  <span className="text-[13.5px] font-medium text-[#04261c]">
                    Turn On 2 Step Verification First
                  </span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-[#6b7280]">
                  Google won&apos;t let any app, including ours, connect to your
                  inbox until you turn on 2 Step Verification. It&apos;s a one
                  time setup and takes about a minute.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="inline-flex h-[36px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[6px] border border-[#13644e] bg-white text-[12.5px] font-medium text-[#13644e] transition-colors duration-150 ease-out hover:bg-[#13644e]/[0.04]"
                  >
                    Open 2 Step Setup
                    <ExternalIcon />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-[36px] flex-1 cursor-pointer items-center justify-center rounded-[6px] border border-[#e5e7eb] bg-white text-[12.5px] font-medium text-[#374151] transition-colors duration-150 ease-out hover:border-[#9ca3af]"
                  >
                    I Turned It On
                  </button>
                </div>
              </div>
            </div>
          </ModalShell>
        </StageWrap>
      </div>

      <VariantFooter prev="v5" next="v1" />
    </div>
  );
}

function VariantHeader() {
  return (
    <div className="mx-auto mb-10 max-w-[520px]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
        Variant V6 · Recommended Hybrid
      </div>
      <h1 className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-[#04261c]">
        Progressive Column + Google Walkthrough
      </h1>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#6b7280]">
        V1&apos;s progressive single panel base, with style C success
        indicator (small petrol dot, no tinted background) plus a four piece
        app password combo: 2 Step Verification pre flight, Loom video,
        annotated screenshots, and a clipboard auto detect pill. The
        provider preview from V2 collapses into a small disclosure under the
        email field.
      </p>
    </div>
  );
}

function VariantFooter({ prev, next }: { prev: string; next: string }) {
  return (
    <div className="mx-auto mt-12 flex max-w-[520px] items-center justify-between text-[12px]">
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

function SubHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#f0f1f3] px-6 py-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-6 w-6 cursor-pointer items-center justify-center text-[#9ca3af] hover:text-[#04261c]"
          aria-label="Back"
        >
          <BackIcon />
        </button>
        <div className="text-[14px] font-semibold tracking-[-0.01em] text-[#04261c]">
          {title}
        </div>
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

function DotIndicator() {
  return <span className="inline-block h-2 w-2 rounded-full bg-[#13644e]" />;
}

function AccessRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-[#374151]">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#13644e]" />
      <span>{children}</span>
    </div>
  );
}

function RadioPill({
  children,
  checked = false,
}: {
  children: React.ReactNode;
  checked?: boolean;
}) {
  return (
    <button
      type="button"
      className={`inline-flex h-[34px] flex-1 cursor-pointer items-center justify-center rounded-[6px] border bg-white px-3 text-[12.5px] font-medium transition-colors duration-150 ease-out ${
        checked
          ? "border-[#13644e] text-[#04261c] ring-1 ring-[#13644e]"
          : "border-[#e5e7eb] text-[#374151] hover:border-[#9ca3af]"
      }`}
    >
      {children}
    </button>
  );
}

function VideoCard() {
  return (
    <div className="mt-4 overflow-hidden rounded-[8px] border border-[#e5e7eb] bg-[#04261c]">
      <div className="relative flex aspect-video items-center justify-center">
        <button
          type="button"
          className="group inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-2 border-white/80 bg-white/10 text-white backdrop-blur-sm transition-all duration-150 ease-out hover:scale-105 hover:bg-white/20"
          aria-label="Play walkthrough"
        >
          <PlayIcon />
        </button>
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[10.5px] font-medium text-white backdrop-blur-sm">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
          25 Second Walkthrough
        </div>
      </div>
    </div>
  );
}

function StepCard({
  number,
  caption,
  detail,
  variant,
}: {
  number: string;
  caption: string;
  detail: string;
  variant: "create" | "name" | "copy";
}) {
  return (
    <div className="overflow-hidden rounded-[6px] border border-[#e5e7eb] bg-white">
      <div className="relative flex h-[88px] items-center justify-center bg-[#fafbfc] px-2">
        <ScreenshotMock variant={variant} />
        <span className="absolute left-1.5 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#13644e] text-[9.5px] font-semibold text-white">
          {number}
        </span>
      </div>
      <div className="px-2.5 py-2">
        <div className="text-[11px] font-semibold text-[#04261c]">
          {caption}
        </div>
        <div className="text-[10.5px] text-[#9ca3af]">{detail}</div>
      </div>
    </div>
  );
}

function ScreenshotMock({ variant }: { variant: "create" | "name" | "copy" }) {
  if (variant === "create") {
    return (
      <div className="flex h-full w-full flex-col justify-end pb-2">
        <div className="mx-auto h-1 w-3/4 rounded bg-[#e5e7eb]" />
        <div className="mx-auto mt-1 h-1 w-3/5 rounded bg-[#e5e7eb]" />
        <div className="mx-auto mt-3 inline-flex h-5 w-14 items-center justify-center rounded-[4px] bg-[#1a73e8] text-[8px] font-semibold text-white ring-2 ring-[#13644e] ring-offset-1">
          Create
        </div>
      </div>
    );
  }
  if (variant === "name") {
    return (
      <div className="flex h-full w-full flex-col justify-center px-2">
        <div className="h-1 w-1/2 rounded bg-[#e5e7eb]" />
        <div className="mt-1 flex h-5 items-center rounded-[4px] border border-[#13644e] bg-white px-1.5 text-[8.5px] font-medium text-[#04261c] ring-1 ring-[#13644e]/30">
          Next Surplus
        </div>
        <div className="mt-2 h-1 w-1/3 rounded bg-[#e5e7eb]" />
      </div>
    );
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1">
      <div className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#04261c]">
        abcd efgh ijkl mnop
      </div>
      <div className="inline-flex items-center gap-1 text-[8.5px] font-medium text-[#13644e]">
        <CopyIcon /> Copy
      </div>
    </div>
  );
}

function ClipboardPill() {
  return (
    <div className="mt-5 flex items-center gap-3 rounded-[8px] border border-[#13644e] bg-white px-3 py-2.5">
      <span className="relative inline-flex">
        <span className="absolute inset-0 inline-block h-2 w-2 animate-ping rounded-full bg-[#13644e] opacity-60" />
        <span className="relative inline-block h-2 w-2 rounded-full bg-[#13644e]" />
      </span>
      <div className="flex-1">
        <div className="text-[12px] font-medium text-[#04261c]">
          We See A Password In Your Clipboard
        </div>
        <div className="text-[11px] text-[#6b7280]">
          Ends In x9k2 · 16 Characters
        </div>
      </div>
      <button
        type="button"
        className="inline-flex h-[30px] cursor-pointer items-center justify-center rounded-[5px] bg-[#13644e] px-3 text-[11.5px] font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0d4b3a]"
      >
        Paste It
      </button>
    </div>
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

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" aria-hidden>
      <rect
        x="8"
        y="8"
        width="12"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M4 16V6a2 2 0 0 1 2-2h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
