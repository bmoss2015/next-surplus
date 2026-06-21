"use client";

import Link from "next/link";

const FONT =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

type Provider = {
  id: string;
  name: string;
  badge?: string;
};

const PROVIDERS: Provider[] = [
  { id: "google", name: "Google Workspace" },
  { id: "outlook", name: "Outlook · M365" },
  { id: "icloud", name: "iCloud" },
  { id: "fastmail", name: "Fastmail" },
  { id: "zoho", name: "Zoho" },
  { id: "yahoo", name: "Yahoo" },
  { id: "aol", name: "AOL" },
  { id: "gmx", name: "GMX · Mail.com" },
  { id: "custom", name: "Custom IMAP" },
];

export default function InboxConnectV4() {
  return (
    <div
      className="min-h-[calc(100vh-49px)] bg-[#f5f7f6] px-6 py-10"
      style={{ fontFamily: FONT, letterSpacing: "-0.005em" }}
    >
      <VariantHeader />

      <div className="mx-auto max-w-[640px] space-y-12">
        <StageWrap label="Stage 1 · Initial, All Providers Equal">
          <ModalShell>
            <ModalHeader />
            <div className="p-7">
              <EmailField placeholder="you@yourcompany.com" detected={null} />
              <Divider label="Or Pick A Provider" />
              <ProviderGrid highlighted={null} />
            </div>
            <ModalFooter ctaLabel="Continue" disabled />
          </ModalShell>
        </StageWrap>

        <StageWrap label="Stage 2 · Email Typed, Google Tile Auto Highlighted">
          <ModalShell>
            <ModalHeader />
            <div className="p-7">
              <EmailField
                value="bree@mossequitypartners.com"
                detected="google"
              />
              <Divider label="Or Pick A Different Provider" />
              <ProviderGrid highlighted="google" />
            </div>
            <ModalFooter ctaLabel="Continue With Google Workspace" />
          </ModalShell>
        </StageWrap>

        <StageWrap label="Stage 3 · Connected">
          <ModalShell>
            <ModalHeader />
            <div className="px-7 pb-7 pt-10 text-center">
              <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#e9f3ee] text-[#13644e]">
                <BigCheckIcon />
              </div>
              <div className="text-[17px] font-semibold tracking-[-0.01em] text-[#04261c]">
                Inbox Connected
              </div>
              <div className="mt-2 text-[13px] text-[#6b7280]">
                bree@mossequitypartners.com via Google Workspace
              </div>
              <div className="mt-1 text-[12px] text-[#9ca3af]">
                Syncing 1,247 Messages
              </div>
              <button
                type="button"
                className="mt-7 inline-flex h-[40px] w-[200px] cursor-pointer items-center justify-center rounded-[6px] bg-[#13644e] text-[13.5px] font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0d4b3a]"
              >
                Go To Inbox
              </button>
            </div>
          </ModalShell>
        </StageWrap>
      </div>

      <VariantFooter prev="v3" next="v5" />
    </div>
  );
}

function VariantHeader() {
  return (
    <div className="mx-auto mb-10 max-w-[640px]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
        Variant V4
      </div>
      <h1 className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-[#04261c]">
        Provider Tile Grid
      </h1>
      <p className="mt-1.5 text-[12.5px] text-[#6b7280]">
        Anchored to Notion. Email field at top, provider tiles below. Auto
        detected tile highlights with a brand ring. Hybrid of auto detect
        and explicit pick. Scales gracefully when autodetect fails.
      </p>
    </div>
  );
}

function VariantFooter({ prev, next }: { prev: string; next: string }) {
  return (
    <div className="mx-auto mt-12 flex max-w-[640px] items-center justify-between text-[12px]">
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

function ModalFooter({
  ctaLabel,
  disabled = false,
}: {
  ctaLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-[#f0f1f3] bg-[#fafbfc] px-7 py-4">
      <button
        type="button"
        className="inline-flex h-[36px] min-w-[100px] cursor-pointer items-center justify-center rounded-[6px] border border-[#e5e7eb] bg-white px-4 text-[13px] font-medium text-[#374151] transition-colors duration-150 ease-out hover:border-[#9ca3af]"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={disabled}
        className="inline-flex h-[36px] min-w-[100px] cursor-pointer items-center justify-center rounded-[6px] bg-[#13644e] px-4 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0d4b3a] disabled:cursor-not-allowed disabled:bg-[#e5e7eb] disabled:text-[#9ca3af]"
      >
        {ctaLabel}
      </button>
    </div>
  );
}

function EmailField({
  value,
  placeholder,
  detected,
}: {
  value?: string;
  placeholder?: string;
  detected: string | null;
}) {
  return (
    <div>
      <label className="text-[11.5px] font-medium text-[#374151]">
        Email Address
      </label>
      <div className="mt-1.5 flex h-[42px] w-full items-center gap-2 rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13.5px] text-[#04261c] focus-within:border-[#13644e]">
        <span className="flex-1 truncate">
          {value || <span className="text-[#9ca3af]">{placeholder}</span>}
        </span>
        {detected && (
          <span className="inline-flex items-center gap-1 text-[11.5px] text-[#13644e]">
            <CheckIcon /> Detected
          </span>
        )}
      </div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-[#e5e7eb]" />
      <span className="text-[10px] uppercase tracking-[0.14em] text-[#9ca3af]">
        {label}
      </span>
      <span className="h-px flex-1 bg-[#e5e7eb]" />
    </div>
  );
}

function ProviderGrid({ highlighted }: { highlighted: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {PROVIDERS.map((p) => (
        <ProviderTile
          key={p.id}
          provider={p}
          highlighted={highlighted === p.id}
        />
      ))}
    </div>
  );
}

function ProviderTile({
  provider,
  highlighted,
}: {
  provider: Provider;
  highlighted: boolean;
}) {
  return (
    <button
      type="button"
      className={`group relative flex h-[88px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[8px] border bg-white px-3 text-center transition-all duration-150 ease-out ${
        highlighted
          ? "border-[#13644e] ring-2 ring-[#13644e]/15"
          : "border-[#e5e7eb] hover:border-[#9ca3af]"
      }`}
    >
      <ProviderLogo id={provider.id} />
      <span className="text-[11.5px] font-medium text-[#04261c]">
        {provider.name}
      </span>
      {highlighted && (
        <span className="absolute right-2 top-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#13644e] text-white">
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" aria-hidden>
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </button>
  );
}

function ProviderLogo({ id }: { id: string }) {
  if (id === "google") {
    return (
      <svg width="22" height="22" viewBox="0 0 18 18" aria-hidden>
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
    );
  }
  if (id === "outlook") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="6" width="18" height="12" rx="1.5" fill="#0078D4" />
        <path
          d="M3 7l9 6 9-6"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (id === "icloud") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6 18a4 4 0 1 1 .6-7.96A6 6 0 0 1 18 11a4 4 0 0 1 0 7H6z"
          fill="#3693f3"
        />
      </svg>
    );
  }
  if (id === "fastmail") {
    return (
      <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] bg-[#0067b9] text-[11px] font-bold text-white">
        F
      </div>
    );
  }
  if (id === "zoho") {
    return (
      <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] bg-[#e42527] text-[10px] font-bold text-white">
        Z
      </div>
    );
  }
  if (id === "yahoo") {
    return (
      <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] bg-[#6001d2] text-[10px] font-bold text-white">
        Y!
      </div>
    );
  }
  if (id === "aol") {
    return (
      <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] bg-[#0060df] text-[9px] font-bold text-white">
        AOL
      </div>
    );
  }
  if (id === "gmx") {
    return (
      <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] bg-[#1c449b] text-[9px] font-bold text-white">
        GMX
      </div>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="#04261c"
      strokeWidth="1.5"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden>
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
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden>
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
