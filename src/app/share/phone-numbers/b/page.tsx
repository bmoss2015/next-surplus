"use client";

import {
  IconPlus,
  IconChevronRight,
  IconMapPin,
} from "@tabler/icons-react";
import { NUMBERS } from "../_data";

const STATE_DOTS: Record<string, { x: number; y: number }> = {
  "Texas": { x: 360, y: 260 },
  "North Carolina": { x: 620, y: 220 },
  "Arizona": { x: 220, y: 260 },
  "Georgia": { x: 580, y: 270 },
  "Florida": { x: 620, y: 330 },
  "Ohio": { x: 540, y: 160 },
};

export default function PNVariantB() {
  const byState = NUMBERS.reduce<Record<string, typeof NUMBERS>>((acc, n) => {
    (acc[n.state] = acc[n.state] || []).push(n);
    return acc;
  }, {});
  const states = Object.keys(byState);

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="mx-auto max-w-[1080px] px-12 pb-32 pt-11">
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
              Variant B &middot; The geographic view. Lead with where your numbers live across the country.
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

        <div className="mt-7 grid grid-cols-[1fr_360px] gap-6">
          <div
            className="relative overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
            style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, rgba(12,13,16,0.05) 1px, transparent 0)",
                backgroundSize: "20px 20px",
              }}
              aria-hidden
            />
            <svg viewBox="0 0 800 460" className="relative h-[460px] w-full">
              {Object.entries(byState).map(([state, nums]) => {
                const pos = STATE_DOTS[state] ?? { x: 400, y: 250 };
                const count = nums.length;
                const r = 18 + count * 6;
                return (
                  <g key={state}>
                    <circle cx={pos.x} cy={pos.y} r={r} fill="rgba(13,75,58,0.06)" stroke="rgba(13,75,58,0.30)" strokeWidth="1" />
                    <circle cx={pos.x} cy={pos.y} r={6} fill="#0d4b3a" />
                    <text x={pos.x} y={pos.y - r - 10} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0a0d14" fontFamily="Inter">
                      {state}
                    </text>
                    <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="14" fontWeight="600" fill="#fff" fontFamily="Inter">
                      {count}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="space-y-3">
            {states.map((s) => (
              <div
                key={s}
                className="overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
                style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
              >
                <div className="flex items-center justify-between border-b border-[#f1f2f4] px-5 py-3">
                  <div className="flex items-center gap-2">
                    <IconMapPin size={13} stroke={2} className="text-[#0d4b3a]" />
                    <div className="text-[13.5px] font-semibold text-[#0a0d14]">{s}</div>
                  </div>
                  <span className="text-[11.5px] font-medium tabular-nums text-[#5b606a]">{byState[s].length} {byState[s].length === 1 ? "number" : "numbers"}</span>
                </div>
                <div className="divide-y divide-[#f1f2f4]">
                  {byState[s].map((n) => (
                    <div key={n.id} className="flex items-center justify-between px-5 py-2.5">
                      <div>
                        <div className="text-[12.5px] font-semibold tabular-nums text-[#0a0d14]">{n.number}</div>
                        <div className="text-[11px] text-[#5b606a]">{n.city}</div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#5b606a]">
                        <span className={["h-[6px] w-[6px] rounded-full", n.status === "active" ? "bg-[#16a34a]" : "bg-[#9298a3]"].join(" ")} style={{
                          boxShadow: n.status === "active" ? "0 0 0 3px rgba(22,163,74,0.14)" : "0 0 0 3px rgba(146,152,163,0.14)",
                        }} />
                        {n.status === "active" ? "Active" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
