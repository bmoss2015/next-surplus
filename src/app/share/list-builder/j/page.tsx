"use client";

import {
  IconChevronDown,
  IconArrowRight,
  IconPlus,
  IconX,
} from "@tabler/icons-react";

export default function VariantJ() {
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="mx-auto max-w-[720px] px-10 pb-24 pt-9">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9298a3]">
          Variant J &middot; F Structure &middot; Dense Compact
        </div>
        <h1 className="mt-1.5 text-[24px] font-semibold leading-[1.18] tracking-[-0.025em] text-[#0a0d14]">
          Start A Dialer Session
        </h1>

        <div
          className="mt-5 flex items-center justify-between gap-3 rounded-[10px] border border-[#ebedf0] bg-white px-4 py-3"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#0d4b3a]">
              Resume Last Session
            </div>
            <div className="mt-1 text-[13.5px] font-semibold leading-[1.2] tracking-[-0.012em] text-[#0a0d14]">
              Fort Bend County, Texas
            </div>
            <div className="mt-0.5 text-[11.5px] text-[#5b606a]">
              <span className="font-semibold tabular-nums text-[#0a0d14]">23 of 47</span> dialed &middot; Paused yesterday at 4:38pm
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[6px] bg-[#0d4b3a] px-3.5 text-[12px] font-medium tracking-[-0.008em] text-white"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 4px 10px -2px rgba(13,75,58,0.28)" }}
          >
            Resume
            <IconArrowRight size={12} stroke={2.25} />
          </button>
        </div>

        <div className="mt-7 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
          Or Start A New Session
          <span className="h-px flex-1 bg-[#ebedf0]" />
        </div>

        <div
          className="mt-3 overflow-hidden rounded-[10px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Calling List</div>
            <button
              type="button"
              className="mt-1.5 flex w-full cursor-pointer items-center justify-between rounded-[6px] border border-[#ebedf0] bg-white px-3 py-2 text-left transition hover:border-[#d8d6cf]"
            >
              <div>
                <div className="text-[13px] font-semibold tracking-[-0.005em] text-[#0a0d14]">
                  Fort Bend County, Texas
                </div>
                <div className="mt-0.5 text-[10.5px] text-[#5b606a]">Imported Jun 21, 2026</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11.5px] font-medium tabular-nums text-[#5b606a]">47</span>
                <IconChevronDown size={12} stroke={2} className="text-[#9298a3]" />
              </div>
            </button>
          </div>

          <div className="border-t border-[#f1f2f4] px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Filter</div>
              <div className="flex items-baseline gap-1">
                <span className="text-[15px] font-semibold tabular-nums text-[#0a0d14]">28</span>
                <span className="text-[10.5px] text-[#9298a3]">from <span className="tabular-nums">47</span></span>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {[
                ["Stage", "Researched, First Contact"],
                ["State", "Texas"],
                ["Owner Status", "Living"],
                ["Surplus", "$20k Plus"],
                ["Last Touched", "Never"],
              ].map(([l, v]) => (
                <span
                  key={l}
                  className="inline-flex h-[22px] items-center gap-1 rounded-[5px] border border-[#ebedf0] bg-white px-2 text-[11px] font-medium tabular-nums text-[#1a1d24]"
                >
                  <span className="text-[#9298a3]">{l}:</span>
                  <span className="text-[#0a0d14]">{v}</span>
                  <IconX size={9} stroke={2.25} className="text-[#9298a3] opacity-45" />
                </span>
              ))}
              <button
                type="button"
                className="inline-flex h-[22px] cursor-pointer items-center gap-0.5 rounded-[5px] border border-dashed border-[#c2c5cc] bg-white px-1.5 text-[10.5px] font-medium text-[#5b606a]"
              >
                <IconPlus size={9} stroke={2.5} />
                Add
              </button>
            </div>
            <div className="mt-2.5 flex items-center gap-5 border-t border-[#f1f2f4] pt-2.5">
              <Toggle label="Skip DNC" on />
              <Toggle label="Skip Litigated" on />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#f1f2f4] px-4 py-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Defaults</div>
              <div className="mt-0.5 text-[11px] text-[#5b606a]">
                Using your saved defaults for caller ID, voicemail, wrap up, email, and SMS
              </div>
            </div>
            <button
              type="button"
              className="h-8 cursor-pointer rounded-[6px] bg-white px-3 text-[11.5px] font-medium text-[#0a0d14]"
              style={{ border: "1px solid #ebedf0", boxShadow: "0 1px 1px rgba(12,13,16,0.02)" }}
            >
              Edit
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5">
          <input
            type="text"
            placeholder="Name This List To Save It"
            className="h-9 flex-1 rounded-[6px] border border-[#ebedf0] bg-white px-3 text-[12.5px] text-[#0a0d14] outline-none transition focus:border-[#0d4b3a] placeholder:text-[#c2c5cc]"
          />
          <button
            type="button"
            className="h-9 cursor-pointer rounded-[6px] bg-white px-3 text-[12px] font-medium text-[#0a0d14]"
            style={{ border: "1px solid #ebedf0", boxShadow: "0 1px 1px rgba(12,13,16,0.02)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[6px] bg-[#0d4b3a] px-4 text-[12px] font-medium tracking-[-0.008em] text-white"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 4px 10px -2px rgba(13,75,58,0.28)" }}
          >
            Start Session
            <span className="rounded-[3px] bg-white/15 px-1 py-0.5 text-[10px] tabular-nums">28</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, on }: { label: string; on: boolean }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <span
        className={[
          "relative inline-flex h-[18px] w-[32px] shrink-0 rounded-full transition",
          on ? "bg-[#0d4b3a]" : "bg-[#d6d4cd]",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition",
            on ? "left-[16px]" : "left-[2px]",
          ].join(" ")}
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.20)" }}
        />
      </span>
      <span className="text-[11.5px] font-medium text-[#0a0d14]">{label}</span>
    </label>
  );
}
