"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  IconPlus,
  IconPhone,
  IconMessageCircle,
  IconChevronDown,
  IconChevronUp,
  IconCheck,
  IconClock,
} from "@tabler/icons-react";
import type { PhoneNumberRow, A2pBrand } from "@/lib/settings/fetch";

function formatE164(e164: string): string {
  const cleaned = e164.replace(/[^\d]/g, "");
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return e164;
}

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

type A2PState = "pending" | "in-progress" | "approved";

function brandToA2pState(brand: A2pBrand | null): A2PState {
  if (!brand) return "pending";
  if (brand.status === "approved") return "approved";
  if (brand.status === "draft" || brand.status === "rejected") return "pending";
  return "in-progress";
}

export function PhoneNumbersSection({
  initial,
  a2pBrand,
}: {
  initial: PhoneNumberRow[];
  a2pBrand: A2pBrand | null;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafbfc]" />}>
      <PhoneNumbersInner initial={initial} a2pBrand={a2pBrand} />
    </Suspense>
  );
}

function PhoneNumbersInner({
  initial,
  a2pBrand,
}: {
  initial: PhoneNumberRow[];
  a2pBrand: A2pBrand | null;
}) {
  const sp = useSearchParams();
  const initialState: A2PState =
    (sp.get("a2p") as A2PState | null) === "approved"
      ? "approved"
      : (sp.get("a2p") as A2PState | null) === "in-progress"
        ? "in-progress"
        : sp.get("a2p") === "pending"
          ? "pending"
          : brandToA2pState(a2pBrand);
  const [a2pState] = useState<A2PState>(initialState);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const numbers = initial;

  return (
    <div className="mx-auto w-full max-w-[960px] px-8 pb-32 pt-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.026em] text-[#0a0d14]">
            Phone Numbers
          </h1>
          <p className="mt-3 max-w-[60ch] text-[14px] leading-[1.55] text-[#5b606a]">
            Numbers your team dials from. Voice works immediately. SMS unlocks once your brand and campaign clear carrier review.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[7px] bg-[#0d4b3a] px-4 text-[13px] font-medium text-white"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
        >
          <IconPlus size={13} stroke={2.25} />
          Buy Number
        </button>
      </div>

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
              <Link
                href="/dialer/a2p"
                className="mt-5 inline-flex h-10 cursor-pointer items-center rounded-[7px] bg-[#0d4b3a] px-4 text-[13px] font-medium text-white"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
              >
                Start Registration
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="mt-10 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
        Your Numbers
        <span className="h-px flex-1 bg-[#ebedf0]" />
      </div>

      <div
        className="mt-3 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
        style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
      >
        <div className="divide-y divide-[#f1f2f4]">
          {numbers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-[14px] font-semibold text-[#0a0d14]">No Numbers Yet</div>
              <div className="mt-1 text-[12.5px] text-[#5b606a]">Buy your first number to start dialing.</div>
            </div>
          ) : (
            numbers.map((n) => {
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
                      <div className="text-[14px] font-semibold tabular-nums text-[#0a0d14]">{formatE164(n.e164)}</div>
                      <div className="mt-0.5 text-[11.5px] text-[#5b606a]">{n.city ?? "—"}{n.state ? `, ${n.state}` : ""}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CapIndicator icon={<IconPhone size={12} stroke={2.25} />} label="Voice" status={n.voice_enabled ? "live" : "pending"} />
                      <CapIndicator icon={<IconMessageCircle size={12} stroke={2.25} />} label="SMS" status={n.sms_enabled ? "live" : "pending"} />
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#5b606a]">
                        <span
                          className={["h-[7px] w-[7px] rounded-full", n.status === "active" ? "bg-[#16a34a]" : "bg-[#9298a3]"].join(" ")}
                          style={{
                            boxShadow: n.status === "active" ? "0 0 0 3px rgba(22,163,74,0.14)" : "0 0 0 3px rgba(146,152,163,0.14)",
                          }}
                        />
                        {n.status === "active" ? "Active" : "Pending"}
                      </span>
                    </div>
                    <div className="text-right text-[13.5px] font-semibold tabular-nums text-[#0a0d14]">
                      {formatMoney(n.monthly_cost_cents)}<span className="text-[11px] font-normal text-[#9298a3]">/mo</span>
                    </div>
                    <div className="text-right">
                      {expanded ? <IconChevronUp size={14} stroke={2} className="text-[#9298a3]" /> : <IconChevronDown size={14} stroke={2} className="text-[#9298a3]" />}
                    </div>
                  </button>
                  {expanded && (
                    <div className="border-t border-[#f1f2f4] bg-[#fafbfc] px-6 py-4">
                      <div className="grid grid-cols-3 gap-6">
                        <DetailCell label="Purchased" value={formatDate(n.purchased_at)} />
                        <DetailCell label="Telnyx Id" value={n.telnyx_phone_number_id ?? "—"} />
                        <DetailCell label="Friendly Name" value={n.friendly_name ?? "—"} />
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
            })
          )}
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
