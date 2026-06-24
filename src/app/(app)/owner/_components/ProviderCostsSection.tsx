"use client";

// Lob Rate panel.
//
// Read-only owner view of what Lob charges us per piece. The Effective
// Per-Letter Cost table below adds in the auto-inserted blank
// addressing page that every letter ships with (required by the
// windowed envelope; see lobSendLetter for the address_placement
// wiring). The raw Published Rate Card section is Lob's own price
// list with no per-letter aggregation applied.

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
        <h1 className="text-[22px] font-semibold text-ink">Lob Rate</h1>
        <p className="mt-1 text-[13px] text-gray-600">
          What Lob charges us per piece on the Developer (pay-as-you-go)
          tier. Internal cost data, not customer pricing. Customer
          pricing lives in Settings.
        </p>
      </div>

      {/* Effective Per Letter ----------------------------------------- */}
      {lob && (
        <section className="mb-6 rounded-lg border border-gray-200 bg-white">
          <header className="border-b border-gray-200 px-5 py-3.5">
            <div className="text-[14px] font-semibold text-ink">
              Effective Cost Per Letter
            </div>
            <div className="mt-1 text-[11.5px] text-gray-600">
              Every letter ships in a #10 double-window envelope. To keep
              the user&apos;s template untouched, Lob inserts a blank
              addressing page in front of the letter. We pay for that
              inserted page on every send.
            </div>
          </header>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-200 text-left text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-5 py-2 font-medium">Letter Type</th>
                <th className="px-5 py-2 text-right font-medium">Base Page</th>
                <th className="px-5 py-2 text-right font-medium">
                  Address Page
                </th>
                <th className="px-5 py-2 text-right font-medium">
                  Total Per Letter
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  label: "First Class B&W",
                  base: lob.letter_first_class_bw,
                  extra: lob.letter_extra_page_bw,
                },
                {
                  label: "First Class Color",
                  base: lob.letter_first_class_color,
                  extra: lob.letter_extra_page_color,
                },
                {
                  label: "Standard Class B&W",
                  base: lob.letter_standard_bw,
                  extra: lob.letter_extra_page_bw,
                },
                {
                  label: "Standard Class Color",
                  base: lob.letter_standard_color,
                  extra: lob.letter_extra_page_color,
                },
              ].map((row) => {
                const total =
                  typeof row.base === "number" && typeof row.extra === "number"
                    ? row.base + row.extra
                    : null;
                return (
                  <tr
                    key={row.label}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    <td className="px-5 py-2.5 text-ink">{row.label}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-gray-700">
                      {dollars(row.base)}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-gray-700">
                      +{dollars(row.extra)}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums font-semibold text-ink">
                      {dollars(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* Published Rate Card ----------------------------------------- */}
      <section className="mb-6 rounded-lg border border-gray-200 bg-white">
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div>
            <div className="text-[14px] font-semibold text-ink">
              Lob Published Rate Card
            </div>
            <div className="text-[11.5px] text-gray-500">
              Developer tier (pay-as-you-go). Rates are all inclusive
              (printing, postage, envelope).
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
                <th className="px-5 py-2 text-right font-medium">Lob Rate</th>
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
