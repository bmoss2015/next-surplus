import Link from "next/link";
import { Logomark, CARD_SHADOW } from "./Shared";
import { OUTCOME_CHIPS } from "./Shared";

const FILTER_PILLS = [
  "Case Type: Estate, Foreclosure",
  "Surplus: $25K to $300K",
  "County: Cuyahoga, Lancaster, Franklin",
  "Last Touch: Older Than 30 Days",
];

const DIAL_NUMBERS = [
  { number: "(216) 555-9100", state: "OH" },
  { number: "(717) 555-2244", state: "PA" },
  { number: "(216) 555-9101", state: "OH" },
];

const VM_TEMPLATES = [
  "Standard Intro (16s)",
  "Second Attempt (22s)",
  "Heir Cascade (24s)",
];

const EMAIL_TEMPLATES = [
  "None (Don't Send)",
  "Documentation Packet",
  "Callback Confirmation",
  "Light Touch Follow Up",
  "Verification Required",
];

export function SetupPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] px-7 py-7">
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/share/dialer-mockup-final"
              className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 hover:text-ink"
            >
              ← All Variants
            </Link>
            <Logomark />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">
            Pre Session Setup
          </span>
        </div>

        <header className="mb-7">
          <h1 className="m-0 text-[24px] font-semibold tracking-tight text-ink">
            Power Dialer Setup
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] text-gray-600">
            Configure the lead list, dial-from number, voicemail drop, wrap up cadence,
            and follow up templates before starting the session.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-5">
          <Card title="Lead List">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {FILTER_PILLS.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-[10.5px] font-medium text-gray-700"
                  >
                    {p}
                  </span>
                ))}
                <span className="inline-flex cursor-pointer items-center rounded-md px-2 py-1 text-[10.5px] font-semibold text-petrol-700 ring-1 ring-inset ring-petrol-300/40">
                  + Add Filter
                </span>
              </div>
              <div className="flex items-baseline justify-between rounded-lg bg-petrol-700 px-3.5 py-2.5 text-white">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/70">
                  Selected
                </span>
                <div>
                  <span className="text-[22px] font-semibold tabular-nums">47</span>
                  <span className="ml-1.5 text-[11px] text-white/65">Leads Selected</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Dial From Number">
            <div className="space-y-3">
              <Select
                value={`${DIAL_NUMBERS[0].number} · ${DIAL_NUMBERS[0].state}`}
                options={DIAL_NUMBERS.map((d) => `${d.number} · ${d.state}`)}
              />
              <div className="flex items-center gap-2">
                <Toggle on />
                <span className="text-[12px] text-ink">Auto Map by State</span>
              </div>
              <div className="text-[10.5px] text-gray-500">
                System picks the dial-from number that matches the lead state. Otherwise the default above is used.
              </div>
            </div>
          </Card>

          <Card title="DNC Behavior">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[12px] font-medium text-ink">
                    Skip DNC Flagged Numbers
                  </div>
                  <div className="mt-0.5 text-[10.5px] text-gray-500">
                    Default ON. Recommended for VA-run sessions.
                  </div>
                </div>
                <Toggle on />
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[12px] font-medium text-ink">
                    Call Anyway with Consent Recording
                  </div>
                  <div className="mt-0.5 text-[10.5px] text-gray-500">
                    Requires written justification per call. Off by default.
                  </div>
                </div>
                <Toggle on={false} />
              </div>
            </div>
          </Card>

          <Card title="Voicemail Drop Template">
            <div className="space-y-3">
              <Select value={VM_TEMPLATES[0]} options={VM_TEMPLATES} />
              <Link
                href="#"
                className="inline-block cursor-pointer text-[11.5px] font-semibold text-petrol-700 hover:underline"
              >
                Manage VM Templates →
              </Link>
            </div>
          </Card>

          <Card title="Wrap Up Time">
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-gray-500">
                  Time between disposition and next call
                </span>
                <span className="text-[22px] font-semibold tabular-nums text-ink">
                  3<span className="ml-0.5 text-[12px] text-gray-500">s</span>
                </span>
              </div>
              <div className="relative h-1.5 rounded-full bg-gray-200">
                <div className="absolute left-0 top-0 h-1.5 rounded-full bg-petrol-700" style={{ width: "30%" }} />
                <div className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-petrol-700 ring-2 ring-white" style={{ left: "calc(30% - 6px)" }} />
              </div>
              <div className="flex items-center justify-between text-[10.5px] text-gray-400">
                <span>0s (Immediate)</span>
                <span>10s</span>
              </div>
            </div>
          </Card>

          <Card title="Outcome Email Templates">
            <div className="space-y-2.5">
              {OUTCOME_CHIPS.map((c, i) => (
                <div key={c} className="flex items-center gap-3">
                  <div className="w-[140px] text-[11.5px] font-semibold text-ink">
                    {c}
                  </div>
                  <div className="flex-1">
                    <Select
                      value={EMAIL_TEMPLATES[Math.min(i + 1, EMAIL_TEMPLATES.length - 1)]}
                      options={EMAIL_TEMPLATES}
                    />
                  </div>
                </div>
              ))}
              <Link
                href="#"
                className="inline-block cursor-pointer text-[11.5px] font-semibold text-petrol-700 hover:underline"
              >
                Manage Email Templates →
              </Link>
            </div>
          </Card>

          <Card title="Outcome SMS Templates" className="col-span-2">
            <div className="space-y-2.5">
              {OUTCOME_CHIPS.map((c) => (
                <div key={c} className="flex items-center gap-3">
                  <div className="w-[140px] text-[11.5px] font-semibold text-gray-400">
                    {c}
                  </div>
                  <div className="flex-1">
                    <DisabledSelect value="Pending A2P Registration, Complete to Enable" />
                  </div>
                </div>
              ))}
              <div className="rounded-md bg-gray-100 px-3 py-2 text-[11px] text-gray-600">
                SMS follow up is deferred until A2P 10DLC registration completes. Email
                follow up is active now.
              </div>
            </div>
          </Card>
        </div>

        <div className={`mt-6 flex items-center justify-between rounded-[12px] bg-white p-5 ${CARD_SHADOW}`}>
          <div>
            <div className="text-[12px] font-semibold text-ink">Ready to Start</div>
            <div className="mt-0.5 text-[11px] text-gray-500">
              47 leads selected. 3 second wrap up cadence. 5 follow up templates wired.
            </div>
          </div>
          <Link
            href="/share/dialer-mockup-final/v44"
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-petrol-700 px-6 text-[13px] font-semibold text-white shadow-[0_4px_14px_-4px_rgba(13,75,58,0.45)] hover:bg-petrol-500"
          >
            Start Session
          </Link>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[12px] bg-white p-5 ${CARD_SHADOW} ${className}`}>
      <div className="text-[13px] font-semibold tracking-tight text-ink">
        {title}
      </div>
      <div className="mt-3.5">{children}</div>
    </div>
  );
}

function Select({ value, options }: { value: string; options: string[] }) {
  return (
    <div
      className="flex h-9 items-center rounded-lg px-3 text-[11.5px] text-ink"
      style={{ background: "#F5F5F5" }}
      title={options.join(" · ")}
    >
      <span className="flex-1 truncate">{value}</span>
      <span className="text-gray-400">▾</span>
    </div>
  );
}

function DisabledSelect({ value }: { value: string }) {
  return (
    <div
      className="flex h-9 items-center rounded-lg px-3 text-[11.5px] text-gray-400"
      style={{ background: "#F5F5F5", opacity: 0.7 }}
    >
      <span className="flex-1 truncate italic">{value}</span>
      <span className="text-gray-300">▾</span>
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div
      className={`flex h-5 w-9 items-center rounded-full p-0.5 ${
        on ? "bg-petrol-700" : "bg-gray-200"
      }`}
    >
      <div
        className={`h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] ${
          on ? "ml-auto" : ""
        }`}
      />
    </div>
  );
}
