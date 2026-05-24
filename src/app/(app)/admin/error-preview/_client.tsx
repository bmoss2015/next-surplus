"use client";

// Static visual reference of every error / warning state the Send Mail
// flow can show a customer. Each card renders the exact DOM the user
// would see (modal banner, inline pill, sub-text, button states) so
// admins can audit without manually triggering every failure mode.

const SCENARIOS = [
  {
    title: "Undeliverable address",
    when: "Pre-flight (before Send click)",
    blocks: true,
    render: <UndeliverablePill />,
    explain:
      "Lob /us_verifications returned deliverability='undeliverable'. The Send button stays disabled for this recipient until they fix the address inline.",
  },
  {
    title: "Unit warning",
    when: "Pre-flight (before Send click)",
    blocks: false,
    render: <UnitWarningPill />,
    explain:
      "Address is deliverable, but Lob flagged a unit-number issue (missing apartment, extra unit, etc.). Customer can still send through — Lob usually delivers — but the pill flags the risk.",
  },
  {
    title: "Address verified",
    when: "Pre-flight (before Send click)",
    blocks: false,
    render: <VerifiedPill />,
    explain:
      "Lob /us_verifications confirmed deliverable. Address was normalized (ZIP+4 added, capitalization standardized). Normal happy path.",
  },
  {
    title: "Modal blocking error: missing company address",
    when: "After Send click (server-side validation)",
    blocks: true,
    render: <ModalBlockError text="Complete the Company Address in Settings before sending mail." />,
    explain:
      "The user's org doesn't have a return address configured. Send action returns this error in the modal's top banner. Send didn't fire; nothing charged.",
  },
  {
    title: "Modal blocking error: empty body",
    when: "Before Send click (client-side validation)",
    blocks: true,
    render: <ModalBlockError text="Body is required" />,
    explain:
      "Customer picked the Blank Letter option but left the body empty. Client validation blocks Send before any server call.",
  },
  {
    title: "Modal blocking error: no bank account on check send",
    when: "Before Send click (client-side validation)",
    blocks: true,
    render: <ModalBlockError text="Pick a verified bank account for the check" />,
    explain:
      "Customer toggled Include Check but didn't select a bank account. Send disabled until they pick one (or remove the check).",
  },
  {
    title: "Lob outage / 5xx",
    when: "After Send click (auto-retried 3x first)",
    blocks: true,
    render: (
      <ModalBlockError text="The mail service is having problems right now. Please try again in a few minutes." />
    ),
    explain:
      "Lob returned 5xx on all 3 retries with exponential backoff. Friendly message surfaces in the modal. No charges; customer retries when Lob is back.",
  },
  {
    title: "Lob rate limit (429)",
    when: "After Send click (auto-retried 3x first)",
    blocks: true,
    render: <ModalBlockError text="Mail service is busy right now. Wait a few seconds and try again." />,
    explain:
      "All 3 retry attempts hit 429. Rare at your scale (Lob's letter API caps around 300 req / 5 sec). Customer just waits.",
  },
  {
    title: "Lob plan-cap hit (500/mo)",
    when: "After Send click",
    blocks: true,
    render: (
      <ModalBlockError text="Mail service is temporarily unavailable. Please contact support." />
    ),
    explain:
      "Hit Lob Developer's 500-mailings/month cap. Customer sees the generic 'unavailable' message. You get an email alert at 75/90/100% of the cap so you can upgrade before customers hit this.",
  },
  {
    title: "Recipient moved (NCOA NOT enabled — current state)",
    when: "Days later via webhook",
    blocks: false,
    render: <ReturnedRow />,
    explain:
      "CASS passed at send time. Recipient moved without USPS forwarding. Letter goes out, USPS attempts delivery, fails, returns to sender. mail_jobs.status flips to 'returned' via webhook. Bell notification fires. The piece appears in the Returned section with a Fix & Resend button.",
  },
  {
    title: "Recipient moved (NCOA enabled — future)",
    when: "Transparent at send time",
    blocks: false,
    render: <NcoaTransparentRow />,
    explain:
      "When NCOA is enabled on the Lob account, the API auto-swaps in the recipient's new forwarding address. mail_jobs row gets recipient_moved=true; customer doesn't see anything different in the UI. Letter physically reaches the right person.",
  },
];

export function ErrorPreviewClient() {
  return (
    <div className="mx-auto max-w-[960px] px-8 py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-ink">
          Send Mail Error Preview
        </h1>
        <p className="mt-1 text-[13px] text-gray-600">
          Every error / warning state customers can hit, with the exact UI
          they&apos;d see. Static rendering — no real sends fire.
        </p>
      </div>

      <div className="grid gap-4">
        {SCENARIOS.map((s, i) => (
          <section
            key={i}
            className="rounded-lg bg-white"
            style={{ border: "1px solid #ebedf0" }}
          >
            <header
              className="flex items-baseline justify-between px-5 py-3"
              style={{ borderBottom: "1px solid #ebedf0" }}
            >
              <div>
                <div className="text-[14px] font-semibold text-ink">
                  {s.title}
                </div>
                <div className="text-[11.5px] text-gray-500">{s.when}</div>
              </div>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                style={
                  s.blocks
                    ? { background: "#fef2f2", color: "#b42318" }
                    : { background: "#ecfdf5", color: "#067647" }
                }
              >
                {s.blocks ? "Blocks send" : "Customer can still send"}
              </span>
            </header>
            <div
              className="px-5 py-5"
              style={{ background: "#fafbfc" }}
            >
              {s.render}
            </div>
            <div className="px-5 py-3 text-[12.5px] text-gray-700">
              {s.explain}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// --- The render fragments below are the EXACT components the modal /
// dashboard show, copied here so the preview matches production. If
// either side's styling changes, this file needs the same update so
// the preview stays accurate.

function UndeliverablePill() {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[11.5px] font-medium"
      style={{
        background: "#fef2f2",
        color: "#b42318",
        border: "1px solid rgba(180, 35, 24, 0.20)",
      }}
    >
      Address Check Failed: Undeliverable
    </div>
  );
}

function UnitWarningPill() {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[11.5px] font-medium"
      style={{
        background: "#fef2f2",
        color: "#b42318",
        border: "1px solid rgba(180, 35, 24, 0.20)",
      }}
    >
      Address Check: Missing apartment / unit number
    </div>
  );
}

function VerifiedPill() {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[11.5px] font-medium"
      style={{ background: "#ecfdf5", color: "#067647", border: "1px solid rgba(6, 118, 71, 0.20)" }}
    >
      Verified · ZIP+4 added
    </div>
  );
}

function ModalBlockError({ text }: { text: string }) {
  return (
    <div
      className="rounded-md px-4 py-3 text-[12.5px]"
      style={{
        background: "#fef2f2",
        color: "#b42318",
        border: "1px solid rgba(180, 35, 24, 0.25)",
      }}
    >
      {text}
    </div>
  );
}

function ReturnedRow() {
  return (
    <div
      className="rounded-md bg-white"
      style={{ border: "1px solid #ebedf0", padding: "12px 16px" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold text-ink">
            John Doe
          </div>
          <div className="text-[12px] text-gray-600">
            123 Old Address, Springfield, IL 62701
          </div>
          <div className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: "#b42318" }}>
            ⌫ Returned May 18, 2026 (no forwarding address on file)
          </div>
        </div>
        <span
          className="inline-flex h-[24px] items-center rounded-md border bg-white px-2 text-[10.5px] font-semibold uppercase tracking-wide"
          style={{ borderColor: "rgba(180, 35, 24, 0.4)", color: "#b42318" }}
        >
          Returned
        </span>
        <button
          type="button"
          className="cursor-pointer rounded-md px-3 py-1.5 text-[11.5px] font-semibold text-white"
          style={{ background: "#b42318" }}
        >
          Fix &amp; Resend
        </button>
      </div>
    </div>
  );
}

function NcoaTransparentRow() {
  return (
    <div
      className="rounded-md bg-white"
      style={{ border: "1px solid #ebedf0", padding: "12px 16px" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold text-ink">
            John Doe
          </div>
          <div className="text-[12px] text-gray-600">
            [Forwarded by NCOA — original address redacted]
          </div>
          <div className="mt-1 inline-flex items-center gap-1 text-[12px] text-petrol-700">
            ✓ Delivered May 22, 2026
          </div>
        </div>
        <span
          className="inline-flex h-[24px] items-center rounded-md border bg-white px-2 text-[10.5px] font-semibold uppercase tracking-wide"
          style={{ borderColor: "rgba(13, 75, 58, 0.4)", color: "#0d4b3a" }}
        >
          Delivered
        </span>
      </div>
    </div>
  );
}
