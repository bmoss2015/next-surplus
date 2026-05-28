import Link from "next/link";
import { fetchDashboard } from "@/lib/leads/fetch-dashboard";
import { formatCurrency } from "@/lib/leads/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await fetchDashboard();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const totalPipeline = Math.max(
    ...data.marketsByState.map((m) => m.pipeline),
    1
  );

  const maxFunnelCount = Math.max(...data.funnel.map((f) => f.count), 1);

  return (
    <div className="px-7 py-6">
      <div className="mb-[26px]">
        <div className="text-[11px] font-medium uppercase tracking-[0.6px] text-petrol-500">
          {today}
        </div>
        <h1 className="m-0 mt-1.5 text-[26px] font-semibold tracking-tight text-ink">
          Dashboard
        </h1>
      </div>

      <div className="mb-[22px] grid grid-cols-4 overflow-hidden rounded-lg border border-gray-200 bg-surface">
        <Metric
          label="Pipeline Value"
          value={formatCurrency(data.pipelineValue)}
          context={`${data.activeLeadsCount} Active Leads`}
        />
        <Metric
          label="Won (30 Days)"
          value={String(data.wonLast30Count)}
          context={`${formatCurrency(data.wonLast30Amount)} Recovered`}
          divider
        />
        <Metric
          label="Win Rate"
          value={
            data.conversionRate == null
              ? "—"
              : `${Math.round(data.conversionRate * 100)}%`
          }
          context="Of Closed Leads, Last 30 Days"
          divider
        />
        <Link href="/tasks?filter=overdue" className="block">
          <Metric
            label="Overdue Tasks"
            value={String(data.overdueTasksCount)}
            context="Past Due, Not Completed"
            divider
          />
        </Link>
      </div>

      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="section-subheader">Pipeline Funnel</h2>
          <div className="mt-1 text-[11px] text-gray-500">
            Open Stages: Current Snapshot · Won And Lost: Last 30 Days
          </div>
        </div>
        <Link
          href="/leads"
          className="text-[12px] text-ink underline decoration-gray-300 underline-offset-[3px] hover:decoration-petrol-500"
        >
          View All Leads
        </Link>
      </div>
      <div className="mb-[26px] rounded-lg border border-gray-200 bg-surface p-5 shadow-card">
        {data.funnel.length === 0 ? (
          <div className="text-center text-[12px] text-gray-500">
            No stages configured yet.
          </div>
        ) : (
          <div className="space-y-2">
            {data.funnel.map((stage) => {
              const barColor =
                stage.kind === "won"
                  ? "bg-petrol-700"
                  : stage.kind === "lost"
                    ? "bg-gray-400"
                    : "bg-petrol-500";
              const widthPct =
                stage.count > 0
                  ? Math.max(2, (stage.count / maxFunnelCount) * 100)
                  : 0;
              return (
                <div key={stage.id} className="flex items-center gap-3">
                  <Link
                    href={`/leads?stage=${stage.id}`}
                    className="w-[140px] shrink-0 truncate text-right text-[12px] text-gray-500 hover:text-ink"
                    title={stage.name}
                  >
                    {stage.name}
                  </Link>
                  <div className="flex-1 h-7 rounded bg-gray-100 overflow-hidden">
                    {stage.count > 0 && (
                      <div
                        className={`h-full flex items-center px-2 text-[12px] font-medium text-white ${barColor}`}
                        style={{ width: `${widthPct}%` }}
                      >
                        {stage.count}
                      </div>
                    )}
                  </div>
                  <div className="w-[100px] shrink-0 text-right text-[11px] text-gray-500">
                    {stage.kind === "lost" ? "" : formatCurrency(stage.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-[22px]">
        <div>
          <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-surface shadow-card">
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{
                background:
                  "linear-gradient(90deg, #0d4b3a 0%, #4a9c75 100%)",
              }}
            />
            <div className="flex items-center justify-between border-b border-gray-200 px-[18px] py-[14px]">
              <div>
                <h2 className="section-subheader">Leads Needing Action</h2>
                <div className="mt-1 text-[12px] font-normal text-[#94a3b8]">
                  Sorted By Surplus Value
                </div>
              </div>
              <Link
                href="/leads/daily"
                className="text-[12px] text-ink underline decoration-gray-300 underline-offset-[3px] hover:decoration-petrol-500"
              >
                Daily Work
              </Link>
            </div>
            {data.leadsNeedingAction.length === 0 ? (
              <div className="px-4 py-6 text-center text-[12px] text-gray-500">
                No leads need action right now.
              </div>
            ) : (
              data.leadsNeedingAction.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center gap-[12px] border-b border-gray-150 px-[18px] py-[13px] last:border-b-0 hover:bg-gray-50"
                >
                  <span className="w-[130px] shrink-0 font-mono text-[11px] text-gray-500">
                    {lead.lead_id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ink">
                      {lead.address}
                    </div>
                    <div className="truncate text-[11px] text-gray-500">
                      {lead.primary_owner} · {lead.city}, {lead.state}
                    </div>
                  </div>
                  <span className="w-[100px] shrink-0 truncate text-[11px] text-gray-500">
                    {lead.stageName}
                  </span>
                  <div className="w-[100px] shrink-0 text-right">
                    <div className="text-[13px] font-medium text-ink">
                      {formatCurrency(lead.estimated_surplus)}
                    </div>
                    <span className="text-[11px] font-medium text-petrol-500">
                      {lead.reason}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="mb-[10px]">
            <h2 className="section-subheader">Active Markets</h2>
            <div className="mt-1 text-[12px] font-normal text-[#94a3b8]">
              Pipeline By State
            </div>
          </div>
          <div className="mb-[18px] rounded-lg border border-gray-200 bg-surface p-5 shadow-card">
            {data.marketsByState.length === 0 ? (
              <div className="text-center text-[12px] text-gray-500">
                No market data yet.
              </div>
            ) : (
              data.marketsByState.map((m) => (
                <div key={m.state} className="mb-[14px] last:mb-0">
                  <div className="mb-[6px] flex justify-between text-[12px]">
                    <span className="font-medium text-ink">{m.label}</span>
                    <span className="text-ink">{m.count}</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded bg-gray-150">
                    <div
                      className="h-full rounded bg-gradient-to-r from-petrol-700 to-petrol-500"
                      style={{
                        width: `${Math.min(100, (m.pipeline / totalPipeline) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-gray-500">
                    {formatCurrency(m.pipeline)} Pipeline · {m.inProgress} In
                    Progress
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mb-[10px] flex items-baseline justify-between">
            <h2 className="section-subheader">Upcoming Deadlines</h2>
            <Link
              href="/leads"
              className="text-[12px] text-ink underline decoration-gray-300 underline-offset-[3px] hover:decoration-petrol-500"
            >
              All
            </Link>
          </div>
          <div className="rounded-lg border border-gray-200 bg-surface shadow-card">
            {data.upcomingDeadlines.length === 0 ? (
              <div className="px-4 py-5 text-center text-[12px] text-gray-500">
                Nothing in the next 60 days.
              </div>
            ) : (
              data.upcomingDeadlines.map((d, idx) => {
                const tone =
                  d.daysAway <= 7
                    ? "text-danger"
                    : d.daysAway <= 30
                      ? "text-warn"
                      : "text-gray-500";
                return (
                  <Link
                    key={`${d.leadId}-${idx}`}
                    href={`/leads/${d.leadId}`}
                    className="flex items-center justify-between border-b border-gray-150 px-[18px] py-[13px] last:border-b-0 hover:bg-gray-50"
                  >
                    <div>
                      <div className="text-[13px] font-medium text-ink">
                        {d.title}
                      </div>
                      <div className="text-[11px] text-gray-500">{d.sub}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[12px] font-medium ${tone}`}>
                        {d.daysAway === 0
                          ? "Today"
                          : d.daysAway === 1
                            ? "1 day"
                            : `${d.daysAway} days`}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {d.formattedDate}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  context,
  divider,
}: {
  label: string;
  value: string;
  context: string;
  divider?: boolean;
}) {
  return (
    <div className={`p-[18px] px-[22px] ${divider ? "border-l border-gray-200" : ""}`}>
      <div className="mb-2 text-[11px] tracking-[0.4px] text-gray-500">
        {label}
      </div>
      <div className="text-[24px] font-medium tracking-tight text-ink">
        {value}
      </div>
      <div className="mt-1 text-[12px] text-gray-500">{context}</div>
    </div>
  );
}
