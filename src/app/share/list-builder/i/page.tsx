"use client";

import {
  IconChevronDown,
  IconArrowRight,
  IconPlus,
  IconX,
} from "@tabler/icons-react";

export default function VariantI() {
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="mx-auto max-w-[880px] px-14 pb-32 pt-11">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#9298a3]">
          Variant I &middot; F Structure &middot; Featured Resume
        </div>
        <h1 className="mt-2 text-[30px] font-semibold leading-[1.15] tracking-[-0.028em] text-[#0a0d14]">
          Start A Dialer Session
        </h1>

        <div
          className="mt-7 flex overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02), 0 12px 32px -10px rgba(13,75,58,0.10)" }}
        >
          <div
            className="w-[5px] shrink-0"
            style={{ background: "linear-gradient(135deg, #0d4b3a 0%, #04261c 100%)" }}
          />
          <div className="flex flex-1 items-center justify-between gap-4 px-7 py-6">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#0d4b3a]">
                Resume Last Session
              </div>
              <div className="mt-2 text-[20px] font-semibold leading-[1.2] tracking-[-0.022em] text-[#0a0d14]">
                Fort Bend County, Texas
              </div>
              <div className="mt-1 text-[13px] text-[#5b606a]">
                <span className="font-semibold tabular-nums text-[#0a0d14]">23 of 47</span> dialed &middot; Paused yesterday at 4:38pm
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[7px] bg-[#0d4b3a] px-5 text-[13.5px] font-medium tracking-[-0.008em] text-white"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 8px 18px -4px rgba(13,75,58,0.34)" }}
            >
              Resume Session
              <IconArrowRight size={14} stroke={2.25} />
            </button>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
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
              <div className="mt-0.5 text-[11.5px] text-[#5b606a]">Imported Jun 21, 2026</div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[12.5px] font-medium tabular-nums text-[#5b606a]">47 Leads</span>
              <IconChevronDown size={14} stroke={2} className="text-[#9298a3]" />
            </div>
          </button>
        </SectionCard>

        <SectionCard
          eyebrow="Filter"
          right={
            <div className="flex items-baseline gap-1.5">
              <span className="text-[22px] font-semibold leading-[1.1] tabular-nums tracking-[-0.018em] text-[#0a0d14]">28</span>
              <span className="text-[12px] text-[#9298a3]">From <span className="tabular-nums">47</span></span>
            </div>
          }
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: "Stage", value: "Researched, First Contact" },
              { label: "State", value: "Texas" },
              { label: "Owner Status", value: "Living" },
              { label: "Surplus", value: "$20k Plus" },
              { label: "Last Touched", value: "Never" },
            ].map((f) => (
              <span
                key={f.label}
                className="inline-flex h-[24px] cursor-pointer items-center gap-1 rounded-[5px] border border-[#ebedf0] bg-white px-2.5 text-[11.75px] font-medium tabular-nums text-[#1a1d24] transition hover:border-[#d8d6cf]"
              >
                <span className="text-[#9298a3]">{f.label}:</span>
                <span className="text-[#0a0d14]">{f.value}</span>
                <IconX size={10} stroke={2.25} className="text-[#9298a3] opacity-45" />
              </span>
            ))}
            <button
              type="button"
              className="inline-flex h-[24px] cursor-pointer items-center gap-1 rounded-[5px] border border-dashed border-[#c2c5cc] bg-white px-2 text-[11px] font-medium text-[#5b606a] transition hover:border-[#0d4b3a] hover:text-[#0d4b3a]"
            >
              <IconPlus size={10} stroke={2.5} />
              Add Filter
            </button>
          </div>
          <div className="mt-4 flex items-center gap-6 border-t border-[#f1f2f4] pt-4">
            <Toggle label="Skip DNC" on />
            <Toggle label="Skip Litigated" on />
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Defaults"
          description="Using your saved defaults for caller ID, voicemail, wrap up, email, and SMS."
          right={
            <button
              type="button"
              className="h-9 cursor-pointer rounded-[7px] bg-white px-4 text-[13px] font-medium text-[#0a0d14] transition hover:border-[#d8d6cf]"
              style={{ border: "1px solid #ebedf0", boxShadow: "0 1px 1px rgba(12,13,16,0.02)" }}
            >
              Edit
            </button>
          }
        />

        <div className="mt-6 flex items-center gap-2">
          <input
            type="text"
            placeholder="Name This List To Save It (Optional)"
            className="h-[38px] flex-1 rounded-[7px] border border-[#ebedf0] bg-white px-3 text-[13.5px] text-[#0a0d14] outline-none transition focus:border-[#0d4b3a] placeholder:text-[#c2c5cc]"
          />
          <button
            type="button"
            className="h-[38px] cursor-pointer rounded-[7px] bg-white px-4 text-[13px] font-medium text-[#0a0d14] transition hover:border-[#d8d6cf]"
            style={{ border: "1px solid #ebedf0", boxShadow: "0 1px 1px rgba(12,13,16,0.02)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-[38px] cursor-pointer items-center gap-2 rounded-[7px] bg-[#0d4b3a] px-5 text-[13px] font-medium tracking-[-0.008em] text-white"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
          >
            Start Session
            <span className="rounded-[4px] bg-white/15 px-1.5 py-0.5 text-[11px] tabular-nums">28</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  eyebrow,
  right,
  description,
  children,
}: {
  eyebrow: string;
  right?: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="mt-5 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
      style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
    >
      <div className="flex items-start justify-between gap-6 px-6 py-5">
        <div className="min-w-0">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
            {eyebrow}
          </div>
          {description && (
            <div className="mt-1.5 max-w-[64ch] text-[12.5px] leading-[1.55] text-[#5b606a]">
              {description}
            </div>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {children && <div className="border-t border-[#f1f2f4] px-6 py-5">{children}</div>}
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
