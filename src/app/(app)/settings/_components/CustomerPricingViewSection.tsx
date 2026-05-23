"use client";

// Customer-facing pricing view, read-only.
//
// Shows what THIS org pays for the SaaS subscription and per piece of
// mail sent through the platform. Values are owned and edited by the
// SaaS operator (Bree) under /owner > Customer Pricing. Customer admins
// see them here so they understand what they're being billed.

import type { CustomerPricingViewData } from "@/lib/settings/fetch";

type Row = { label: string; cents: number };

function fmt(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CustomerPricingViewSection({
  data,
}: {
  data: CustomerPricingViewData | null;
}) {
  if (!data) {
    return (
      <div className="mx-auto max-w-[760px] px-8 py-8 text-[13px] text-gray-600">
        Pricing has not been configured yet.
      </div>
    );
  }

  const p = data.customer_mail_pricing_cents;
  const rows: Row[] = [
    { label: "B&W Letter, First Class", cents: p.letter_first_class_bw },
    { label: "Color Letter, First Class", cents: p.letter_first_class_color },
    { label: "B&W Letter, Standard Class", cents: p.letter_standard_bw },
    { label: "Color Letter, Standard Class", cents: p.letter_standard_color },
    { label: "B&W Letter, Certified", cents: p.letter_certified_bw },
    { label: "Color Letter, Certified", cents: p.letter_certified_color },
    { label: "B&W Additional Page", cents: p.letter_extra_page_bw },
    { label: "Color Additional Page", cents: p.letter_extra_page_color },
    { label: "Check", cents: p.check_base },
    { label: "Check Attachment Page", cents: p.check_extra_attachment_page },
  ];

  return (
    <div className="mx-auto max-w-[760px] px-8 py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-ink">Your Pricing</h1>
        <p className="mt-1 text-[13px] text-gray-600">
          What your team pays for the platform and for each piece of mail you
          send. Rates are all inclusive (printing, postage, envelope).
        </p>
      </div>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white">
        <header className="border-b border-gray-200 px-5 py-3.5">
          <div className="text-[14px] font-semibold text-ink">
            Monthly Subscription
          </div>
          <div className="text-[11.5px] text-gray-500">
            Flat fee, billed monthly. Includes platform access for everyone on
            your team.
          </div>
        </header>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="text-[13px] text-ink">Per month</div>
          <div className="font-mono text-[15px] text-ink">
            {fmt(data.subscription_monthly_cents)}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white">
        <header className="border-b border-gray-200 px-5 py-3.5">
          <div className="text-[14px] font-semibold text-ink">
            Per-Piece Mail Rates
          </div>
          <div className="text-[11.5px] text-gray-500">
            Billed when each piece is queued for printing. Same rate
            regardless of batch size.
          </div>
        </header>
        <table className="w-full text-[13px]">
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.label}
                className="border-b border-gray-100 last:border-b-0"
              >
                <td className="px-5 py-2.5 text-ink">{r.label}</td>
                <td className="px-5 py-2.5 text-right font-mono text-ink">
                  {fmt(r.cents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-4 text-[12px] text-gray-500">
        Pricing managed centrally. Reach out if you need a custom rate.
      </div>
    </div>
  );
}
