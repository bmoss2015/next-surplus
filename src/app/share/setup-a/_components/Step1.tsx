import {
  Card,
  SectionLabel,
  Checkbox,
  Radio,
  FilterChip,
  DualSlider,
  FakeSelect,
  ContinueButton,
  CARD_SHADOW,
  CTA_SHADOW,
  PETROL_GRADIENT_BTN,
} from "./Shared";

const STATES = [
  { label: "Ohio", count: 24, checked: true },
  { label: "Pennsylvania", count: 13, checked: true },
  { label: "South Carolina", count: 6, checked: true },
  { label: "Tennessee", count: 3, checked: true },
  { label: "New York", count: 1, checked: false },
];

const COUNTIES = [
  { name: "Cuyahoga", count: 28 },
  { name: "Lancaster", count: 12 },
  { name: "Franklin", count: 5 },
  { name: "Hamilton", count: 2 },
  { name: "Charleston", count: 2 },
];

const CASE_TYPES = [
  { label: "Tax Sale", count: 31, checked: true },
  { label: "Mortgage Foreclosure", count: 14, checked: true },
  { label: "Other", count: 2, checked: false },
];

const CRM_STAGES = [
  { label: "New Lead", count: 12, checked: true },
  { label: "Outreach", count: 18, checked: true },
  { label: "Engaged", count: 9, checked: true },
  { label: "Qualified", count: 6, checked: true },
  { label: "Agreement Sent", count: 2, checked: false },
  { label: "Signed", count: 0, checked: false },
  { label: "Closed Won", count: 0, checked: false },
  { label: "Closed Lost", count: 0, checked: false },
];

const OWNER_STATUS = [
  { label: "Living", count: 22, checked: true },
  { label: "Deceased", count: 23, checked: true },
  { label: "Unknown", count: 2, checked: true },
];

export function Step1() {
  return (
    <div>
      <div className="grid grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <Card>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <FilterBlock>
                <SectionLabel icon="list">Lead Source</SectionLabel>
                <div className="mt-2.5">
                  <FakeSelect value="All Active Leads" />
                </div>
                <Hint>Pulls from every CRM list flagged active.</Hint>
              </FilterBlock>

              <FilterBlock>
                <SectionLabel icon="map">State</SectionLabel>
                <div className="mt-2 space-y-0.5">
                  {STATES.map((s) => (
                    <Checkbox key={s.label} label={s.label} count={s.count} checked={s.checked} />
                  ))}
                </div>
              </FilterBlock>

              <FilterBlock>
                <SectionLabel icon="building">County</SectionLabel>
                <Hint>Filtered by the selected states above.</Hint>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {COUNTIES.map((c) => (
                    <FilterChip key={c.name} label={c.name} count={c.count} active />
                  ))}
                  <FilterChip label="+ 7 More" active={false} />
                </div>
              </FilterBlock>

              <FilterBlock>
                <SectionLabel icon="file">Case Type</SectionLabel>
                <div className="mt-2 space-y-0.5">
                  {CASE_TYPES.map((c) => (
                    <Checkbox key={c.label} label={c.label} count={c.count} checked={c.checked} />
                  ))}
                </div>
              </FilterBlock>

              <FilterBlock className="col-span-2">
                <SectionLabel icon="kanban">CRM Stage</SectionLabel>
                <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-0.5">
                  {CRM_STAGES.map((s) => (
                    <Checkbox key={s.label} label={s.label} count={s.count} checked={s.checked} />
                  ))}
                </div>
              </FilterBlock>

              <FilterBlock>
                <SectionLabel icon="phone">Call History</SectionLabel>
                <div className="mt-2 space-y-0.5">
                  <Radio label="All Leads" selected={false} />
                  <Radio label="Never Called" selected={false} />
                  <Radio label="Less Than 3 Attempts" selected={true} />
                  <Radio label="3 or More Attempts" selected={false} />
                  <Radio
                    label="Last Call Was"
                    selected={false}
                    trailing={
                      <div className="w-[110px]">
                        <FakeSelect value="Older Than 14 Days" size="sm" />
                      </div>
                    }
                  />
                </div>
              </FilterBlock>

              <FilterBlock>
                <SectionLabel icon="user">Owner Status</SectionLabel>
                <div className="mt-2 space-y-0.5">
                  {OWNER_STATUS.map((s) => (
                    <Checkbox key={s.label} label={s.label} count={s.count} checked={s.checked} />
                  ))}
                </div>
              </FilterBlock>

              <FilterBlock>
                <SectionLabel icon="dollar">Surplus Range</SectionLabel>
                <Hint>Lower bound includes the surplus floor.</Hint>
                <div className="mt-3">
                  <DualSlider start={2.5} end={30} />
                  <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-gray-500">
                    <span>$0</span>
                    <span className="font-semibold text-petrol-700">$25K to $300K</span>
                    <span>$1M</span>
                  </div>
                </div>
              </FilterBlock>

              <FilterBlock>
                <SectionLabel icon="clock">Last Contacted</SectionLabel>
                <div className="mt-2 space-y-0.5">
                  <Radio label="Any" selected={false} />
                  <Radio label="Older Than 30 Days" selected={true} />
                  <Radio label="Older Than 90 Days" selected={false} />
                </div>
              </FilterBlock>

              <FilterBlock className="col-span-2">
                <SectionLabel icon="scale">Litigation</SectionLabel>
                <div className="mt-2 flex items-start justify-between gap-4">
                  <Checkbox label="Skip Litigated Leads" checked={true} />
                  <span className="text-[11px] text-gray-500">
                    8 leads excluded · Active or pending claims
                  </span>
                </div>
              </FilterBlock>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <div
            className={`rounded-[12px] p-5 text-white ${PETROL_GRADIENT_BTN} ${CTA_SHADOW}`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65">
              Selected
            </div>
            <div className="mt-2 text-[42px] font-semibold leading-none tabular-nums">
              47
              <span className="ml-2 text-[16px] font-medium text-white/75">Leads</span>
            </div>
            <div className="mt-3 border-t border-white/20 pt-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65">
                Estimated Session
              </div>
              <div className="mt-1 text-[22px] font-semibold tabular-nums">
                3h 45m
              </div>
              <div className="mt-0.5 text-[11px] text-white/75">
                4.8 min avg per dial · 30 day pace
              </div>
            </div>
          </div>

          <div className={`rounded-[12px] bg-white p-4 ${CARD_SHADOW}`}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              Filter Recap
            </div>
            <ul className="mt-2 space-y-1 text-[11px] text-gray-700">
              <li>· 4 states, 5 counties</li>
              <li>· 2 case types (Tax Sale, Mortgage Foreclosure)</li>
              <li>· 4 CRM stages</li>
              <li>· Surplus $25K to $300K</li>
              <li>· Older than 30 days, &lt;3 attempts</li>
              <li>· Skip litigated (8 excluded)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-[11.5px] text-gray-400">Back disabled on Step 1</span>
        <ContinueButton label="Continue to Call Settings" />
      </div>
    </div>
  );
}

function FilterBlock({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={className}>{children}</div>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1 text-[10.5px] text-gray-500 leading-snug">
      {children}
    </div>
  );
}
