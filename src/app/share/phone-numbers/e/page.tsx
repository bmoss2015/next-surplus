"use client";

import { useState } from "react";
import {
  IconPlus,
  IconPhone,
  IconMessageCircle,
  IconChevronRight,
  IconSearch,
} from "@tabler/icons-react";
import { NUMBERS } from "../_data";

export default function PNVariantE() {
  const [showBuy, setShowBuy] = useState(false);
  const activeCount = NUMBERS.filter((n) => n.status === "active").length;
  const pendingCount = NUMBERS.filter((n) => n.status === "pending").length;
  const totalMonthly = activeCount * 1.5;

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="mx-auto max-w-[880px] px-14 pb-32 pt-11">
        <div className="text-[12px] text-[#9298a3] flex items-center gap-1.5">
          <span>Settings</span>
          <IconChevronRight size={12} stroke={2} className="text-[#c2c5cc]" />
          <span>Phone Numbers</span>
        </div>

        <h1 className="mt-3 text-[30px] font-semibold leading-[1.15] tracking-[-0.028em] text-[#0a0d14]">
          Phone Numbers
        </h1>

        <div
          className="mt-7 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="grid grid-cols-[1fr_auto] items-start gap-6 px-6 py-5">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
                SMS Setup
              </div>
              <div className="mt-1.5 text-[16px] font-semibold leading-[1.25] tracking-[-0.018em] text-[#0a0d14]">
                A2P 10DLC Registration In Progress
              </div>
              <div className="mt-1.5 max-w-[64ch] text-[12.5px] leading-[1.55] text-[#5b606a]">
                Voice works immediately on every number you buy. SMS unlocks once carriers approve your brand and campaign. Typical timeline is 1 to 3 weeks.
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-9 cursor-pointer items-center rounded-[7px] bg-[#0d4b3a] px-4 text-[13px] font-medium tracking-[-0.008em] text-white"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
            >
              Start Registration
            </button>
          </div>
          <div className="border-t border-[#f1f2f4] px-6 py-5">
            <div className="flex items-center justify-between gap-2">
              <Step label="Submit Brand" state="todo" />
              <span className="h-px flex-1 bg-[#ebedf0]" />
              <Step label="Submit Campaign" state="todo" />
              <span className="h-px flex-1 bg-[#ebedf0]" />
              <Step label="Carrier Review" state="todo" />
              <span className="h-px flex-1 bg-[#ebedf0]" />
              <Step label="Approved" state="todo" />
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-[12px] font-medium text-[#5b606a]">
              <span className="h-[7px] w-[7px] rounded-full bg-[#9298a3]" style={{ boxShadow: "0 0 0 3px rgba(146,152,163,0.14)" }} />
              SMS Not Ready Until Approved
            </div>
          </div>
        </div>

        <div
          className="mt-6 flex items-stretch overflow-hidden rounded-[12px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="flex flex-1 flex-col gap-1 px-5 py-4 border-r border-[#f1f2f4]">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">Active Numbers</div>
            <div className="text-[22px] font-semibold leading-[1.1] tabular-nums tracking-[-0.018em] text-[#0d4b3a]">{activeCount}</div>
            <div className="text-[11.5px] text-[#5b606a]">Available To Dial</div>
          </div>
          <div className="flex flex-1 flex-col gap-1 px-5 py-4 border-r border-[#f1f2f4]">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">Pending Numbers</div>
            <div className="text-[22px] font-semibold leading-[1.1] tabular-nums tracking-[-0.018em] text-[#0a0d14]">{pendingCount}</div>
            <div className="text-[11.5px] text-[#5b606a]">Setup In Progress</div>
          </div>
          <div className="flex flex-1 flex-col gap-1 px-5 py-4">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">Monthly Cost</div>
            <div className="text-[22px] font-semibold leading-[1.1] tabular-nums tracking-[-0.018em] text-[#0a0d14]">${totalMonthly.toFixed(2)}</div>
            <div className="text-[11.5px] text-[#5b606a]">Billed On The 1st</div>
          </div>
        </div>

        <div className="mt-11 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3] flex items-center gap-2.5">
            Your Numbers
            <span className="h-px flex-1 bg-[#ebedf0]" />
          </div>
          <button
            type="button"
            onClick={() => setShowBuy((s) => !s)}
            className="inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-[7px] bg-white px-3 text-[12.25px] font-medium text-[#0a0d14] transition hover:border-[#d8d6cf]"
            style={{ border: "1px solid #ebedf0", boxShadow: "0 1px 1px rgba(12,13,16,0.02)" }}
          >
            <IconPlus size={11} stroke={2.5} />
            Buy A Number
          </button>
        </div>

        <div
          className="mt-3.5 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="divide-y divide-[#f1f2f4]">
            {NUMBERS.map((n) => (
              <div key={n.id} className="grid grid-cols-[1fr_minmax(0,160px)_auto_auto_auto] items-center gap-5 px-6 py-3.5">
                <div className="text-[14.5px] font-semibold tabular-nums tracking-[-0.005em] text-[#0a0d14]">{n.number}</div>
                <div>
                  <div className="text-[12.5px] font-medium text-[#0a0d14]">{n.city}</div>
                  <div className="text-[11px] text-[#5b606a]">{n.state}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] text-[#0d4b3a]" style={{ border: "1px solid #0d4b3a" }} title="Voice Live">
                    <IconPhone size={11} stroke={2} />
                  </span>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] text-[#c2c5cc]" style={{ border: "1px dashed #ebedf0" }} title="SMS Pending Approval">
                    <IconMessageCircle size={11} stroke={2} />
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#5b606a]">
                  <span className={[
                    "h-[7px] w-[7px] rounded-full",
                    n.status === "active" ? "bg-[#16a34a]" : "bg-[#9298a3]",
                  ].join(" ")} style={{
                    boxShadow: n.status === "active"
                      ? "0 0 0 3px rgba(22,163,74,0.14)"
                      : "0 0 0 3px rgba(146,152,163,0.14)"
                  }} />
                  {n.status === "active" ? "Active" : "Pending"}
                </span>
                <div className="flex items-center gap-3 justify-self-end">
                  <span className="text-[13px] font-medium tabular-nums text-[#0a0d14]">{n.monthly}</span>
                  <button
                    type="button"
                    className="cursor-pointer text-[11.5px] font-medium text-[#5b606a] transition hover:text-[#b42318]"
                  >
                    Release
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showBuy && (
          <div
            className="mt-4 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
            style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
          >
            <div className="px-6 py-5">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
                Buy A Number
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-[7px] border border-[#ebedf0] bg-white px-3 py-2.5 transition focus-within:border-[#0d4b3a]">
                <IconSearch size={14} stroke={2} className="text-[#9298a3]" />
                <input
                  defaultValue="404"
                  placeholder="Area Code, City, Or State"
                  className="w-full bg-transparent text-[13.5px] text-[#0a0d14] outline-none placeholder:text-[#c2c5cc]"
                />
              </div>
              <div className="mt-3 divide-y divide-[#f1f2f4]">
                {[
                  { number: "(404) 555 0291", city: "Atlanta" },
                  { number: "(404) 555 0382", city: "Atlanta" },
                  { number: "(770) 555 0413", city: "Marietta" },
                  { number: "(678) 555 0509", city: "Roswell" },
                ].map((r) => (
                  <div key={r.number} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-[14px] font-semibold tabular-nums text-[#0a0d14]">{r.number}</div>
                      <div className="mt-0.5 text-[11.5px] text-[#5b606a]">{r.city}, Georgia</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[12.5px] tabular-nums text-[#5b606a]">$1.50/mo</span>
                      <button
                        type="button"
                        className="h-[30px] cursor-pointer rounded-[7px] bg-[#0d4b3a] px-3 text-[12.25px] font-medium text-white"
                        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-11 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
          Per State Rotation
          <span className="h-px flex-1 bg-[#ebedf0]" />
        </div>
        <div
          className="mt-3.5 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="divide-y divide-[#f1f2f4]">
            {[
              { state: "Texas", count: 2, mode: "Rotate" },
              { state: "North Carolina", count: 1, mode: "Single Number" },
              { state: "Arizona", count: 1, mode: "Single Number" },
            ].map((r) => (
              <div key={r.state} className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className="text-[13.75px] font-medium tracking-[-0.008em] text-[#0a0d14]">{r.state}</div>
                  <div className="mt-0.5 text-[11.5px] text-[#5b606a]">{r.count} Number{r.count === 1 ? "" : "s"}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[12.5px] font-medium text-[#0a0d14]">{r.mode}</span>
                  {r.count > 1 && (
                    <button type="button" className="cursor-pointer text-[12px] font-medium text-[#0d4b3a] hover:text-[#13644e]">
                      Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ label, state }: { label: string; state: "done" | "active" | "todo" }) {
  return (
    <div className="flex items-center gap-2">
      <span className={[
        "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
        state === "done" ? "bg-[#0d4b3a] text-white" : state === "active" ? "bg-white text-[#0d4b3a]" : "bg-white text-[#9298a3]",
      ].join(" ")} style={{ border: state === "active" ? "2px solid #0d4b3a" : "1px solid #ebedf0" }}>
        {state === "done" ? "✓" : ""}
      </span>
      <span className={[
        "text-[11.5px] font-medium whitespace-nowrap",
        state === "todo" ? "text-[#9298a3]" : "text-[#0a0d14]",
      ].join(" ")}>{label}</span>
    </div>
  );
}
