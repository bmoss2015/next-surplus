import Link from "next/link";
import { IconArrowRight, IconMail } from "@tabler/icons-react";
import { fetchReports, STAGE_NAMES } from "@/lib/reports/fetch";
import { fetchMailReport } from "@/lib/mail/reports";
import { formatCurrency } from "@/lib/leads/format";
import { SALE_TYPE_LABELS, type SaleType } from "@/lib/leads/types";

export const dynamic = "force-dynamic";

function fmtBig(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

export default async function ReportsPage() {
  const [data, mailReport] = await Promise.all([
    fetchReports(),
    fetchMailReport({ range: "30d" }),
  ]);

  return (
    <div className="px-7 py-6">
      <div className="mb-[22px]">
        <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
          Reports
        </h1>
        <div className="mt-1 text-[13px] text-gray-500">
          Read-only summaries of pipeline, conversion, and outcomes.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[18px]">
        {/* Pipeline by State */}
        <Card title="Pipeline by State">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[10px] tracking-[0.4px] text-gray-500">
                <th className="pb-2 font-medium">State</th>
                <th className="pb-2 text-right font-medium">Leads</th>
                <th className="pb-2 text-right font-medium">Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {data.pipelineByState.map((row) => (
                <tr key={row.state} className="border-t border-gray-150">
                  <td className="py-[6px] text-ink">{row.state}</td>
                  <td className="py-[6px] text-right text-ink">{row.count}</td>
                  <td className="py-[6px] text-right font-medium text-ink">
                    {fmtBig(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Pipeline by Sale Type */}
        <Card title="Pipeline by Sale Type">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[10px] tracking-[0.4px] text-gray-500">
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 text-right font-medium">Leads</th>
                <th className="pb-2 text-right font-medium">Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {data.pipelineBySaleType.map((row) => (
                <tr key={row.sale_type} className="border-t border-gray-150">
                  <td className="py-[6px] text-ink">
                    {SALE_TYPE_LABELS[row.sale_type as SaleType] ?? row.sale_type}
                  </td>
                  <td className="py-[6px] text-right text-ink">{row.count}</td>
                  <td className="py-[6px] text-right font-medium text-ink">
                    {fmtBig(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Funnel */}
        <Card title="Conversion Funnel" wide>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[10px] tracking-[0.4px] text-gray-500">
                <th className="pb-2 font-medium">Stage</th>
                <th className="pb-2 text-right font-medium">Count</th>
                <th className="pb-2 text-right font-medium">% of Total</th>
                <th className="pb-2 text-right font-medium">Drop Off</th>
              </tr>
            </thead>
            <tbody>
              {data.funnel.map((row) => (
                <tr key={row.stage} className="border-t border-gray-150">
                  <td className="py-[6px] text-ink">{STAGE_NAMES[row.stage]}</td>
                  <td className="py-[6px] text-right text-ink">{row.count}</td>
                  <td className="py-[6px] text-right text-gray-500">
                    {row.pctOfTotal.toFixed(1)}%
                  </td>
                  <td className="py-[6px] text-right">
                    {row.dropOff == null ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <span
                        className={
                          row.dropOff > 50
                            ? "text-danger"
                            : row.dropOff > 20
                              ? "text-warn-strong"
                              : "text-gray-500"
                        }
                      >
                        {row.dropOff.toFixed(0)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Avg Days in Stage */}
        <Card title="Average Days in Stage" wide>
          <div className="space-y-[10px]">
            {data.avgDaysInStage.map((row) => (
              <div key={row.stage} className="flex items-center gap-3">
                <span className="w-[140px] shrink-0 text-[12px] text-ink">
                  {STAGE_NAMES[row.stage]}
                </span>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded bg-gray-150">
                    <div
                      className="h-full rounded bg-petrol-500"
                      style={{
                        width: `${Math.min(100, (row.avgDays / 60) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="w-[80px] shrink-0 text-right text-[12px] font-medium text-ink">
                  {row.avgDays} {row.avgDays === 1 ? "Day" : "Days"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Won Summary */}
        <Card title="Won Deals Summary">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Deals Won" value={String(data.wonSummary.count)} />
            <Stat
              label="Total Recovered"
              value={fmtBig(data.wonSummary.totalRecovered)}
            />
            <Stat
              label="Fees Earned"
              value={fmtBig(data.wonSummary.totalFees)}
            />
            <Stat
              label="Est. Net Payout"
              value={fmtBig(data.wonSummary.totalNetPayout)}
            />
            <Stat
              label="Avg Days Import → Won"
              value={`${data.wonSummary.avgDaysImportToWon} days`}
            />
          </div>
        </Card>

        {/* Lost Breakdown */}
        <Card title="Lost Reason Breakdown">
          {data.lostBreakdown.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-[12px] text-gray-500">
              No lost leads yet.
            </div>
          ) : (
            <table className="w-full text-[12.5px]">
              <tbody>
                {data.lostBreakdown.map((row) => (
                  <tr
                    key={row.reason}
                    className="border-t border-gray-150 first:border-t-0"
                  >
                    <td className="py-[6px] text-ink">{row.reason}</td>
                    <td className="py-[6px] text-right text-ink">{row.count}</td>
                    <td className="py-[6px] text-right text-gray-500">
                      {row.pct.toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Mail Activity — 30-day snapshot, click-through to full report */}
        <Card title="Mail Activity (Last 30 Days)" wide>
          <div className="grid grid-cols-4 gap-3 mb-3">
            <Stat label="Sent" value={String(mailReport.totals.sent_total)} />
            <Stat label="Delivered" value={String(mailReport.totals.delivered)} />
            <Stat label="Returned" value={String(mailReport.totals.returned)} />
            <Stat
              label="Spent"
              value={`$${(mailReport.totals.spent_cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
            />
          </div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[10px] tracking-[0.4px] text-gray-500">
                <th className="pb-2 font-medium">Month</th>
                <th className="pb-2 text-right font-medium">Sent</th>
                <th className="pb-2 text-right font-medium">Delivered</th>
                <th className="pb-2 text-right font-medium">Returned</th>
                <th className="pb-2 text-right font-medium">Spend</th>
              </tr>
            </thead>
            <tbody>
              {mailReport.months
                .slice()
                .reverse()
                .map((m) => (
                  <tr key={m.month} className="border-t border-gray-150">
                    <td className="py-[6px] text-ink">{m.label}</td>
                    <td className="py-[6px] text-right text-ink">{m.sent_total}</td>
                    <td className="py-[6px] text-right text-petrol-700">{m.delivered}</td>
                    <td className={`py-[6px] text-right ${m.returned > 0 ? "text-danger" : "text-gray-500"}`}>
                      {m.returned}
                    </td>
                    <td className="py-[6px] text-right font-medium text-ink">
                      ${(m.spent_cents / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <Link
            href="/reports/mail"
            className="mt-3 inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium text-petrol-500 hover:text-petrol-700"
          >
            <IconMail size={12} stroke={2} /> Open Full Mail Activity Report
            <IconArrowRight size={12} stroke={2} />
          </Link>
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  children,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-surface p-5 shadow-card ${wide ? "col-span-2" : ""}`}
    >
      <h2 className="m-0 mb-3 text-[14px] font-medium text-ink">{title}</h2>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
      <div className="text-[10px] tracking-[0.4px] text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-[18px] font-medium tracking-tight text-ink">
        {value}
      </div>
    </div>
  );
}
