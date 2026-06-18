"use client";

// Provider Costs panel.
//
// Read-only owner view of what Lob charges us per piece. The basis for
// margin math against Customer Pricing.

import type { ProviderCostsData } from "@/lib/owner/fetch";

function dollars(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(3)}`;
}

function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ProviderCostsSection({ data }: { data: ProviderCostsData }) {
  const lob = data.lob.published;

  return (
    <div className="mx-auto max-w-[920px] px-8 py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-ink">Provider Costs</h1>
        <p className="mt-1 text-[13px] text-gray-600">
          What the mail provider charges us per piece. Internal cost
          data, not customer pricing. Customer pricing lives in Settings.
        </p>
      </div>

      {/* Lob ---------------------------------------------------------- */}
      <section className="mb-6 rounded-lg border border-gray-200 bg-white">
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div>
            <div className="text-[14px] font-semibold text-ink">Lob</div>
            <div className="text-[11.5px] text-gray-500">
              Developer tier (free). Rates are all inclusive (printing,
              postage, envelope).
            </div>
          </div>
          <div className="text-right text-[11.5px] text-gray-500">
            <div>Source: help.lob.com</div>
            <div>Last synced: {formatWhen(data.lob.lastCheckedAt)}</div>
          </div>
        </header>
        {lob ? (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-200 text-left text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-5 py-2 font-medium">Product</th>
                <th className="px-5 py-2 text-right font-medium">All-in Rate</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["B&W Letter, First Class", lob.letter_first_class_bw],
                ["Color Letter, First Class", lob.letter_first_class_color],
                ["B&W Letter, Standard Class", lob.letter_standard_bw],
                ["Color Letter, Standard Class", lob.letter_standard_color],
                ["B&W Additional Page", lob.letter_extra_page_bw],
                ["Color Additional Page", lob.letter_extra_page_color],
                ["Check", lob.check_base],
                ["Check Attachment Page", lob.check_extra_attachment_page],
              ].map(([label, cents]) => (
                <tr key={label as string} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-5 py-2.5 text-ink">{label}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-ink">
                    {dollars(cents as number)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-6 text-[13px] text-gray-600">
            No Lob rates synced yet. The weekly cron will populate this on
            its next run (Mondays 04:00 UTC). You can also trigger it
            manually with a GET to /api/cron/lob-pricing-sync.
          </div>
        )}
      </section>

    </div>
  );
}
