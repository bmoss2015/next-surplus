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

export default function PNVariantB() {
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
        <p className="mt-4 max-w-[60ch] text-[14px] leading-[1.55] tracking-[-0.005em] text-[#5b606a]">
          Manage the numbers your dialer calls from. Voice works immediately on every number. SMS unlocks after A2P 10DLC brand approval.
        </p>

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

        <SettingsCard
          eyebrow="Your Numbers"
          title="4 Numbers Across 3 States"
          description="Voice is live on every number from purchase. SMS requires brand approval."
          action={
            <button
              type="button"
              onClick={() => setShowBuy((s) => !s)}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#0d4b3a] px-4 text-[13px] font-medium tracking-[-0.008em] text-white"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
            >
              <IconPlus size={13} stroke={2.25} />
              Buy A Number
            </button>
          }
        >
          <div className="divide-y divide-[#f1f2f4]">
            {NUMBERS.map((n) => (
              <div key={n.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,160px)_120px_140px_auto] items-center gap-5 px-6 py-3.5">
                <div className="text-[14px] font-semibold tabular-nums text-[#0a0d14]">{n.number}</div>
                <div>
                  <div className="text-[13px] font-medium text-[#0a0d14]">{n.city}</div>
                  <div className="text-[11.5px] text-[#5b606a]">{n.state}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <CapBadge active={n.voice} icon={<IconPhone size={11} stroke={2} />} label="Voice" />
                  <CapBadge active={n.sms} icon={<IconMessageCircle size={11} stroke={2} />} label="SMS" pending />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#5b606a]">
                    <span className={[
                      "h-[7px] w-[7px] rounded-full",
                      n.status === "active" ? "bg-[#16a34a]" : "bg-[#9298a3]"
                    ].join(" ")} style={{
                      boxShadow: n.status === "active"
                        ? "0 0 0 3px rgba(22,163,74,0.14)"
                        : "0 0 0 3px rgba(146,152,163,0.14)"
                    }} />
                    {n.status === "active" ? "Active" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center gap-3 justify-self-end">
                  <span className="text-[13px] font-medium tabular-nums text-[#0a0d14]">{n.monthly}</span>
                  <button
                    type="button"
                    className="text-[11.5px] font-medium text-[#5b606a] transition hover:text-[#b42318] cursor-pointer"
                  >
                    Release
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SettingsCard>

        {showBuy && (
          <SettingsCard
            eyebrow="Buy A Number"
            title="Search Available Numbers"
            description="Local numbers improve pickup rates. Each number is $1.50 per month."
          >
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 rounded-[7px] border border-[#ebedf0] bg-white px-3 py-2.5 transition focus-within:border-[#0d4b3a]">
                <IconSearch size={14} stroke={2} className="text-[#9298a3]" />
                <input
                  defaultValue="404"
                  placeholder="Area Code, City, Or State"
                  className="w-full bg-transparent text-[13.5px] text-[#0a0d14] outline-none placeholder:text-[#c2c5cc]"
                />
              </div>
              <div className="mt-4 divide-y divide-[#f1f2f4]">
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
          </SettingsCard>
        )}

        <SettingsCard
          eyebrow="Per State Rotation"
          title="When You Have Multiple Numbers In One State"
          description="The dialer rotates them per call to spread load and avoid spam flagging."
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
        </SettingsCard>

        <SettingsCard
          eyebrow="SMS Setup"
          title="A2P 10DLC Brand Approval"
          description="To send SMS from these numbers you need brand and campaign approval from the carriers. Typical timeline is 1 to 3 weeks. Voice works immediately."
          action={
            <button
              type="button"
              className="inline-flex h-9 cursor-pointer items-center rounded-[7px] bg-[#0d4b3a] px-4 text-[13px] font-medium tracking-[-0.008em] text-white"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
            >
              Start A2P Registration
            </button>
          }
        >
          <div className="border-t border-[#f1f2f4] px-6 py-4">
            <span className="inline-flex items-center gap-2 text-[12px] font-medium text-[#5b606a]">
              <span className="h-[7px] w-[7px] rounded-full bg-[#9298a3]" style={{ boxShadow: "0 0 0 3px rgba(146,152,163,0.14)" }} />
              Not Ready Until Approved
            </span>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}

function SettingsCard({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="mt-6 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
      style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
    >
      <div className="flex items-start justify-between gap-6 px-6 py-5">
        <div className="min-w-0">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
            {eyebrow}
          </div>
          <div className="mt-1.5 text-[16px] font-semibold leading-[1.25] tracking-[-0.018em] text-[#0a0d14]">
            {title}
          </div>
          {description && (
            <div className="mt-1.5 max-w-[64ch] text-[12.5px] leading-[1.55] text-[#5b606a]">
              {description}
            </div>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className="border-t border-[#f1f2f4]">{children}</div>}
    </div>
  );
}

function CapBadge({ active, icon, label, pending }: { active: boolean; icon: React.ReactNode; label: string; pending?: boolean }) {
  if (pending) {
    return (
      <span className="inline-flex h-[22px] items-center gap-1 rounded-[5px] bg-white px-2 text-[10.5px] font-medium text-[#9298a3]" style={{ border: "1px dashed #ebedf0" }}>
        {icon}
        {label}
      </span>
    );
  }
  return (
    <span className={[
      "inline-flex h-[22px] items-center gap-1 rounded-[5px] bg-white px-2 text-[10.5px] font-medium",
      active ? "text-[#0d4b3a]" : "text-[#9298a3]",
    ].join(" ")} style={{ border: `1px solid ${active ? "#0d4b3a" : "#ebedf0"}` }}>
      {icon}
      {label}
    </span>
  );
}
