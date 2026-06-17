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
  CARD_SHADOW,
} from "./SetupShared";

export function SetupB() {
  return (
    <SetupCanvas>
      <SetupHeader title="Power Dialer Setup" eyebrow="Option B · Two Pane" />
      <div className="flex h-[calc(100%-57px)] gap-5 px-7 pt-6 pb-6">
        <div className="flex w-[70%] flex-col">
          <div className="flex items-end justify-between">
            <LeadCountCallout size="xl" />
            <div className="text-[11px] text-gray-500">
              Estimate based on 5.4 min per call · 30 day avg
            </div>
          </div>

          <div className={`mt-5 flex flex-1 flex-col rounded-[12px] bg-white p-6 ${CARD_SHADOW}`}>
            <SubHead icon="filters">Filters</SubHead>
            <div className="mt-3 grid grid-cols-2 gap-5">
              <div>
                <SubFieldLabel>Case Type</SubFieldLabel>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {CASE_TYPES.map((c) => (
                    <FilterChip key={c.label} label={c.label} count={c.count} active={c.active} size="sm" />
                  ))}
                </div>
              </div>
              <div>
                <SubFieldLabel>County</SubFieldLabel>
                <div className="mt-1.5">
                  <CountyChips />
                </div>
              </div>
              <div>
                <SubFieldLabel>Surplus Range</SubFieldLabel>
                <div className="mt-3">
                  <Slider start={20} end={85} />
                  <div className="mt-1 flex justify-between text-[10.5px] text-gray-500">
                    <span>$25K</span>
                    <span>$300K</span>
                  </div>
                </div>
              </div>
              <div>
                <SubFieldLabel>Last Touch Date</SubFieldLabel>
                <div className="mt-1.5">
                  <div className="flex h-9 items-center rounded-lg bg-[#F5F5F5] px-3 text-[11.5px] text-ink">
                    <span className="flex-1">Older Than 30 Days</span>
                    <span className="text-gray-400">▾</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between">
                <SubHead icon="leads">Selected Leads</SubHead>
                <span className="text-[10.5px] text-gray-500">Showing 6 of 47</span>
              </div>
              <div className="mt-3 max-h-[260px] overflow-y-auto rounded-lg bg-[#F8F8F8] p-2">
                <PreviewList count={6} />
                <div className="mt-1 px-3 py-1 text-[10.5px] text-gray-400">
                  Scroll for 41 more...
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-[30%] flex-col">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
            Settings · Smart Defaults
          </div>
          <div className="flex flex-1 flex-col gap-2.5">
            <SettingRow icon="phone" label="Dial From" value="(216) 555-9100" sub="Auto Map by State" />
            <SettingRow icon="shield" label="DNC" value="Skip Flagged Numbers" />
            <SettingRow icon="clock" label="Wrap Up Time" value="3 Seconds" />
            <SettingRow icon="voicemail" label="Voicemail Drop" value="Standard Intro" />
            <SettingRow icon="mail" label="Email Templates" value="5 Configured" />
            <SettingRow icon="sms" label="SMS" value="Pending A2P" disabled />
          </div>

          <div className="mt-5">
            <StartSessionCTA subLabel="47 Leads" fullWidth />
            <div className="mt-2 text-center text-[10.5px] text-gray-500">
              Est. 4h 12m at current pace
            </div>
          </div>
        </div>
      </div>
    </SetupCanvas>
  );
}

function SettingRow({
  icon,
  label,
  value,
  sub,
  disabled,
}: {
  icon: "phone" | "shield" | "clock" | "voicemail" | "mail" | "sms";
  label: string;
  value: string;
  sub?: string;
  disabled?: boolean;
}) {
  return (
    <div className={`rounded-[12px] bg-white p-4 ${CARD_SHADOW} ${disabled ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-petrol-100 text-petrol-700">
            <SectionIcon kind={icon} className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              {label}
            </div>
            <div className="mt-0.5 text-[12.5px] font-semibold text-ink">
              {value}
            </div>
            {sub && (
              <div className="mt-0.5 text-[10.5px] text-gray-500">{sub}</div>
            )}
          </div>
        </div>
        {!disabled && (
          <span className="cursor-pointer text-[11px] font-semibold text-petrol-700 hover:underline">
            Edit
          </span>
        )}
        {disabled && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Disabled
          </span>
        )}
      </div>
    </div>
  );
}

function SubHead({
  icon,
  children,
  className = "",
}: {
  icon: "filters" | "leads";
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

function SubFieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
      {children}
    </div>
  );
}
