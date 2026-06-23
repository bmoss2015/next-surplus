"use client";

import { useState } from "react";
import {
  IconChevronDown,
  IconArrowRight,
  IconPlus,
} from "@tabler/icons-react";

function CircleToggle({ checked, label }: { checked: boolean; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5">
      <span
        className={[
          "relative flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-2 transition",
          checked ? "border-[#13644e] bg-[#13644e]" : "border-[#d1d5db] bg-white",
        ].join(" ")}
      >
        {checked && <span className="h-[7px] w-[7px] rounded-full bg-white" />}
      </span>
      <span className="text-[13.5px] text-[#374151]">{label}</span>
    </label>
  );
}

export default function VariantI() {
  const [skipDnc] = useState(true);
  const [skipLitigated] = useState(true);

  return (
    <div className="mx-auto max-w-[820px] px-6 py-16">
      <div className="mb-10">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
          Variant I &middot; Folk Atmospheric
        </div>
        <h1 className="mt-2.5 text-[30px] font-semibold tracking-[-0.025em] text-[#0f1729]">
          Start A Dialer Session
        </h1>
      </div>

      <div className="mb-8 overflow-hidden rounded-[16px] bg-white" style={{ boxShadow: "0 1px 3px rgba(15,23,41,0.05), 0 10px 30px -10px rgba(15,23,41,0.08)" }}>
        <div className="flex items-center justify-between px-7 py-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#13644e]">
              Resume Last Session
            </div>
            <div className="mt-2 text-[19px] font-semibold tracking-[-0.005em] text-[#0f1729]">
              Fort Bend County, Texas
            </div>
            <div className="mt-1 text-[13px] text-[#6b7280]">
              <span className="font-semibold tabular-nums text-[#374151]">23 of 47</span> dialed &middot; Paused yesterday at 4:38pm
            </div>
          </div>
          <button
            type="button"
            className="flex h-11 cursor-pointer items-center gap-2 rounded-[12px] bg-gradient-to-b from-[#13644e] to-[#0a3d4a] px-5 text-[13.5px] font-semibold text-white shadow-[0_2px_8px_-2px_rgba(13,75,58,0.30)] transition hover:opacity-95"
          >
            Resume
            <IconArrowRight size={14} stroke={2.25} />
          </button>
        </div>
      </div>

      <div className="mb-4 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-[#9ca3af]">
        Or Start A New Session
      </div>

      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between rounded-[16px] bg-white px-7 py-6 text-left transition hover:translate-y-[-1px]"
        style={{ boxShadow: "0 1px 3px rgba(15,23,41,0.05), 0 10px 30px -10px rgba(15,23,41,0.08)" }}
      >
        <div>
          <div className="text-[19px] font-semibold tracking-[-0.005em] text-[#0f1729]">
            Fort Bend County, Texas
          </div>
          <div className="mt-1 text-[13px] text-[#6b7280]">
            Imported Jun 21, 2026
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold tabular-nums text-[#0f1729]">47</span>
          <span className="text-[12px] uppercase tracking-[0.10em] text-[#9ca3af]">Leads</span>
          <IconChevronDown size={16} stroke={2} className="text-[#9ca3af]" />
        </div>
      </button>

      <div
        className="mt-5 overflow-hidden rounded-[16px] bg-white"
        style={{ boxShadow: "0 1px 3px rgba(15,23,41,0.05), 0 10px 30px -10px rgba(15,23,41,0.08)" }}
      >
        <div className="flex items-baseline justify-between px-7 py-5">
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#0f1729]">
              Filter
            </div>
            <div className="mt-0.5 text-[12px] text-[#9ca3af]">
              Trim the list before you dial
            </div>
          </div>
          <div className="text-right">
            <div className="text-[34px] font-semibold leading-none tabular-nums tracking-[-0.025em] text-[#0f1729]">
              28
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.10em] text-[#9ca3af]">
              From <span className="tabular-nums text-[#374151]">47</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#f1f2f4] px-7 py-4">
          <div className="flex flex-wrap gap-2">
            <FilterChip label="Stage" value="Researched, First Contact" />
            <FilterChip label="State" value="Texas" />
            <FilterChip label="County" value="Fort Bend" />
            <FilterChip label="Owner Status" value="Living" />
            <FilterChip label="Surplus" value="$20k Plus" />
            <FilterChip label="Last Touched" value="Never" />
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-1 rounded-[12px] border border-dashed border-[#d1d5db] px-3 py-1.5 text-[12px] font-medium text-[#6b7280] transition hover:border-[#13644e] hover:text-[#13644e]"
            >
              <IconPlus size={11} stroke={2.25} />
              Add Filter
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t border-[#f1f2f4] px-7 py-4">
          <CircleToggle checked={skipDnc} label="Skip DNC" />
          <CircleToggle checked={skipLitigated} label="Skip Litigated" />
        </div>
      </div>

      <div
        className="mt-5 overflow-hidden rounded-[16px] bg-white"
        style={{ boxShadow: "0 1px 3px rgba(15,23,41,0.05), 0 10px 30px -10px rgba(15,23,41,0.08)" }}
      >
        <div className="flex items-center justify-between px-7 py-5">
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#0f1729]">
              Defaults
            </div>
            <div className="mt-0.5 text-[12px] text-[#6b7280]">
              Using your saved defaults for caller ID, voicemail, wrap up, email, and SMS
            </div>
          </div>
          <button
            type="button"
            className="h-10 cursor-pointer rounded-[12px] bg-[#0f1729] px-4 text-[12.5px] font-medium text-white transition hover:opacity-90"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <input
          type="text"
          placeholder="Name This List (Required To Save)"
          className="h-12 flex-1 rounded-[12px] bg-white px-4 text-[13.5px] text-[#0f1729] outline-none ring-1 ring-[#e5e7eb] transition focus:ring-[#13644e] placeholder:text-[#9ca3af]"
        />
        <button
          type="button"
          className="h-12 cursor-pointer rounded-[12px] bg-white px-5 text-[13px] font-medium text-[#374151] ring-1 ring-[#e5e7eb] transition hover:ring-[#9ca3af]"
        >
          Cancel
        </button>
        <button
          type="button"
          className="flex h-12 cursor-pointer items-center gap-2.5 rounded-[12px] bg-gradient-to-b from-[#13644e] to-[#0a3d4a] px-6 text-[14px] font-semibold text-white shadow-[0_2px_8px_-2px_rgba(13,75,58,0.30)] transition hover:opacity-95"
        >
          Start Session
          <span className="rounded-[6px] bg-white/15 px-2 py-0.5 text-[12px] tabular-nums">28</span>
        </button>
      </div>
    </div>
  );
}

function FilterChip({ label, value }: { label: string; value: string }) {
  return (
    <button
      type="button"
      className="inline-flex cursor-pointer items-center gap-2 rounded-[12px] bg-white py-2 pl-3.5 pr-3.5 text-[12.5px] ring-1 ring-[#e5e7eb] transition hover:ring-[#13644e]"
    >
      <span className="text-[#9ca3af]">{label}</span>
      <span className="font-semibold text-[#0f1729]">{value}</span>
    </button>
  );
}
