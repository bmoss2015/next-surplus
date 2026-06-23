"use client";

import { useState } from "react";
import {
  IconPlus,
  IconPhone,
  IconMessageCircle,
  IconChevronRight,
  IconDots,
} from "@tabler/icons-react";
import { NUMBERS } from "../_data";

export default function PNVariantC() {
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

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-5">
          <h1 className="row-start-1 col-start-1 text-[30px] font-semibold leading-[1.15] tracking-[-0.028em] text-[#0a0d14]">
            Phone Numbers
          </h1>
          <button
            type="button"
            onClick={() => setShowBuy((s) => !s)}
            className="row-start-1 col-start-2 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#0d4b3a] px-4 text-[13px] font-medium tracking-[-0.008em] text-white"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
          >
            <IconPlus size={13} stroke={2.25} />
            Buy A Number
          </button>
          <p className="col-span-2 mt-4 text-[14px] leading-[1.55] tracking-[-0.005em] text-[#5b606a]">
            Each number is its own surface. Click any card to manage it.
          </p>
        </div>

        <div
          className="mt-6 flex items-stretch overflow-hidden rounded-[12px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <Cell label="Active Numbers" value={String(activeCount)} meta="Available To Dial" emphasized />
          <Cell label="Pending Numbers" value={String(pendingCount)} meta="Setup In Progress" />
          <Cell label="Monthly Cost" value={`$${totalMonthly.toFixed(2)}`} meta="Billed On The 1st" last />
        </div>

        <div className="mt-11 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
          Your Numbers
          <span className="h-px flex-1 bg-[#ebedf0]" />
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-4">
          {NUMBERS.map((n) => (
            <div
              key={n.id}
              className="group relative overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white transition hover:border-[#d8d6cf]"
              style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
            >
              <div className="flex items-start justify-between px-5 pb-3 pt-5">
                <div>
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
                    {n.city}, {n.state}
                  </div>
                  <div className="mt-1.5 text-[18px] font-semibold tabular-nums tracking-[-0.018em] text-[#0a0d14]">
                    {n.number}
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[6px] text-[#9298a3] opacity-0 transition group-hover:opacity-100 hover:bg-[#f1f2f4] hover:text-[#0a0d14]"
                >
                  <IconDots size={14} stroke={2} />
                </button>
              </div>

              <div className="flex items-center gap-2 px-5 pb-4">
                {n.status === "active" ? (
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#5b606a]">
                    <span className="h-[6px] w-[6px] rounded-full bg-[#16a34a]" style={{ boxShadow: "0 0 0 3px rgba(22,163,74,0.14)" }} />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#5b606a]">
                    <span className="h-[6px] w-[6px] rounded-full bg-[#9298a3]" style={{ boxShadow: "0 0 0 3px rgba(146,152,163,0.14)" }} />
                    Pending
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-0 border-t border-[#f1f2f4]">
                <div className="flex items-center gap-2 border-r border-[#f1f2f4] px-5 py-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-[#0d4b3a]" style={{ border: "1px solid #0d4b3a" }}>
                    <IconPhone size={13} stroke={2} />
                  </span>
                  <div>
                    <div className="text-[11.5px] font-medium text-[#0a0d14]">Voice</div>
                    <div className="text-[10.5px] text-[#5b606a]">Live</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-5 py-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-[#c2c5cc]" style={{ border: "1px dashed #ebedf0" }}>
                    <IconMessageCircle size={13} stroke={2} />
                  </span>
                  <div>
                    <div className="text-[11.5px] font-medium text-[#0a0d14]">SMS</div>
                    <div className="text-[10.5px] text-[#5b606a]">Pending Approval</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#f1f2f4] px-5 py-3">
                <span className="text-[11.5px] text-[#5b606a]">
                  Purchased {n.purchasedOn}
                </span>
                <span className="text-[12.5px] font-medium tabular-nums text-[#0a0d14]">
                  {n.monthly}/mo
                </span>
              </div>
            </div>
          ))}

          {showBuy && (
            <div
              className="overflow-hidden rounded-[14px] border-2 border-dashed border-[#d1d5db] bg-white px-5 py-4"
            >
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
                Add A New Number
              </div>
              <input
                defaultValue="404"
                placeholder="Area Code Or City"
                className="mt-2.5 h-[38px] w-full rounded-[7px] border border-[#ebedf0] bg-white px-3 text-[13.5px] text-[#0a0d14] outline-none transition focus:border-[#0d4b3a] placeholder:text-[#c2c5cc]"
              />
              <div className="mt-3 text-[11px] uppercase tracking-[0.06em] text-[#9298a3]">
                4 Results
              </div>
              <div className="mt-1.5 max-h-[160px] space-y-1.5 overflow-y-auto">
                {[
                  { number: "(404) 555 0291", city: "Atlanta" },
                  { number: "(404) 555 0382", city: "Atlanta" },
                  { number: "(770) 555 0413", city: "Marietta" },
                  { number: "(678) 555 0509", city: "Roswell" },
                ].map((r) => (
                  <button
                    key={r.number}
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-between rounded-[7px] bg-white px-3 py-2 text-left transition hover:border-[#d8d6cf]"
                    style={{ border: "1px solid #ebedf0", boxShadow: "0 1px 1px rgba(12,13,16,0.02)" }}
                  >
                    <div>
                      <div className="text-[12.5px] font-semibold tabular-nums text-[#0a0d14]">{r.number}</div>
                      <div className="text-[10.5px] text-[#5b606a]">{r.city}, GA</div>
                    </div>
                    <span className="text-[11px] tabular-nums text-[#5b606a]">$1.50/mo</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-11 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
          SMS Setup
          <span className="h-px flex-1 bg-[#ebedf0]" />
        </div>
        <div
          className="mt-3.5 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="px-6 py-5">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
              A2P 10DLC Status
            </div>
            <div className="mt-1.5 text-[16px] font-semibold tracking-[-0.018em] text-[#0a0d14]">
              Not Ready Until Approved
            </div>
            <div className="mt-1.5 max-w-[64ch] text-[12.5px] leading-[1.55] text-[#5b606a]">
              SMS requires brand and campaign approval from the carriers. Voice works immediately on every number you buy.
            </div>

            <div className="mt-4 flex items-center gap-2">
              <ProgStep label="Submit" state="todo" />
              <span className="h-px w-6 bg-[#ebedf0]" />
              <ProgStep label="Carrier Review" state="todo" />
              <span className="h-px w-6 bg-[#ebedf0]" />
              <ProgStep label="Approved" state="todo" />
            </div>

            <button
              type="button"
              className="mt-5 inline-flex h-9 cursor-pointer items-center rounded-[7px] bg-[#0d4b3a] px-4 text-[13px] font-medium tracking-[-0.008em] text-white"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
            >
              Start A2P Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, meta, emphasized, last }: { label: string; value: string; meta: string; emphasized?: boolean; last?: boolean }) {
  return (
    <div className={["flex flex-1 flex-col gap-1 px-5 py-4", last ? "" : "border-r border-[#f1f2f4]"].join(" ")}>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">{label}</div>
      <div className={["text-[22px] font-semibold leading-[1.1] tabular-nums tracking-[-0.018em]", emphasized ? "text-[#0d4b3a]" : "text-[#0a0d14]"].join(" ")}>{value}</div>
      <div className="text-[11.5px] tabular-nums text-[#5b606a]">{meta}</div>
    </div>
  );
}

function ProgStep({ label, state }: { label: string; state: "done" | "active" | "todo" }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={[
        "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
        state === "done" ? "bg-[#0d4b3a] text-white" : state === "active" ? "bg-white text-[#0d4b3a]" : "bg-white text-[#9298a3]",
      ].join(" ")} style={{ border: state === "active" ? "2px solid #0d4b3a" : "1px solid #ebedf0" }}>
        {state === "done" ? "✓" : ""}
      </span>
      <span className={[
        "text-[11.5px] font-medium",
        state === "todo" ? "text-[#9298a3]" : "text-[#0a0d14]",
      ].join(" ")}>{label}</span>
    </div>
  );
}
