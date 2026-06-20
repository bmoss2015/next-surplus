"use client";

import Link from "next/link";

const FONT =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export default function InboxConnectV2() {
  return (
    <div
      className="min-h-[calc(100vh-49px)] bg-[#f5f7f6] px-6 py-10"
      style={{ fontFamily: FONT, letterSpacing: "-0.005em" }}
    >
      <VariantHeader />

      <div className="mx-auto max-w-[720px] space-y-12">
        <StageWrap label="Stage 1 · Initial State">
          <DrawerShell>
            <DrawerHeader />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">
              <FormSide
                emailValue=""
                emailDetected={false}
                passwordPlaceholder=""
              />
              <PreviewSide detected={false} />
            </div>
            <DrawerFooter disabled />
          </DrawerShell>
        </StageWrap>

        <StageWrap label="Stage 2 · Provider Detected, Password Field Active">
          <DrawerShell>
            <DrawerHeader />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">
              <FormSide
                emailValue="bree@mossequitypartners.com"
                emailDetected
                passwordPlaceholder="●●●● ●●●● ●●●● ●●●●"
              />
              <PreviewSide detected />
            </div>
            <DrawerFooter />
          </DrawerShell>
        </StageWrap>

        <StageWrap label="Stage 3 · Connected">
          <DrawerShell>
            <DrawerHeader />
            <div className="flex flex-col items-center px-10 py-16 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#e9f3ee] text-[#13644e]">
                <BigCheckIcon />
              </div>
              <div className="mt-5 text-[17px] font-semibold tracking-[-0.01em] text-[#04261c]">
                Inbox Connected
              </div>
              <div className="mt-2 text-[13px] text-[#6b7280]">
                bree@mossequitypartners.com is syncing now.
              </div>
              <div className="mt-1 text-[12px] text-[#9ca3af]">
                Found 1,247 Messages In Your Inbox
              </div>
              <button
                type="button"
                className="mt-7 inline-flex h-[40px] w-[180px] cursor-pointer items-center justify-center rounded-[6px] bg-[#13644e] text-[13.5px] font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0d4b3a]"
              >
                Go To Inbox
              </button>
            </div>
          </DrawerShell>
        </StageWrap>
      </div>

      <VariantFooter prev="v1" next="v3" />
    </div>
  );
}

function VariantHeader() {
  return (
    <div className="mx-auto mb-10 max-w-[720px]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
        Variant V2
      </div>
      <h1 className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-[#04261c]">
        Split Drawer With Live Preview
      </h1>
      <p className="mt-1.5 text-[12.5px] text-[#6b7280]">
        Anchored to Attio. Right side drawer pattern. Form on the left,
        live provider preview on the right showing logo, capabilities, and
        what the portal will access. Transparency forward, highest trust.
      </p>
    </div>
  );
}

function VariantFooter({ prev, next }: { prev: string; next: string }) {
  return (
    <div className="mx-auto mt-12 flex max-w-[720px] items-center justify-between text-[12px]">
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

function DrawerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04),0_8px_24px_rgba(15,23,41,0.06)]">
      {children}
    </div>
  );
}

function DrawerHeader() {
  return (
    <div className="flex items-center justify-between border-b border-[#f0f1f3] px-6 py-4">
      <div className="flex items-center gap-2.5">
        <div className="inline-flex h-6 w-6 items-center justify-center rounded-[4px] bg-[#04261c] text-white">
          <MailIcon />
        </div>
        <div className="text-[14px] font-semibold tracking-[-0.01em] text-[#04261c]">
          Add Inbox
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

function DrawerFooter({ disabled = false }: { disabled?: boolean }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-[#f0f1f3] bg-[#fafbfc] px-6 py-4">
      <button
        type="button"
        className="inline-flex h-[36px] w-[100px] cursor-pointer items-center justify-center rounded-[6px] border border-[#e5e7eb] bg-white text-[13px] font-medium text-[#374151] transition-colors duration-150 ease-out hover:border-[#9ca3af]"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={disabled}
        className="inline-flex h-[36px] w-[100px] cursor-pointer items-center justify-center rounded-[6px] bg-[#13644e] text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0d4b3a] disabled:cursor-not-allowed disabled:bg-[#e5e7eb] disabled:text-[#9ca3af]"
      >
        Connect
      </button>
    </div>
  );
}

function FormSide({
  emailValue,
  emailDetected,
  passwordPlaceholder,
}: {
  emailValue: string;
  emailDetected: boolean;
  passwordPlaceholder: string;
}) {
  return (
    <div className="px-7 py-7">
      <label className="text-[11.5px] font-medium text-[#374151]">
        Email Address
      </label>
      <div className="mt-1.5 flex h-[40px] w-full items-center gap-2 rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13.5px] text-[#04261c]">
        <span className="flex-1 truncate">
          {emailValue || (
            <span className="text-[#9ca3af]">you@yourcompany.com</span>
          )}
        </span>
        {emailDetected && <CheckIcon />}
      </div>

      <div className="mt-5">
        <label className="text-[11.5px] font-medium text-[#374151]">
          App Password
        </label>
        <input
          type="password"
          placeholder={passwordPlaceholder || "Generate One From Your Provider"}
          disabled={!emailDetected}
          className="mt-1.5 h-[40px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13.5px] text-[#04261c] outline-none transition-colors duration-150 ease-out focus:border-[#13644e] disabled:cursor-not-allowed disabled:bg-[#fafbfc] disabled:text-[#9ca3af]"
        />
        {emailDetected && (
          <a
            href="#"
            className="mt-2 inline-flex cursor-pointer items-center gap-1 text-[11.5px] font-medium text-[#13644e] hover:underline"
          >
            Get App Password From Google
            <ExternalIcon />
          </a>
        )}
      </div>

      <div className="mt-6 rounded-[6px] border border-[#e5e7eb] bg-[#fafbfc] px-3 py-2.5 text-[11.5px] text-[#6b7280]">
        <span className="font-medium text-[#374151]">Why An App Password?</span>{" "}
        Google requires a one time password for inbox apps. Takes about 20
        seconds.
      </div>
    </div>
  );
}

function PreviewSide({ detected }: { detected: boolean }) {
  return (
    <div className="border-l border-[#f0f1f3] bg-[#fafbfc] px-6 py-7">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
        Provider
      </div>

      {detected ? (
        <>
          <div className="mt-3 flex items-center gap-2.5">
            <GoogleLogo />
            <div>
              <div className="text-[13.5px] font-semibold text-[#04261c]">
                Google Workspace
              </div>
              <div className="text-[11px] text-[#9ca3af]">
                Custom Domain · IMAP + SMTP
              </div>
            </div>
          </div>

          <div className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
            What You'll See In The Portal
          </div>
          <div className="mt-2.5 flex flex-col gap-2">
            <PreviewRow>Inbox Threads</PreviewRow>
            <PreviewRow>Sent Items</PreviewRow>
            <PreviewRow>Attachments</PreviewRow>
            <PreviewRow>Compose And Reply</PreviewRow>
          </div>

          <div className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
            Detection Method
          </div>
          <div className="mt-2 text-[11.5px] text-[#6b7280]">
            MX record lookup on mossequitypartners.com.
          </div>
        </>
      ) : (
        <div className="mt-3 text-[12px] text-[#9ca3af]">
          Type your email above. We'll auto detect your mail server and
          show what the portal will access.
        </div>
      )}
    </div>
  );
}

function PreviewRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-[#374151]">
      <CheckIcon />
      <span>{children}</span>
    </div>
  );
}

function GoogleLogo() {
  return (
    <div className="inline-flex h-9 w-9 items-center justify-center rounded-[5px] border border-[#e5e7eb] bg-white">
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
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
    </div>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden>
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
