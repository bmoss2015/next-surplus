"use client";

import { useState } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconArrowRight,
  IconCircleCheck,
} from "@tabler/icons-react";

export default function VariantJ() {
  const [defaultsOpen, setDefaultsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="mx-auto max-w-[920px] px-14 pb-32 pt-12">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#9298a3]">
          Variant J &middot; F Structure &middot; Side Accent Resume + Grid Filter
        </div>
        <h1 className="mt-2.5 text-[30px] font-semibold leading-[1.15] tracking-[-0.028em] text-[#0a0d14]">
          Start A Dialer Session
        </h1>

        <div
          className="relative mt-8 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white px-7 py-6"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02), 0 8px 22px -8px rgba(13,75,58,0.14)" }}
        >
          <div
            className="absolute right-0 top-0 h-full w-[160px] opacity-[0.06]"
            style={{
              background: "radial-gradient(circle at 100% 0%, #0d4b3a 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />
          <div className="relative grid grid-cols-[1fr_auto] items-center gap-6">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0d4b3a]">
                <span className="h-[6px] w-[6px] rounded-full bg-[#0d4b3a]" style={{ boxShadow: "0 0 0 3px rgba(13,75,58,0.18)" }} />
                Resume Last Session
              </div>
              <div className="mt-2.5 text-[20px] font-semibold leading-[1.2] tracking-[-0.022em] text-[#0a0d14]">
                Fort Bend County, Texas
              </div>
              <div className="mt-3 grid grid-cols-3 gap-5 border-t border-[#f1f2f4] pt-3.5">
                <Stat num="23" lab="Dialed" />
                <Stat num="24" lab="Remaining" />
                <Stat num="$48k" lab="Avg Surplus" />
              </div>
              <div className="mt-2.5 text-[11.5px] text-[#9298a3]">Paused Yesterday At 4:38pm</div>
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
        </div>

        <div className="mt-10 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
          Or Start A New Session
          <span className="h-px flex-1 bg-[#ebedf0]" />
        </div>

        <SectionCard eyebrow="Calling List">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-[7px] border border-[#ebedf0] bg-white px-4 py-3 text-left transition hover:border-[#d8d6cf]"
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
        </SectionCard>

        <div
          className="mt-5 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="flex items-start justify-between gap-6 px-7 py-5">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Filter</div>
              <div className="mt-1.5 text-[16px] font-semibold tracking-[-0.018em] text-[#0a0d14]">Trim The List</div>
            </div>
            <div className="text-right">
              <div className="text-[26px] font-semibold leading-none tabular-nums tracking-[-0.022em] text-[#0a0d14]">28</div>
              <div className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
                Leads Match
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0 border-t border-[#f1f2f4]">
            <FilterCell label="Stage" value="Researched, First Contact" />
            <FilterCell label="State" value="Texas" />
            <FilterCell label="County" value="Fort Bend" />
            <FilterCell label="Sale Type" value="Tax Sale" />
            <FilterCell label="Owner Status" value="Living" />
            <FilterCell label="Surplus" value="$20,000+" />
            <FilterCell label="Last Touched" value="Never" />
            <FilterCell label="Has Notes" value="Any" />
          </div>
          <div className="flex items-center gap-6 border-t border-[#f1f2f4] px-7 py-4">
            <Toggle label="Skip DNC" on />
            <Toggle label="Skip Litigated" on />
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
                Auto map by state, voicemail off, 30 sec wrap up, auto email per outcome
              </div>
            </div>
            <span className="inline-flex h-9 shrink-0 items-center gap-1.5 text-[12.5px] font-medium text-[#0d4b3a]">
              {defaultsOpen ? "Hide" : "Edit"}
              {defaultsOpen ? <IconChevronUp size={12} stroke={2} /> : <IconChevronDown size={12} stroke={2} />}
            </span>
          </button>
          {defaultsOpen && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-0 border-t border-[#f1f2f4]">
              <DefaultCell label="Caller ID" value="Auto Map By State" />
              <DefaultCell label="Voicemail" value="Off" />
              <DefaultCell label="Wrap Up" value="30 Seconds" />
              <DefaultCell label="Email Followup" value="Auto Sent" />
              <DefaultCell label="SMS Followup" value="Not Ready" muted />
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

function Stat({ num, lab }: { num: string; lab: string }) {
  return (
    <div>
      <div className="text-[20px] font-semibold leading-none tabular-nums tracking-[-0.022em] text-[#0a0d14]">{num}</div>
      <div className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">{lab}</div>
    </div>
  );
}

function SectionCard({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div
      className="mt-5 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
      style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
    >
      <div className="border-b border-[#f1f2f4] px-7 py-4">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">{eyebrow}</div>
      </div>
      <div className="px-7 py-5">{children}</div>
    </div>
  );
}

function FilterCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#f1f2f4] px-7 py-3.5 [&:nth-last-child(-n+2)]:border-b-0 [&:nth-child(odd)]:border-r [&:nth-child(odd)]:border-r-[#f1f2f4]">
      <div className="text-[12.5px] font-medium text-[#5b606a]">{label}</div>
      <button
        type="button"
        className="inline-flex max-w-[60%] cursor-pointer items-center gap-1.5 rounded-[6px] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#0a0d14] transition hover:border-[#d8d6cf]"
        style={{ border: "1px solid #ebedf0" }}
      >
        <span className="truncate">{value}</span>
        <IconChevronDown size={11} stroke={2} className="shrink-0 text-[#9298a3]" />
      </button>
    </div>
  );
}

function DefaultCell({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[#f1f2f4] px-7 py-3.5 last:border-b-0 [&:nth-last-child(-n+2)]:border-b-0 [&:nth-child(odd)]:border-r [&:nth-child(odd)]:border-r-[#f1f2f4]">
      <div className="text-[12px] font-medium text-[#5b606a]">{label}</div>
      <div className="flex items-center gap-2">
        <span className={["text-[12px] font-medium", muted ? "text-[#9298a3]" : "text-[#0a0d14]"].join(" ")}>
          {value}
        </span>
        <button type="button" className="cursor-pointer text-[11px] font-medium text-[#0d4b3a] hover:text-[#13644e]">
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
