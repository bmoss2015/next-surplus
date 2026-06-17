import Link from "next/link";
import { Logomark, CARD_SHADOW, BTN_SHADOW, OUTCOME_CHIPS } from "./Shared";
import { QUEUE_DEFAULT, QUEUE_PEMBERTON } from "../_data";

const CASE_TYPES = [
  { label: "Estate", count: 28, checked: true },
  { label: "Foreclosure", count: 17, checked: true },
  { label: "Tax Sale Surplus", count: 2, checked: false },
  { label: "Other", count: 0, checked: false },
];

const COUNTIES = ["Cuyahoga (28)", "Lancaster (12)", "Franklin (5)", "Hamilton (2)"];

const DIAL_NUMBERS = [
  { number: "(216) 555-9100", state: "OH" },
  { number: "(717) 555-2244", state: "PA" },
  { number: "(216) 555-9101", state: "OH" },
];

const VM_TEMPLATES = [
  "None",
  "Standard Intro (16s)",
  "Second Attempt (22s)",
  "Heir Cascade (24s)",
];

const EMAIL_TEMPLATES = [
  "None",
  "Documentation Packet",
  "Callback Confirmation",
  "Light Touch Follow Up",
  "Verification Required",
];

const PREVIEW_LEADS = [
  ...QUEUE_DEFAULT.slice(0, 3),
  ...QUEUE_PEMBERTON.slice(0, 2),
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
          <Card title="Lead List" className="col-span-2">
            <div className="grid grid-cols-[1fr_1fr_1.1fr] gap-5">
              <div>
                <SubHead>Case Type</SubHead>
                <div className="mt-2 space-y-1.5">
                  {CASE_TYPES.map((c) => (
                    <Checkbox key={c.label} label={c.label} count={c.count} checked={c.checked} />
                  ))}
                </div>
                <SubHead className="mt-4">Surplus Range</SubHead>
                <div className="mt-3">
                  <DualSlider />
                  <div className="mt-1 flex items-center justify-between text-[10.5px] text-gray-500">
                    <span>$25,000</span>
                    <span>$300,000</span>
                  </div>
                </div>
              </div>
              <div>
                <SubHead>County</SubHead>
                <div className="mt-2">
                  <Select value="4 Counties Selected" options={COUNTIES} />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {COUNTIES.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[10.5px] font-medium text-gray-700">
                      {c}
                      <span className="text-gray-400">×</span>
                    </span>
                  ))}
                </div>
                <SubHead className="mt-4">Last Touch Date</SubHead>
                <div className="mt-2">
                  <Select value="Older Than 30 Days" options={["No Filter", "Older Than 7 Days", "Older Than 14 Days", "Older Than 30 Days", "Older Than 60 Days"]} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <SubHead>Selected Leads</SubHead>
                  <span className="text-[18px] font-semibold tabular-nums text-petrol-700">
                    47
                  </span>
                </div>
                <div className="mt-2 max-h-[180px] overflow-y-auto rounded-lg bg-[#F5F5F5] p-2">
                  <div className="space-y-1">
                    {PREVIEW_LEADS.map((l, i) => (
                      <div key={l.id} className="flex items-baseline gap-2 rounded-md bg-white px-2.5 py-1.5">
                        <span className="w-4 shrink-0 text-right text-[9.5px] font-semibold tabular-nums text-gray-400">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[11px] font-semibold text-ink">
                            {l.name}
                          </div>
                          <div className="truncate text-[10px] text-gray-500">
                            {l.surplus} · {l.city}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="px-2.5 py-1 text-[10px] text-gray-400">
                      Scroll for 42 more...
                    </div>
                  </div>
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
              <div className="text-[11px] leading-relaxed text-gray-500">
                Auto Map matches the recipient state to your matching local number for better answer rates.
              </div>
            </div>
          </Card>

          <Card title="DNC Behavior">
            <div className="space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[12px] font-medium text-ink">
                    Skip DNC Flagged Numbers
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-500">
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
                  <div className="mt-0.5 text-[11px] text-gray-500">
                    Requires written justification per call.
                  </div>
                </div>
                <Toggle on={false} />
              </div>
            </div>
          </Card>

          <Card title="Voicemail Drop Template">
            <div className="space-y-3">
              <Select value={VM_TEMPLATES[1]} options={VM_TEMPLATES} />
              <Link
                href="#"
                className="inline-block cursor-pointer text-[11.5px] font-semibold text-petrol-700 hover:underline"
              >
                Manage Templates →
              </Link>
            </div>
          </Card>

          <Card title="Wrap Up Time">
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-gray-500">
                  Time between call end and next dial
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
              <div className="text-[11px] leading-relaxed text-gray-500">
                Countdown is always skippable with the Dial Now button.
              </div>
            </div>
          </Card>

          <Card title="Outcome Email Templates" className="col-span-2">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {OUTCOME_CHIPS.map((c, i) => (
                <div key={c} className="flex items-center gap-3">
                  <div className="w-[150px] text-[11.5px] font-semibold text-ink">
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
            </div>
            <div className="mt-4">
              <Link
                href="#"
                className="inline-block cursor-pointer text-[11.5px] font-semibold text-petrol-700 hover:underline"
              >
                Manage Email Templates →
              </Link>
            </div>
          </Card>

          <Card title="SMS (Pending)" className="col-span-2">
            <div className="flex items-start gap-3 rounded-lg bg-[#F5F5F5] px-4 py-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[11px] font-semibold text-gray-600">
                i
              </div>
              <div className="flex-1 text-[11.5px] leading-relaxed text-gray-700">
                SMS follow up is pending A2P 10DLC registration. Estimated 2 to 3 weeks
                before SMS template selection becomes available per outcome. Email
                follow up is active and can be configured above.
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
            className={`inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-petrol-700 px-6 text-[13px] font-semibold text-white ${BTN_SHADOW} hover:bg-petrol-500`}
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

function SubHead({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 ${className}`}
    >
      {children}
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

function Checkbox({
  label,
  count,
  checked,
}: {
  label: string;
  count: number;
  checked: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-[11.5px]">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded ${
          checked ? "bg-petrol-700 text-white" : "bg-white ring-1 ring-inset ring-gray-300"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M2.5 6.5L5 9l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="flex-1 text-ink">{label}</span>
      <span className="text-[10.5px] text-gray-400">{count}</span>
    </div>
  );
}

function DualSlider() {
  return (
    <div className="relative h-1.5 rounded-full bg-gray-200">
      <div className="absolute left-[20%] right-[15%] top-0 h-1.5 rounded-full bg-petrol-700" />
      <div className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-petrol-700 ring-2 ring-white" style={{ left: "calc(20% - 6px)" }} />
      <div className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-petrol-700 ring-2 ring-white" style={{ right: "calc(15% - 6px)" }} />
    </div>
  );
}
