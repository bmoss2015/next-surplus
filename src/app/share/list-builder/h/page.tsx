"use client";

import { useState } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconArrowRight,
  IconExternalLink,
} from "@tabler/icons-react";

export default function VariantH() {
  const [defaultsOpen, setDefaultsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="mx-auto max-w-[960px] px-12 pb-32 pt-12">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#9298a3]">
          Variant H &middot; F Structure &middot; Two Column Layout
        </div>
        <h1 className="mt-2.5 text-[30px] font-semibold leading-[1.15] tracking-[-0.028em] text-[#0a0d14]">
          Start A Dialer Session
        </h1>

        <div
          className="mt-7 flex items-center justify-between gap-6 rounded-[14px] border border-[#ebedf0] bg-white px-7 py-5"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="flex items-center gap-5">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #0d4b3a 0%, #04261c 100%)" }}
            >
              <IconArrowRight size={18} stroke={2} />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0d4b3a]">
                Resume Last Session
              </div>
              <div className="mt-1 text-[16px] font-semibold tracking-[-0.018em] text-[#0a0d14]">
                Fort Bend County, Texas
              </div>
              <div className="mt-0.5 text-[12px] text-[#5b606a]">
                <span className="font-semibold tabular-nums text-[#0a0d14]">23 of 47</span> Dialed &middot; Paused Yesterday At 4:38pm
              </div>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[7px] bg-[#0d4b3a] px-5 text-[13.5px] font-medium tracking-[-0.008em] text-white"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
          >
            Resume
            <IconArrowRight size={13} stroke={2.25} />
          </button>
        </div>

        <div className="mt-10 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
          Or Start A New Session
          <span className="h-px flex-1 bg-[#ebedf0]" />
        </div>

        <div className="mt-4 grid grid-cols-[1fr_320px] gap-5">
          <div>
            <SectionCard eyebrow="Calling List" title="Pick A Base Set">
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-between rounded-[7px] border border-[#ebedf0] bg-white px-4 py-3 text-left transition hover:border-[#d8d6cf]"
              >
                <div>
                  <div className="text-[14px] font-semibold tracking-[-0.005em] text-[#0a0d14]">
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

            <SectionCard eyebrow="Filter" title="Trim The List" noChildrenPadding>
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
                  <div className="flex items-center gap-5">
                    <Toggle label="DNC" on />
                    <Toggle label="Litigated" on />
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
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[7px] bg-white px-3.5 text-[12.5px] font-medium text-[#0a0d14] transition hover:border-[#d8d6cf]"
                  style={{ border: "1px solid #ebedf0", boxShadow: "0 1px 1px rgba(12,13,16,0.02)" }}
                >
                  {defaultsOpen ? "Hide" : "Edit"}
                  {defaultsOpen ? <IconChevronUp size={12} stroke={2} className="text-[#9298a3]" /> : <IconChevronDown size={12} stroke={2} className="text-[#9298a3]" />}
                </button>
              }
            >
              {defaultsOpen && (
                <div className="divide-y divide-[#f1f2f4]">
                  <DefaultRow label="Caller ID" value="Auto Map By State" />
                  <DefaultRow label="Voicemail" value="Off" />
                  <DefaultRow label="Wrap Up" value="30 Seconds" />
                  <DefaultRow label="Email Followup" value="Auto Sent After Each Call" />
                  <DefaultRow label="SMS Followup" value="Not Ready Until Approved" muted />
                </div>
              )}
            </SectionCard>
          </div>

          <div className="self-start">
            <div
              className="overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
              style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
            >
              <div className="border-b border-[#f1f2f4] px-5 py-4">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
                  Ready To Launch
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-[36px] font-semibold leading-none tabular-nums tracking-[-0.025em] text-[#0a0d14]">28</span>
                  <span className="text-[13px] font-medium text-[#5b606a]">Leads</span>
                </div>
                <div className="mt-1 text-[11.5px] text-[#9298a3]">
                  From <span className="tabular-nums">47</span> in Fort Bend County
                </div>
              </div>
              <div className="border-b border-[#f1f2f4] px-5 py-4 text-[11.5px] text-[#5b606a]">
                Using your saved defaults. <button className="cursor-pointer text-[#0d4b3a] hover:text-[#13644e]">Review</button>
              </div>
              <div className="px-5 py-4">
                <input
                  type="text"
                  placeholder="Name This List To Save It"
                  className="h-10 w-full rounded-[7px] border border-[#ebedf0] bg-white px-3 text-[13px] text-[#0a0d14] outline-none transition focus:border-[#0d4b3a] placeholder:text-[#c2c5cc]"
                />
                <button
                  type="button"
                  className="mt-3 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[7px] bg-[#0d4b3a] text-[14px] font-medium tracking-[-0.008em] text-white"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 8px 20px -4px rgba(13,75,58,0.34)" }}
                >
                  Start Session
                  <IconArrowRight size={14} stroke={2.25} />
                </button>
                <button
                  type="button"
                  className="mt-2 h-10 w-full cursor-pointer rounded-[7px] bg-white text-[12.5px] font-medium text-[#5b606a] transition hover:text-[#0a0d14]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
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
      className="mt-4 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white first:mt-0"
      style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
    >
      <div className="flex items-start justify-between gap-6 px-6 py-4">
        <div className="min-w-0">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
            {eyebrow}
          </div>
          {title && (
            <div className="mt-1 text-[15px] font-semibold leading-[1.25] tracking-[-0.018em] text-[#0a0d14]">
              {title}
            </div>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {children && (
        <div className={["border-t border-[#f1f2f4]", noChildrenPadding ? "" : "px-6 py-4"].join(" ")}>
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
    <div className="flex items-center justify-between border-b border-[#f1f2f4] px-6 py-3 last:border-b-0">
      <div className="text-[12.5px] font-medium tracking-[-0.005em] text-[#0a0d14]">{label}</div>
      {customControl ? (
        customControl
      ) : (
        <button
          type="button"
          className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-[7px] bg-white px-3 text-[12px] font-medium text-[#0a0d14] transition hover:border-[#d8d6cf]"
          style={{ border: "1px solid #ebedf0", boxShadow: "0 1px 1px rgba(12,13,16,0.02)" }}
        >
          {value}
          <IconChevronDown size={11} stroke={2} className="text-[#9298a3]" />
        </button>
      )}
    </div>
  );
}

function DefaultRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3.5">
      <div className="text-[12.5px] font-medium text-[#0a0d14]">{label}</div>
      <div className="flex items-center gap-3">
        <span className={["text-[12.5px] font-medium", muted ? "text-[#9298a3]" : "text-[#0a0d14]"].join(" ")}>
          {value}
        </span>
        <button
          type="button"
          className="cursor-pointer text-[11.5px] font-medium text-[#0d4b3a] hover:text-[#13644e]"
        >
          Change
        </button>
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
      <span className="text-[12px] font-medium text-[#0a0d14]">{label}</span>
    </label>
  );
}
