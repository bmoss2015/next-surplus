"use client";

import { useState } from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconUpload,
} from "@tabler/icons-react";
import Link from "next/link";

type Step = 1 | 2 | 3;

const STEPS = [
  { n: 1, label: "Pick Leads" },
  { n: 2, label: "Call Settings" },
  { n: 3, label: "Auto Follow Up" },
] as const;

export function DialerSetupWizard() {
  const [step, setStep] = useState<Step>(1);

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col px-7 py-8">
      <div className="mb-2">
        <h1 className="text-[24px] font-semibold tracking-tight text-ink">
          Start a Power Dialer Session
        </h1>
        <div className="mt-1 text-[13.5px] text-gray-500">
          Pick a list, dial settings, and what to send after each call.
        </div>
      </div>

      <ProgressDots step={step} />

      <div className="mt-6 grid grid-cols-[1fr_280px] gap-6">
        <div
          className="rounded-2xl bg-white p-7"
          style={{
            boxShadow:
              "0 1px 2px rgba(15,23,41,0.04), 0 8px 24px -8px rgba(15,23,41,0.10)",
          }}
        >
          {step === 1 && <StepPickLeads />}
          {step === 2 && <StepCallSettings />}
          {step === 3 && <StepAutoFollowUp />}

          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as Step)}
                  className="flex h-10 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  <IconArrowLeft size={14} stroke={2} />
                  Back
                </button>
              )}
            </div>
            <div>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s + 1) as Step)}
                  className="flex h-10 items-center gap-1.5 rounded-lg bg-petrol-700 px-4 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,75,58,0.20),0_6px_16px_-4px_rgba(13,75,58,0.30)] transition hover:bg-petrol-500"
                >
                  {step === 1 ? "Continue to Call Settings" : "Continue to Auto Follow Up"}
                  <IconArrowRight size={14} stroke={2.25} />
                </button>
              ) : (
                <Link
                  href="/dialer"
                  className="flex h-10 items-center gap-1.5 rounded-lg bg-petrol-700 px-4 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,75,58,0.20),0_6px_16px_-4px_rgba(13,75,58,0.30)] transition hover:bg-petrol-500"
                >
                  Start Session · 47 Leads
                  <IconArrowRight size={14} stroke={2.25} />
                </Link>
              )}
            </div>
          </div>
        </div>

        <SummaryRail step={step} />
      </div>
    </div>
  );
}

function ProgressDots({ step }: { step: Step }) {
  return (
    <div className="mt-6 flex items-center gap-2">
      {STEPS.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <div key={s.n} className="flex items-center gap-2">
            <div
              className={[
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition",
                done
                  ? "bg-petrol-500 text-white"
                  : active
                    ? "bg-ink text-white"
                    : "bg-gray-200 text-gray-500",
              ].join(" ")}
            >
              {done ? <IconCheck size={12} stroke={3} /> : s.n}
            </div>
            <div
              className={[
                "text-[12.5px] font-medium",
                active ? "text-ink" : done ? "text-gray-700" : "text-gray-400",
              ].join(" ")}
            >
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className="mx-2 h-px w-10 bg-gray-200" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepPickLeads() {
  const [source, setSource] = useState<"crm" | "upload" | "combine">("crm");
  const [skipLitigated, setSkipLitigated] = useState(true);
  const [skipRecent, setSkipRecent] = useState(true);
  const [skipDnc, setSkipDnc] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-[16px] font-semibold tracking-tight text-ink">
          Lead Source
        </h2>
        <div className="mt-3 space-y-2">
          <RadioRow
            checked={source === "crm"}
            onClick={() => setSource("crm")}
            label="Pick from CRM List"
            trailing={
              <select
                onClick={(e) => e.stopPropagation()}
                disabled={source !== "crm"}
                className="h-9 rounded-md border border-gray-200 bg-white px-3 text-[12.5px] text-ink outline-none transition focus:border-petrol-500 disabled:opacity-40"
              >
                <option>All Researched Leads (124)</option>
                <option>Awaiting Signature (12)</option>
                <option>First Contact Due (47)</option>
                <option>Callback Today (8)</option>
              </select>
            }
          />
          <RadioRow
            checked={source === "upload"}
            onClick={() => setSource("upload")}
            label="Upload a New List"
            trailing={
              <button
                type="button"
                disabled={source !== "upload"}
                className="flex h-9 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-[12.5px] font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
              >
                <IconUpload size={13} stroke={2} />
                Choose CSV
              </button>
            }
          />
          <RadioRow
            checked={source === "combine"}
            onClick={() => setSource("combine")}
            label="Combine Sources"
            trailing={
              <button
                type="button"
                disabled={source !== "combine"}
                className="h-9 rounded-md border border-gray-200 bg-white px-3 text-[12.5px] font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
              >
                Include / Exclude Rules
              </button>
            }
          />
        </div>
      </div>

      <div>
        <h2 className="text-[16px] font-semibold tracking-tight text-ink">
          Quick Filters
        </h2>
        <div className="mt-3 space-y-2">
          <CheckRow
            checked={skipLitigated}
            onChange={setSkipLitigated}
            label="Skip Litigated Leads"
            hint="Anything currently in active litigation."
          />
          <CheckRow
            checked={skipRecent}
            onChange={setSkipRecent}
            label="Skip Recently Contacted (Less Than 30 Days)"
            hint="Avoid burning warm leads with a second touch too soon."
          />
          <CheckRow
            checked={skipDnc}
            onChange={setSkipDnc}
            label="Skip DNC Flagged"
            hint="Required to stay compliant. We do not recommend unchecking."
          />
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="flex items-center gap-1 text-[13px] font-semibold text-petrol-500 hover:text-petrol-700"
        >
          {advancedOpen ? (
            <IconChevronUp size={14} stroke={2.25} />
          ) : (
            <IconChevronDown size={14} stroke={2.25} />
          )}
          Show Advanced
        </button>

        {advancedOpen && (
          <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-gray-100 bg-gray-50 p-5">
            <AdvancedField label="State">
              <SelectInput options={["All States", "Texas", "North Carolina", "Arizona", "Georgia", "Ohio"]} />
            </AdvancedField>
            <AdvancedField label="County">
              <SelectInput options={["All Counties", "Travis", "Mecklenburg", "Maricopa", "Fulton", "Cuyahoga"]} />
            </AdvancedField>
            <AdvancedField label="Case Type">
              <SelectInput options={["All Types", "Tax Sale", "Mortgage Foreclosure", "Other"]} />
            </AdvancedField>
            <AdvancedField label="CRM Stage">
              <SelectInput options={["All Stages", "Researched", "First Contact", "Contact Made", "Awaiting Signature", "Signed"]} />
            </AdvancedField>
            <AdvancedField label="Owner Status">
              <SelectInput options={["Any", "Living", "Deceased"]} />
            </AdvancedField>
            <AdvancedField label="Surplus Range">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="$0"
                  className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-[12.5px] outline-none focus:border-petrol-500"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="text"
                  placeholder="No max"
                  className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-[12.5px] outline-none focus:border-petrol-500"
                />
              </div>
            </AdvancedField>
            <AdvancedField label="Last Touch Date">
              <SelectInput options={["Any Time", "More Than 30 Days Ago", "More Than 60 Days Ago", "More Than 90 Days Ago"]} />
            </AdvancedField>
            <AdvancedField label="Call Attempts">
              <SelectInput options={["Any", "0 Attempts", "1 to 2 Attempts", "3 to 5 Attempts", "6 or More"]} />
            </AdvancedField>
          </div>
        )}
      </div>
    </div>
  );
}

function StepCallSettings() {
  const [dialFrom, setDialFrom] = useState<"auto" | "specific">("auto");
  const [skipDnc, setSkipDnc] = useState(true);
  const [skipLitigated, setSkipLitigated] = useState(true);
  const [wrapUp, setWrapUp] = useState(30);
  const [vmDrop, setVmDrop] = useState<"off" | "on">("off");

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-[16px] font-semibold tracking-tight text-ink">
          Dial From Number
        </h2>
        <div className="mt-3 space-y-2">
          <RadioRow
            checked={dialFrom === "auto"}
            onClick={() => setDialFrom("auto")}
            label="Auto Map by State"
            hint="Picks a caller ID local to the lead's state for higher pickup rates."
          />
          <RadioRow
            checked={dialFrom === "specific"}
            onClick={() => setDialFrom("specific")}
            label="Use a Specific Number"
            trailing={
              <select
                disabled={dialFrom !== "specific"}
                className="h-9 rounded-md border border-gray-200 bg-white px-3 text-[12.5px] outline-none disabled:opacity-40"
              >
                <option>(512) 555 0188 · Austin TX</option>
                <option>(704) 555 0212 · Charlotte NC</option>
                <option>(602) 555 0177 · Phoenix AZ</option>
              </select>
            }
          />
        </div>
      </div>

      <div>
        <h2 className="text-[16px] font-semibold tracking-tight text-ink">
          Compliance
        </h2>
        <div className="mt-3 space-y-2">
          <CheckRow
            checked={skipDnc}
            onChange={setSkipDnc}
            label="Skip DNC"
            hint="Required for compliance."
          />
          <CheckRow
            checked={skipLitigated}
            onChange={setSkipLitigated}
            label="Skip Litigated"
            hint="Skip any lead currently in active litigation."
          />
        </div>
      </div>

      <div>
        <h2 className="text-[16px] font-semibold tracking-tight text-ink">
          Wrap Up Time
        </h2>
        <div className="mt-3 flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={60}
            step={5}
            value={wrapUp}
            onChange={(e) => setWrapUp(Number(e.target.value))}
            className="h-2 flex-1 cursor-pointer accent-petrol-500"
          />
          <div className="flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1.5 text-[13px] font-semibold tabular-nums text-ink">
            <IconClock size={13} stroke={2} />
            {wrapUp}s
          </div>
        </div>
        <div className="mt-2 text-[12px] text-gray-500">
          Wrap up only runs after a connected call. The countdown pauses automatically while you are typing a note. Voicemail, No Answer, and Wrong Number skip wrap up entirely.
        </div>
      </div>

      <div>
        <h2 className="text-[16px] font-semibold tracking-tight text-ink">
          Voicemail Drop
        </h2>
        <div className="mt-3 space-y-2">
          <RadioRow
            checked={vmDrop === "off"}
            onClick={() => setVmDrop("off")}
            label="Don't Drop a Voicemail"
            hint="Hang up if the call rolls to voicemail."
          />
          <RadioRow
            checked={vmDrop === "on"}
            onClick={() => setVmDrop("on")}
            label="Drop a Voicemail"
            trailing={
              <select
                disabled={vmDrop !== "on"}
                className="h-9 rounded-md border border-gray-200 bg-white px-3 text-[12.5px] outline-none disabled:opacity-40"
              >
                <option>Default Outreach Voicemail</option>
                <option>Heir Outreach Voicemail</option>
                <option>Living Owner Voicemail</option>
              </select>
            }
          />
        </div>
      </div>
    </div>
  );
}

const OUTCOMES = [
  {
    name: "Connected",
    color: "#13644e",
    desc: "Live conversation. Send the prospect a follow up recap with next steps.",
    defaultTemplate: "Connected Call Recap",
  },
  {
    name: "Voicemail",
    color: "#9ca3af",
    desc: "Reached voicemail. Send a short follow up so they can read who called.",
    defaultTemplate: "Voicemail Drop Recap",
  },
  {
    name: "No Answer",
    color: "#9ca3af",
    desc: "Did not pick up. Optional follow up so the next attempt has context.",
    defaultTemplate: "Do Not Send",
  },
  {
    name: "Wrong Number",
    color: "#9ca3af",
    desc: "Number does not belong to the contact. Flag and skip follow up.",
    defaultTemplate: "Do Not Send",
  },
];

function StepAutoFollowUp() {
  return (
    <div>
      <h2 className="text-[16px] font-semibold tracking-tight text-ink">
        Auto Follow Up
      </h2>
      <div className="mt-1 text-[13px] text-gray-500">
        For each call outcome, pick the email template that auto sends to the
        contact.
      </div>

      <div className="mt-5 space-y-3">
        {OUTCOMES.map((o) => (
          <div
            key={o.name}
            className="flex items-stretch gap-4 rounded-lg border border-gray-100 bg-white px-4 py-3"
          >
            <div
              aria-hidden
              className="w-1 shrink-0 rounded-sm"
              style={{ background: o.color }}
            />
            <div className="flex flex-1 items-center gap-4">
              <div className="w-[150px] shrink-0 text-[13.5px] font-semibold text-ink">
                {o.name}
              </div>
              <select className="h-9 w-[240px] rounded-md border border-gray-200 bg-white px-3 text-[12.5px] outline-none focus:border-petrol-500">
                <option>{o.defaultTemplate}</option>
                <option>Do Not Send</option>
                <option>Custom Template</option>
              </select>
              <button
                type="button"
                className="text-[12px] font-semibold text-petrol-500 hover:text-petrol-700"
              >
                Preview
              </button>
              <div className="ml-auto max-w-[260px] text-right text-[11.5px] text-gray-500">
                {o.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryRail({ step }: { step: Step }) {
  return (
    <div
      className="self-start rounded-2xl bg-white p-5"
      style={{
        boxShadow:
          "0 1px 2px rgba(15,23,41,0.04), 0 8px 24px -8px rgba(15,23,41,0.10)",
      }}
    >
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-gray-500">
        Session Preview
      </div>
      <div className="mt-2 text-[26px] font-semibold tabular-nums text-ink">
        47
      </div>
      <div className="text-[12.5px] text-gray-500">Selected Leads</div>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between text-[12.5px]">
          <span className="text-gray-500">Estimated Time</span>
          <span className="font-semibold text-ink tabular-nums">3h 45m</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[12.5px]">
          <span className="text-gray-500">Avg Talk Per Call</span>
          <span className="font-semibold text-ink tabular-nums">4m 10s</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[12.5px]">
          <span className="text-gray-500">Expected Connects</span>
          <span className="font-semibold text-ink tabular-nums">14</span>
        </div>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <div className="text-[11.5px] font-semibold uppercase tracking-[0.10em] text-gray-500">
          Step {step} of 3
        </div>
        <div className="mt-1 text-[12.5px] text-gray-700">
          {step === 1
            ? "Pick the lead list and quick filters."
            : step === 2
              ? "Choose how the dialer behaves between calls."
              : "Pick what auto sends after each outcome."}
        </div>
      </div>
    </div>
  );
}

function RadioRow({
  checked,
  onClick,
  label,
  hint,
  trailing,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={[
        "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition",
        checked
          ? "border-petrol-500 bg-[#F4F8F7]"
          : "border-gray-200 bg-white hover:border-gray-300",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition",
          checked ? "border-petrol-500" : "border-gray-300",
        ].join(" ")}
      >
        {checked && <div className="h-2 w-2 rounded-full bg-petrol-500" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-medium text-ink">{label}</div>
        {hint && (
          <div className="mt-0.5 text-[12px] text-gray-500">{hint}</div>
        )}
      </div>
      {trailing && <div onClick={(e) => e.stopPropagation()}>{trailing}</div>}
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (b: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 transition hover:border-gray-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 cursor-pointer accent-petrol-500"
      />
      <div>
        <div className="text-[13.5px] font-medium text-ink">{label}</div>
        {hint && <div className="mt-0.5 text-[12px] text-gray-500">{hint}</div>}
      </div>
    </label>
  );
}

function AdvancedField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-gray-500">
        {label}
      </div>
      {children}
    </div>
  );
}

function SelectInput({ options }: { options: string[] }) {
  return (
    <select className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-[12.5px] text-ink outline-none focus:border-petrol-500">
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}
