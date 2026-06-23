"use client";

import {
  IconPlus,
  IconPhone,
  IconMessageCircle,
  IconChevronRight,
  IconCheck,
  IconClock,
} from "@tabler/icons-react";
import { NUMBERS } from "../_data";

export default function PNVariantC() {
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
          Variant C &middot; The compliance view. SMS readiness is the gating concern, so lead with it.
        </p>

        <div
          className="mt-7 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="grid grid-cols-[1fr_auto] items-center gap-6 px-7 py-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.10em] text-[#0d4b3a]">
                SMS Capability Status
              </div>
              <div className="mt-2 text-[20px] font-semibold tracking-[-0.022em] text-[#0a0d14]">
                A2P 10DLC Registration Required
              </div>
              <div className="mt-1.5 max-w-[60ch] text-[12.5px] leading-[1.55] text-[#5b606a]">
                Carriers need to approve your brand and campaign before you can send SMS from any number. Typical timeline 1 to 3 weeks. Voice works immediately on every number.
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-11 cursor-pointer items-center rounded-[7px] bg-[#0d4b3a] px-5 text-[13.5px] font-medium text-white"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 8px 20px -4px rgba(13,75,58,0.34)" }}
            >
              Start Registration
            </button>
          </div>
          <div className="border-t border-[#f1f2f4] px-7 py-6">
            <div className="grid grid-cols-4 gap-6">
              <Stage n={1} label="Submit Brand" status="todo" />
              <Stage n={2} label="Submit Campaign" status="todo" />
              <Stage n={3} label="Carrier Review" status="todo" />
              <Stage n={4} label="Approved" status="todo" />
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3] flex items-center gap-3 flex-1">
            Your Numbers
            <span className="h-px flex-1 bg-[#ebedf0]" />
          </div>
          <button
            type="button"
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#0d4b3a] px-3.5 text-[12.5px] font-medium text-white"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
          >
            <IconPlus size={12} stroke={2.25} />
            Buy A Number
          </button>
        </div>

        <div
          className="mt-3 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="divide-y divide-[#f1f2f4]">
            {NUMBERS.map((n) => (
              <div key={n.id} className="grid grid-cols-[200px_180px_1fr_120px] items-center gap-4 px-6 py-3.5">
                <div className="text-[14px] font-semibold tabular-nums text-[#0a0d14]">{n.number}</div>
                <div>
                  <div className="text-[13px] font-medium text-[#0a0d14]">{n.city}</div>
                  <div className="text-[11.5px] text-[#5b606a]">{n.state}</div>
                </div>
                <div className="flex items-center gap-2">
                  <CapPill icon={<IconPhone size={11} stroke={2} />} label="Voice" status="live" />
                  <CapPill icon={<IconMessageCircle size={11} stroke={2} />} label="SMS" status="locked" />
                </div>
                <div className="text-right text-[12.5px] tabular-nums text-[#0a0d14]">{n.monthly}/mo</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stage({ n, label, status }: { n: number; label: string; status: "done" | "active" | "todo" }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span
          className={[
            "inline-flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold",
            status === "done" ? "bg-[#0d4b3a] text-white" : status === "active" ? "bg-white text-[#0d4b3a]" : "bg-white text-[#9298a3]",
          ].join(" ")}
          style={{ border: status === "active" ? "2px solid #0d4b3a" : "1px solid #ebedf0" }}
        >
          {status === "done" ? <IconCheck size={13} stroke={3} /> : n}
        </span>
        <span className={["text-[12px] font-medium", status === "todo" ? "text-[#9298a3]" : "text-[#0a0d14]"].join(" ")}>
          {label}
        </span>
      </div>
    </div>
  );
}

function CapPill({ icon, label, status }: { icon: React.ReactNode; label: string; status: "live" | "locked" }) {
  if (status === "live") {
    return (
      <span className="inline-flex h-6 items-center gap-1 rounded-[5px] border border-[#0d4b3a] bg-white px-2 text-[10.5px] font-semibold text-[#0d4b3a]">
        {icon}
        {label}
        <IconCheck size={9} stroke={2.5} className="ml-0.5" />
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-[5px] bg-white px-2 text-[10.5px] font-medium text-[#9298a3]" style={{ border: "1px dashed #ebedf0" }}>
      {icon}
      {label}
      <IconClock size={9} stroke={2.25} className="ml-0.5" />
    </span>
  );
}
