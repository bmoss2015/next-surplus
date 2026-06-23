"use client";

import { useState } from "react";
import {
  IconChevronDown,
  IconArrowRight,
  IconPlus,
  IconUserCircle,
} from "@tabler/icons-react";

function CircleToggle({ checked, label }: { checked: boolean; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5">
      <span
        className={[
          "relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition",
          checked ? "border-[#13644e] bg-[#13644e]" : "border-[#d1d5db] bg-white",
        ].join(" ")}
      >
        {checked && <span className="h-[6px] w-[6px] rounded-full bg-white" />}
      </span>
      <span className="text-[13px] text-[#374151]">{label}</span>
    </label>
  );
}

export default function VariantJ() {
  const [skipDnc] = useState(true);
  const [skipLitigated] = useState(true);

  return (
    <div className="mx-auto max-w-[1040px] px-8 py-12">
      <div className="mb-8">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
          Variant J &middot; Notion Comfortable
        </div>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.025em] text-[#0f1729]">
          Start A Dialer Session
        </h1>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6">
        <div>
          <div className="mb-6 flex items-center justify-between rounded-[12px] border border-[#e5e7eb] bg-white px-6 py-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#13644e]">
                Resume Last Session
              </div>
              <div className="mt-1.5 text-[17px] font-semibold tracking-[-0.005em] text-[#0f1729]">
                Fort Bend County, Texas
              </div>
              <div className="mt-0.5 text-[12.5px] text-[#6b7280]">
                <span className="font-semibold tabular-nums text-[#374151]">23 of 47</span> dialed &middot; Paused yesterday at 4:38pm
              </div>
            </div>
            <button
              type="button"
              className="flex h-10 cursor-pointer items-center gap-2 rounded-[8px] bg-gradient-to-b from-[#13644e] to-[#0a3d4a] px-5 text-[13px] font-semibold text-white transition hover:opacity-95"
            >
              Resume
              <IconArrowRight size={13} stroke={2.25} />
            </button>
          </div>

          <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
            Or Build A New Session
          </div>

          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-[12px] border border-[#e5e7eb] bg-white px-6 py-5 transition hover:border-[#9ca3af]"
          >
            <div>
              <div className="text-[17px] font-semibold tracking-[-0.005em] text-[#0f1729]">
                Fort Bend County, Texas
              </div>
              <div className="mt-1 text-[12.5px] text-[#6b7280]">
                Imported Jun 21, 2026
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-[6px] bg-[#0f1729] px-2.5 py-1 text-[12.5px] font-semibold tabular-nums text-white">47</span>
              <IconChevronDown size={15} stroke={2} className="text-[#9ca3af]" />
            </div>
          </button>

          <div className="mt-5 overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white">
            <div className="flex items-center justify-between border-b border-[#f1f2f4] px-6 py-3.5">
              <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#0f1729]">
                Refine
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[20px] font-semibold tabular-nums text-[#0f1729]">28</span>
                <span className="text-[11.5px] text-[#9ca3af]">from <span className="tabular-nums">47</span></span>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="flex flex-wrap gap-2">
                <FilterChip label="Stage" value="Researched, First Contact" />
                <FilterChip label="State" value="Texas" />
                <FilterChip label="County" value="Fort Bend" />
                <FilterChip label="Owner Status" value="Living" />
                <FilterChip label="Surplus" value="$20k Plus" />
                <FilterChip label="Last Touched" value="Never" />
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-[8px] border border-dashed border-[#d1d5db] px-3 py-1.5 text-[12px] font-medium text-[#6b7280] transition hover:border-[#13644e] hover:text-[#13644e]"
                >
                  <IconPlus size={11} stroke={2.25} />
                  Add Filter
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6 border-t border-[#f1f2f4] px-6 py-3.5">
              <CircleToggle checked={skipDnc} label="Skip DNC" />
              <CircleToggle checked={skipLitigated} label="Skip Litigated" />
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#0f1729]">
                  Defaults
                </div>
                <div className="mt-0.5 text-[11.5px] text-[#6b7280]">
                  Using your saved defaults for caller ID, voicemail, wrap up, email, and SMS
                </div>
              </div>
              <button
                type="button"
                className="h-9 cursor-pointer rounded-[8px] border border-[#e5e7eb] bg-white px-3.5 text-[12px] font-medium text-[#0f1729] transition hover:border-[#9ca3af]"
              >
                Update Defaults
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <input
              type="text"
              placeholder="Name This List (Required To Save)"
              className="h-11 flex-1 rounded-[8px] border border-[#e5e7eb] bg-white px-4 text-[13px] text-[#0f1729] outline-none transition focus:border-[#13644e] placeholder:text-[#9ca3af]"
            />
            <button
              type="button"
              className="h-11 cursor-pointer rounded-[8px] border border-[#e5e7eb] bg-white px-5 text-[13px] font-medium text-[#374151] transition hover:border-[#9ca3af]"
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex h-11 cursor-pointer items-center gap-2 rounded-[8px] bg-gradient-to-b from-[#13644e] to-[#0a3d4a] px-5 text-[13px] font-semibold text-white transition hover:opacity-95"
            >
              Start Session
              <span className="rounded-[4px] bg-white/15 px-1.5 py-0.5 text-[11px] tabular-nums">28</span>
            </button>
          </div>
        </div>

        <div className="self-start rounded-[12px] border border-[#e5e7eb] bg-white">
          <div className="border-b border-[#f1f2f4] px-5 py-3.5">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
              First In Queue
            </div>
            <div className="mt-1 text-[12px] text-[#6b7280]">
              Preview of who you would dial
            </div>
          </div>
          <div className="divide-y divide-[#f1f2f4]">
            <PreviewLead name="Sarah Pemberton" county="Travis, TX" status="Living" surplus="$48,200" />
            <PreviewLead name="Daniel Brooks Estate" county="Travis, TX" status="Deceased" surplus="$19,420" />
            <PreviewLead name="Michael Ortiz" county="Harris, TX" status="Living" surplus="$33,100" />
            <PreviewLead name="Linda Chen" county="Maricopa, AZ" status="Living" surplus="$22,915" />
          </div>
          <div className="border-t border-[#f1f2f4] px-5 py-2.5 text-[11px] text-[#9ca3af]">
            Plus 24 more
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, value }: { label: string; value: string }) {
  return (
    <button
      type="button"
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#e5e7eb] bg-white py-1.5 pl-3 pr-3 text-[12px] transition hover:border-[#13644e]"
    >
      <span className="text-[#9ca3af]">{label}</span>
      <span className="font-semibold text-[#0f1729]">{value}</span>
    </button>
  );
}

function PreviewLead({ name, county, status, surplus }: { name: string; county: string; status: string; surplus: string }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f7f8f9] text-[#9ca3af]">
        <IconUserCircle size={18} stroke={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-semibold text-[#0f1729]">{name}</div>
        <div className="text-[11px] text-[#6b7280]">{county} &middot; {status}</div>
      </div>
      <div className="text-[12px] font-semibold tabular-nums text-[#0f1729]">{surplus}</div>
    </div>
  );
}
