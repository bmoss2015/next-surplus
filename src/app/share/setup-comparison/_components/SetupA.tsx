import {
  SetupCanvas,
  SetupHeader,
  LeadCountCallout,
  FilterChip,
  Slider,
  CountyChips,
  PreviewList,
  StartSessionCTA,
  ProgressDots,
  SectionIcon,
  CASE_TYPES,
  OUTCOME_TEMPLATES,
  CARD_SHADOW,
  Toggle,
  BTN_SHADOW,
} from "./SetupShared";

export function SetupA() {
  return (
    <SetupCanvas>
      <SetupHeader title="Power Dialer Setup" eyebrow="Option A · Wizard" />

      <div className="mx-auto flex max-w-[760px] flex-col px-7 pt-8">
        <Steps current={1} />

        <div className="mt-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
            Step 1 of 3
          </div>
          <h1 className="m-0 mt-1 text-[26px] font-semibold tracking-tight text-ink">
            Pick Leads
          </h1>
          <p className="mt-1 text-[12.5px] text-gray-500">
            Filter the lead list so you only call leads that match your criteria.
          </p>
        </div>

        <div className={`mt-6 rounded-[12px] bg-white p-6 ${CARD_SHADOW}`}>
          <div className="flex items-center justify-between">
            <LeadCountCallout />
            <div className="rounded-lg bg-petrol-100 px-3 py-2 text-[11px] font-semibold text-petrol-700">
              ~5.4 min Per Call Avg
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <SubHead icon="filters">Case Type</SubHead>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {CASE_TYPES.map((c) => (
                  <FilterChip key={c.label} label={c.label} count={c.count} active={c.active} />
                ))}
              </div>

              <SubHead icon="filters" className="mt-5">
                Surplus Range
              </SubHead>
              <div className="mt-3">
                <Slider start={20} end={85} />
                <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-gray-500">
                  <span>$25,000</span>
                  <span>$300,000</span>
                </div>
              </div>
            </div>
            <div>
              <SubHead icon="filters">County</SubHead>
              <div className="mt-2.5">
                <CountyChips />
              </div>

              <SubHead icon="filters" className="mt-5">
                Last Touch Date
              </SubHead>
              <div className="mt-2">
                <FakeSelect value="Older Than 30 Days" />
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <SubHead icon="leads">Selected Leads Preview</SubHead>
            <div className="mt-2.5 max-h-[140px] overflow-y-auto rounded-lg bg-[#F8F8F8] p-2">
              <PreviewList count={4} />
              <div className="mt-1 px-3 py-1 text-[10.5px] text-gray-400">
                Scroll for 43 more...
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-[11.5px] text-gray-400">
            Back disabled on Step 1
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-500">
              47 of 100 Leads Selected
            </span>
            <ContinueButton label="Continue to Dialer Behavior" />
          </div>
        </div>
      </div>
    </SetupCanvas>
  );
}

export function SetupAStep2() {
  return (
    <SetupCanvas>
      <SetupHeader title="Power Dialer Setup" eyebrow="Option A · Wizard" />
      <div className="mx-auto flex max-w-[760px] flex-col px-7 pt-8">
        <Steps current={2} />
        <div className="mt-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
            Step 2 of 3
          </div>
          <h1 className="m-0 mt-1 text-[26px] font-semibold tracking-tight text-ink">
            Dialer Behavior
          </h1>
          <p className="mt-1 text-[12.5px] text-gray-500">
            Tell the dialer how to call out and what to do between calls.
          </p>
        </div>

        <div className={`mt-6 grid grid-cols-2 gap-4 rounded-[12px] bg-white p-6 ${CARD_SHADOW}`}>
          <div>
            <SubHead icon="phone">Dial From Number</SubHead>
            <div className="mt-2">
              <FakeSelect value="(216) 555-9100 · OH" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Toggle on />
              <span className="text-[12px] text-ink">Auto Map by State</span>
            </div>
          </div>
          <div>
            <SubHead icon="shield">DNC Behavior</SubHead>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-ink">Skip DNC Flagged Numbers</span>
                <Toggle on />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-500">Call Anyway With Consent Recording</span>
                <Toggle on={false} />
              </div>
            </div>
          </div>
          <div>
            <SubHead icon="voicemail">Voicemail Drop Template</SubHead>
            <div className="mt-2">
              <FakeSelect value="Standard Intro (16s)" />
            </div>
          </div>
          <div>
            <SubHead icon="clock">Wrap Up Time</SubHead>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[11px] text-gray-500">Between calls</span>
              <span className="text-[22px] font-semibold tabular-nums text-ink">3<span className="ml-0.5 text-[12px] text-gray-500">s</span></span>
            </div>
            <div className="mt-2">
              <Slider start={0} end={30} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <BackButton />
          <ContinueButton label="Continue to Templates" />
        </div>
      </div>
    </SetupCanvas>
  );
}

function Steps({ current }: { current: number }) {
  const steps = ["Pick Leads", "Dialer Behavior", "Follow Up Templates"];
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                i + 1 < current
                  ? "bg-petrol-500 text-white"
                  : i + 1 === current
                  ? "bg-petrol-700 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {i + 1 < current ? <SectionIcon kind="check" className="h-3 w-3" /> : i + 1}
            </span>
            <span
              className={`text-[12px] font-semibold ${
                i + 1 === current ? "text-ink" : "text-gray-400"
              }`}
            >
              {s}
            </span>
            {i < steps.length - 1 && <span className="text-gray-300">›</span>}
          </div>
        ))}
      </div>
      <ProgressDots total={3} current={current} />
    </div>
  );
}

function SubHead({
  icon,
  children,
  className = "",
}: {
  icon: "filters" | "leads" | "phone" | "shield" | "clock" | "voicemail" | "mail";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 ${className}`}>
      <SectionIcon kind={icon} className="h-3.5 w-3.5 text-petrol-700" />
      {children}
    </div>
  );
}

function FakeSelect({ value }: { value: string }) {
  return (
    <div
      className="flex h-9 items-center rounded-lg px-3 text-[11.5px] text-ink"
      style={{ background: "#F5F5F5" }}
    >
      <span className="flex-1 truncate">{value}</span>
      <span className="text-gray-400">▾</span>
    </div>
  );
}

function ContinueButton({ label }: { label: string }) {
  return (
    <div
      className={`inline-flex h-11 cursor-pointer items-center justify-center rounded-lg px-6 text-[13px] font-semibold tracking-tight text-white bg-petrol-700 ${BTN_SHADOW} hover:bg-petrol-500`}
    >
      {label}
      <span className="ml-2 text-white/80">→</span>
    </div>
  );
}

function BackButton() {
  return (
    <div
      className={`inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-white px-5 text-[12.5px] font-semibold text-petrol-700 ${BTN_SHADOW}`}
    >
      ← Back
    </div>
  );
}

export function SetupAStep3() {
  return (
    <SetupCanvas>
      <SetupHeader title="Power Dialer Setup" eyebrow="Option A · Wizard" />
      <div className="mx-auto flex max-w-[760px] flex-col px-7 pt-8">
        <Steps current={3} />
        <div className="mt-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
            Step 3 of 3
          </div>
          <h1 className="m-0 mt-1 text-[26px] font-semibold tracking-tight text-ink">
            Follow Up Templates
          </h1>
          <p className="mt-1 text-[12.5px] text-gray-500">
            Choose which email goes out automatically when you log each outcome.
          </p>
        </div>

        <div className={`mt-6 rounded-[12px] bg-white p-6 ${CARD_SHADOW}`}>
          <div className="space-y-3">
            {OUTCOME_TEMPLATES.map((row) => (
              <div key={row.outcome} className="flex items-center gap-3">
                <div className="w-[160px] text-[12px] font-semibold text-ink">
                  {row.outcome}
                </div>
                <div className="flex-1">
                  <FakeSelect value={row.template} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg bg-[#F5F5F5] px-3.5 py-2.5 text-[11px] text-gray-600">
            SMS templates pending A2P 10DLC registration. Estimated 2 to 3 weeks before SMS becomes available per outcome.
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <BackButton />
          <StartSessionCTA subLabel="47 Leads" />
        </div>
      </div>
    </SetupCanvas>
  );
}
