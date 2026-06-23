"use client";

import { useState } from "react";
import {
  IconPlus,
  IconPhone,
  IconMessageCircle,
  IconChevronRight,
  IconTrendingUp,
} from "@tabler/icons-react";
import { NUMBERS } from "../_data";

export default function PNVariantA() {
  const activeCount = NUMBERS.filter((n) => n.status === "active").length;
  const totalMonthly = activeCount * 1.5;
  const projected = totalMonthly * 12;

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="mx-auto max-w-[960px] px-12 pb-32 pt-11">
        <div className="text-[12px] text-[#9298a3] flex items-center gap-1.5">
          <span>Settings</span>
          <IconChevronRight size={12} stroke={2} className="text-[#c2c5cc]" />
          <span>Phone Numbers</span>
        </div>

        <h1 className="mt-3 text-[30px] font-semibold leading-[1.15] tracking-[-0.028em] text-[#0a0d14]">
          Phone Numbers
        </h1>
        <p className="mt-4 max-w-[60ch] text-[14px] leading-[1.55] text-[#5b606a]">
          Variant A &middot; The financial view. Lead with what you spend, see each number as a line item.
        </p>

        <div
          className="relative mt-7 overflow-hidden rounded-[14px] px-8 py-7 text-white"
          style={{
            background:
              "radial-gradient(120% 140% at 100% 0%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(80% 120% at 0% 100%, rgba(40,130,100,0.55) 0%, transparent 70%), linear-gradient(135deg, #0d4b3a 0%, #04261c 100%)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 48px -12px rgba(13,75,58,0.30), 0 8px 16px -8px rgba(13,75,58,0.20)",
          }}
        >
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.10em] text-white/55">
                Total Monthly Spend
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <div className="text-[44px] font-semibold leading-none tabular-nums tracking-[-0.025em] text-white">
                  ${totalMonthly.toFixed(2)}
                </div>
                <div className="inline-flex items-center gap-1 text-[12.5px] text-white/72">
                  <IconTrendingUp size={13} stroke={2.25} />
                  ${projected.toFixed(0)} per year
                </div>
              </div>
              <div className="mt-1.5 text-[12.5px] text-white/65">
                Across <span className="font-semibold text-white">{activeCount}</span> active numbers in <span className="font-semibold text-white">{new Set(NUMBERS.filter((n) => n.status === "active").map((n) => n.state)).size}</span> states
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[7px] bg-white px-4 text-[13px] font-medium text-[#0d4b3a]"
              style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.06), 0 2px 8px -2px rgba(12,13,16,0.12)" }}
            >
              <IconPlus size={13} stroke={2.25} />
              Buy A Number
            </button>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
          Itemized
          <span className="h-px flex-1 bg-[#ebedf0]" />
        </div>

        <div
          className="mt-3 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="grid grid-cols-[200px_180px_120px_110px_1fr_70px] items-center gap-3 border-b border-[#f1f2f4] bg-[#fafbfc] px-6 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#9298a3]">
            <div>Number</div>
            <div>Location</div>
            <div>Capabilities</div>
            <div>Status</div>
            <div className="text-right">Monthly</div>
            <div></div>
          </div>
          <div className="divide-y divide-[#f1f2f4]">
            {NUMBERS.map((n) => (
              <div key={n.id} className="grid grid-cols-[200px_180px_120px_110px_1fr_70px] items-center gap-3 px-6 py-3.5">
                <div className="text-[14px] font-semibold tabular-nums text-[#0a0d14]">{n.number}</div>
                <div>
                  <div className="text-[13px] font-medium text-[#0a0d14]">{n.city}</div>
                  <div className="text-[11.5px] text-[#5b606a]">{n.state}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] text-[#0d4b3a]" style={{ border: "1px solid #0d4b3a" }}>
                    <IconPhone size={12} stroke={2} />
                  </span>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] text-[#c2c5cc]" style={{ border: "1px dashed #ebedf0" }}>
                    <IconMessageCircle size={12} stroke={2} />
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#5b606a]">
                  <span className={["h-[7px] w-[7px] rounded-full", n.status === "active" ? "bg-[#16a34a]" : "bg-[#9298a3]"].join(" ")} style={{
                    boxShadow: n.status === "active" ? "0 0 0 3px rgba(22,163,74,0.14)" : "0 0 0 3px rgba(146,152,163,0.14)",
                  }} />
                  {n.status === "active" ? "Active" : "Pending"}
                </span>
                <div className="text-right text-[13.5px] font-semibold tabular-nums text-[#0a0d14]">
                  {n.monthly}<span className="text-[11px] text-[#9298a3]">/mo</span>
                </div>
                <div className="text-right">
                  <button type="button" className="cursor-pointer text-[11.5px] font-medium text-[#5b606a] transition hover:text-[#b42318]">
                    Release
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-[#f1f2f4] bg-[#fafbfc] px-6 py-3.5">
            <div className="text-[12px] font-medium text-[#5b606a]">Total</div>
            <div className="text-[15px] font-semibold tabular-nums text-[#0a0d14]">${totalMonthly.toFixed(2)} per month</div>
          </div>
        </div>
      </div>
    </div>
  );
}
