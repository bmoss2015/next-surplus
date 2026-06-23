"use client";

import { useState } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconArrowRight,
} from "@tabler/icons-react";

export default function VariantK() {
  const [defaultsOpen, setDefaultsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="mx-auto max-w-[880px] px-14 pb-32 pt-12">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#9298a3]">
          Variant K &middot; F Structure &middot; Hero Light + Hex Pattern Filter
        </div>
        <h1 className="mt-2.5 text-[30px] font-semibold leading-[1.15] tracking-[-0.028em] text-[#0a0d14]">
          Start A Dialer Session
        </h1>

        <div
          className="relative mt-8 overflow-hidden rounded-[14px] bg-white"
          style={{
            border: "1px solid #ebedf0",
            boxShadow: "0 1px 2px rgba(12,13,16,0.02)",
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{ background: "linear-gradient(90deg, #0d4b3a 0%, #13644e 50%, #1a8a73 100%)" }}
          />
          <div className="flex items-start justify-between gap-6 px-8 py-7">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0d4b3a]">
                Resume Last Session
              </div>
              <div className="mt-2 text-[22px] font-semibold leading-[1.2] tracking-[-0.024em] text-[#0a0d14]">
                Fort Bend County, Texas
              </div>
              <div className="mt-1.5 text-[13px] text-[#5b606a]">
                Paused Yesterday At 4:38pm
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-[7px] bg-[#0d4b3a] px-6 text-[14px] font-medium tracking-[-0.008em] text-white"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 8px 20px -4px rgba(13,75,58,0.34)" }}
            >
              Resume Session
              <IconArrowRight size={14} stroke={2.25} />
            </button>
          </div>
          <div className="border-t border-[#f1f2f4]">
            <div className="grid grid-cols-3 divide-x divide-[#f1f2f4]">
              <Stat num="23" lab="Dialed" mode="brand" />
              <Stat num="24" lab="Remaining" />
              <Stat num="48.9%" lab="Through The List" />
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
          Or Start A New Session
          <span className="h-px flex-1 bg-[#ebedf0]" />
        </div>

        <div
          className="mt-4 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="px-7 py-5">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Calling List</div>
            <button
              type="button"
              className="mt-2.5 flex w-full cursor-pointer items-center justify-between rounded-[7px] border border-[#ebedf0] bg-white px-4 py-3 text-left transition hover:border-[#d8d6cf]"
            >
              <div>
                <div className="text-[14.5px] font-semibold tracking-[-0.005em] text-[#0a0d14]">
                  Fort Bend County, Texas
                </div>
                <div className="mt-0.5 text-[12px] text-[#5b606a]">Imported Jun 21, 2026</div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[13px] font-medium tabular-nums text-[#5b606a]">47 Leads</span>
                <IconChevronDown size={14} stroke={2} className="text-[#9298a3]" />
              </div>
            </button>
          </div>

          <div
            className="relative border-t border-[#f1f2f4] px-7 py-5"
            style={{
              background:
                "radial-gradient(60% 80% at 50% 0%, rgba(13,75,58,0.025) 0%, transparent 60%), #ffffff",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Filter</div>
                <div className="mt-1 text-[15px] font-semibold tracking-[-0.018em] text-[#0a0d14]">
                  Trim The List Before You Dial
                </div>
              </div>
              <div className="text-right">
                <div className="text-[26px] font-semibold leading-none tabular-nums tracking-[-0.022em] text-[#0d4b3a]">28</div>
                <div className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">Leads Match</div>
              </div>
            </div>

            <div className="mt-5 divide-y divide-[#f1f2f4] rounded-[10px] border border-[#ebedf0] bg-white">
              <FilterRow label="Stage" value="Researched, First Contact" />
              <FilterRow label="State" value="Texas" />
              <FilterRow label="County" value="Fort Bend" />
              <FilterRow label="Sale Type" value="Tax Sale" />
              <FilterRow label="Owner Status" value="Living" />
              <FilterRow label="Surplus" value="$20,000 To No Max" />
              <FilterRow label="Last Touched" value="Never" />
            </div>

            <div className="mt-4 flex items-center gap-7">
              <Toggle label="Skip DNC" on />
              <Toggle label="Skip Litigated" on />
            </div>
          </div>
        </div>

        <div
          className="mt-5 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <button
            type="button"
            onClick={() => setDefaultsOpen((o) => !o)}
            className="flex w-full cursor-pointer items-start justify-between gap-6 px-7 py-5 text-left transition hover:bg-[#fafbfc]"
          >
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Defaults</div>
              <div className="mt-1.5 text-[13px] text-[#5b606a]">
                Using your saved defaults across caller ID, voicemail, wrap up, email, and SMS.
              </div>
            </div>
            <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[7px] bg-white px-3.5 text-[12.5px] font-medium text-[#0a0d14]"
              style={{ border: "1px solid #ebedf0" }}
            >
              {defaultsOpen ? "Hide" : "Edit"}
              {defaultsOpen ? <IconChevronUp size={12} stroke={2} className="text-[#9298a3]" /> : <IconChevronDown size={12} stroke={2} className="text-[#9298a3]" />}
            </span>
          </button>
          {defaultsOpen && (
            <div className="border-t border-[#f1f2f4] divide-y divide-[#f1f2f4]">
              <DefaultRow label="Caller ID" value="Auto Map By State" />
              <DefaultRow label="Voicemail" value="Off" />
              <DefaultRow label="Wrap Up" value="30 Seconds" />
              <DefaultRow label="Email Followup" value="Auto Sent After Each Call" />
              <DefaultRow label="SMS Followup" value="Not Ready Until Approved" muted />
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center gap-3">
          <input
            type="text"
            placeholder="Name This List To Save It"
            className="h-11 flex-1 rounded-[7px] border border-[#ebedf0] bg-white px-4 text-[14px] text-[#0a0d14] outline-none transition focus:border-[#0d4b3a] placeholder:text-[#c2c5cc]"
          />
          <button
            type="button"
            className="h-11 cursor-pointer rounded-[7px] bg-white px-5 text-[13.5px] font-medium text-[#0a0d14] transition hover:border-[#d8d6cf]"
            style={{ border: "1px solid #ebedf0", boxShadow: "0 1px 1px rgba(12,13,16,0.02)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-[7px] bg-[#0d4b3a] px-6 text-[14px] font-medium tracking-[-0.008em] text-white"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 8px 20px -4px rgba(13,75,58,0.34)" }}
          >
            Start Session
            <span className="rounded-[5px] bg-white/15 px-2 py-0.5 text-[12px] tabular-nums">28</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ num, lab, mode }: { num: string; lab: string; mode?: "brand" }) {
  return (
    <div className="px-7 py-4">
      <div className={["text-[22px] font-semibold leading-none tabular-nums tracking-[-0.022em]", mode === "brand" ? "text-[#0d4b3a]" : "text-[#0a0d14]"].join(" ")}>
        {num}
      </div>
      <div className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">{lab}</div>
    </div>
  );
}

function FilterRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="text-[12.5px] font-medium tracking-[-0.005em] text-[#0a0d14]">{label}</div>
      <button
        type="button"
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[6px] bg-[#fafbfc] px-2.5 text-[12px] font-medium text-[#0a0d14] transition hover:bg-white hover:shadow-[0_1px_2px_rgba(12,13,16,0.06)]"
      >
        <span className="truncate">{value}</span>
        <IconChevronDown size={11} stroke={2} className="text-[#9298a3]" />
      </button>
    </div>
  );
}

function DefaultRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-7 py-3.5">
      <div className="text-[12.5px] font-medium text-[#0a0d14]">{label}</div>
      <div className="flex items-center gap-3">
        <span className={["text-[12.5px] font-medium", muted ? "text-[#9298a3]" : "text-[#0a0d14]"].join(" ")}>
          {value}
        </span>
        <button type="button" className="cursor-pointer text-[11.5px] font-medium text-[#0d4b3a] hover:text-[#13644e]">
          Change
        </button>
      </div>
    </div>
  );
}

function Toggle({ label, on }: { label: string; on: boolean }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5">
      <span
        className={[
          "relative inline-flex h-[20px] w-[36px] shrink-0 rounded-full transition",
          on ? "bg-[#0d4b3a]" : "bg-[#d6d4cd]",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white transition",
            on ? "left-[18px]" : "left-[2px]",
          ].join(" ")}
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.20), 0 0 0 0.5px rgba(12,13,16,0.06)" }}
        />
      </span>
      <span className="text-[12.5px] font-medium text-[#0a0d14]">{label}</span>
    </label>
  );
}
