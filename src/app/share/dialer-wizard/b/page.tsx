import {
  IconChevronDown,
  IconArrowRight,
  IconUserCircle,
  IconX,
  IconPlus,
} from "@tabler/icons-react";

const PREVIEW_LEADS = [
  {
    name: "Sarah Pemberton",
    county: "Travis, TX",
    surplus: "$48,200",
    saleDate: "Apr 18, 2026",
    status: "Living",
  },
  {
    name: "Marcus Hayes Estate",
    county: "Mecklenburg, NC",
    surplus: "$31,640",
    saleDate: "Mar 02, 2026",
    status: "Deceased",
  },
  {
    name: "Linda Chen",
    county: "Maricopa, AZ",
    surplus: "$22,915",
    saleDate: "May 11, 2026",
    status: "Living",
  },
];

const FILTER_CHIPS = [
  { label: "State: All", active: false },
  { label: "Surplus > $20k", active: true },
  { label: "Has Phone", active: true },
  { label: "Last Touch > 30 Days", active: true },
];

export default function VariantB() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
          Variant B &middot; Launch Pad
        </div>
        <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.02em] text-[#0f1729]">
          Start A Dialer Session
        </h1>
      </div>

      <div className="grid grid-cols-[1fr_440px] gap-6">
        <div
          className="rounded-[14px] bg-white p-6"
          style={{
            boxShadow:
              "0 1px 2px rgba(15,23,41,0.04), 0 12px 32px -8px rgba(15,23,41,0.12)",
          }}
        >
          <div>
            <label className="block text-[11.5px] font-semibold uppercase tracking-[0.10em] text-[#6b7280]">
              Saved View
            </label>
            <button
              type="button"
              className="mt-2 flex w-full cursor-pointer items-center justify-between rounded-[10px] border border-[#e5e7eb] bg-white px-4 py-3.5 text-left transition hover:border-[#0f1729]"
            >
              <div className="text-[15px] font-semibold text-[#0f1729]">
                First Contact Due
              </div>
              <IconChevronDown size={16} stroke={2} className="text-[#9ca3af]" />
            </button>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div className="text-[11.5px] font-semibold uppercase tracking-[0.10em] text-[#6b7280]">
                Refine This Session
              </div>
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1 text-[12px] font-medium text-[#13644e] hover:text-[#0a3d4a]"
              >
                <IconPlus size={12} stroke={2.5} />
                Add Filter
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {FILTER_CHIPS.map((chip) => (
                <span
                  key={chip.label}
                  className={[
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                    chip.active
                      ? "border-[#0f1729] bg-[#0f1729] text-white"
                      : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#0f1729]",
                  ].join(" ")}
                >
                  {chip.label}
                  {chip.active && <IconX size={11} stroke={2.5} />}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-[#f1f2f4] pt-5">
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.10em] text-[#6b7280]">
              Defaults
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-[12.5px]">
              <DefaultLine label="Caller ID" value="Auto Map By State" />
              <DefaultLine label="Voicemail" value="Default Outreach" />
              <DefaultLine label="Wrap Up" value="30 Seconds" />
              <DefaultLine label="Auto Followup" value="4 Templates" />
            </div>
            <button
              type="button"
              className="mt-3 cursor-pointer text-[12px] font-medium text-[#13644e] hover:text-[#0a3d4a]"
            >
              Change For This Session
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div
            className="rounded-[14px] bg-white p-5"
            style={{
              boxShadow:
                "0 1px 2px rgba(15,23,41,0.04), 0 12px 32px -8px rgba(15,23,41,0.12)",
            }}
          >
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-[11.5px] font-semibold uppercase tracking-[0.10em] text-[#6b7280]">
                  Queue Preview
                </div>
                <div className="mt-1 text-[28px] font-semibold tabular-nums tracking-[-0.02em] text-[#0f1729]">
                  47
                </div>
                <div className="text-[12px] text-[#6b7280]">Leads After Filters</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-[0.08em] text-[#9ca3af]">
                  Est. Session
                </div>
                <div className="mt-0.5 text-[14px] font-semibold tabular-nums text-[#0f1729]">
                  3h 45m
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 border-t border-[#f1f2f4] pt-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">
                First In Queue
              </div>
              {PREVIEW_LEADS.map((l, i) => (
                <div
                  key={l.name}
                  className="flex items-center gap-3 rounded-[8px] border border-[#f1f2f4] bg-white px-3 py-2.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f7f8f9] text-[#9ca3af]">
                    <IconUserCircle size={20} stroke={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] font-semibold text-[#0f1729]">
                        {i + 1}.
                      </span>
                      <span className="truncate text-[12.5px] font-semibold text-[#0f1729]">
                        {l.name}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-[#6b7280]">
                      {l.county} &middot; Sold {l.saleDate} &middot; {l.status}
                    </div>
                  </div>
                  <div className="text-[12.5px] font-semibold tabular-nums text-[#0f1729]">
                    {l.surplus}
                  </div>
                </div>
              ))}
              <div className="pt-1 text-[11.5px] text-[#6b7280]">
                Plus 44 More
              </div>
            </div>
          </div>

          <button
            type="button"
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#0a3d4a] to-[#13644e] text-[14px] font-semibold text-white shadow-[0_1px_2px_rgba(13,75,58,0.20),0_8px_20px_-4px_rgba(13,75,58,0.30)] transition hover:opacity-95"
          >
            Start Session With 47 Leads
            <IconArrowRight size={15} stroke={2.25} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DefaultLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[11.5px] text-[#9ca3af]">{label}</span>
      <span className="text-[12px] font-medium text-[#0f1729]">{value}</span>
    </div>
  );
}
