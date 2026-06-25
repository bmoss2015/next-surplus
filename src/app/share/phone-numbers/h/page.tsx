"use client";

import { useState } from "react";
import {
  IconPlus,
  IconPhone,
  IconMessageCircle,
  IconChevronRight,
  IconCheck,
  IconClock,
} from "@tabler/icons-react";
import { NUMBERS } from "../_data";

type A2PState = "pending" | "in-progress" | "approved";

export default function PNVariantH() {
  const [a2pState] = useState<A2PState>("in-progress");
  const activeCount = NUMBERS.filter((n) => n.status === "active").length;
  const states = new Set(NUMBERS.map((n) => n.state)).size;

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="mx-auto max-w-[1040px] px-10 pb-32 pt-11">
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
              Variant H &middot; Bento dashboard. A2P status as a focused tile (not a hero). Coverage and active numbers as siblings. List below.
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

        <div className="mt-7 grid grid-cols-[2fr_1fr] gap-4">
          <div
            className="overflow-hidden rounded-[14px] border border-[#0d4b3a] bg-white"
            style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
          >
            <div className="flex items-start justify-between gap-4 px-6 py-5">
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#0d4b3a]">
                  A2P 10DLC
                </div>
                <div className="mt-1.5 text-[16px] font-semibold tracking-[-0.018em] text-[#0a0d14]">
                  {a2pState === "approved" ? "SMS Approved" : a2pState === "in-progress" ? "Carrier Review In Progress" : "Registration Needed"}
                </div>
                <div className="mt-1 text-[12px] text-[#5b606a]">
                  {a2pState === "approved" ? "SMS works on every number." : "Voice works now. SMS unlocks after carrier approval."}
                </div>
              </div>
              {a2pState === "pending" && (
                <button
                  type="button"
                  className="inline-flex h-9 shrink-0 cursor-pointer items-center rounded-[7px] bg-[#0d4b3a] px-3.5 text-[12.5px] font-medium text-white"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
                >
                  Start
                </button>
              )}
            </div>
            <div className="border-t border-[#f1f2f4] px-6 py-4">
              <div className="flex items-center justify-between gap-2">
                <Mini n={1} label="Brand" status="done" />
                <span className="h-px flex-1 bg-[#0d4b3a]" />
                <Mini n={2} label="Campaign" status="done" />
                <span className="h-px flex-1 bg-[#ebedf0]" />
                <Mini n={3} label="Review" status="active" />
                <span className="h-px flex-1 bg-[#ebedf0]" />
                <Mini n={4} label="Live" status="todo" />
              </div>
            </div>
          </div>

          <div className="grid grid-rows-2 gap-4">
            <div
              className="rounded-[14px] border border-[#ebedf0] bg-white px-5 py-4"
              style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
            >
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
                Active Numbers
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-[28px] font-semibold leading-none tabular-nums tracking-[-0.022em] text-[#0a0d14]">{activeCount}</div>
                <div className="text-[12px] text-[#5b606a]">numbers</div>
              </div>
            </div>
            <div
              className="rounded-[14px] border border-[#ebedf0] bg-white px-5 py-4"
              style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
            >
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
                Coverage
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-[28px] font-semibold leading-none tabular-nums tracking-[-0.022em] text-[#0a0d14]">{states}</div>
                <div className="text-[12px] text-[#5b606a]">states</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
          Your Numbers
          <span className="h-px flex-1 bg-[#ebedf0]" />
        </div>

        <div
          className="mt-3 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="divide-y divide-[#f1f2f4]">
            {NUMBERS.map((n) => (
              <div key={n.id} className="grid grid-cols-[1fr_140px_120px_140px_70px] items-center gap-4 px-6 py-3.5">
                <div>
                  <div className="text-[14px] font-semibold tabular-nums text-[#0a0d14]">{n.number}</div>
                  <div className="mt-0.5 text-[11.5px] text-[#5b606a]">{n.city}, {n.state}</div>
                </div>
                <div className="flex items-center gap-3">
                  <CapIndicator icon={<IconPhone size={12} stroke={2.25} />} label="Voice" status="live" />
                  <CapIndicator icon={<IconMessageCircle size={12} stroke={2.25} />} label="SMS" status={a2pState === "approved" ? "live" : "pending"} />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#5b606a]">
                    <span className={["h-[7px] w-[7px] rounded-full", n.status === "active" ? "bg-[#16a34a]" : "bg-[#9298a3]"].join(" ")} style={{
                      boxShadow: n.status === "active" ? "0 0 0 3px rgba(22,163,74,0.14)" : "0 0 0 3px rgba(146,152,163,0.14)",
                    }} />
                    {n.status === "active" ? "Active" : "Pending"}
                  </span>
                </div>
                <div className="text-right text-[13.5px] font-semibold tabular-nums text-[#0a0d14]">
                  {n.monthly}<span className="text-[11px] font-normal text-[#9298a3]">/mo</span>
                </div>
                <div className="text-right">
                  <button type="button" className="cursor-pointer text-[11.5px] font-medium text-[#5b606a] transition hover:text-[#b42318]">
                    Release
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Mini({ n, label, status }: { n: number; label: string; status: "done" | "active" | "todo" }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={[
          "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
          status === "done" ? "bg-[#0d4b3a] text-white" : status === "active" ? "bg-white text-[#0d4b3a]" : "bg-white text-[#9298a3]",
        ].join(" ")}
        style={{ border: status === "active" ? "2px solid #0d4b3a" : "1px solid #ebedf0" }}
      >
        {status === "done" ? <IconCheck size={10} stroke={3} /> : n}
      </span>
      <span className={["text-[10.5px] font-medium whitespace-nowrap", status === "todo" ? "text-[#9298a3]" : "text-[#0a0d14]"].join(" ")}>
        {label}
      </span>
    </div>
  );
}

function CapIndicator({ icon, label, status }: { icon: React.ReactNode; label: string; status: "live" | "pending" }) {
  return (
    <span className={["inline-flex items-center gap-1 text-[11.5px] font-medium", status === "live" ? "text-[#0d4b3a]" : "text-[#9298a3]"].join(" ")}>
      {icon}
      {label}
      {status === "live" ? <IconCheck size={10} stroke={2.5} className="ml-0.5" /> : <IconClock size={10} stroke={2.25} className="ml-0.5" />}
    </span>
  );
}
