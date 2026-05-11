import Link from "next/link";
import { fetchDashboard } from "@/lib/leads/fetch-dashboard";
import { STAGES, STAGE_LABELS } from "@/lib/leads/types";
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

  return (
    <div className="px-7 py-6">
      <div className="mb-[22px]">
        <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
          Dashboard
        </h1>
        <div className="mt-1 text-[13px] text-gray-500">
          {today} · {data.totalActive} active leads
        </div>
      </div>

      {/* Metric row */}
      <div className="mb-[22px] grid grid-cols-4 overflow-hidden rounded-lg border border-gray-200 bg-surface">
        <Metric
          label="Pipeline Value"
          value={formatCurrency(data.pipelineValue)}
          context="Estimated Surplus, Active Leads"
          trend={
            data.newThisWeekCount > 0
              ? { kind: "success", text: `+${data.newThisWeekCount} New This Week` }
              : { kind: "muted", text: "No New Leads This Week" }
          }
        />
        <Metric
          label="Active Claims"
          value={String(data.activeClaimsCount)}
          context={`${formatCurrency(data.activeClaimsAmount)} Filed At Counties`}
          trend={{ kind: "muted", text: "All On Track" }}
          divider
        />
        <Metric
          label="Active Conversations"
          value={String(data.activeConversationsCount)}
          context="Leads In Conversation"
          trend={{ kind: "info", text: "Live" }}
          divider
        />
        <Link href="/tasks?filter=overdue" className="block">
          <Metric
            label="Overdue Tasks"
            value={String(data.overdueTasksCount)}
            context="Past Due, Not Completed"
            trend={
              data.overdueTasksCount > 0
                ? { kind: "alert", text: "Action Required" }
                : { kind: "success", text: "All Caught Up" }
            }
            divider
          />
        </Link>
      </div>

      {/* Stages strip */}
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="m-0 text-[14px] font-medium text-ink">Lead Stages</h2>
          <div className="text-[11px] text-gray-500">
            {data.totalActive} active leads
          </div>
        </div>
        <Link
          href="/leads"
          className="text-[12px] text-ink underline decoration-gray-300 underline-offset-[3px] hover:decoration-petrol-500"
        >View All Leads</Link>
      </div>
      <div className="mb-[22px] grid grid-cols-9 overflow-hidden rounded-lg border border-gray-200 bg-surface">
        {STAGES.map((stage, idx) => (
          <Link
            key={stage}
            href={
              stage === "lost"
                ? "/leads?stage=lost"
                : `/leads?stage=${stage}`
            }
            className={`px-[6px] py-[14px] text-center transition-colors hover:bg-gray-50 ${
              idx < STAGES.length - 1 ? "border-r border-gray-200" : ""
            }`}
          >
            <div className="text-[20px] font-medium tracking-tight text-ink">
              {data.stagesCounts[stage]}
            </div>
            <div className="mt-1 text-[9px] tracking-[0.4px] text-gray-500">
              {STAGE_LABELS[stage]}
            </div>
          </Link>
        ))}
      </div>

      {/* Split row: Leads Needing Action + Markets/Deadlines */}
      <div className="grid grid-cols-[1.5fr_1fr] gap-[22px]">
        <div>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-surface shadow-card">
            <div className="flex items-center justify-between border-b border-gray-200 px-[18px] py-[14px]">
              <div>
                <h2 className="m-0 text-[14px] font-medium text-ink">
                  Leads Needing Action
                </h2>
                <div className="mt-[1px] text-[11px] text-gray-500">
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
                  <span className="w-[80px] shrink-0 text-[11px] text-gray-500">
                    {STAGE_LABELS[lead.stage]}
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
            <h2 className="m-0 text-[14px] font-medium text-ink">
              Active Markets
            </h2>
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
                    {formatCurrency(m.pipeline)} Pipeline · {m.inConversation} In
                    Conversation
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mb-[10px] flex items-baseline justify-between">
            <h2 className="m-0 text-[14px] font-medium text-ink">
              Upcoming Deadlines
            </h2>
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
  trend,
  divider,
}: {
  label: string;
  value: string;
  context: string;
  trend: { kind: "success" | "muted" | "alert" | "info"; text: string };
  divider?: boolean;
}) {
  const trendColor =
    trend.kind === "success"
      ? "text-success"
      : trend.kind === "alert"
        ? "text-danger"
        : trend.kind === "info"
          ? "text-petrol-500"
          : "text-gray-500";
  return (
    <div className={`p-[18px] px-[22px] ${divider ? "border-l border-gray-200" : ""}`}>
      <div className="mb-2 text-[11px] tracking-[0.4px] text-gray-500">
        {label}
      </div>
      <div className="text-[24px] font-medium tracking-tight text-ink">
        {value}
      </div>
      <div className="mt-1 text-[12px] text-gray-500">{context}</div>
      <div className={`mt-[10px] text-[11px] font-medium ${trendColor}`}>
        {trend.text}
      </div>
    </div>
  );
}
