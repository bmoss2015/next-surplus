"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  IconPlus,
  IconPhone,
  IconMessageCircle,
  IconChevronRight,
  IconChevronDown,
  IconChevronUp,
  IconCheck,
  IconClock,
} from "@tabler/icons-react";
import { NUMBERS } from "../_data";

type A2PState = "pending" | "in-progress" | "approved";

export default function PNVariantG() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafbfc]" />}>
      <PNVariantGInner />
    </Suspense>
  );
}

type ApprovedView = "default" | "A" | "B" | "C" | "D" | "E" | "F";

function PNVariantGInner() {
  const sp = useSearchParams();
  const initial =
    (sp.get("a2p") as A2PState | null) === "approved"
      ? "approved"
      : (sp.get("a2p") as A2PState | null) === "pending"
        ? "pending"
        : "in-progress";
  const viewParam = sp.get("view") as ApprovedView | null;
  const approvedView: ApprovedView =
    viewParam === "A" || viewParam === "B" || viewParam === "C" ||
    viewParam === "D" || viewParam === "E" || viewParam === "F"
      ? viewParam
      : "default";
  const [a2pState, setA2pState] = useState<A2PState>(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const numbersInStates = new Set(NUMBERS.map((n) => n.state)).size;
  const activeNumbersCount = NUMBERS.filter((n) => n.status === "active").length;

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
            <div className="flex items-center gap-2">
              <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.028em] text-[#0a0d14]">
                Phone Numbers
              </h1>
              {a2pState === "approved" && approvedView === "E" && (
                <IconCheck size={16} stroke={2.5} className="text-[#0d4b3a]" />
              )}
            </div>

            {a2pState === "approved" && approvedView === "D" ? (
              <p className="mt-4 max-w-[60ch] text-[14px] leading-[1.55] text-[#5b606a]">
                <span className="font-medium text-[#0a0d14]">{activeNumbersCount} numbers</span> across {Array.from(new Set(NUMBERS.map((n) => n.city))).slice(0, 3).join(", ")}. Voice and SMS both active.
              </p>
            ) : (
              <p className="mt-4 max-w-[60ch] text-[14px] leading-[1.55] text-[#5b606a]">
                Numbers your team dials from. Voice works immediately. SMS unlocks once your brand and campaign clear carrier review.
              </p>
            )}

            {a2pState === "approved" && approvedView === "B" && (
              <p className="mt-2 text-[13px] text-[#5b606a]">
                Voice and SMS active on every number.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {a2pState === "approved" && approvedView === "default" && (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-[7px] border border-[#0d4b3a] bg-white px-3 text-[12px] font-semibold text-[#0d4b3a]">
                <IconCheck size={11} stroke={2.5} />
                SMS Approved
              </span>
            )}
            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#0d4b3a] px-4 text-[13px] font-medium text-white"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
            >
              <IconPlus size={13} stroke={2.25} />
              Buy A Number
            </button>
          </div>
        </div>

        {a2pState === "approved" && approvedView === "C" && (
          <div className="mt-7 grid grid-cols-3 gap-3">
            <StatTile label="Active Numbers" value={String(activeNumbersCount)} sub="numbers" />
            <StatTile label="Coverage" value={String(numbersInStates)} sub="states" />
            <StatTile label="SMS Status" value="Live" sub="all numbers" emphasis />
          </div>
        )}

        {a2pState !== "approved" && (
          <div
            className="mt-8 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
            style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
          >
            <div className="px-7 py-5">
              <div className="text-[17px] font-semibold tracking-[-0.018em] text-[#0a0d14]">
                A2P 10DLC Registration
              </div>
              <div className="mt-1.5 text-[12.5px] text-[#5b606a]">
                Carriers approve your brand and campaign before SMS unlocks. Voice already works on every number.
              </div>
            </div>
            <div className="border-t border-[#f1f2f4] px-7 py-5">
              <div className="flex items-center justify-between gap-3">
                <Stage n={1} label="Submit Brand" status={a2pState === "pending" ? "todo" : "done"} />
                <span className={["h-px flex-1", a2pState === "pending" ? "bg-[#ebedf0]" : "bg-[#0d4b3a]"].join(" ")} />
                <Stage n={2} label="Submit Campaign" status={a2pState === "in-progress" ? "done" : "todo"} />
                <span className="h-px flex-1 bg-[#ebedf0]" />
                <Stage n={3} label="Carrier Review" status={a2pState === "in-progress" ? "active" : "todo"} />
                <span className="h-px flex-1 bg-[#ebedf0]" />
                <Stage n={4} label="Approved" status="todo" />
              </div>
              {a2pState === "pending" && (
                <button
                  type="button"
                  className="mt-5 inline-flex h-10 cursor-pointer items-center rounded-[7px] bg-[#0d4b3a] px-4 text-[13px] font-medium text-white"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
                >
                  Start Registration
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
          Your Numbers
          <span className="h-px flex-1 bg-[#ebedf0]" />
          {a2pState === "approved" && approvedView === "F" && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0d4b3a]">
              Brand &middot; Campaign &middot; Approved May 18
            </span>
          )}
        </div>

        <div
          className="mt-3 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="divide-y divide-[#f1f2f4]">
            {NUMBERS.map((n) => {
              const expanded = expandedId === n.id;
              return (
                <div key={n.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : n.id)}
                    className={[
                      "grid w-full cursor-pointer grid-cols-[1fr_140px_120px_140px_40px] items-center gap-4 px-6 py-3.5 text-left transition",
                      expanded ? "bg-[#fafbfc]" : "hover:bg-[#fafbfc]",
                    ].join(" ")}
                  >
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
                      {expanded ? <IconChevronUp size={14} stroke={2} className="text-[#9298a3]" /> : <IconChevronDown size={14} stroke={2} className="text-[#9298a3]" />}
                    </div>
                  </button>
                  {expanded && (
                    <div className="border-t border-[#f1f2f4] bg-[#fafbfc] px-6 py-4">
                      <div className="grid grid-cols-3 gap-6">
                        <DetailCell label="Purchased" value={n.purchasedOn} />
                        <DetailCell label="Telnyx ID" value="—" />
                        <DetailCell label="Calls This Week" value="—" />
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <button type="button" className="cursor-pointer text-[12px] font-medium text-[#0d4b3a] hover:text-[#13644e]">Rename</button>
                        <span className="text-[#c2c5cc]">&middot;</span>
                        <button type="button" className="cursor-pointer text-[12px] font-medium text-[#5b606a] hover:text-[#b42318]">Release</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 text-[11px] text-[#9298a3]">
          A2P state demo: <button type="button" onClick={() => setA2pState((s) => s === "pending" ? "in-progress" : s === "in-progress" ? "approved" : "pending")} className="cursor-pointer font-medium text-[#0d4b3a] hover:text-[#13644e]">cycle</button> (current: <span className="font-semibold text-[#0a0d14]">{a2pState}</span>)
        </div>
      </div>
    </div>
  );
}

function Stage({ n, label, status }: { n: number; label: string; status: "done" | "active" | "todo" }) {
  return (
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
      <span className={["text-[12px] font-medium whitespace-nowrap", status === "todo" ? "text-[#9298a3]" : "text-[#0a0d14]"].join(" ")}>
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

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">{label}</div>
      <div className="mt-1 text-[13px] font-medium text-[#0a0d14]">{value}</div>
    </div>
  );
}

function StatTile({ label, value, sub, emphasis }: { label: string; value: string; sub: string; emphasis?: boolean }) {
  return (
    <div
      className="rounded-[14px] border border-[#ebedf0] bg-white px-5 py-4"
      style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
    >
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div
          className={[
            "text-[28px] font-semibold leading-none tabular-nums tracking-[-0.022em]",
            emphasis ? "text-[#0d4b3a]" : "text-[#0a0d14]",
          ].join(" ")}
        >
          {value}
        </div>
        <div className="text-[12px] text-[#5b606a]">{sub}</div>
      </div>
    </div>
  );
}
