"use client";

// Owner Customer Pricing panel.
//
// SaaS-wide retail rates. Set by Bree (the owner) here, applied to every
// customer org. Customer admins see the same values read-only under
// Settings > Mail > Your Pricing. Wholesale (what Lob bills us) shown
// alongside each row so margin is visible at a glance.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CustomerPricingData } from "@/lib/owner/fetch";
import type { LobPricing } from "@/lib/mail/types";
import { updateCustomerPricing } from "@/lib/owner/actions";

type Row = {
  key: keyof Omit<LobPricing, "tier_label">;
  label: string;
};

const ROWS: Row[] = [
  { key: "letter_first_class_bw", label: "B&W Letter, First Class" },
  { key: "letter_first_class_color", label: "Color Letter, First Class" },
  { key: "letter_standard_bw", label: "B&W Letter, Standard Class" },
  { key: "letter_standard_color", label: "Color Letter, Standard Class" },
  { key: "letter_certified_bw", label: "B&W Letter, Certified" },
  { key: "letter_certified_color", label: "Color Letter, Certified" },
  { key: "letter_extra_page_bw", label: "B&W Additional Page" },
  { key: "letter_extra_page_color", label: "Color Additional Page" },
  { key: "check_base", label: "Check" },
  { key: "check_extra_attachment_page", label: "Check Attachment Page" },
];

function centsToDollars(c: number): string {
  return (c / 100).toFixed(2);
}

function dollarsToCents(s: string): number {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function fmt(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(3)}`;
}

export function CustomerPricingSection({
  data,
}: {
  data: CustomerPricingData;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [subscription, setSubscription] = useState(
    centsToDollars(data.subscription_monthly_cents)
  );
  const [rates, setRates] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const r of ROWS) {
      out[r.key] = centsToDollars(data.customer_mail_pricing_cents[r.key]);
    }
    return out;
  });

  function setRate(key: string, value: string) {
    setRates((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function save() {
    setError(null);
    setSaved(false);
    const built: Partial<LobPricing> = {
      tier_label: data.customer_mail_pricing_cents.tier_label ?? "Standard",
    };
    for (const r of ROWS) {
      built[r.key] = dollarsToCents(rates[r.key] ?? "0");
    }
    startTransition(async () => {
      const res = await updateCustomerPricing({
        subscription_monthly_cents: dollarsToCents(subscription),
        customer_mail_pricing_cents: built,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-[960px] px-8 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink">
            Customer Pricing
          </h1>
          <p className="mt-1 text-[13px] text-gray-600">
            What we charge customer orgs. Owner-controlled. Wholesale shown
            alongside so margin per piece is visible.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-[12px] text-petrol-700">Saved.</span>
          )}
          {error && (
            <span className="text-[12px] text-danger">{error}</span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="cursor-pointer rounded-md bg-petrol-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-petrol-700 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Subscription -------------------------------------------------- */}
      <section className="mb-6 rounded-lg border border-gray-200 bg-white">
        <header className="border-b border-gray-200 px-5 py-3.5">
          <div className="text-[14px] font-semibold text-ink">
            Monthly Subscription
          </div>
          <div className="text-[11.5px] text-gray-500">
            Flat monthly fee charged to each customer org. Independent of mail
            volume.
          </div>
        </header>
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="text-[13px] text-ink">Per customer org, per month</div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[13px] text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={subscription}
              onChange={(e) => {
                setSubscription(e.target.value);
                setSaved(false);
              }}
              className="w-[100px] rounded-md border border-gray-300 px-2.5 py-1.5 text-right font-mono text-[13px] text-ink focus:border-petrol-500 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Per-piece rates ---------------------------------------------- */}
      <section className="rounded-lg border border-gray-200 bg-white">
        <header className="border-b border-gray-200 px-5 py-3.5">
          <div className="text-[14px] font-semibold text-ink">
            Per-Piece Rates
          </div>
          <div className="text-[11.5px] text-gray-500">
            What customers pay per letter / postcard / check. Margin shows
            customer rate minus wholesale.
          </div>
        </header>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-gray-200 text-left text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-5 py-2 font-medium">Product</th>
              <th className="px-5 py-2 text-right font-medium">Wholesale (Lob)</th>
              <th className="px-5 py-2 text-right font-medium">Customer Rate</th>
              <th className="px-5 py-2 text-right font-medium">Margin</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => {
              const wholesaleCents = data.wholesale_pricing_cents?.[r.key];
              const customerCents = dollarsToCents(rates[r.key] ?? "0");
              const marginCents =
                typeof wholesaleCents === "number"
                  ? customerCents - wholesaleCents
                  : null;
              const marginIsLoss =
                marginCents !== null && marginCents < 0;
              return (
                <tr
                  key={r.key}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <td className="px-5 py-2.5 text-ink">{r.label}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-gray-600">
                    {fmt(wholesaleCents)}
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <span className="text-[12px] text-gray-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={rates[r.key] ?? ""}
                        onChange={(e) => setRate(r.key, e.target.value)}
                        className="w-[88px] rounded-md border border-gray-300 px-2 py-1 text-right font-mono text-[13px] text-ink focus:border-petrol-500 focus:outline-none"
                      />
                    </div>
                  </td>
                  <td
                    className={
                      "px-5 py-2.5 text-right font-mono " +
                      (marginIsLoss
                        ? "text-danger"
                        : marginCents == null
                        ? "text-gray-400"
                        : "text-petrol-700")
                    }
                  >
                    {marginCents == null ? "—" : fmt(marginCents)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 text-[12px] text-gray-600">
        Defaults seeded May 2026 from competitor research (Postalytics,
        LetterStream, BatchLeads, PostGrid). Edit any rate inline and click
        Save Changes. Customer admins see these rates read-only under
        Settings, Mail, Your Pricing.
      </div>
    </div>
  );
}
