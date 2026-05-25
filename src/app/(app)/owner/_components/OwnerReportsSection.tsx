"use client";

// Owner-only mail reports. Shows the same monthly aggregates as the
// customer-facing /reports/mail page, plus the cost + margin columns
// that customers don't see. Useful for "is this product actually
// profitable" checks.

import type { MailReportData, MailReportRange } from "@/lib/mail/reports";

function fmtUSD(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function OwnerReportsSection({
  data,
}: {
  data: MailReportData & { range: MailReportRange };
}) {
  const { months, totals } = data;
  const grossPct =
    totals.spent_cents > 0
      ? Math.round((totals.margin_cents / totals.spent_cents) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-[1100px] px-8 py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-ink">Reports</h1>
        <p className="mt-1 text-[13px] text-gray-600">
          Revenue, Lob cost, and margin across every customer org. Last
          30 days by default. Sample-data rows excluded.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Kpi label="Customer Revenue" value={fmtUSD(totals.spent_cents)} sub="What you billed customers" />
        <Kpi label="Provider Cost" value={fmtUSD(totals.provider_cost_cents)} sub="What Lob charged you" />
        <Kpi
          label="Margin"
          value={fmtUSD(totals.margin_cents)}
          sub={
            totals.spent_cents > 0
              ? `${grossPct}% gross`
              : "No mail this window"
          }
          tone={totals.margin_cents < 0 ? "danger" : "ok"}
        />
      </div>

      <section
        className="rounded-lg bg-white"
        style={{ border: "1px solid #ebedf0" }}
      >
        <header
          className="px-5 py-3.5"
          style={{ borderBottom: "1px solid #ebedf0" }}
        >
          <div className="text-[14px] font-semibold text-ink">By Month</div>
        </header>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr
              className="text-left text-[10.5px] uppercase tracking-wider text-gray-500"
              style={{ borderBottom: "1px solid #ebedf0" }}
            >
              <th className="px-5 py-2 font-medium">Month</th>
              <th className="px-5 py-2 text-right font-medium">Sent</th>
              <th className="px-5 py-2 text-right font-medium">Delivered</th>
              <th className="px-5 py-2 text-right font-medium">Returned</th>
              <th className="px-5 py-2 text-right font-medium">Revenue</th>
              <th className="px-5 py-2 text-right font-medium">Lob Cost</th>
              <th className="px-5 py-2 text-right font-medium">Margin</th>
            </tr>
          </thead>
          <tbody>
            {months
              .slice()
              .reverse()
              .map((m) => (
                <tr key={m.month} style={{ borderBottom: "1px solid #f1f2f4" }}>
                  <td className="px-5 py-2.5 text-ink">{m.label}</td>
                  <td className="px-5 py-2.5 text-right text-ink tabular-nums">
                    {m.sent_total}
                  </td>
                  <td className="px-5 py-2.5 text-right text-petrol-700 tabular-nums">
                    {m.delivered}
                  </td>
                  <td
                    className="px-5 py-2.5 text-right tabular-nums"
                    style={{ color: m.returned > 0 ? "#b42318" : "#5b606a" }}
                  >
                    {m.returned}
                  </td>
                  <td className="px-5 py-2.5 text-right font-medium text-ink tabular-nums">
                    {fmtUSD(m.spent_cents)}
                  </td>
                  <td className="px-5 py-2.5 text-right text-gray-600 tabular-nums">
                    {fmtUSD(m.provider_cost_cents)}
                  </td>
                  <td
                    className="px-5 py-2.5 text-right font-medium tabular-nums"
                    style={{
                      color: m.margin_cents < 0 ? "#b42318" : "#067647",
                    }}
                  >
                    {fmtUSD(m.margin_cents)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "ok" | "danger";
}) {
  const valueColor =
    tone === "danger" ? "#b42318" : tone === "ok" ? "#067647" : "#0a0d14";
  return (
    <div
      className="rounded-lg bg-white p-5"
      style={{ border: "1px solid #ebedf0" }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
        {label}
      </div>
      <div
        className="mt-2 text-[26px] font-semibold tabular-nums tracking-tight"
        style={{ color: valueColor }}
      >
        {value}
      </div>
      <div className="mt-1 text-[11.5px] text-gray-500">{sub}</div>
    </div>
  );
}
