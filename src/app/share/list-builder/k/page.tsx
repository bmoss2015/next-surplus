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
          "relative flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full transition",
          checked
            ? "bg-gradient-to-br from-[#13644e] to-[#0a3d4a] shadow-[0_2px_4px_rgba(13,75,58,0.30),inset_0_1px_0_rgba(255,255,255,0.10)]"
            : "border-2 border-[#d1d5db] bg-white",
        ].join(" ")}
      >
        {checked && <span className="h-[7px] w-[7px] rounded-full bg-white" />}
      </span>
      <span className="text-[13px] text-[#0f1729]">{label}</span>
    </label>
  );
}

export default function VariantK() {
  const [skipDnc] = useState(true);
  const [skipLitigated] = useState(true);

  return (
    <div className="min-h-screen pb-16">
      <div className="bg-gradient-to-b from-[#0a3d4a] to-[#13644e] px-6 pb-16 pt-14">
        <div className="mx-auto max-w-[900px]">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/60">
            Variant K &middot; Brand Forward
          </div>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.025em] text-white">
            Start A Dialer Session
          </h1>
          <div className="mt-2 text-[14px] text-white/70">
            Pick a starting point. Refine. Hit start.
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-10 max-w-[900px] px-6">
        <div
          className="flex items-center justify-between gap-4 rounded-[14px] bg-white px-6 py-5"
          style={{ boxShadow: "0 12px 32px -8px rgba(10,61,74,0.18), 0 2px 6px rgba(15,23,41,0.06)" }}
        >
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#13644e]">
              Resume Last Session
            </div>
            <div className="mt-1.5 text-[18px] font-semibold tracking-[-0.005em] text-[#0f1729]">
              Fort Bend County, Texas
            </div>
            <div className="mt-1 text-[12.5px] text-[#6b7280]">
              <span className="font-semibold tabular-nums text-[#0f1729]">23 of 47</span> dialed &middot; Paused yesterday at 4:38pm
            </div>
          </div>
          <button
            type="button"
            className="flex h-11 cursor-pointer items-center gap-2 rounded-[10px] bg-gradient-to-b from-[#13644e] to-[#0a3d4a] px-6 text-[14px] font-semibold text-white shadow-[0_4px_12px_-2px_rgba(13,75,58,0.40),inset_0_1px_0_rgba(255,255,255,0.10)] transition hover:opacity-95"
          >
            Resume Session
            <IconArrowRight size={14} stroke={2.25} />
          </button>
        </div>

        <div className="mt-8 mb-3 flex items-center gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
            Or Build A New Session
          </div>
          <div className="h-px flex-1 bg-[#e5e7eb]" />
        </div>

        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-between rounded-[12px] bg-white px-6 py-5 transition hover:bg-[#fbfbfc]"
          style={{ boxShadow: "0 1px 2px rgba(15,23,41,0.04), 0 4px 12px -2px rgba(15,23,41,0.06)" }}
        >
          <div>
            <div className="text-[18px] font-semibold tracking-[-0.005em] text-[#0f1729]">
              Fort Bend County, Texas
            </div>
            <div className="mt-1 text-[12.5px] text-[#6b7280]">
              Imported Jun 21, 2026
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-[8px] bg-gradient-to-b from-[#13644e] to-[#0a3d4a] px-3 py-1.5 text-[13px] font-semibold tabular-nums text-white shadow-[0_2px_4px_rgba(13,75,58,0.25)]">
              47 Leads
            </span>
            <IconChevronDown size={16} stroke={2} className="text-[#9ca3af]" />
          </div>
        </button>

        <div
          className="mt-5 overflow-hidden rounded-[12px] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(15,23,41,0.04), 0 4px 12px -2px rgba(15,23,41,0.06)" }}
        >
          <div className="flex items-center justify-between border-b border-[#f1f2f4] px-6 py-4">
            <div>
              <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#0f1729]">
                Refine
              </div>
              <div className="mt-0.5 text-[11.5px] text-[#9ca3af]">
                Trim the list before you dial
              </div>
            </div>
            <div className="text-right">
              <div className="text-[32px] font-semibold tabular-nums leading-none tracking-[-0.02em] text-[#0f1729]">
                28
              </div>
              <div className="mt-1 text-[10.5px] uppercase tracking-[0.10em] text-[#9ca3af]">
                From <span className="tabular-nums text-[#374151]">47</span> Leads
              </div>
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
                className="inline-flex cursor-pointer items-center gap-1 rounded-[8px] border border-dashed border-[#9ca3af] px-2.5 py-1.5 text-[12px] font-medium text-[#6b7280] transition hover:border-[#13644e] hover:text-[#13644e]"
              >
                <IconPlus size={11} stroke={2.25} />
                Add Filter
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t border-[#f1f2f4] bg-[#fbfbfc] px-6 py-3.5">
            <CircleToggle checked={skipDnc} label="Skip DNC" />
            <CircleToggle checked={skipLitigated} label="Skip Litigated" />
          </div>
        </div>

        <div
          className="mt-5 overflow-hidden rounded-[12px] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(15,23,41,0.04), 0 4px 12px -2px rgba(15,23,41,0.06)" }}
        >
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
              className="h-9 cursor-pointer rounded-[8px] bg-gradient-to-b from-[#13644e] to-[#0a3d4a] px-4 text-[12px] font-semibold text-white shadow-[0_1px_2px_rgba(13,75,58,0.25),inset_0_1px_0_rgba(255,255,255,0.10)] transition hover:opacity-95"
            >
              Update Defaults
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <input
            type="text"
            placeholder="Name This List (Required To Save)"
            className="h-12 flex-1 rounded-[10px] bg-white px-4 text-[13.5px] text-[#0f1729] outline-none ring-1 ring-[#e5e7eb] transition focus:ring-[#13644e] placeholder:text-[#9ca3af]"
            style={{ boxShadow: "0 1px 2px rgba(15,23,41,0.04)" }}
          />
          <button
            type="button"
            className="h-12 cursor-pointer rounded-[10px] bg-white px-5 text-[13px] font-medium text-[#374151] ring-1 ring-[#e5e7eb] transition hover:ring-[#9ca3af]"
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex h-12 cursor-pointer items-center gap-2.5 rounded-[10px] bg-gradient-to-b from-[#13644e] to-[#0a3d4a] px-6 text-[14px] font-semibold text-white shadow-[0_4px_12px_-2px_rgba(13,75,58,0.40),inset_0_1px_0_rgba(255,255,255,0.10)] transition hover:opacity-95"
          >
            Start Session
            <span className="rounded-[6px] bg-white/15 px-2 py-0.5 text-[12px] tabular-nums">28</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, value }: { label: string; value: string }) {
  return (
    <button
      type="button"
      className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] bg-white py-1.5 pl-3 pr-3 text-[12px] ring-1 ring-[#e5e7eb] transition hover:ring-[#13644e]"
    >
      <span className="text-[#9ca3af]">{label}</span>
      <span className="font-semibold text-[#0f1729]">{value}</span>
    </button>
  );
}
