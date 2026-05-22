import Link from "next/link";
import { IconArrowLeft, IconInfoCircle } from "@tabler/icons-react";
import {
  fetchMailReport,
  mailReportRangeLabel,
  type MailReportRange,
} from "@/lib/mail/reports";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ range?: string }>;

const RANGE_CHIPS: MailReportRange[] = ["30d", "90d", "ytd", "12m", "ly", "all"];

function parseRange(s: string | undefined): MailReportRange {
  if (s === "30d" || s === "90d" || s === "ytd" || s === "12m" || s === "ly" || s === "all") {
    return s;
  }
  return "30d";
}

function fmtUSD(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function rate(n: number, total: number): string {
  if (total === 0) return "0";
  return ((n / total) * 100).toFixed(0);
}

export default async function MailActivityReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const range = parseRange(params.range);
  const { months, totals, cost_sources } = await fetchMailReport({ range });
  const maxSpend = Math.max(1, ...months.map((m) => m.spent_cents));

  return (
    <div className="px-7 py-6">
      <Link
        href="/reports"
        className="mb-3 inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium text-petrol-500 hover:text-petrol-700"
      >
        <IconArrowLeft size={13} stroke={2} /> All Reports
      </Link>
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
            Mail Activity
          </h1>
          <div className="mt-1 text-[13px] text-gray-500">
            Volume, delivery rate, and spend across all physical mail.{" "}
            {mailReportRangeLabel(range)}.
          </div>
        </div>
      </div>

      {/* Range filter chips */}
      <div className="mb-5 flex flex-wrap items-center gap-1">
        {RANGE_CHIPS.map((r) => {
          const active = r === range;
          return (
            <Link
              key={r}
              href={r === "30d" ? "/reports/mail" : `/reports/mail?range=${r}`}
              className={`cursor-pointer rounded-full border px-3 py-1 text-[11.5px] font-medium transition-colors ${
                active
                  ? "border-ink bg-ink text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-ink"
              }`}
            >
              {mailReportRangeLabel(r)}
            </Link>
          );
        })}
      </div>

      <div className="mb-5 grid grid-cols-4 gap-3">
        <StatCard
          label="Sent"
          value={String(totals.sent_total)}
          sub={mailReportRangeLabel(range)}
        />
        <StatCard
          label="Delivered"
          value={String(totals.delivered)}
          sub={`${rate(totals.delivered, totals.sent_total)}% Delivery Rate`}
        />
        <StatCard
          label="Returned"
          value={String(totals.returned)}
          sub={`${rate(totals.returned, totals.sent_total)}% Return Rate`}
          warn={totals.returned > 0}
        />
        <StatCard
          label="Spent"
          value={fmtUSD(totals.spent_cents)}
          sub="Provider Charges"
        />
      </div>

      {/* Cost transparency note — surfaces only when there's at least
          one Lob piece in the window, since that's the leg that uses a
          placeholder rate. */}
      {cost_sources.has_lob_pieces && (
        <div className="mb-5 flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[11.5px] text-gray-700">
          <IconInfoCircle size={14} stroke={1.75} className="mt-[1px] shrink-0 text-gray-500" />
          <div>
            <span className="font-medium text-ink">Cost data source:</span>{" "}
            Click2Mail amounts are invoiced per piece (accurate). Lob check
            costs use the published Developer-tier rate ($1.16) since Lob
            doesn&apos;t return exact cost in their API — reconcile
            against the monthly Lob invoice for exact spend.
          </div>
        </div>
      )}

      {months.length > 0 && (
        <section className="mb-5 rounded-lg border border-gray-200 bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[15px] font-medium text-ink">Spend by Month</h2>
            <div className="text-[11px] text-gray-500">Bar = month spend</div>
          </div>
          <div
            className="grid items-end gap-2 h-40"
            style={{
              gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`,
            }}
          >
            {months.map((m) => {
              const heightPct = (m.spent_cents / maxSpend) * 100;
              return (
                <div key={m.month} className="flex flex-col items-center gap-1">
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-petrol-500/80"
                      style={{
                        height: `${Math.max(heightPct, m.spent_cents > 0 ? 4 : 0)}%`,
                      }}
                      title={`${m.label} · ${fmtUSD(m.spent_cents)}`}
                    />
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {m.label.split(" ")[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-gray-200 bg-surface shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-[10px] uppercase tracking-wide text-gray-500">
              <th className="px-4 py-2 font-medium">Month</th>
              <th className="px-4 py-2 text-right font-medium">Sent</th>
              <th className="px-4 py-2 text-right font-medium">First Class</th>
              <th className="px-4 py-2 text-right font-medium">Standard</th>
              <th className="px-4 py-2 text-right font-medium">Certified</th>
              <th className="px-4 py-2 text-right font-medium">Delivered</th>
              <th className="px-4 py-2 text-right font-medium">Returned</th>
              <th className="px-4 py-2 text-right font-medium">Spend</th>
            </tr>
          </thead>
          <tbody>
            {months
              .slice()
              .reverse()
              .map((m) => (
                <tr
                  key={m.month}
                  className="border-b border-gray-150 last:border-b-0 text-[12.5px]"
                >
                  <td className="px-4 py-2 text-ink">{m.label}</td>
                  <td className="px-4 py-2 text-right text-ink">{m.sent_total}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{m.by_class.first_class}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{m.by_class.standard}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{m.by_class.certified}</td>
                  <td className="px-4 py-2 text-right text-petrol-700">{m.delivered}</td>
                  <td className={`px-4 py-2 text-right ${m.returned > 0 ? "text-danger" : "text-gray-600"}`}>
                    {m.returned}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-ink">
                    {fmtUSD(m.spent_cents)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  warn,
}: {
  label: string;
  value: string;
  sub: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border bg-surface p-4 shadow-card ${
        warn ? "border-danger" : "border-gray-200"
      }`}
    >
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className={`mt-1 text-[22px] font-medium ${warn ? "text-danger" : "text-ink"}`}>
        {value}
      </div>
      <div className="text-[11px] text-gray-500">{sub}</div>
    </div>
  );
}
