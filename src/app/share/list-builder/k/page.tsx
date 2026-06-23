"use client";

import {
  IconChevronDown,
  IconArrowRight,
  IconPlus,
  IconX,
} from "@tabler/icons-react";

export default function VariantK() {
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="mx-auto max-w-[960px] px-16 pb-40 pt-14">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#9298a3]">
          Variant K &middot; F Structure &middot; Comfortable Spacious
        </div>
        <h1 className="mt-2.5 text-[34px] font-semibold leading-[1.12] tracking-[-0.028em] text-[#0a0d14]">
          Start A Dialer Session
        </h1>
        <p className="mt-4 max-w-[60ch] text-[15px] leading-[1.55] tracking-[-0.005em] text-[#5b606a]">
          Resume the session you paused yesterday, or build a fresh list and start dialing in two clicks.
        </p>

        <div
          className="mt-9 flex items-center justify-between gap-6 rounded-[14px] border border-[#ebedf0] bg-white px-7 py-6"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02), 0 6px 18px -8px rgba(13,75,58,0.10)" }}
        >
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0d4b3a]">
              Resume Last Session
            </div>
            <div className="mt-2 text-[18px] font-semibold leading-[1.2] tracking-[-0.018em] text-[#0a0d14]">
              Fort Bend County, Texas
            </div>
            <div className="mt-1.5 text-[13px] text-[#5b606a]">
              <span className="font-semibold tabular-nums text-[#0a0d14]">23 of 47</span> dialed &middot; Paused yesterday at 4:38pm
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[8px] bg-[#0d4b3a] px-6 text-[14px] font-medium tracking-[-0.008em] text-white"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 8px 20px -4px rgba(13,75,58,0.34)" }}
          >
            Resume Session
            <IconArrowRight size={14} stroke={2.25} />
          </button>
        </div>

        <div className="mt-12 flex items-center gap-3 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
          Or Start A New Session
          <span className="h-px flex-1 bg-[#ebedf0]" />
        </div>

        <SectionCard eyebrow="Calling List" title="Pick A Base Set" description="Choose a recent import, a saved list, or everyone in your database.">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-[8px] border border-[#ebedf0] bg-white px-5 py-3.5 text-left transition hover:border-[#d8d6cf]"
          >
            <div>
              <div className="text-[15.5px] font-semibold tracking-[-0.005em] text-[#0a0d14]">
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
          description="Each filter narrows the set. The count on the right updates live."
          right={
            <div className="flex items-baseline gap-1.5">
              <span className="text-[28px] font-semibold leading-[1.1] tabular-nums tracking-[-0.022em] text-[#0a0d14]">28</span>
              <span className="text-[13px] text-[#9298a3]">From <span className="tabular-nums">47</span></span>
            </div>
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            {[
              ["Stage", "Researched, First Contact"],
              ["State", "Texas"],
              ["Owner Status", "Living"],
              ["Surplus", "$20k Plus"],
              ["Last Touched", "Never"],
            ].map(([l, v]) => (
              <span
                key={l}
                className="inline-flex h-[28px] cursor-pointer items-center gap-1.5 rounded-[6px] border border-[#ebedf0] bg-white px-3 text-[12.5px] font-medium tabular-nums text-[#1a1d24] transition hover:border-[#d8d6cf]"
              >
                <span className="text-[#9298a3]">{l}:</span>
                <span className="text-[#0a0d14]">{v}</span>
                <IconX size={11} stroke={2.25} className="text-[#9298a3] opacity-45" />
              </span>
            ))}
            <button
              type="button"
              className="inline-flex h-[28px] cursor-pointer items-center gap-1 rounded-[6px] border border-dashed border-[#c2c5cc] bg-white px-2.5 text-[12px] font-medium text-[#5b606a] transition hover:border-[#0d4b3a] hover:text-[#0d4b3a]"
            >
              <IconPlus size={11} stroke={2.5} />
              Add Filter
            </button>
          </div>
          <div className="mt-5 flex items-center gap-7 border-t border-[#f1f2f4] pt-4">
            <Toggle label="Skip DNC" on />
            <Toggle label="Skip Litigated" on />
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Defaults"
          title="Caller ID, Voicemail, Wrap Up, Email, And SMS"
          description="Using your saved defaults from Settings. Edit any one for just this session without changing the global default."
          right={
            <button
              type="button"
              className="h-10 cursor-pointer rounded-[8px] bg-white px-5 text-[13.5px] font-medium text-[#0a0d14] transition hover:border-[#d8d6cf]"
              style={{ border: "1px solid #ebedf0", boxShadow: "0 1px 1px rgba(12,13,16,0.02)" }}
            >
              Edit Defaults
            </button>
          }
        />

        <div className="mt-8 flex items-center gap-3">
          <input
            type="text"
            placeholder="Name This List To Save It (Optional)"
            className="h-11 flex-1 rounded-[8px] border border-[#ebedf0] bg-white px-4 text-[14px] text-[#0a0d14] outline-none transition focus:border-[#0d4b3a] placeholder:text-[#c2c5cc]"
          />
          <button
            type="button"
            className="h-11 cursor-pointer rounded-[8px] bg-white px-5 text-[13.5px] font-medium text-[#0a0d14] transition hover:border-[#d8d6cf]"
            style={{ border: "1px solid #ebedf0", boxShadow: "0 1px 1px rgba(12,13,16,0.02)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-[8px] bg-[#0d4b3a] px-6 text-[14px] font-medium tracking-[-0.008em] text-white"
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

function SectionCard({
  eyebrow,
  title,
  description,
  right,
  children,
}: {
  eyebrow: string;
  title?: string;
  description?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="mt-6 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
      style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
    >
      <div className="flex items-start justify-between gap-7 px-7 py-6">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
            {eyebrow}
          </div>
          {title && (
            <div className="mt-2 text-[17px] font-semibold leading-[1.25] tracking-[-0.018em] text-[#0a0d14]">
              {title}
            </div>
          )}
          {description && (
            <div className="mt-2 max-w-[64ch] text-[13px] leading-[1.55] text-[#5b606a]">
              {description}
            </div>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {children && <div className="border-t border-[#f1f2f4] px-7 py-6">{children}</div>}
    </div>
  );
}

function Toggle({ label, on }: { label: string; on: boolean }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3">
      <span
        className={[
          "relative inline-flex h-[22px] w-[40px] shrink-0 rounded-full transition",
          on ? "bg-[#0d4b3a]" : "bg-[#d6d4cd]",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white transition",
            on ? "left-[20px]" : "left-[2px]",
          ].join(" ")}
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.20), 0 0 0 0.5px rgba(12,13,16,0.06)" }}
        />
      </span>
      <span className="text-[13.5px] font-medium text-[#0a0d14]">{label}</span>
    </label>
  );
}
