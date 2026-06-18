import {
  SetupCanvas,
  SetupHeader,
  LeadCountCallout,
  FilterChip,
  Slider,
  CountyChips,
  PreviewList,
  StartSessionCTA,
  SectionIcon,
  CASE_TYPES,
  OUTCOME_TEMPLATES,
  CARD_SHADOW,
} from "./SetupShared";

export function SetupC() {
  return (
    <SetupCanvas>
      <SetupHeader title="Power Dialer Setup" eyebrow="Option C · Single Page Hierarchy" />
      <div className="flex flex-col gap-5 px-7 pt-6 pb-6">
        <section className={`rounded-[12px] bg-white p-6 ${CARD_SHADOW}`}>
          <div className="flex items-start justify-between">
            <LeadCountCallout size="lg" />
            <div className="rounded-lg bg-petrol-100 px-3 py-1.5 text-[11px] font-semibold text-petrol-700">
              Est. 4h 12m
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_1fr_1fr_1.1fr] gap-5">
            <div>
              <SubFieldLabel icon="filters">Case Type</SubFieldLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {CASE_TYPES.map((c) => (
                  <FilterChip key={c.label} label={c.label} count={c.count} active={c.active} size="sm" />
                ))}
              </div>
            </div>
            <div>
              <SubFieldLabel icon="filters">County</SubFieldLabel>
              <div className="mt-2">
                <CountyChips />
              </div>
            </div>
            <div>
              <SubFieldLabel icon="filters">Surplus Range</SubFieldLabel>
              <div className="mt-4">
                <Slider start={20} end={85} />
                <div className="mt-1 flex justify-between text-[10.5px] text-gray-500">
                  <span>$25K</span>
                  <span>$300K</span>
                </div>
              </div>
            </div>
            <div>
              <SubFieldLabel icon="filters">Last Touch Date</SubFieldLabel>
              <div className="mt-2">
                <div className="flex h-9 items-center rounded-lg bg-[#F5F5F5] px-3 text-[11.5px] text-ink">
                  <span className="flex-1">Older Than 30 Days</span>
                  <span className="text-gray-400">▾</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <SubFieldLabel icon="leads">Selected Leads Preview</SubFieldLabel>
              <span className="text-[10.5px] text-gray-500">Showing 5 of 47</span>
            </div>
            <div className="mt-2.5 max-h-[180px] overflow-y-auto rounded-lg bg-[#F8F8F8] p-2">
              <PreviewList count={5} />
              <div className="mt-1 px-3 py-1 text-[10.5px] text-gray-400">
                Scroll for 42 more...
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-3">
          <MiniSettingCard icon="phone" label="Dial From" value="(216) 555-9100" sub="Auto Map by State" />
          <MiniSettingCard icon="shield" label="DNC" value="Skip Flagged" sub="Default ON" />
          <MiniSettingCard icon="clock" label="Wrap Up Time" value="3 Seconds" sub="Skippable" />
          <MiniSettingCard icon="voicemail" label="Voicemail Drop" value="Standard Intro" sub="16s clip" />
        </section>

        <section className={`flex items-center justify-between rounded-[12px] bg-white p-5 ${CARD_SHADOW}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-petrol-100 text-petrol-700">
              <SectionIcon kind="mail" className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-ink">
                Outcome Email Templates
              </div>
              <div className="mt-0.5 text-[11px] text-gray-500">
                5 templates configured · Expand to edit per outcome
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {OUTCOME_TEMPLATES.map((t) => (
              <span
                key={t.outcome}
                className="rounded-md bg-petrol-100 px-2 py-1 text-[10px] font-semibold text-petrol-700"
                title={`${t.outcome} → ${t.template}`}
              >
                {t.outcome.split(" ")[0]}
              </span>
            ))}
            <span className="ml-1 cursor-pointer text-[11.5px] font-semibold text-petrol-700">
              Expand to Edit
            </span>
          </div>
        </section>

        <section className={`flex items-center justify-between rounded-[12px] bg-white p-5 ${CARD_SHADOW}`}>
          <div>
            <div className="text-[12px] font-semibold text-ink">Ready to Start</div>
            <div className="mt-0.5 text-[11px] text-gray-500">
              47 leads · 3 second wrap up · 5 follow up templates
            </div>
          </div>
          <StartSessionCTA subLabel="47 Leads" />
        </section>
      </div>
    </SetupCanvas>
  );
}

function MiniSettingCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: "phone" | "shield" | "clock" | "voicemail";
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className={`rounded-[12px] bg-white p-4 ${CARD_SHADOW}`}>
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-petrol-100 text-petrol-700">
          <SectionIcon kind={icon} className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            {label}
          </div>
          <div className="mt-0.5 truncate text-[12.5px] font-semibold text-ink">
            {value}
          </div>
          <div className="mt-0.5 truncate text-[10.5px] text-gray-500">{sub}</div>
        </div>
      </div>
      <div className="mt-3 text-right">
        <span className="cursor-pointer text-[11px] font-semibold text-petrol-700 hover:underline">
          Edit
        </span>
      </div>
    </div>
  );
}

function SubFieldLabel({
  icon,
  children,
}: {
  icon: "filters" | "leads";
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
      <SectionIcon kind={icon} className="h-3.5 w-3.5 text-petrol-700" />
      {children}
    </div>
  );
}
