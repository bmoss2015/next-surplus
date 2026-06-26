"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconArrowsExchange, IconRefresh } from "@tabler/icons-react";
import type { TelnyxPricingSettings } from "@/lib/settings/fetch";
import { updateTelnyxPricing, refreshTelnyxLiveCost } from "@/app/(app)/settings/_actions";

function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

function dollarsToCents(s: string): number {
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function markup(cost: number, price: number): string {
  if (cost <= 0) return "—";
  return `${((price / cost) * 100 - 100).toFixed(0)}%`;
}

export function TelnyxPricingSection({ initial }: { initial: TelnyxPricingSettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [phoneTelnyx, setPhoneTelnyx] = useState(centsToDollars(initial.telnyx_phone_monthly_cents));
  const [phoneCustomer, setPhoneCustomer] = useState(centsToDollars(initial.customer_phone_monthly_cents));

  const [voiceTelnyx, setVoiceTelnyx] = useState(centsToDollars(initial.telnyx_voice_outbound_per_min_cents));
  const [voiceCustomer, setVoiceCustomer] = useState(centsToDollars(initial.customer_voice_outbound_per_min_cents));

  const [smsTelnyx, setSmsTelnyx] = useState(centsToDollars(initial.telnyx_sms_outbound_per_segment_cents));
  const [smsCustomer, setSmsCustomer] = useState(centsToDollars(initial.customer_sms_outbound_per_segment_cents));

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateTelnyxPricing({
        telnyx_phone_monthly_cents: dollarsToCents(phoneTelnyx),
        telnyx_voice_outbound_per_min_cents: dollarsToCents(voiceTelnyx),
        telnyx_sms_outbound_per_segment_cents: dollarsToCents(smsTelnyx),
        customer_phone_monthly_cents: dollarsToCents(phoneCustomer),
        customer_voice_outbound_per_min_cents: dollarsToCents(voiceCustomer),
        customer_sms_outbound_per_segment_cents: dollarsToCents(smsCustomer),
      });
      if (!res.ok) {
        setError(res.error ?? "Save failed");
        return;
      }
      router.refresh();
    });
  }

  function refreshLive() {
    setError(null);
    startTransition(async () => {
      const res = await refreshTelnyxLiveCost();
      if (!res.ok) {
        setError(res.error ?? "Failed to fetch live Telnyx cost");
        return;
      }
      if (res.phoneCostCents != null) setPhoneTelnyx(centsToDollars(res.phoneCostCents));
      router.refresh();
    });
  }

  const lastCheck = initial.last_telnyx_price_check_at
    ? new Date(initial.last_telnyx_price_check_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : "Never";

  return (
    <div className="mx-auto w-full max-w-[960px] px-8 pb-32 pt-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.026em] text-[#0a0d14]">
            Power Dialer Pricing
          </h1>
          <p className="mt-3 max-w-[60ch] text-[14px] leading-[1.55] text-[#5b606a]">
            What you charge customers above what Telnyx charges us. Live cost auto-refreshes monthly from the Telnyx API and arrives in a quarterly email digest.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshLive}
          disabled={pending}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[7px] border border-[#ebedf0] bg-white px-3 text-[12.5px] font-medium text-[#0a0d14] hover:border-[#0d4b3a] hover:text-[#0d4b3a] disabled:opacity-50"
        >
          <IconRefresh size={12} stroke={2.25} />
          Refresh Live Cost
        </button>
      </div>

      <div className="mt-4 inline-flex items-center gap-2 text-[11.5px] text-[#5b606a]">
        <span>Last Telnyx Price Check: {lastCheck}</span>
        {initial.last_telnyx_price_drift_pct != null && Math.abs(initial.last_telnyx_price_drift_pct) > 0.5 && (
          <span className="font-semibold text-[#b42318]">
            (Drift {initial.last_telnyx_price_drift_pct > 0 ? "+" : ""}{initial.last_telnyx_price_drift_pct.toFixed(1)}%)
          </span>
        )}
      </div>

      <div className="mt-8 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white" style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}>
        <div className="grid grid-cols-[1fr_140px_140px_100px] items-center gap-4 border-b border-[#f1f2f4] bg-[#fafbfc] px-6 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
          <div>Item</div>
          <div className="text-right">Telnyx Cost</div>
          <div className="text-right">Customer Price</div>
          <div className="text-right">Markup</div>
        </div>

        <PricingRow
          label="Phone Number"
          unit="per month"
          telnyx={phoneTelnyx}
          customer={phoneCustomer}
          onTelnyxChange={setPhoneTelnyx}
          onCustomerChange={setPhoneCustomer}
        />
        <PricingRow
          label="Outbound Voice Minute"
          unit="per minute"
          telnyx={voiceTelnyx}
          customer={voiceCustomer}
          onTelnyxChange={setVoiceTelnyx}
          onCustomerChange={setVoiceCustomer}
        />
        <PricingRow
          label="Outbound SMS Segment"
          unit="per message"
          telnyx={smsTelnyx}
          customer={smsCustomer}
          onTelnyxChange={setSmsTelnyx}
          onCustomerChange={setSmsCustomer}
          last
        />
      </div>

      {error && (
        <div className="mt-4 rounded-[7px] border border-[#fca5a5] bg-[#fef2f2] px-4 py-2.5 text-[12.5px] text-[#b42318]">
          {error}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#0d4b3a] px-4 text-[13px] font-medium text-white disabled:opacity-50"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
        >
          <IconArrowsExchange size={13} stroke={2.25} />
          {pending ? "Saving..." : "Save Pricing"}
        </button>
        <span className="text-[11.5px] text-[#9298a3]">
          Existing numbers keep their current rate. New purchases use the updated customer price.
        </span>
      </div>
    </div>
  );
}

function PricingRow({
  label,
  unit,
  telnyx,
  customer,
  onCustomerChange,
  last,
}: {
  label: string;
  unit: string;
  telnyx: string;
  customer: string;
  onTelnyxChange?: (v: string) => void;
  onCustomerChange: (v: string) => void;
  last?: boolean;
}) {
  const telnyxN = parseFloat(telnyx) || 0;
  const customerN = parseFloat(customer) || 0;

  return (
    <div className={["grid grid-cols-[1fr_140px_140px_100px] items-center gap-4 px-6 py-4", last ? "" : "border-b border-[#f1f2f4]"].join(" ")}>
      <div>
        <div className="text-[14px] font-semibold tracking-[-0.012em] text-[#0a0d14]">{label}</div>
        <div className="mt-0.5 text-[11.5px] text-[#5b606a]">{unit}</div>
      </div>
      <div className="text-right">
        <div className="inline-flex h-9 w-[110px] items-center justify-end rounded-[7px] bg-[#f1f2f4] px-3 text-right text-[13px] font-medium tabular-nums text-[#0a0d14]" title="Read-only. Refreshed from Telnyx by Refresh Live Cost.">
          ${telnyx}
        </div>
      </div>
      <div className="text-right">
        <div className="relative inline-flex items-center">
          <span className="absolute left-3 text-[12.5px] text-[#9298a3]">$</span>
          <input
            type="number"
            step="0.001"
            min="0"
            value={customer}
            onChange={(e) => onCustomerChange(e.target.value)}
            className="h-9 w-[110px] rounded-[7px] border border-[#ebedf0] bg-white pl-6 pr-3 text-right text-[13px] font-medium tabular-nums text-[#0a0d14] outline-none focus:border-[#0d4b3a]"
          />
        </div>
      </div>
      <div className="text-right text-[13px] font-semibold tabular-nums text-[#0d4b3a]">
        {markup(telnyxN, customerN)}
      </div>
    </div>
  );
}
