"use client";

import { useState } from "react";
import {
  IconPlus,
  IconSearch,
  IconPhone,
  IconMessageCircle,
  IconTrash,
  IconCheck,
  IconAlertCircle,
} from "@tabler/icons-react";

type PhoneNumber = {
  id: string;
  number: string;
  state: string;
  city: string;
  voice: boolean;
  sms: boolean;
  monthly: string;
  status: "active" | "pending";
  purchasedOn: string;
};

const NUMBERS: PhoneNumber[] = [
  { id: "1", number: "(512) 555 0188", state: "Texas", city: "Austin", voice: true, sms: true, monthly: "$1.50", status: "active", purchasedOn: "Jun 03, 2026" },
  { id: "2", number: "(713) 555 0244", state: "Texas", city: "Houston", voice: true, sms: false, monthly: "$1.50", status: "active", purchasedOn: "Jun 12, 2026" },
  { id: "3", number: "(704) 555 0212", state: "North Carolina", city: "Charlotte", voice: true, sms: true, monthly: "$1.50", status: "active", purchasedOn: "May 18, 2026" },
  { id: "4", number: "(602) 555 0177", state: "Arizona", city: "Phoenix", voice: true, sms: false, monthly: "$1.50", status: "pending", purchasedOn: "Jun 22, 2026" },
];

const SEARCH_RESULTS = [
  { number: "(404) 555 0291", state: "Georgia", city: "Atlanta", voice: true, sms: true, monthly: "$1.50" },
  { number: "(404) 555 0382", state: "Georgia", city: "Atlanta", voice: true, sms: true, monthly: "$1.50" },
  { number: "(770) 555 0413", state: "Georgia", city: "Marietta", voice: true, sms: true, monthly: "$1.50" },
  { number: "(678) 555 0509", state: "Georgia", city: "Roswell", voice: true, sms: true, monthly: "$1.50" },
];

export default function PhoneNumbersPage() {
  const [search, setSearch] = useState("404");
  const [showBuy, setShowBuy] = useState(false);

  const totalMonthly = NUMBERS.filter((n) => n.status === "active").length * 1.5;

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-12">
      <div className="mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
          Settings &middot; Phone Numbers
        </div>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.025em] text-[#0f1729]">
          Phone Numbers
        </h1>
        <div className="mt-1.5 text-[13.5px] text-[#6b7280]">
          Manage the numbers your dialer calls from. Each number is billed monthly. Buy local numbers to improve pickup rates.
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-4">
        <StatCard label="Active Numbers" value={NUMBERS.filter((n) => n.status === "active").length.toString()} hint="Available to dial" />
        <StatCard label="Pending Numbers" value={NUMBERS.filter((n) => n.status === "pending").length.toString()} hint="Setup in progress" />
        <StatCard label="Monthly Cost" value={`$${totalMonthly.toFixed(2)}`} hint="Charged on the 1st" />
      </div>

      <div
        className="overflow-hidden rounded-[12px] bg-white"
        style={{ boxShadow: "0 1px 2px rgba(15,23,41,0.04), 0 4px 12px -2px rgba(15,23,41,0.06)" }}
      >
        <div className="flex items-center justify-between border-b border-[#f1f2f4] px-5 py-4">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0f1729]">
              Your Numbers
            </div>
            <div className="mt-0.5 text-[11.5px] text-[#6b7280]">
              {NUMBERS.length} numbers across {new Set(NUMBERS.map((n) => n.state)).size} states
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowBuy((s) => !s)}
            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-[8px] bg-gradient-to-b from-[#13644e] to-[#0a3d4a] px-3.5 text-[12.5px] font-semibold text-white shadow-[0_1px_2px_rgba(13,75,58,0.25),inset_0_1px_0_rgba(255,255,255,0.10)] transition hover:opacity-95"
          >
            <IconPlus size={13} stroke={2.25} />
            Buy A Number
          </button>
        </div>

        <div className="grid grid-cols-[180px_180px_120px_120px_120px_60px] items-center gap-3 border-b border-[#f1f2f4] bg-[#fbfbfc] px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#9ca3af]">
          <div>Number</div>
          <div>Location</div>
          <div>Capabilities</div>
          <div>Status</div>
          <div>Monthly</div>
          <div></div>
        </div>

        <div className="divide-y divide-[#f1f2f4]">
          {NUMBERS.map((n) => (
            <div key={n.id} className="grid grid-cols-[180px_180px_120px_120px_120px_60px] items-center gap-3 px-5 py-3.5">
              <div className="font-mono text-[13px] tabular-nums text-[#0f1729]">{n.number}</div>
              <div>
                <div className="text-[12.5px] font-medium text-[#0f1729]">{n.city}</div>
                <div className="text-[11px] text-[#6b7280]">{n.state}</div>
              </div>
              <div className="flex gap-1.5">
                <CapabilityChip on={n.voice} icon={<IconPhone size={10} stroke={2.25} />} label="Voice" />
                <CapabilityChip on={n.sms} icon={<IconMessageCircle size={10} stroke={2.25} />} label="SMS" />
              </div>
              <div>
                {n.status === "active" ? (
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0f1729]">
                    <span className="h-2 w-2 rounded-full bg-[#13644e]" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6b7280]">
                    <span className="h-2 w-2 rounded-full bg-[#9ca3af]" />
                    Pending
                  </span>
                )}
              </div>
              <div className="text-[12.5px] tabular-nums text-[#0f1729]">{n.monthly}</div>
              <div className="text-right">
                <button
                  type="button"
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#f1f2f4] hover:text-[#0f1729]"
                  title="Release this number"
                >
                  <IconTrash size={13} stroke={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showBuy && (
        <div
          className="mt-6 overflow-hidden rounded-[12px] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(15,23,41,0.04), 0 4px 12px -2px rgba(15,23,41,0.06)" }}
        >
          <div className="border-b border-[#f1f2f4] px-5 py-4">
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0f1729]">
              Buy A Number
            </div>
            <div className="mt-0.5 text-[11.5px] text-[#6b7280]">
              Search by area code, city, or state. Numbers are billed $1.50 per month each.
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="flex items-center gap-2 rounded-[8px] border border-[#e5e7eb] bg-white px-3 py-2 transition focus-within:border-[#13644e]">
              <IconSearch size={14} stroke={2} className="text-[#9ca3af]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Area code, city, or state"
                className="w-full bg-transparent text-[13px] text-[#0f1729] outline-none placeholder:text-[#9ca3af]"
              />
            </div>

            <div className="mt-4 text-[11px] uppercase tracking-[0.10em] text-[#9ca3af]">
              4 Results In Georgia
            </div>

            <div className="mt-2 divide-y divide-[#f1f2f4]">
              {SEARCH_RESULTS.map((r) => (
                <div key={r.number} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <div className="font-mono text-[13.5px] tabular-nums text-[#0f1729]">{r.number}</div>
                    <div className="mt-0.5 text-[11.5px] text-[#6b7280]">
                      {r.city}, {r.state} &middot; Voice &amp; SMS
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12.5px] tabular-nums text-[#0f1729]">{r.monthly}/mo</span>
                    <button
                      type="button"
                      className="h-8 cursor-pointer rounded-[6px] bg-[#0f1729] px-3 text-[12px] font-semibold text-white transition hover:opacity-90"
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

      <div
        className="mt-6 overflow-hidden rounded-[12px] bg-white"
        style={{ boxShadow: "0 1px 2px rgba(15,23,41,0.04), 0 4px 12px -2px rgba(15,23,41,0.06)" }}
      >
        <div className="flex items-center justify-between border-b border-[#f1f2f4] px-5 py-4">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0f1729]">
              Per State Rotation
            </div>
            <div className="mt-0.5 text-[11.5px] text-[#6b7280]">
              When you have multiple numbers in a state, rotate them per call to spread load and avoid spam flagging.
            </div>
          </div>
        </div>

        <div className="divide-y divide-[#f1f2f4]">
          <RotationRow state="Texas" numbers={2} mode="Rotate Evenly" />
          <RotationRow state="North Carolina" numbers={1} mode="Single Number" />
          <RotationRow state="Arizona" numbers={1} mode="Single Number" />
        </div>
      </div>

      <div
        className="mt-6 rounded-[12px] border border-[#e5e7eb] bg-white p-5"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-[#9ca3af]">
            <IconAlertCircle size={18} stroke={2} />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-[#0f1729]">
              SMS Requires Brand Approval
            </div>
            <div className="mt-1 text-[12.5px] leading-relaxed text-[#6b7280]">
              To send SMS from these numbers you need A2P 10DLC brand and campaign approval from the carriers. Typical timeline is 1 to 3 weeks. Voice works immediately on every number.
            </div>
            <button
              type="button"
              className="mt-3 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[12px] font-medium text-[#0f1729] transition hover:border-[#0f1729]"
            >
              Start A2P Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div
      className="rounded-[12px] bg-white p-5"
      style={{ boxShadow: "0 1px 2px rgba(15,23,41,0.04), 0 4px 12px -2px rgba(15,23,41,0.06)" }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">{label}</div>
      <div className="mt-1.5 text-[26px] font-semibold tabular-nums tracking-[-0.02em] text-[#0f1729]">{value}</div>
      <div className="mt-0.5 text-[11.5px] text-[#6b7280]">{hint}</div>
    </div>
  );
}

function CapabilityChip({ on, icon, label }: { on: boolean; icon: React.ReactNode; label: string }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[10.5px] font-semibold",
        on ? "bg-[#0f1729] text-white" : "border border-[#e5e7eb] bg-white text-[#9ca3af]",
      ].join(" ")}
    >
      {icon}
      {label}
      {on && <IconCheck size={9} stroke={2.5} />}
    </span>
  );
}

function RotationRow({ state, numbers, mode }: { state: string; numbers: number; mode: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div>
        <div className="text-[13px] font-semibold text-[#0f1729]">{state}</div>
        <div className="mt-0.5 text-[11.5px] text-[#6b7280]">
          {numbers} number{numbers === 1 ? "" : "s"}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[12.5px] font-medium text-[#0f1729]">{mode}</span>
        {numbers > 1 && (
          <button
            type="button"
            className="cursor-pointer text-[11.5px] font-medium text-[#13644e] hover:text-[#0a3d4a]"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
