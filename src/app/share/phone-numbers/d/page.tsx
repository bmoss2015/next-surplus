"use client";

import { useState } from "react";
import {
  IconPlus,
  IconPhone,
  IconMessageCircle,
  IconChevronRight,
  IconX,
  IconCheck as IconCheckMark,
} from "@tabler/icons-react";

const IconCheck = IconCheckMark;
import { NUMBERS } from "../_data";

export default function PNVariantD() {
  const [selectedId, setSelectedId] = useState<string>("1");
  const [drawerMode, setDrawerMode] = useState<"detail" | "buy" | null>("detail");
  const selected = NUMBERS.find((n) => n.id === selectedId) ?? NUMBERS[0];
  const activeCount = NUMBERS.filter((n) => n.status === "active").length;
  const pendingCount = NUMBERS.filter((n) => n.status === "pending").length;
  const totalMonthly = activeCount * 1.5;

  function openBuy() {
    setDrawerMode("buy");
  }

  function selectNumber(id: string) {
    setSelectedId(id);
    setDrawerMode("detail");
  }

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="mx-auto max-w-[1080px] px-12 pb-32 pt-11">
        <div className="text-[12px] text-[#9298a3] flex items-center gap-1.5">
          <span>Settings</span>
          <IconChevronRight size={12} stroke={2} className="text-[#c2c5cc]" />
          <span>Phone Numbers</span>
        </div>

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-5">
          <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.028em] text-[#0a0d14]">
            Phone Numbers
          </h1>
          <button
            type="button"
            onClick={openBuy}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#0d4b3a] px-4 text-[13px] font-medium tracking-[-0.008em] text-white"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
          >
            <IconPlus size={13} stroke={2.25} />
            Buy A Number
          </button>
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

        <div className="mt-7 grid grid-cols-[1fr_360px] gap-5">
          <div>
            <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
              Your Numbers
              <span className="h-px flex-1 bg-[#ebedf0]" />
            </div>
            <div
              className="mt-3.5 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
              style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
            >
              <div className="divide-y divide-[#f1f2f4]">
                {NUMBERS.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => selectNumber(n.id)}
                    className={[
                      "flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-3.5 text-left transition",
                      selectedId === n.id && drawerMode === "detail" ? "bg-[#fafbfc]" : "hover:bg-[#fafbfc]",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-[14px] font-semibold tabular-nums text-[#0a0d14]">{n.number}</div>
                        <div className="mt-0.5 text-[11.5px] text-[#5b606a]">{n.city}, {n.state}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={[
                        "inline-flex items-center gap-1.5 text-[11.5px] font-medium",
                        n.status === "active" ? "text-[#5b606a]" : "text-[#5b606a]",
                      ].join(" ")}>
                        <span className={[
                          "h-[6px] w-[6px] rounded-full",
                          n.status === "active" ? "bg-[#16a34a]" : "bg-[#9298a3]",
                        ].join(" ")} style={{
                          boxShadow: n.status === "active"
                            ? "0 0 0 3px rgba(22,163,74,0.14)"
                            : "0 0 0 3px rgba(146,152,163,0.14)"
                        }} />
                        {n.status === "active" ? "Active" : "Pending"}
                      </span>
                      <span className="text-[12px] tabular-nums text-[#0a0d14]">{n.monthly}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
              SMS Setup
              <span className="h-px flex-1 bg-[#ebedf0]" />
            </div>
            <div
              className="mt-3.5 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
              style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
            >
              <div className="px-6 py-5">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
                  A2P 10DLC
                </div>
                <div className="mt-1.5 text-[16px] font-semibold tracking-[-0.018em] text-[#0a0d14]">
                  Not Ready Until Approved
                </div>
                <div className="mt-1.5 text-[12.5px] leading-[1.55] text-[#5b606a]">
                  SMS requires brand and campaign approval. Voice works immediately on every number.
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

          <div className="self-start">
            {drawerMode === "detail" && (
              <div
                className="overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
                style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
              >
                <div className="flex items-center justify-between border-b border-[#f1f2f4] px-5 py-4">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
                    Number Detail
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerMode(null)}
                    className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-[#9298a3] hover:bg-[#f1f2f4] hover:text-[#0a0d14]"
                  >
                    <IconX size={13} stroke={2} />
                  </button>
                </div>
                <div className="px-5 py-5">
                  <div className="text-[20px] font-semibold tabular-nums tracking-[-0.018em] text-[#0a0d14]">
                    {selected.number}
                  </div>
                  <div className="mt-1 text-[12.5px] text-[#5b606a]">
                    {selected.city}, {selected.state}
                  </div>

                  <div className="mt-5 space-y-2.5 border-t border-[#f1f2f4] pt-4">
                    <DetailRow label="Status" value={selected.status === "active" ? "Active" : "Pending"} />
                    <DetailRow label="Monthly Cost" value={`${selected.monthly}/mo`} />
                    <DetailRow label="Purchased" value={selected.purchasedOn} />
                  </div>

                  <div className="mt-4 border-t border-[#f1f2f4] pt-4">
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
                      Capabilities
                    </div>
                    <div className="mt-2.5 space-y-2">
                      <Cap on icon={<IconPhone size={13} stroke={2} />} label="Voice" status="Live" />
                      <Cap on={false} pending icon={<IconMessageCircle size={13} stroke={2} />} label="SMS" status="Pending Approval" />
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2 border-t border-[#f1f2f4] pt-4">
                    <button
                      type="button"
                      className="h-9 flex-1 cursor-pointer rounded-[7px] bg-white text-[12.5px] font-medium text-[#0a0d14] transition hover:border-[#d8d6cf]"
                      style={{ border: "1px solid #ebedf0", boxShadow: "0 1px 1px rgba(12,13,16,0.02)" }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="h-9 flex-1 cursor-pointer rounded-[7px] bg-white text-[12.5px] font-medium text-[#b42318] transition hover:bg-[#fafbfc]"
                      style={{ border: "1px solid #ebedf0", boxShadow: "0 1px 1px rgba(12,13,16,0.02)" }}
                    >
                      Release
                    </button>
                  </div>
                </div>
              </div>
            )}

            {drawerMode === "buy" && (
              <div
                className="overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
                style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
              >
                <div className="flex items-center justify-between border-b border-[#f1f2f4] px-5 py-4">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
                    Buy A Number
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerMode(null)}
                    className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-[#9298a3] hover:bg-[#f1f2f4] hover:text-[#0a0d14]"
                  >
                    <IconX size={13} stroke={2} />
                  </button>
                </div>
                <div className="px-5 py-5">
                  <input
                    defaultValue="404"
                    placeholder="Area Code Or City"
                    className="h-[38px] w-full rounded-[7px] border border-[#ebedf0] bg-white px-3 text-[13.5px] text-[#0a0d14] outline-none transition focus:border-[#0d4b3a] placeholder:text-[#c2c5cc]"
                  />
                  <div className="mt-4 text-[11px] uppercase tracking-[0.06em] text-[#9298a3]">
                    4 Results In Georgia
                  </div>
                  <div className="mt-2 divide-y divide-[#f1f2f4]">
                    {[
                      { number: "(404) 555 0291", city: "Atlanta" },
                      { number: "(404) 555 0382", city: "Atlanta" },
                      { number: "(770) 555 0413", city: "Marietta" },
                      { number: "(678) 555 0509", city: "Roswell" },
                    ].map((r) => (
                      <div key={r.number} className="flex items-center justify-between py-2.5">
                        <div>
                          <div className="text-[12.5px] font-semibold tabular-nums text-[#0a0d14]">{r.number}</div>
                          <div className="text-[10.5px] text-[#5b606a]">{r.city}, GA</div>
                        </div>
                        <button
                          type="button"
                          className="h-7 cursor-pointer rounded-[6px] bg-white px-2.5 text-[11.5px] font-medium text-[#0a0d14] transition"
                          style={{ border: "1px solid #ebedf0" }}
                        >
                          $1.50
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className="text-[#5b606a]">{label}</span>
      <span className="font-medium text-[#0a0d14]">{value}</span>
    </div>
  );
}

function Cap({ on, pending, icon, label, status }: { on: boolean; pending?: boolean; icon: React.ReactNode; label: string; status: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={[
        "inline-flex h-7 w-7 items-center justify-center rounded-[6px]",
        pending ? "text-[#c2c5cc]" : on ? "text-[#0d4b3a]" : "text-[#9298a3]",
      ].join(" ")} style={{ border: pending ? "1px dashed #ebedf0" : `1px solid ${on ? "#0d4b3a" : "#ebedf0"}` }}>
        {icon}
      </span>
      <div>
        <div className="text-[12px] font-medium text-[#0a0d14]">{label}</div>
        <div className="text-[10.5px] text-[#5b606a]">{status}</div>
      </div>
      {on && !pending && <IconCheck size={12} stroke={2.5} className="ml-auto text-[#0d4b3a]" />}
    </div>
  );
}
