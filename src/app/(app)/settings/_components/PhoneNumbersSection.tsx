"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  IconPlus,
  IconPhone,
  IconMessageCircle,
  IconChevronDown,
  IconChevronUp,
  IconCheck,
  IconClock,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import type { PhoneNumberRow, A2pBrand } from "@/lib/settings/fetch";
import { syncTelnyxPhoneNumbers, searchAvailableNumbers, buyTelnyxNumber } from "../_actions";

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
  const router = useRouter();
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
  const [buyOpen, setBuyOpen] = useState(false);
  const [syncing, startSync] = useTransition();
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const numbers = initial;

  function handleSync() {
    setSyncMsg(null);
    startSync(async () => {
      const res = await syncTelnyxPhoneNumbers();
      if (!res.ok) {
        setSyncMsg(res.error);
        return;
      }
      setSyncMsg(res.synced === 0 ? "Already In Sync" : `Synced ${res.synced} Number${res.synced === 1 ? "" : "s"}`);
      router.refresh();
    });
  }

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
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[7px] border border-[#ebedf0] bg-white px-3.5 text-[13px] font-medium text-[#0a0d14] transition hover:border-[#0d4b3a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconRefresh size={13} stroke={2.25} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Sync From Telnyx"}
          </button>
          <button
            type="button"
            onClick={() => setBuyOpen(true)}
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[7px] bg-[#0d4b3a] px-4 text-[13px] font-medium text-white"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
          >
            <IconPlus size={13} stroke={2.25} />
            Buy Number
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className="mt-4 rounded-[8px] border border-[#ebedf0] bg-[#fafbfc] px-4 py-2.5 text-[12.5px] text-[#0a0d14]">
          {syncMsg}
        </div>
      )}

      {buyOpen && (
        <BuyNumberDialog
          onClose={() => setBuyOpen(false)}
          onPurchased={() => {
            setBuyOpen(false);
            router.refresh();
          }}
        />
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

      {a2pState === "approved" && (
        <div className="mt-8 grid grid-cols-2 gap-3">
          <ComplianceCard
            eyebrow="Brand"
            title={a2pBrand?.company_legal_name ?? "Your Brand"}
            meta={brandMeta(a2pBrand)}
            status={a2pBrand?.status === "rejected" ? "denied" : a2pBrand?.status === "approved" ? "approved" : "pending"}
            denialReason={a2pBrand?.rejection_reason ?? ""}
          />
          <ComplianceCard
            eyebrow="Campaign"
            title="Customer Care"
            meta="Surplus Recovery"
            status="approved"
            denialReason=""
          />
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

function brandMeta(brand: A2pBrand | null): string {
  if (!brand) return "Not Registered";
  const parts: string[] = [];
  if (brand.ein) parts.push(`EIN Ending ${brand.ein.slice(-4)}`);
  if (brand.approved_at) parts.push(`Verified ${formatDate(brand.approved_at)}`);
  return parts.length ? parts.join(" · ") : "Verified";
}

function ComplianceCard({
  eyebrow,
  title,
  meta,
  status,
  denialReason,
}: {
  eyebrow: string;
  title: string;
  meta: string;
  status: "approved" | "pending" | "denied";
  denialReason: string;
}) {
  const isApproved = status === "approved";
  const isDenied = status === "denied";
  return (
    <div
      className="overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
      style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
    >
      <div className="px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#9298a3]">
            {eyebrow}
          </div>
          <StatusIndicator status={status} />
        </div>
        <div className="mt-3 text-[17px] font-semibold tracking-[-0.014em] text-[#0a0d14]">
          {title}
        </div>
        <div className="mt-1 text-[12.5px] text-[#5b606a]">{meta}</div>
      </div>

      {isDenied && (
        <div className="border-t border-[#f1f2f4] bg-[#fafbfc] px-6 py-4">
          <div className="border-l-[3px] border-[#b42318] pl-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#5b606a]">
              Carrier Feedback
            </div>
            <p className="mt-1.5 text-[12.5px] leading-[1.5] text-[#0a0d14]">{denialReason}</p>
          </div>
          <Link
            href="/dialer/a2p"
            className="mt-3 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#0d4b3a] px-3.5 text-[12px] font-medium text-white"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
          >
            Fix And Resubmit
          </Link>
        </div>
      )}

      {isApproved && (
        <div className="border-t border-[#f1f2f4] bg-[#fafbfc] px-6 py-3">
          <button type="button" className="cursor-pointer text-[12px] font-medium text-[#5b606a] hover:text-[#0d4b3a]">
            View Details &rarr;
          </button>
        </div>
      )}

      {status === "pending" && (
        <div className="border-t border-[#f1f2f4] bg-[#fafbfc] px-6 py-3 text-[12px] text-[#5b606a]">
          Carriers reviewing this submission. No action needed.
        </div>
      )}
    </div>
  );
}

type AvailableNumber = {
  e164: string;
  city: string | null;
  state: string | null;
  monthly_cost_cents: number;
  voice: boolean;
  sms: boolean;
};

function BuyNumberDialog({ onClose, onPurchased }: { onClose: () => void; onPurchased: () => void }) {
  const [areaCode, setAreaCode] = useState("");
  const [results, setResults] = useState<AvailableNumber[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const [buyingNumber, setBuyingNumber] = useState<string | null>(null);

  function handleSearch() {
    setError(null);
    setResults([]);
    startSearch(async () => {
      const res = await searchAvailableNumbers({ area_code: areaCode });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResults(res.numbers);
      if (res.numbers.length === 0) {
        setError("No numbers available in that area code");
      }
    });
  }

  async function handleBuy(e164: string) {
    setError(null);
    setBuyingNumber(e164);
    const res = await buyTelnyxNumber(e164);
    setBuyingNumber(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onPurchased();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[640px] overflow-hidden rounded-[14px] bg-white" style={{ boxShadow: "0 24px 48px -8px rgba(15,23,41,0.30)" }}>
        <div className="flex items-start justify-between gap-6 border-b border-[#f1f2f4] px-7 py-5">
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.018em] text-[#0a0d14]">Buy Number</h2>
            <p className="mt-1 text-[12.5px] text-[#5b606a]">Search inventory by US area code, then click a number to purchase.</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#9298a3] hover:text-[#0a0d14]">
            <IconX size={18} stroke={2} />
          </button>
        </div>

        <div className="px-7 py-5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Area Code</label>
          <div className="mt-2 flex gap-2">
            <input
              autoFocus
              type="text"
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value.replace(/[^\d]/g, "").slice(0, 3))}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              placeholder="678"
              maxLength={3}
              className="h-11 w-32 rounded-[7px] border border-[#ebedf0] bg-white px-3 text-[14px] tabular-nums text-[#0a0d14] outline-none transition focus:border-[#0d4b3a] placeholder:text-[#c2c5cc]"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={areaCode.length !== 3 || searching}
              className="inline-flex h-11 cursor-pointer items-center rounded-[7px] bg-[#0d4b3a] px-5 text-[13.5px] font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-[7px] border border-[#fee4e2] bg-[#fef3f2] px-4 py-2.5 text-[12.5px] text-[#b42318]">
              {error}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-5 max-h-[360px] overflow-y-auto rounded-[10px] border border-[#ebedf0]">
              {results.map((n) => (
                <div key={n.e164} className="flex items-center justify-between gap-3 border-b border-[#f1f2f4] px-4 py-3 last:border-b-0">
                  <div>
                    <div className="text-[14px] font-semibold tabular-nums text-[#0a0d14]">{formatE164(n.e164)}</div>
                    <div className="mt-0.5 text-[11.5px] text-[#5b606a]">
                      {n.city ?? "—"}{n.state ? `, ${n.state}` : ""} · {formatMoney(n.monthly_cost_cents)}/mo
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={["inline-flex items-center gap-1 text-[11px] font-medium", n.voice ? "text-[#0d4b3a]" : "text-[#9298a3]"].join(" ")}>
                      <IconPhone size={11} stroke={2.25} />
                      Voice
                    </span>
                    <span className={["inline-flex items-center gap-1 text-[11px] font-medium", n.sms ? "text-[#0d4b3a]" : "text-[#9298a3]"].join(" ")}>
                      <IconMessageCircle size={11} stroke={2.25} />
                      SMS
                    </span>
                    <button
                      type="button"
                      onClick={() => handleBuy(n.e164)}
                      disabled={buyingNumber !== null}
                      className="inline-flex h-9 cursor-pointer items-center rounded-[7px] bg-[#0d4b3a] px-3.5 text-[12px] font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {buyingNumber === n.e164 ? "Buying..." : "Buy"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusIndicator({ status }: { status: "approved" | "pending" | "denied" }) {
  const color =
    status === "approved" ? "#0d4b3a" : status === "denied" ? "#b42318" : "#9298a3";
  const glow =
    status === "approved"
      ? "rgba(13,75,58,0.16)"
      : status === "denied"
        ? "rgba(180,35,24,0.16)"
        : "rgba(146,152,163,0.16)";
  const label = status === "approved" ? "Approved" : status === "denied" ? "Denied" : "In Review";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
      style={{ color }}
    >
      <span
        className="inline-block h-[7px] w-[7px] rounded-full"
        style={{ background: color, boxShadow: `0 0 0 3px ${glow}` }}
      />
      {label}
    </span>
  );
}
