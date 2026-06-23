"use client";

import { useState } from "react";
import {
  IconChevronDown,
  IconArrowRight,
  IconArrowNarrowRight,
  IconPlus,
  IconX,
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

export default function VariantG() {
  const [skipDnc] = useState(true);
  const [skipLitigated] = useState(true);

  return (
    <div className="mx-auto max-w-[880px] px-6 py-14">
      <div className="mb-8">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
          Variant G &middot; Stripe Quiet
        </div>
        <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.025em] text-[#0a0a0a]">
          Start A Dialer Session
        </h1>
      </div>

      <div className="mb-8 flex items-center justify-between rounded-[8px] bg-white px-6 py-5 ring-1 ring-[#e5e7eb]">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
            Resume Last Session
          </div>
          <div className="mt-1.5 text-[17px] font-semibold tracking-[-0.005em] text-[#0a0a0a]">
            Fort Bend County, Texas
          </div>
          <div className="mt-1 text-[12.5px] text-[#6b7280]">
            <span className="font-medium tabular-nums text-[#0a0a0a]">23 of 47</span> dialed &middot; Paused yesterday at 4:38pm
          </div>
        </div>
        <button
          type="button"
          className="flex h-10 cursor-pointer items-center gap-1.5 rounded-[6px] bg-gradient-to-b from-[#13644e] to-[#0a3d4a] px-5 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(13,75,58,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:opacity-95"
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
        className="flex w-full cursor-pointer items-center justify-between rounded-[8px] bg-white px-6 py-5 text-left ring-1 ring-[#e5e7eb] transition hover:ring-[#d1d5db]"
      >
        <div>
          <div className="text-[17px] font-semibold tracking-[-0.005em] text-[#0a0a0a]">
            Fort Bend County, Texas
          </div>
          <div className="mt-1 text-[12.5px] text-[#6b7280]">
            Imported Jun 21, 2026
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[14px] tabular-nums text-[#0a0a0a]">47</span>
          <IconChevronDown size={15} stroke={1.75} className="text-[#9ca3af]" />
        </div>
      </button>

      <div className="mt-6 rounded-[8px] bg-white ring-1 ring-[#e5e7eb]">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#0a0a0a]">
              Refine
            </div>
            <div className="mt-0.5 text-[11.5px] text-[#9ca3af]">
              Trim the list before you dial
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[28px] font-medium tabular-nums leading-none text-[#0a0a0a]">
              28
            </div>
            <div className="mt-1 text-[10.5px] uppercase tracking-[0.10em] text-[#9ca3af]">
              From <span className="font-mono tabular-nums">47</span> Leads
            </div>
          </div>
        </div>

        <div className="border-t border-[#f1f2f4] px-6 py-3">
          <FilterRow label="Stage" value="Researched, First Contact" />
          <FilterRow label="State" value="Texas" />
          <FilterRow label="County" value="Fort Bend" />
          <FilterRow label="Owner Status" value="Living" />
          <FilterRow label="Surplus" value="$20,000 To No Max" />
          <FilterRow label="Last Touched" value="Never" />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[12.5px] text-[#9ca3af]">Compliance</span>
            <div className="flex gap-5">
              <CircleToggle checked={skipDnc} label="Skip DNC" />
              <CircleToggle checked={skipLitigated} label="Skip Litigated" />
            </div>
          </div>
        </div>

        <div className="border-t border-[#f1f2f4] px-6 py-3">
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1.5 text-[12.5px] font-medium text-[#13644e] hover:text-[#0a3d4a]"
          >
            <IconPlus size={12} stroke={2.25} />
            Add A Filter
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[8px] bg-white ring-1 ring-[#e5e7eb]">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#0a0a0a]">
              Defaults
            </div>
            <div className="mt-0.5 text-[11.5px] text-[#9ca3af]">
              Using your saved defaults for caller ID, voicemail, wrap up, email, and SMS
            </div>
          </div>
          <button
            type="button"
            className="h-9 cursor-pointer rounded-[6px] bg-white px-3.5 text-[12px] font-medium text-[#0a0a0a] ring-1 ring-[#e5e7eb] transition hover:ring-[#d1d5db]"
          >
            Update Defaults
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <input
          type="text"
          placeholder="Name This List (Required To Save)"
          className="h-11 flex-1 rounded-[6px] bg-white px-4 text-[13px] text-[#0a0a0a] outline-none ring-1 ring-[#e5e7eb] transition focus:ring-[#0a0a0a] placeholder:text-[#9ca3af]"
        />
        <button
          type="button"
          className="h-11 cursor-pointer rounded-[6px] bg-white px-5 text-[13px] font-medium text-[#374151] ring-1 ring-[#e5e7eb] transition hover:ring-[#d1d5db]"
        >
          Cancel
        </button>
        <button
          type="button"
          className="flex h-11 cursor-pointer items-center gap-2 rounded-[6px] bg-gradient-to-b from-[#13644e] to-[#0a3d4a] px-5 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(13,75,58,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:opacity-95"
        >
          Start Session
          <span className="font-mono text-[12px] tabular-nums opacity-80">28</span>
        </button>
      </div>
    </div>
  );
}

function FilterRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#f1f2f4] py-2.5 last:border-b-0">
      <span className="text-[12.5px] text-[#9ca3af]">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[12.5px] font-medium text-[#0a0a0a]">{value}</span>
        <IconChevronDown size={12} stroke={1.75} className="text-[#9ca3af]" />
      </div>
    </div>
  );
}
