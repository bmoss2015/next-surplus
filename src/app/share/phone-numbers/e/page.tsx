"use client";

import {
  IconChevronRight,
  IconChevronLeft,
  IconArrowRight,
  IconCheck,
  IconSearch,
  IconPhone,
} from "@tabler/icons-react";

export default function PNVariantE() {
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="mx-auto max-w-[760px] px-10 pb-32 pt-11">
        <div className="text-[12px] text-[#9298a3] flex items-center gap-1.5">
          <span>Settings</span>
          <IconChevronRight size={12} stroke={2} className="text-[#c2c5cc]" />
          <span>Phone Numbers</span>
          <IconChevronRight size={12} stroke={2} className="text-[#c2c5cc]" />
          <span className="text-[#0a0d14]">First Number</span>
        </div>

        <h1 className="mt-3 text-[30px] font-semibold leading-[1.15] tracking-[-0.028em] text-[#0a0d14]">
          Get Your First Number
        </h1>
        <p className="mt-4 max-w-[60ch] text-[14px] leading-[1.55] text-[#5b606a]">
          Variant E &middot; First-time setup view. Guided pick + buy + first call. Different organizing principle than the operating-mode pages, because the user has nothing yet.
        </p>

        <div className="mt-7 flex items-center gap-3">
          <Step n={1} label="Pick A State" status="done" />
          <span className="h-px w-12 bg-[#0d4b3a]" />
          <Step n={2} label="Choose A Number" status="active" />
          <span className="h-px w-12 bg-[#ebedf0]" />
          <Step n={3} label="Confirm Purchase" status="todo" />
        </div>

        <div
          className="mt-7 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="border-b border-[#f1f2f4] px-7 py-5">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
              Step 2 Of 3
            </div>
            <div className="mt-1.5 text-[17px] font-semibold tracking-[-0.018em] text-[#0a0d14]">
              Choose Your Texas Number
            </div>
            <div className="mt-1.5 text-[12.5px] text-[#5b606a]">
              Local Texas numbers improve pickup rates. Pick whichever feels memorable. Each is $1.50 per month.
            </div>
          </div>

          <div className="px-7 py-5">
            <div className="flex items-center gap-2 rounded-[7px] border border-[#ebedf0] bg-white px-3 py-2.5 transition focus-within:border-[#0d4b3a]">
              <IconSearch size={14} stroke={2} className="text-[#9298a3]" />
              <input
                defaultValue="Austin"
                placeholder="Filter by area code or city"
                className="w-full bg-transparent text-[13.5px] text-[#0a0d14] outline-none placeholder:text-[#c2c5cc]"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { num: "(512) 555 0188", city: "Austin", featured: true },
                { num: "(512) 555 0244", city: "Austin" },
                { num: "(737) 555 0301", city: "Austin" },
                { num: "(737) 555 0398", city: "Round Rock" },
              ].map((r) => (
                <button
                  key={r.num}
                  type="button"
                  className={[
                    "group flex cursor-pointer items-center justify-between rounded-[10px] bg-white px-4 py-3 text-left transition",
                    r.featured ? "ring-2 ring-[#0d4b3a]" : "border border-[#ebedf0] hover:border-[#0d4b3a]",
                  ].join(" ")}
                >
                  <div>
                    <div className="text-[15px] font-semibold tabular-nums text-[#0a0d14]">{r.num}</div>
                    <div className="mt-0.5 text-[11px] text-[#5b606a]">{r.city}, TX</div>
                  </div>
                  {r.featured ? (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0d4b3a] text-white">
                      <IconCheck size={13} stroke={3} />
                    </span>
                  ) : (
                    <IconPhone size={14} stroke={2} className="text-[#c2c5cc] transition group-hover:text-[#0d4b3a]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#f1f2f4] bg-[#fafbfc] px-7 py-4">
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-[#5b606a] transition hover:text-[#0a0d14]"
            >
              <IconChevronLeft size={13} stroke={2.25} />
              Back
            </button>
            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[7px] bg-[#0d4b3a] px-5 text-[13.5px] font-medium text-white"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 8px 20px -4px rgba(13,75,58,0.34)" }}
            >
              Continue To Confirm
              <IconArrowRight size={14} stroke={2.25} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ n, label, status }: { n: number; label: string; status: "done" | "active" | "todo" }) {
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
      <span className={["text-[12.5px] font-medium whitespace-nowrap", status === "todo" ? "text-[#9298a3]" : "text-[#0a0d14]"].join(" ")}>
        {label}
      </span>
    </div>
  );
}
