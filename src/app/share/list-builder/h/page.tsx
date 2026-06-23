"use client";

import { useState } from "react";
import {
  IconChevronDown,
  IconArrowRight,
  IconPlus,
  IconCommand,
} from "@tabler/icons-react";

function CircleToggle({ checked, label }: { checked: boolean; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <span
        className={[
          "relative flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full border transition",
          checked ? "border-[#13644e] bg-[#13644e]" : "border-[#d1d5db] bg-white",
        ].join(" ")}
      >
        {checked && <span className="h-[5px] w-[5px] rounded-full bg-white" />}
      </span>
      <span className="text-[12.5px] text-[#0f1729]">{label}</span>
    </label>
  );
}

export default function VariantH() {
  const [skipDnc] = useState(true);
  const [skipLitigated] = useState(true);

  return (
    <div className="mx-auto max-w-[820px] px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
            Variant H &middot; Linear Sharp
          </div>
          <h1 className="mt-1.5 text-[22px] font-semibold tracking-[-0.02em] text-[#0f1729]">
            Start A Dialer Session
          </h1>
        </div>
        <button
          type="button"
          className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-[6px] bg-white px-2.5 text-[11.5px] font-medium text-[#6b7280] ring-1 ring-[#e5e7eb] transition hover:text-[#0f1729]"
        >
          <IconCommand size={11} stroke={2} />
          Search
        </button>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4 rounded-[6px] bg-white px-4 py-3 ring-1 ring-[#e5e7eb]">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#13644e]" />
          <div>
            <div className="text-[12.5px] font-semibold text-[#0f1729]">
              Resume Last Session
            </div>
            <div className="mt-0.5 text-[11.5px] text-[#6b7280]">
              Fort Bend County, Texas &middot; 23 of 47 dialed &middot; Paused yesterday at 4:38pm
            </div>
          </div>
        </div>
        <button
          type="button"
          className="flex h-8 cursor-pointer items-center gap-1 rounded-[6px] bg-[#0f1729] px-3 text-[12px] font-medium text-white transition hover:opacity-90"
        >
          Resume
          <IconArrowRight size={12} stroke={2.25} />
        </button>
      </div>

      <div className="mb-2 flex items-center gap-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
          Or Start A New Session
        </div>
        <div className="h-px flex-1 bg-[#e5e7eb]" />
      </div>

      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between rounded-[6px] bg-white px-4 py-3 ring-1 ring-[#e5e7eb] transition hover:ring-[#0f1729]"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-[4px] bg-[#0f1729] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.10em] text-white">
            Import
          </div>
          <span className="text-[13.5px] font-semibold text-[#0f1729]">
            Fort Bend County, Texas
          </span>
          <span className="text-[11.5px] text-[#6b7280]">
            Jun 21, 2026
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] tabular-nums text-[#0f1729]">47 Leads</span>
          <IconChevronDown size={13} stroke={2} className="text-[#9ca3af]" />
        </div>
      </button>

      <div className="mt-4 overflow-hidden rounded-[6px] bg-white ring-1 ring-[#e5e7eb]">
        <div className="flex items-center justify-between border-b border-[#f1f2f4] px-4 py-2.5">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#0f1729]">
            Filter
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[16px] font-semibold tabular-nums text-[#0f1729]">28</span>
            <span className="text-[11.5px] text-[#9ca3af]">
              of <span className="tabular-nums">47</span>
            </span>
          </div>
        </div>

        <div className="px-4 py-2">
          <FilterPill label="Stage" value="Researched, First Contact" />
          <FilterPill label="State" value="Texas" />
          <FilterPill label="Owner Status" value="Living" />
          <FilterPill label="Surplus" value="$20k Plus" />
          <FilterPill label="Last Touched" value="Never" />
          <button
            type="button"
            className="mt-1.5 inline-flex cursor-pointer items-center gap-1 rounded-[4px] border border-dashed border-[#d1d5db] px-2 py-1 text-[11px] font-medium text-[#6b7280] transition hover:border-[#0f1729] hover:text-[#0f1729]"
          >
            <IconPlus size={10} stroke={2.5} />
            Add Filter
          </button>
        </div>

        <div className="flex items-center gap-5 border-t border-[#f1f2f4] px-4 py-2.5">
          <CircleToggle checked={skipDnc} label="Skip DNC" />
          <CircleToggle checked={skipLitigated} label="Skip Litigated" />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[6px] bg-white ring-1 ring-[#e5e7eb]">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#0f1729]">
              Defaults
            </div>
            <div className="mt-0.5 text-[11px] text-[#6b7280]">
              Using your saved defaults for caller ID, voicemail, wrap up, email, and SMS
            </div>
          </div>
          <button
            type="button"
            className="h-8 cursor-pointer rounded-[6px] bg-white px-3 text-[11.5px] font-medium text-[#0f1729] ring-1 ring-[#e5e7eb] transition hover:ring-[#0f1729]"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="Name This List (Required To Save)"
          className="h-10 flex-1 rounded-[6px] bg-white px-3 text-[12.5px] text-[#0f1729] outline-none ring-1 ring-[#e5e7eb] transition focus:ring-[#0f1729] placeholder:text-[#9ca3af]"
        />
        <button
          type="button"
          className="h-10 cursor-pointer rounded-[6px] bg-white px-4 text-[12.5px] font-medium text-[#374151] ring-1 ring-[#e5e7eb] transition hover:ring-[#0f1729]"
        >
          Cancel
        </button>
        <button
          type="button"
          className="flex h-10 cursor-pointer items-center gap-2 rounded-[6px] bg-[#0f1729] px-4 text-[12.5px] font-medium text-white transition hover:opacity-90"
        >
          Start Session
          <span className="rounded bg-white/15 px-1.5 py-0.5 text-[11px] tabular-nums">28</span>
        </button>
      </div>
    </div>
  );
}

function FilterPill({ label, value }: { label: string; value: string }) {
  return (
    <button
      type="button"
      className="mr-1.5 mt-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded-[4px] bg-white py-1 pl-2 pr-2.5 text-[11.5px] text-[#374151] ring-1 ring-[#e5e7eb] transition hover:ring-[#0f1729]"
    >
      <span className="text-[#9ca3af]">{label}</span>
      <span className="font-medium text-[#0f1729]">{value}</span>
    </button>
  );
}
