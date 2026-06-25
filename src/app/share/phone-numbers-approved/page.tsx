"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  IconPlus,
  IconPhone,
  IconMessageCircle,
  IconChevronRight,
  IconChevronDown,
  IconCheck,
  IconArrowUpRight,
  IconSparkles,
} from "@tabler/icons-react";
import { NUMBERS } from "../phone-numbers/_data";

type View = "1" | "2" | "3" | "4" | "5" | "6";

export default function ApprovedStateMockup() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafbfc]" />}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const sp = useSearchParams();
  const view: View =
    sp.get("v") === "2"
      ? "2"
      : sp.get("v") === "3"
        ? "3"
        : sp.get("v") === "4"
          ? "4"
          : sp.get("v") === "5"
            ? "5"
            : sp.get("v") === "6"
              ? "6"
              : "1";
  const state = sp.get("state") === "denied" ? "denied" : "approved";

  return (
    <div className="mx-auto max-w-[960px] px-12 pb-32 pt-11">
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
            Numbers your team dials from. Voice works immediately. SMS is approved across every number.
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

      {view === "5" && <V5TopStrip />}
      {view === "1" && <V1Compliance />}
      {view === "2" && <V2Sender />}
      {view === "3" && <V3Activity />}
      {view === "4" && <V4TwoCard />}
      {view === "6" && <V6TwoCardPolished state={state} />}

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
            <div
              key={n.id}
              className="grid grid-cols-[1fr_140px_120px_140px_40px] items-center gap-4 px-6 py-3.5"
            >
              <div>
                <div className="text-[14px] font-semibold tabular-nums text-[#0a0d14]">{n.number}</div>
                <div className="mt-0.5 text-[11.5px] text-[#5b606a]">{n.city}, {n.state}</div>
              </div>
              <div className="flex items-center gap-3">
                <CapIndicator icon={<IconPhone size={12} stroke={2.25} />} label="Voice" />
                <CapIndicator icon={<IconMessageCircle size={12} stroke={2.25} />} label="SMS" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#5b606a]">
                  <span
                    className="h-[7px] w-[7px] rounded-full bg-[#16a34a]"
                    style={{ boxShadow: "0 0 0 3px rgba(22,163,74,0.14)" }}
                  />
                  Active
                </span>
              </div>
              <div className="text-right text-[13.5px] font-semibold tabular-nums text-[#0a0d14]">
                {n.monthly}<span className="text-[11px] font-normal text-[#9298a3]">/mo</span>
              </div>
              <div className="text-right">
                <IconChevronDown size={14} stroke={2} className="text-[#9298a3]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CapIndicator({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#0d4b3a]">
      {icon}
      {label}
      <IconCheck size={10} stroke={2.5} className="ml-0.5" />
    </span>
  );
}

function V1Compliance() {
  return (
    <div
      className="mt-8 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
      style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
    >
      <div className="flex items-center justify-between gap-4 px-7 py-4">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0d4b3a]"
            style={{ boxShadow: "0 0 0 4px rgba(13,75,58,0.10)" }}
          >
            <IconCheck size={14} stroke={3} className="text-white" />
          </span>
          <div>
            <div className="text-[15px] font-semibold tracking-[-0.012em] text-[#0a0d14]">
              Messaging Compliance
            </div>
            <div className="text-[11.5px] text-[#5b606a]">Brand and Campaign Approved by Carriers</div>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-[7px] border border-[#ebedf0] bg-white px-3 text-[12px] font-medium text-[#0a0d14] hover:border-[#0d4b3a] hover:text-[#0d4b3a]"
        >
          View Audit Log
          <IconArrowUpRight size={11} stroke={2.25} />
        </button>
      </div>

      <div className="grid grid-cols-2 border-t border-[#f1f2f4]">
        <div className="border-r border-[#f1f2f4] px-7 py-5">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
            Brand
          </div>
          <div className="mt-2 text-[14px] font-semibold tracking-[-0.014em] text-[#0a0d14]">
            Workflow Minds LLC
          </div>
          <div className="mt-1 text-[11.5px] text-[#5b606a]">EIN ending 4821 &middot; Verified May 18, 2026</div>
          <button type="button" className="mt-3 cursor-pointer text-[12px] font-medium text-[#0d4b3a] hover:text-[#13644e]">
            Manage Brand Profile &rarr;
          </button>
        </div>
        <div className="px-7 py-5">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
            Campaign
          </div>
          <div className="mt-2 text-[14px] font-semibold tracking-[-0.014em] text-[#0a0d14]">
            Customer Care &middot; Surplus Recovery
          </div>
          <div className="mt-1 text-[11.5px] text-[#5b606a]">5 templates approved &middot; Live since May 22, 2026</div>
          <button type="button" className="mt-3 cursor-pointer text-[12px] font-medium text-[#0d4b3a] hover:text-[#13644e]">
            Edit Sample Messages &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

function V2Sender() {
  return (
    <div className="mt-8 grid grid-cols-[1fr_280px] gap-3">
      <div
        className="overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
        style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-5">
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
              Sender Profile
            </div>
            <div className="mt-1 text-[16px] font-semibold tracking-[-0.014em] text-[#0a0d14]">
              Workflow Minds
            </div>
            <div className="mt-0.5 text-[12px] text-[#5b606a]">Customer Care &middot; 5 templates approved</div>
          </div>
          <span
            className="inline-flex h-7 items-center gap-1.5 rounded-[7px] border border-[#0d4b3a] bg-white px-2.5 text-[11px] font-semibold text-[#0d4b3a]"
          >
            <IconCheck size={11} stroke={2.5} />
            Live
          </span>
        </div>
        <div className="border-t border-[#f1f2f4] px-6 py-5">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
            Sample Templates
          </div>
          <ul className="mt-3 space-y-2 text-[12.5px] text-[#0a0d14]">
            <li className="flex items-center justify-between border-b border-[#f1f2f4] pb-2">
              <span>Initial outreach with case context</span>
              <button type="button" className="cursor-pointer text-[11px] font-medium text-[#5b606a] hover:text-[#0d4b3a]">Edit</button>
            </li>
            <li className="flex items-center justify-between border-b border-[#f1f2f4] pb-2">
              <span>Voicemail follow-up</span>
              <button type="button" className="cursor-pointer text-[11px] font-medium text-[#5b606a] hover:text-[#0d4b3a]">Edit</button>
            </li>
            <li className="flex items-center justify-between border-b border-[#f1f2f4] pb-2">
              <span>Document request reminder</span>
              <button type="button" className="cursor-pointer text-[11px] font-medium text-[#5b606a] hover:text-[#0d4b3a]">Edit</button>
            </li>
            <li className="flex items-center justify-between">
              <button type="button" className="cursor-pointer text-[12px] font-medium text-[#0d4b3a] hover:text-[#13644e]">
                + Add Template
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div
        className="overflow-hidden rounded-[14px] border border-[#0d4b3a] bg-[#0d4b3a] text-white"
        style={{ boxShadow: "0 8px 24px -10px rgba(13,75,58,0.40)" }}
      >
        <div className="px-5 py-4">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/70">
            Live Preview
          </div>
          <div className="mt-1 text-[12px] text-white/60">What recipients see when you message</div>
        </div>
        <div className="bg-white p-4 text-[#0a0d14]">
          <div className="text-[10px] text-[#9298a3]">Today 11:14 AM</div>
          <div className="mt-1.5 max-w-[220px] rounded-[12px] bg-[#f1f2f4] px-3.5 py-2.5 text-[12.5px] leading-[1.4]">
            Hi, this is Sarah with Workflow Minds. Public records show you may be owed funds from a recent foreclosure sale. Reply Y to learn more or STOP to opt out.
          </div>
        </div>
      </div>
    </div>
  );
}

function V3Activity() {
  return (
    <div
      className="mt-8 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
      style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
    >
      <div className="flex items-center justify-between gap-4 px-7 py-5">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
            Messaging
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-[34px] font-semibold leading-none tabular-nums tracking-[-0.024em] text-[#0a0d14]">
              47
            </div>
            <div className="text-[12.5px] text-[#5b606a]">messages sent this week</div>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-[7px] border border-[#ebedf0] bg-white px-3 text-[12px] font-medium text-[#0a0d14] hover:border-[#0d4b3a] hover:text-[#0d4b3a]"
        >
          View Activity Feed
          <IconArrowUpRight size={11} stroke={2.25} />
        </button>
      </div>
      <div className="grid grid-cols-3 border-t border-[#f1f2f4]">
        <StatCell label="Delivered" value="98%" sub="46 of 47" />
        <StatCell label="Reply Rate" value="12%" sub="6 replies" border />
        <StatCell label="Opt-outs" value="0" sub="this week" border />
      </div>
      <div className="border-t border-[#f1f2f4] px-7 py-3 text-[11.5px] text-[#5b606a]">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-[6px] w-[6px] rounded-full bg-[#0d4b3a]"
            style={{ boxShadow: "0 0 0 3px rgba(13,75,58,0.14)" }}
          />
          Brand and Campaign approved &middot; Workflow Minds &middot; Customer Care
        </span>
      </div>
    </div>
  );
}

function StatCell({ label, value, sub, border }: { label: string; value: string; sub: string; border?: boolean }) {
  return (
    <div className={["px-7 py-4", border ? "border-l border-[#f1f2f4]" : ""].join(" ")}>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <div className="text-[20px] font-semibold leading-none tabular-nums tracking-[-0.018em] text-[#0a0d14]">{value}</div>
        <div className="text-[11.5px] text-[#5b606a]">{sub}</div>
      </div>
    </div>
  );
}

function V4TwoCard() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3">
      <div
        className="overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
        style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
      >
        <div className="px-6 py-5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
              Brand
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0d4b3a]">
              <IconCheck size={11} stroke={2.5} />
              Approved
            </span>
          </div>
          <div className="mt-2 text-[16px] font-semibold tracking-[-0.014em] text-[#0a0d14]">
            Workflow Minds LLC
          </div>
          <div className="mt-1 text-[12px] text-[#5b606a]">EIN ending 4821 &middot; Verified May 18, 2026</div>
        </div>
        <div className="grid grid-cols-2 border-t border-[#f1f2f4]">
          <div className="border-r border-[#f1f2f4] px-6 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">Vetting</div>
            <div className="mt-0.5 text-[12px] font-medium text-[#0a0d14]">Standard</div>
          </div>
          <div className="px-6 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">Vertical</div>
            <div className="mt-0.5 text-[12px] font-medium text-[#0a0d14]">Financial Services</div>
          </div>
        </div>
        <div className="border-t border-[#f1f2f4] px-6 py-3">
          <button type="button" className="cursor-pointer text-[12px] font-medium text-[#0d4b3a] hover:text-[#13644e]">
            Manage Brand &rarr;
          </button>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
        style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
      >
        <div className="px-6 py-5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
              Campaign
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0d4b3a]">
              <IconCheck size={11} stroke={2.5} />
              Live
            </span>
          </div>
          <div className="mt-2 text-[16px] font-semibold tracking-[-0.014em] text-[#0a0d14]">
            Customer Care
          </div>
          <div className="mt-1 text-[12px] text-[#5b606a]">Surplus Recovery &middot; Live since May 22, 2026</div>
        </div>
        <div className="grid grid-cols-2 border-t border-[#f1f2f4]">
          <div className="border-r border-[#f1f2f4] px-6 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">Templates</div>
            <div className="mt-0.5 text-[12px] font-medium text-[#0a0d14]">5 approved</div>
          </div>
          <div className="px-6 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">Volume</div>
            <div className="mt-0.5 text-[12px] font-medium text-[#0a0d14]">Low (3k/mo)</div>
          </div>
        </div>
        <div className="border-t border-[#f1f2f4] px-6 py-3">
          <button type="button" className="cursor-pointer text-[12px] font-medium text-[#0d4b3a] hover:text-[#13644e]">
            Edit Campaign &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

function V5TopStrip() {
  return (
    <div className="mt-7 grid grid-cols-3 gap-3">
      <FeatureTile
        eyebrow="Brand"
        title="Workflow Minds"
        sub="Verified May 18"
        accent
      />
      <FeatureTile
        eyebrow="Campaign"
        title="Customer Care"
        sub="Live since May 22"
        accent
      />
      <FeatureTile
        eyebrow="Activity"
        title="47 sent"
        sub="98% delivered this week"
      />
    </div>
  );
}

function FeatureTile({ eyebrow, title, sub, accent }: { eyebrow: string; title: string; sub: string; accent?: boolean }) {
  return (
    <button
      type="button"
      className={[
        "group cursor-pointer overflow-hidden rounded-[14px] border bg-white px-5 py-4 text-left transition",
        accent ? "border-[#ebedf0] hover:border-[#0d4b3a]" : "border-[#ebedf0] hover:border-[#0d4b3a]",
      ].join(" ")}
      style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
          {eyebrow}
        </div>
        {accent && (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0d4b3a]">
            <IconCheck size={11} stroke={3} className="text-white" />
          </span>
        )}
        {!accent && <IconSparkles size={12} stroke={2} className="text-[#9298a3]" />}
      </div>
      <div className="mt-2 text-[16px] font-semibold tracking-[-0.014em] text-[#0a0d14]">{title}</div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-[11.5px] text-[#5b606a]">{sub}</span>
        <IconArrowUpRight size={13} stroke={2} className="text-[#9298a3] transition group-hover:text-[#0d4b3a]" />
      </div>
    </button>
  );
}

// V6 — Polished V4 per Bree's pass.
// Two side-by-side cards, Title Case, slim petrol top accent strip, status pill
// that handles approved/in-review/denied. When denied, expandable rejection reason
// inline with a Resubmit button. NO stats, NO activity. Compliance only.
function V6TwoCardPolished({ state }: { state: "approved" | "denied" }) {
  const brandStatus = state === "denied" ? "denied" : "approved";
  const campaignStatus = state === "denied" ? "pending" : "approved";

  return (
    <div className="mt-8 grid grid-cols-2 gap-3">
      <ComplianceCard
        eyebrow="Brand"
        title="Workflow Minds LLC"
        meta="EIN ending 4821 · Verified May 18, 2026"
        status={brandStatus}
        denialReason="Carriers flagged the EIN format. Looks like a 9-digit value without the standard hyphen. Easy fix."
        cardAccent
      />
      <ComplianceCard
        eyebrow="Campaign"
        title="Customer Care"
        meta="Surplus Recovery · Live Since May 22, 2026"
        status={campaignStatus}
        denialReason=""
        cardAccent
      />
    </div>
  );
}

function ComplianceCard({
  eyebrow,
  title,
  meta,
  status,
  denialReason,
  cardAccent,
}: {
  eyebrow: string;
  title: string;
  meta: string;
  status: "approved" | "pending" | "denied";
  denialReason: string;
  cardAccent?: boolean;
}) {
  const isApproved = status === "approved";
  const isDenied = status === "denied";
  return (
    <div
      className={[
        "overflow-hidden rounded-[14px] border bg-white",
        isDenied ? "border-[#b42318]/30" : "border-[#ebedf0]",
      ].join(" ")}
      style={{
        boxShadow: isDenied ? "0 8px 24px -12px rgba(180,35,24,0.15)" : "0 1px 2px rgba(12,13,16,0.02)",
      }}
    >
      {cardAccent && (
        <div
          className="h-1 w-full"
          style={{
            background: isDenied
              ? "linear-gradient(90deg, #b42318 0%, #ef4444 100%)"
              : "linear-gradient(90deg, #0a3d2c 0%, #0d4b3a 50%, #13644e 100%)",
          }}
        />
      )}
      <div className="px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#9298a3]">
            {eyebrow}
          </div>
          <StatusPill status={status} />
        </div>
        <div className="mt-2 text-[16px] font-semibold tracking-[-0.014em] text-[#0a0d14]">
          {title}
        </div>
        <div className="mt-1 text-[12px] text-[#5b606a]">{meta}</div>
      </div>

      {isDenied && (
        <div className="border-t border-[#fca5a5]/40 bg-[#fef2f2] px-6 py-4">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#b42318]">
            Carrier Feedback
          </div>
          <p className="mt-1.5 text-[12.5px] leading-[1.5] text-[#0a0d14]">{denialReason}</p>
          <button
            type="button"
            className="mt-3 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#b42318] px-3.5 text-[12px] font-medium text-white"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(180,35,24,0.20), 0 6px 16px -4px rgba(180,35,24,0.30)" }}
          >
            Fix And Resubmit
          </button>
        </div>
      )}

      {isApproved && (
        <div className="border-t border-[#f1f2f4] px-6 py-3">
          <button type="button" className="cursor-pointer text-[12px] font-medium text-[#5b606a] hover:text-[#0d4b3a]">
            View Details &rarr;
          </button>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: "approved" | "pending" | "denied" }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0d4b3a]">
        <IconCheck size={11} stroke={2.5} />
        Approved
      </span>
    );
  }
  if (status === "denied") {
    return (
      <span className="inline-flex h-6 items-center gap-1 rounded-full bg-[#b42318] px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white">
        Denied
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full border border-[#ebedf0] bg-white px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#5b606a]">
      In Review
    </span>
  );
}
