"use client";

import { useState } from "react";
import {
  IconPlus,
  IconPhone,
  IconMessageCircle,
  IconChevronRight,
  IconShieldCheck,
} from "@tabler/icons-react";
import { NUMBERS } from "../_data";

export default function PNVariantA() {
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

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-5 gap-y-1">
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
            Manage the numbers your dialer calls from. Buy local numbers to improve pickup rates.
          </p>
        </div>

        <div
          className="mt-6 flex items-stretch overflow-hidden rounded-[12px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <Cell label="Active Numbers" value={String(activeCount)} meta="Available To Dial" />
          <Cell label="Pending Numbers" value={String(pendingCount)} meta="Setup In Progress" />
          <Cell label="Monthly Cost" value={`$${totalMonthly.toFixed(2)}`} meta="Billed On The 1st" last />
        </div>

        <div className="mt-11 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
          Your Numbers
          <span className="h-px flex-1 bg-[#ebedf0]" />
        </div>

        <div
          className="mt-3.5 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="divide-y divide-[#f1f2f4]">
            {NUMBERS.map((n) => (
              <div key={n.id} className="grid grid-cols-[1fr_auto] items-center gap-6 px-6 py-4">
                <div className="grid grid-cols-[minmax(0,180px)_minmax(0,160px)_minmax(0,120px)_1fr] items-center gap-5">
                  <div>
                    <div className="text-[14px] font-semibold tracking-[-0.005em] tabular-nums text-[#0a0d14]">
                      {n.number}
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-[#0a0d14]">{n.city}</div>
                    <div className="text-[11.5px] text-[#5b606a]">{n.state}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Capability on={n.voice} icon={<IconPhone size={12} stroke={2} />} />
                    <Capability on={n.sms} icon={<IconMessageCircle size={12} stroke={2} />} pending />
                  </div>
                  <div>
                    {n.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium tracking-[-0.005em] text-[#5b606a]">
                        <span className="h-[7px] w-[7px] rounded-full bg-[#16a34a]" style={{ boxShadow: "0 0 0 3px rgba(22,163,74,0.14)" }} />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium tracking-[-0.005em] text-[#5b606a]">
                        <span className="h-[7px] w-[7px] rounded-full bg-[#9298a3]" style={{ boxShadow: "0 0 0 3px rgba(146,152,163,0.14)" }} />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[13px] font-medium tabular-nums text-[#0a0d14]">{n.monthly}/mo</span>
                  <button
                    type="button"
                    className="cursor-pointer text-[12px] font-medium tracking-[-0.008em] text-[#5b606a] transition hover:text-[#b42318]"
                  >
                    Release
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showBuy && (
          <div className="mt-11">
            <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
              Buy A Number
              <span className="h-px flex-1 bg-[#ebedf0]" />
            </div>
            <div
              className="mt-3.5 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
              style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
            >
              <div className="px-6 py-5">
                <input
                  defaultValue="404"
                  placeholder="Area Code, City, Or State"
                  className="h-[38px] w-full rounded-[7px] border border-[#ebedf0] bg-white px-3 text-[13.5px] text-[#0a0d14] outline-none transition focus:border-[#0d4b3a] placeholder:text-[#c2c5cc]"
                />
                <div className="mt-4 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
                  4 Results In Georgia
                </div>
                <div className="mt-2 divide-y divide-[#f1f2f4]">
                  {[
                    { number: "(404) 555 0291", city: "Atlanta", state: "Georgia" },
                    { number: "(404) 555 0382", city: "Atlanta", state: "Georgia" },
                    { number: "(770) 555 0413", city: "Marietta", state: "Georgia" },
                    { number: "(678) 555 0509", city: "Roswell", state: "Georgia" },
                  ].map((r) => (
                    <div key={r.number} className="flex items-center justify-between py-3.5">
                      <div>
                        <div className="text-[14px] font-semibold tabular-nums text-[#0a0d14]">{r.number}</div>
                        <div className="mt-0.5 text-[11.5px] text-[#5b606a]">{r.city}, {r.state}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[12.5px] tabular-nums text-[#5b606a]">$1.50/mo</span>
                        <button
                          type="button"
                          className="h-[30px] cursor-pointer rounded-[7px] bg-white px-3 text-[12.25px] font-medium text-[#0a0d14] transition hover:border-[#d8d6cf]"
                          style={{ border: "1px solid #ebedf0", boxShadow: "0 1px 1px rgba(12,13,16,0.02)" }}
                        >
                          Buy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
                <div className="text-[13.75px] font-medium tracking-[-0.008em] text-[#0a0d14]">{r.state}</div>
                <div className="flex items-center gap-4">
                  <span className="text-[12.5px] font-medium text-[#0a0d14]">{r.mode}</span>
                  {r.count > 1 && (
                    <button
                      type="button"
                      className="cursor-pointer text-[12px] font-medium text-[#0d4b3a] transition hover:text-[#13644e]"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-11 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
          SMS Setup
          <span className="h-px flex-1 bg-[#ebedf0]" />
        </div>
        <div
          className="mt-3.5 flex items-start gap-4 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white px-6 py-5"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] bg-white text-[#0d4b3a]" style={{ border: "1px solid #ebedf0" }}>
            <IconShieldCheck size={17} stroke={2} />
          </div>
          <div className="flex-1">
            <div className="text-[13.75px] font-semibold tracking-[-0.008em] text-[#0a0d14]">
              SMS Requires Brand Approval
            </div>
            <div className="mt-1 text-[12.5px] leading-[1.55] text-[#5b606a]">
              To send SMS from these numbers you need A2P 10DLC brand and campaign approval from the carriers. Typical timeline is 1 to 3 weeks. Voice works immediately on every number you buy.
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#5b606a]">
                <span className="h-[7px] w-[7px] rounded-full bg-[#9298a3]" style={{ boxShadow: "0 0 0 3px rgba(146,152,163,0.14)" }} />
                Not Ready Until Approved
              </span>
            </div>
            <button
              type="button"
              className="mt-4 inline-flex h-9 cursor-pointer items-center rounded-[7px] bg-[#0d4b3a] px-4 text-[13px] font-medium tracking-[-0.008em] text-white"
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

function Cell({ label, value, meta, last }: { label: string; value: string; meta: string; last?: boolean }) {
  return (
    <div className={["flex flex-1 flex-col gap-1 px-5 py-4", last ? "" : "border-r border-[#f1f2f4]"].join(" ")}>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">{label}</div>
      <div className="text-[22px] font-semibold leading-[1.1] tabular-nums tracking-[-0.018em] text-[#0a0d14]">{value}</div>
      <div className="text-[11.5px] tabular-nums text-[#5b606a]">{meta}</div>
    </div>
  );
}

function Capability({ on, icon, pending }: { on: boolean; icon: React.ReactNode; pending?: boolean }) {
  if (pending) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] text-[#c2c5cc]" style={{ border: "1px dashed #ebedf0" }}>
        {icon}
      </span>
    );
  }
  return (
    <span className={["inline-flex h-6 w-6 items-center justify-center rounded-[6px]", on ? "text-[#0d4b3a]" : "text-[#c2c5cc]"].join(" ")} style={{ border: `1px solid ${on ? "#0d4b3a" : "#ebedf0"}` }}>
      {icon}
    </span>
  );
}
