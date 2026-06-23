"use client";

import {
  IconPlus,
  IconPhone,
  IconMessageCircle,
  IconChevronRight,
  IconDots,
  IconClock,
  IconCheck,
} from "@tabler/icons-react";
import { NUMBERS } from "../_data";

export default function PNVariantD() {
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="mx-auto max-w-[960px] px-12 pb-32 pt-11">
        <div className="text-[12px] text-[#9298a3] flex items-center gap-1.5">
          <span>Settings</span>
          <IconChevronRight size={12} stroke={2} className="text-[#c2c5cc]" />
          <span>Phone Numbers</span>
        </div>

        <div className="mt-3 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.028em] text-[#0a0d14]">
              Phone Numbers
            </h1>
            <p className="mt-4 max-w-[60ch] text-[14px] leading-[1.55] text-[#5b606a]">
              Variant D &middot; The per-number view. Each number gets its own rich card with usage at a glance.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#0d4b3a] px-4 text-[13px] font-medium text-white"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
          >
            <IconPlus size={13} stroke={2.25} />
            Buy A Number
          </button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          {NUMBERS.map((n) => (
            <div
              key={n.id}
              className="group relative overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white transition hover:border-[#d8d6cf]"
              style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02), 0 4px 12px -4px rgba(12,13,16,0.06)" }}
            >
              <div
                className="absolute right-0 top-0 h-full w-[140px] opacity-[0.04]"
                style={{ background: "radial-gradient(circle at 100% 0%, #0d4b3a 0%, transparent 60%)", pointerEvents: "none" }}
              />
              <div className="relative px-5 pb-3 pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#9298a3]">
                      {n.city}, {n.state.split(" ").map((w) => w[0]).join("")}
                    </div>
                    <div className="mt-1.5 text-[20px] font-semibold tabular-nums tracking-[-0.022em] text-[#0a0d14]">
                      {n.number}
                    </div>
                  </div>
                  <button type="button" className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[6px] text-[#9298a3] opacity-0 transition group-hover:opacity-100 hover:bg-[#f1f2f4]">
                    <IconDots size={14} stroke={2} />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {n.status === "active" ? (
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#5b606a]">
                      <span className="h-[6px] w-[6px] rounded-full bg-[#16a34a]" style={{ boxShadow: "0 0 0 3px rgba(22,163,74,0.14)" }} />
                      Active &middot; <span className="tabular-nums">{n.monthly}/mo</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#5b606a]">
                      <span className="h-[6px] w-[6px] rounded-full bg-[#9298a3]" style={{ boxShadow: "0 0 0 3px rgba(146,152,163,0.14)" }} />
                      Pending Setup
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 border-t border-[#f1f2f4]">
                <div className="flex items-center gap-2.5 border-r border-[#f1f2f4] px-5 py-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] text-[#0d4b3a]" style={{ border: "1px solid #0d4b3a" }}>
                    <IconPhone size={14} stroke={2} />
                  </span>
                  <div>
                    <div className="text-[11.5px] font-semibold text-[#0a0d14]">Voice</div>
                    <div className="text-[10.5px] text-[#5b606a] inline-flex items-center gap-1">
                      <IconCheck size={9} stroke={2.5} className="text-[#0d4b3a]" />
                      Live
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 px-5 py-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] text-[#c2c5cc]" style={{ border: "1px dashed #ebedf0" }}>
                    <IconMessageCircle size={14} stroke={2} />
                  </span>
                  <div>
                    <div className="text-[11.5px] font-semibold text-[#0a0d14]">SMS</div>
                    <div className="text-[10.5px] text-[#5b606a] inline-flex items-center gap-1">
                      <IconClock size={9} stroke={2.5} className="text-[#9298a3]" />
                      Pending
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-[#f1f2f4] px-5 py-2.5 text-[11px] text-[#5b606a]">
                Purchased {n.purchasedOn}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
