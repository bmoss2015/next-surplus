"use client";

// Provider Costs panel.
//
// Read-only owner view of what Lob and Click2Mail actually charge us per
// piece. NOT a customer-facing rate (that's a separate Customer Pricing
// concept under Settings, not yet built in this PR).
//
// Lob side: shows the published Developer-tier rates the weekly cron
// snapshotted into orgs.lob_published_pricing_cents. Source of truth =
// help.lob.com/llms-full.txt. Verified all-in (printing + postage +
// envelope) per Lob's own pricing page.
//
// Click2Mail side: shows observed per-piece cost from mail_jobs in the
// last 30 days. C2M's submitJob response returns totalCost (see
// src/lib/mail/click2mail.ts), so mail_jobs.cost_cents holds the actual
// billed amount per piece. No rate schedule needed; we read what they
// charged.

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

function mailClassLabel(c: string): string {
  if (c === "first_class") return "First Class";
  if (c === "standard") return "Standard Class";
  // 'certified' kept in the type union for backwards compat with old
  // rows, but the UI no longer surfaces it (no Lob plan supports it
  // yet — feature gated until Startup tier).
  if (c === "certified") return "Certified";
  return c;
}

export function ProviderCostsSection({ data }: { data: ProviderCostsData }) {
  const lob = data.lob.published;

  return (
    <div className="mx-auto max-w-[920px] px-8 py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-ink">Provider Costs</h1>
        <p className="mt-1 text-[13px] text-gray-600">
          What Lob and Click2Mail charge us per piece. Internal cost data,
          not customer pricing. Customer pricing lives in Settings.
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

      {/* Click2Mail --------------------------------------------------- */}
      <section className="mb-6 rounded-lg border border-gray-200 bg-white">
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div>
            <div className="text-[14px] font-semibold text-ink">Click2Mail</div>
            <div className="text-[11.5px] text-gray-500">
              Observed cost per piece. C2M returns the billed total on
              every send, so this is what they actually charged us.
            </div>
          </div>
          <div className="text-right text-[11.5px] text-gray-500">
            <div>Window: last {data.click2mail.windowDays} days</div>
            <div>Per-piece cost varies with batch size (qty 1 carries a surcharge).</div>
          </div>
        </header>
        {data.click2mail.rows.length > 0 ? (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-200 text-left text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-5 py-2 font-medium">Mail Class</th>
                <th className="px-5 py-2 text-right font-medium">Sends</th>
                <th className="px-5 py-2 text-right font-medium">Avg</th>
                <th className="px-5 py-2 text-right font-medium">Min</th>
                <th className="px-5 py-2 text-right font-medium">Max</th>
              </tr>
            </thead>
            <tbody>
              {data.click2mail.rows.map((r) => (
                <tr key={r.mail_class} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-5 py-2.5 text-ink">{mailClassLabel(r.mail_class)}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-ink">{r.sends}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-ink">{dollars(r.avg_cost_cents)}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-gray-600">{dollars(r.min_cost_cents)}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-gray-600">{dollars(r.max_cost_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-6 text-[13px] text-gray-600">
            No Click2Mail sends in the last {data.click2mail.windowDays} days.
            Cost data appears here as soon as the first real send goes
            through (sample-data rows are excluded).
          </div>
        )}
      </section>

      {/* Footnote ----------------------------------------------------- */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 text-[12px] text-gray-600">
        Per-piece cost comparison at qty 1 (verified May 2026): Lob B&amp;W
        First Class $1.029 vs C2M $2.674 (C2M adds a $1.59 single-piece
        surcharge that drops at 500+ pieces per batch). For single sends,
        Lob is consistently cheaper across every letter type.
      </div>
    </div>
  );
}
