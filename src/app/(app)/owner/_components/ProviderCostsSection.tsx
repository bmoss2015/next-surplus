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
    <div className="mx-auto w-full max-w-[960px] px-8 pb-32 pt-10">
      <div>
        <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.026em] text-[#0a0d14]">Lob Rate</h1>
        <p className="mt-3 text-[14px] leading-[1.55] text-[#5b606a]">
          What Lob charges per piece on the Developer (pay-as-you-go) tier. Internal cost data only. Customer pricing lives under Customer Pricing.
        </p>
      </div>

      {/* Effective Per Letter ----------------------------------------- */}
      {lob && (
        <section
          className="mt-8 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <header className="border-b border-[#f1f2f4] px-7 py-5">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#0d4b3a]">Letters</div>
            <div className="mt-1.5 text-[17px] font-semibold tracking-[-0.018em] text-[#0a0d14]">Effective Cost Per Letter</div>
            <div className="mt-1 text-[12.5px] text-[#5b606a]">
              Every letter ships in a #10 double-window envelope. The platform inserts a blank addressing page in front of each letter so customer templates stay untouched. That inserted page is billed on every send.
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
      <section
        className="mt-8 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
        style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
      >
        <header className="flex items-start justify-between gap-6 border-b border-[#f1f2f4] px-7 py-5">
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#0d4b3a]">Lob Pricing</div>
            <div className="mt-1.5 text-[17px] font-semibold tracking-[-0.018em] text-[#0a0d14]">Published Rate Card</div>
            <div className="mt-1 text-[12.5px] text-[#5b606a]">
              Developer tier (pay-as-you-go). Rates include printing, postage, and envelope.
            </div>
          </div>
          <div className="text-right text-[11.5px] text-[#9298a3]">
            <div>Source: help.lob.com</div>
            <div className="mt-0.5">Last Synced: {formatWhen(data.lob.lastCheckedAt)}</div>
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
                <tr key={label as string} className="border-b border-[#f1f2f4] last:border-b-0">
                  <td className="px-7 py-3 text-[13px] text-[#0a0d14]">{label}</td>
                  <td className="px-7 py-3 text-right">
                    <span className="inline-flex items-center rounded-[5px] bg-[#f1f2f4] px-2 py-1 text-[12.5px] tabular-nums text-[#0a0d14]">
                      {dollars(cents as number)}
                    </span>
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
