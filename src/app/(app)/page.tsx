import Link from "next/link";
import {
  fetchDashboard,
  type FunnelMode,
  type FunnelTimeframe,
} from "@/lib/leads/fetch-dashboard";
import { formatCurrency } from "@/lib/leads/format";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const ENUM_FROM_NAME: Record<string, string> = {
  "New Leads": "new_leads",
  Qualifying: "qualifying",
  Outreach: "outreach",
  "In Conversation": "in_conversation",
  Contract: "contract",
  "With Attorney": "with_attorney",
  "Claim Filed": "claim_filed",
  Won: "won",
  Lost: "lost",
};

function leadsHrefForStage(name: string): string {
  const enumVal = ENUM_FROM_NAME[name];
  return enumVal ? `/leads?stage=${enumVal}` : "/leads";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const rawTf = typeof sp.tf === "string" ? sp.tf : undefined;
  const tf: FunnelTimeframe =
    rawTf === "90d" || rawTf === "all" ? rawTf : "30d";
  const rawMode = typeof sp.mode === "string" ? sp.mode : undefined;
  const mode: FunnelMode = rawMode === "value" ? "value" : "count";

  const data = await fetchDashboard({ funnelTimeframe: tf, funnelMode: mode });
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

  const maxFunnelValue = Math.max(
    ...data.funnel.map((f) => (mode === "value" ? f.amount : f.count)),
    1
  );

  const firstTerminalIdx = data.funnel.findIndex((s) => s.kind !== "open");

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
            Open Stages: Current Snapshot · Won And Lost: Window Below
          </div>
        </div>
        <div className="flex items-center gap-3">
          <FunnelToggle current={mode} otherMode={tf} />
          <FunnelTimeframeToggle current={tf} otherMode={mode} />
          <Link
            href="/leads"
            className="text-[12px] text-ink underline decoration-gray-300 underline-offset-[3px] hover:decoration-petrol-500"
          >
            View All Leads
          </Link>
        </div>
      </div>
      <div className="mb-[26px] rounded-lg border border-gray-200 bg-surface p-5 shadow-card">
        {data.funnel.length === 0 ? (
          <div className="text-center text-[12px] text-gray-500">
            No stages configured yet.
          </div>
        ) : (
          <div>
            {data.funnel.map((stage, idx) => {
              const barColor =
                stage.kind === "won"
                  ? "bg-petrol-700"
                  : stage.kind === "lost"
                    ? "bg-gray-400"
                    : "bg-petrol-500";
              const numericValue =
                mode === "value" ? stage.amount : stage.count;
              const widthPct =
                numericValue > 0
                  ? Math.max(2, (numericValue / maxFunnelValue) * 100)
                  : 0;
              const isFirstTerminal = idx === firstTerminalIdx && idx > 0;

              return (
                <div key={stage.id}>
                  {/* Drop-off arrow between consecutive open stages */}
                  {stage.kind === "open" && stage.carryFromPrevious != null && (
                    <div className="flex items-center gap-3 py-0.5">
                      <span className="w-[140px] shrink-0" />
                      <div className="flex-1 flex items-center gap-2 text-[10px] text-gray-500">
                        <span className="text-gray-400">↓</span>
                        <span
                          className={cn(
                            "font-medium",
                            stage.carryFromPrevious >= 0.8
                              ? "text-petrol-700"
                              : stage.carryFromPrevious >= 0.5
                                ? "text-gray-600"
                                : "text-red-600"
                          )}
                        >
                          {Math.round(stage.carryFromPrevious * 100)}% Carry
                        </span>
                      </div>
                      <span className="w-[100px] shrink-0" />
                    </div>
                  )}

                  {/* Divider before first terminal (Won/Lost) stage */}
                  {isFirstTerminal && (
                    <div className="my-3 flex items-center gap-3">
                      <span className="w-[140px] shrink-0" />
                      <div className="flex-1 border-t border-dashed border-gray-300" />
                      <span className="shrink-0 text-[10px] uppercase tracking-widest text-gray-400">
                        Closed (
                        {tf === "30d"
                          ? "30D"
                          : tf === "90d"
                            ? "90D"
                            : "All Time"}
                        )
                      </span>
                      <div className="flex-1 border-t border-dashed border-gray-300" />
                      <span className="w-[100px] shrink-0" />
                    </div>
                  )}

                  <div className="flex items-center gap-3 py-1">
                    <Link
                      href={leadsHrefForStage(stage.name)}
                      className="w-[140px] shrink-0 truncate text-right text-[12px] text-gray-500 hover:text-ink hover:underline"
                      title={stage.name}
                    >
                      {stage.name}
                    </Link>
                    <Link
                      href={leadsHrefForStage(stage.name)}
                      className="flex-1 h-7 rounded bg-gray-100 overflow-hidden hover:opacity-90"
                    >
                      {numericValue > 0 && (
                        <div
                          className={cn(
                            "h-full flex items-center px-2 text-[12px] font-medium text-white",
                            barColor
                          )}
                          style={{ width: `${widthPct}%` }}
                        >
                          {mode === "value"
                            ? formatCurrency(stage.amount)
                            : stage.count}
                        </div>
                      )}
                    </Link>
                    <div className="w-[100px] shrink-0 text-right text-[11px] text-gray-500">
                      {stage.kind === "lost"
                        ? ""
                        : mode === "value"
                          ? `${stage.count} leads`
                          : formatCurrency(stage.amount)}
                    </div>
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

function FunnelToggle({
  current,
  otherMode,
}: {
  current: FunnelMode;
  otherMode: FunnelTimeframe;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded border border-gray-200 text-[11px]">
      <Link
        href={`?mode=count&tf=${otherMode}`}
        className={cn(
          "px-2 py-1 transition-colors",
          current === "count"
            ? "bg-petrol-500 text-white font-medium"
            : "text-gray-600 hover:bg-gray-50"
        )}
      >
        Count
      </Link>
      <Link
        href={`?mode=value&tf=${otherMode}`}
        className={cn(
          "border-l border-gray-200 px-2 py-1 transition-colors",
          current === "value"
            ? "bg-petrol-500 text-white font-medium"
            : "text-gray-600 hover:bg-gray-50"
        )}
      >
        Value
      </Link>
    </div>
  );
}

function FunnelTimeframeToggle({
  current,
  otherMode,
}: {
  current: FunnelTimeframe;
  otherMode: FunnelMode;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded border border-gray-200 text-[11px]">
      {(["30d", "90d", "all"] as const).map((tf, i) => (
        <Link
          key={tf}
          href={`?mode=${otherMode}&tf=${tf}`}
          className={cn(
            "px-2 py-1 transition-colors",
            i > 0 && "border-l border-gray-200",
            current === tf
              ? "bg-petrol-500 text-white font-medium"
              : "text-gray-600 hover:bg-gray-50"
          )}
        >
          {tf === "30d" ? "30 Days" : tf === "90d" ? "90 Days" : "All Time"}
        </Link>
      ))}
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
