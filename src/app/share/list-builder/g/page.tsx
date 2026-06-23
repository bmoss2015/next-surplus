"use client";

import { useState } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconArrowRight,
  IconExternalLink,
} from "@tabler/icons-react";

export default function VariantG() {
  const [defaultsOpen, setDefaultsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="mx-auto max-w-[880px] px-14 pb-32 pt-12">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#9298a3]">
          Variant G &middot; F Structure &middot; Hero Dark Resume
        </div>
        <h1 className="mt-2.5 text-[30px] font-semibold leading-[1.15] tracking-[-0.028em] text-[#0a0d14]">
          Start A Dialer Session
        </h1>

        <div
          className="relative mt-8 overflow-hidden rounded-[14px] px-8 py-7"
          style={{
            background:
              "radial-gradient(120% 140% at 100% 0%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(80% 120% at 0% 100%, rgba(40,130,100,0.55) 0%, transparent 70%), linear-gradient(135deg, #0d4b3a 0%, #04261c 100%)",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 48px -12px rgba(13,75,58,0.30), 0 8px 16px -8px rgba(13,75,58,0.20)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              maskImage: "radial-gradient(80% 80% at 80% 20%, #000 0%, transparent 70%)",
              WebkitMaskImage: "radial-gradient(80% 80% at 80% 20%, #000 0%, transparent 70%)",
              opacity: 0.42,
            }}
          />
          <div className="relative">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/55">
                  Resume Last Session
                </div>
                <div className="mt-2 text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-white">
                  Fort Bend County, Texas
                </div>
                <div className="mt-1.5 text-[13px] text-white/72">
                  Paused Yesterday At 4:38pm
                </div>
              </div>
              <button
                type="button"
                className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[7px] bg-white px-5 text-[13.5px] font-medium tracking-[-0.008em] text-[#0d4b3a]"
                style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.06), 0 2px 8px -2px rgba(12,13,16,0.12)" }}
              >
                Resume Session
                <IconArrowRight size={14} stroke={2.25} />
              </button>
            </div>
            <div className="mt-6 grid grid-cols-4 border-t border-white/12 pt-5">
              <HeroStat num="23" lab="Dialed" />
              <HeroStat num="24" lab="Remaining" />
              <HeroStat num="$48k" lab="Avg Surplus" />
              <HeroStat num="2h 12m" lab="Est. Time Left" />
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
          Or Start A New Session
          <span className="h-px flex-1 bg-[#ebedf0]" />
        </div>

        <SectionCard eyebrow="Calling List" title="Pick A Base Set">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-[7px] border border-[#ebedf0] bg-white px-5 py-3.5 text-left transition hover:border-[#d8d6cf]"
          >
            <div>
              <div className="text-[15px] font-semibold tracking-[-0.005em] text-[#0a0d14]">
                Fort Bend County, Texas
              </div>
              <div className="mt-1 text-[12.5px] text-[#5b606a]">Imported Jun 21, 2026</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13.5px] font-medium tabular-nums text-[#5b606a]">47 Leads</span>
              <IconChevronDown size={15} stroke={2} className="text-[#9298a3]" />
            </div>
          </button>
        </SectionCard>

        <SectionCard
          eyebrow="Filter"
          title="Trim The List Before You Dial"
          right={
            <div className="text-right">
              <div className="text-[22px] font-semibold leading-[1.1] tabular-nums tracking-[-0.018em] text-[#0a0d14]">28</div>
              <div className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
                Leads After Filters
              </div>
            </div>
          }
          noChildrenPadding
        >
          <FilterRow label="Stage" value="Researched, First Contact" />
          <FilterRow label="State" value="Texas" />
          <FilterRow label="County" value="Fort Bend" />
          <FilterRow label="Sale Type" value="Tax Sale" />
          <FilterRow label="Owner Status" value="Living" />
          <FilterRow label="Surplus" value="$20,000 To No Max" />
          <FilterRow label="Last Touched" value="Never" />
          <FilterRow
            label="Compliance"
            customControl={
              <div className="flex items-center gap-6">
                <Toggle label="Skip DNC" on />
                <Toggle label="Skip Litigated" on />
              </div>
            }
          />
        </SectionCard>

        <SectionCard
          eyebrow="Defaults"
          right={
            <button
              type="button"
              onClick={() => setDefaultsOpen((o) => !o)}
              className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-[7px] bg-white px-4 text-[13.5px] font-medium text-[#0a0d14] transition hover:border-[#d8d6cf]"
              style={{ border: "1px solid #ebedf0", boxShadow: "0 1px 1px rgba(12,13,16,0.02)" }}
            >
              {defaultsOpen ? "Hide" : "Edit"}
              {defaultsOpen ? <IconChevronUp size={13} stroke={2} className="text-[#9298a3]" /> : <IconChevronDown size={13} stroke={2} className="text-[#9298a3]" />}
            </button>
          }
        >
          {defaultsOpen && (
            <div className="divide-y divide-[#f1f2f4]">
              <DefaultRow label="Caller ID" value="Auto Map By State" subtitle="Picks a number local to each lead's state." />
              <DefaultRow label="Voicemail" value="Off" subtitle="You'll handle voicemail manually until you upload a recording." />
              <DefaultRow label="Wrap Up" value="30 Seconds" subtitle="Pause after a live conversation to finish notes." />
              <DefaultRow label="Email Followup" value="Auto Sent After Each Call" subtitle="Sends a different email per call outcome." />
              <DefaultRow label="SMS Followup" value="Not Ready Until Approved" subtitle="Unlocks after A2P 10DLC approval." muted />
            </div>
          )}
        </SectionCard>

        <SaveBar />
      </div>
    </div>
  );
}

function HeroStat({ num, lab }: { num: string; lab: string }) {
  return (
    <div className="border-l border-white/10 pl-5 first:border-l-0 first:pl-0">
      <div className="text-[28px] font-semibold leading-none tabular-nums tracking-[-0.025em] text-white">
        {num}
      </div>
      <div className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-white/55">
        {lab}
      </div>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  right,
  children,
  noChildrenPadding,
}: {
  eyebrow: string;
  title?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  noChildrenPadding?: boolean;
}) {
  return (
    <div
      className="mt-5 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
      style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
    >
      <div className="flex items-start justify-between gap-6 px-7 py-5">
        <div className="min-w-0">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
            {eyebrow}
          </div>
          {title && (
            <div className="mt-2 text-[16px] font-semibold leading-[1.25] tracking-[-0.018em] text-[#0a0d14]">
              {title}
            </div>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {children && (
        <div className={["border-t border-[#f1f2f4]", noChildrenPadding ? "" : "px-7 py-5"].join(" ")}>
          {children}
        </div>
      )}
    </div>
  );
}

function FilterRow({
  label,
  value,
  customControl,
}: {
  label: string;
  value?: string;
  customControl?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#f1f2f4] px-7 py-3.5 last:border-b-0">
      <div className="text-[13px] font-medium tracking-[-0.005em] text-[#0a0d14]">{label}</div>
      {customControl ? (
        customControl
      ) : (
        <button
          type="button"
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[7px] bg-white px-3.5 text-[12.5px] font-medium text-[#0a0d14] transition hover:border-[#d8d6cf]"
          style={{ border: "1px solid #ebedf0", boxShadow: "0 1px 1px rgba(12,13,16,0.02)" }}
        >
          {value}
          <IconChevronDown size={12} stroke={2} className="text-[#9298a3]" />
        </button>
      )}
    </div>
  );
}

function DefaultRow({
  label,
  value,
  subtitle,
  muted,
}: {
  label: string;
  value: string;
  subtitle: string;
  muted?: boolean;
}) {
  return (
    <div className="grid grid-cols-[160px_1fr_auto] items-start gap-6 px-7 py-5">
      <div className="pt-1 text-[12.5px] font-medium text-[#0a0d14]">{label}</div>
      <div>
        <div className={["text-[13.5px] font-medium", muted ? "text-[#9298a3]" : "text-[#0a0d14]"].join(" ")}>
          {value}
        </div>
        <div className="mt-1.5 text-[12px] leading-[1.55] text-[#5b606a]">{subtitle}</div>
      </div>
      <button
        type="button"
        className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-[6px] bg-white px-2.5 text-[12px] font-medium text-[#5b606a] transition hover:text-[#0a0d14]"
        style={{ border: "1px solid #ebedf0" }}
      >
        Change
        <IconExternalLink size={11} stroke={2} className="text-[#9298a3]" />
      </button>
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

function SaveBar() {
  return (
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
  );
}
