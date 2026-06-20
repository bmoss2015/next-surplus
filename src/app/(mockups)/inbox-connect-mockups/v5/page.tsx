"use client";

import Link from "next/link";

const FONT =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export default function InboxConnectV5() {
  return (
    <div
      className="min-h-[calc(100vh-49px)] bg-[#f5f7f6] px-6 py-10"
      style={{ fontFamily: FONT, letterSpacing: "-0.005em" }}
    >
      <VariantHeader />

      <div className="mx-auto max-w-[460px] space-y-14">
        <StageWrap label="Stage 1 · Asking For Email">
          <Column>
            <Hero
              eyebrow="Step 1 Of 2"
              title="What's Your Email Address?"
              subtitle="We'll detect your provider automatically. Most users finish in under a minute."
            />
            <FieldBlock>
              <FieldLabel>Email Address</FieldLabel>
              <input
                type="email"
                placeholder="you@yourcompany.com"
                className="mt-1.5 h-[44px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3.5 text-[14px] text-[#04261c] outline-none transition-colors duration-150 ease-out focus:border-[#13644e]"
              />
            </FieldBlock>
            <PrimaryButton disabled>Continue</PrimaryButton>
          </Column>
        </StageWrap>

        <StageWrap label="Stage 2 · Email Confirmed, Asking For Password">
          <Column>
            <ConfirmedRow
              label="Email"
              value="bree@mossequitypartners.com"
              note="Detected Google Workspace"
            />
            <Hero
              eyebrow="Step 2 Of 2"
              title="Generate A Google App Password"
              subtitle="Google requires a one time app password for inbox apps. It takes about 20 seconds."
            />
            <ProcedureCard
              steps={[
                "Click the button below. A new tab opens to Google.",
                "Name it Next Surplus. Click Create.",
                "Copy the 16 character code Google shows you.",
              ]}
            />
            <button
              type="button"
              className="inline-flex h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-[6px] border border-[#13644e] bg-white text-[13.5px] font-medium text-[#13644e] transition-colors duration-150 ease-out hover:bg-[#13644e]/[0.04]"
            >
              Open Google App Passwords
              <ExternalIcon />
            </button>
            <FieldBlock>
              <FieldLabel>Paste The 16 Character Code Here</FieldLabel>
              <input
                type="password"
                placeholder="●●●● ●●●● ●●●● ●●●●"
                className="mt-1.5 h-[44px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3.5 text-[14px] text-[#04261c] outline-none transition-colors duration-150 ease-out focus:border-[#13644e]"
              />
            </FieldBlock>
            <PrimaryButton>Connect Inbox</PrimaryButton>
          </Column>
        </StageWrap>

        <StageWrap label="Stage 3 · Connected">
          <Column>
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#e9f3ee] text-[#13644e]">
                <BigCheckIcon />
              </div>
              <div className="mt-5 text-[20px] font-semibold tracking-[-0.02em] text-[#04261c]">
                You're Connected
              </div>
              <div className="mt-2 max-w-[340px] text-[13.5px] leading-relaxed text-[#6b7280]">
                bree@mossequitypartners.com is now syncing. Found 1,247
                messages in your inbox.
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex h-[44px] flex-1 cursor-pointer items-center justify-center rounded-[6px] border border-[#e5e7eb] bg-white text-[13.5px] font-medium text-[#374151] transition-colors duration-150 ease-out hover:border-[#9ca3af]"
              >
                Connect Another
              </button>
              <button
                type="button"
                className="inline-flex h-[44px] flex-1 cursor-pointer items-center justify-center rounded-[6px] bg-[#13644e] text-[13.5px] font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0d4b3a]"
              >
                Go To Inbox
              </button>
            </div>
          </Column>
        </StageWrap>
      </div>

      <VariantFooter prev="v4" next="v1" />
    </div>
  );
}

function VariantHeader() {
  return (
    <div className="mx-auto mb-10 max-w-[460px]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
        Variant V5
      </div>
      <h1 className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-[#04261c]">
        Conversational Column
      </h1>
      <p className="mt-1.5 text-[12.5px] text-[#6b7280]">
        Anchored to Stripe Atlas. Narrow centered column, no modal border,
        questions reveal one at a time. Confirmed answers collapse above as
        compact rows. Highest hand holding, lowest cognitive load.
      </p>
    </div>
  );
}

function VariantFooter({ prev, next }: { prev: string; next: string }) {
  return (
    <div className="mx-auto mt-12 flex max-w-[460px] items-center justify-between text-[12px]">
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
      <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
        {label}
      </div>
      {children}
    </div>
  );
}

function Column({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-5">{children}</div>;
}

function Hero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#13644e]">
        {eyebrow}
      </div>
      <div className="mt-2 text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#04261c]">
        {title}
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-[#6b7280]">
        {subtitle}
      </p>
    </div>
  );
}

function ConfirmedRow({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[8px] border border-[#e5e7eb] bg-white px-4 py-3">
      <CheckCircleIcon />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
          {label}
        </div>
        <div className="mt-0.5 truncate text-[13px] font-medium text-[#04261c]">
          {value}
        </div>
        <div className="text-[11px] text-[#6b7280]">{note}</div>
      </div>
      <button
        type="button"
        className="cursor-pointer text-[11.5px] font-medium text-[#6b7280] hover:text-[#04261c]"
      >
        Change
      </button>
    </div>
  );
}

function FieldBlock({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11.5px] font-medium text-[#374151]">
      {children}
    </label>
  );
}

function ProcedureCard({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2 rounded-[8px] border border-[#e5e7eb] bg-[#fafbfc] p-4">
      {steps.map((s, i) => (
        <li key={s} className="flex items-start gap-3 text-[12.5px] text-[#374151]">
          <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-[#13644e] text-[10.5px] font-semibold text-[#13644e]">
            {i + 1}
          </span>
          <span className="leading-relaxed">{s}</span>
        </li>
      ))}
    </ol>
  );
}

function PrimaryButton({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="inline-flex h-[44px] w-full cursor-pointer items-center justify-center rounded-[6px] bg-[#13644e] text-[13.5px] font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0d4b3a] disabled:cursor-not-allowed disabled:bg-[#e5e7eb] disabled:text-[#9ca3af]"
    >
      {children}
    </button>
  );
}

function CheckCircleIcon() {
  return (
    <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#13644e] text-white">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden>
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function BigCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden>
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

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden>
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
