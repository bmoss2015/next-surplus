import "server-only";
import { createClient } from "@/lib/supabase/server";
import { currentAssignmentFilterId } from "@/lib/leads/query";
import { STAGES, type Stage } from "@/lib/leads/types";

export type ReportData = {
  pipelineByState: Array<{ state: string; count: number; total: number }>;
  pipelineBySaleType: Array<{ sale_type: string; count: number; total: number }>;
  pipelineByStage: Array<{ stage: Stage; count: number; total: number }>;
  funnel: Array<{ stage: Stage; count: number; pctOfTotal: number; dropOff: number | null }>;
  avgDaysInStage: Array<{ stage: Stage; avgDays: number; sampleSize: number }>;
  wonSummary: {
    count: number;
    totalRecovered: number;
    totalFees: number;
    totalNetPayout: number;
    avgDaysImportToWon: number;
  };
  lostBreakdown: Array<{ reason: string; count: number; pct: number }>;
};

const STAGE_NAMES: Record<Stage, string> = {
  new_leads: "New Leads",
  qualifying: "Qualifying",
  outreach: "Outreach",
  in_conversation: "In Conversation",
  contract: "Contract",
  with_attorney: "With Attorney",
  claim_filed: "Claim Filed",
  won: "Won",
  lost: "Lost",
};

export { STAGE_NAMES };

export async function fetchReports(): Promise<ReportData> {
  const sb = await createClient();

  let leadsReq = sb
    .from("leads")
    .select(
      "id, state, sale_type, stage, stage_changed_at, estimated_surplus, recovery_fee_percent, attorney_cost, lost_reason, imported_at, sale_date"
    )
    .eq("archived", false);
  const assignFilter = await currentAssignmentFilterId();
  if (assignFilter) leadsReq = leadsReq.eq("assigned_to", assignFilter);
  const { data: leads, error } = await leadsReq;
  if (error) throw error;
  const all = leads ?? [];

  // Pipeline by state
  const stateMap = new Map<string, { count: number; total: number }>();
  for (const l of all) {
    if (l.stage === "lost") continue;
    const cur = stateMap.get(l.state) ?? { count: 0, total: 0 };
    cur.count += 1;
    cur.total += (l.estimated_surplus as number) ?? 0;
    stateMap.set(l.state, cur);
  }
  const pipelineByState = Array.from(stateMap.entries())
    .map(([state, agg]) => ({ state, ...agg }))
    .sort((a, b) => b.total - a.total);

  // Pipeline by sale type
  const stMap = new Map<string, { count: number; total: number }>();
  for (const l of all) {
    if (l.stage === "lost") continue;
    const cur = stMap.get(l.sale_type) ?? { count: 0, total: 0 };
    cur.count += 1;
    cur.total += (l.estimated_surplus as number) ?? 0;
    stMap.set(l.sale_type, cur);
  }
  const pipelineBySaleType = Array.from(stMap.entries())
    .map(([sale_type, agg]) => ({ sale_type, ...agg }))
    .sort((a, b) => b.total - a.total);

  // Pipeline by stage (active only)
  const stageMap = new Map<Stage, { count: number; total: number }>();
  for (const stage of STAGES) stageMap.set(stage, { count: 0, total: 0 });
  for (const l of all) {
    const cur = stageMap.get(l.stage as Stage)!;
    cur.count += 1;
    cur.total += (l.estimated_surplus as number) ?? 0;
  }
  const pipelineByStage = STAGES.map((stage) => ({
    stage,
    ...stageMap.get(stage)!,
  })).filter((s) => s.stage !== "lost");

  // Funnel — count of leads that have ever been at each stage. Approximated
  // here by current stage (good enough for v0 since we don't track history yet).
  const totalLeads = all.length;
  let prevCount: number | null = null;
  const funnel = STAGES.filter((s) => s !== "lost").map((stage) => {
    const count = stageMap.get(stage)!.count;
    const dropOff =
      prevCount != null && prevCount > 0
        ? ((prevCount - count) / prevCount) * 100
        : null;
    prevCount = count;
    return {
      stage,
      count,
      pctOfTotal: totalLeads === 0 ? 0 : (count / totalLeads) * 100,
      dropOff,
    };
  });

  // Average days in current stage (proxy: now - stage_changed_at, only counts active)
  const now = Date.now();
  const stageDaysMap = new Map<Stage, { sum: number; n: number }>();
  for (const stage of STAGES) stageDaysMap.set(stage, { sum: 0, n: 0 });
  for (const l of all) {
    if (l.stage === "lost" || l.stage === "won") continue;
    const days = Math.max(
      0,
      Math.floor(
        (now - new Date(l.stage_changed_at as string).getTime()) / 86_400_000
      )
    );
    const cur = stageDaysMap.get(l.stage as Stage)!;
    cur.sum += days;
    cur.n += 1;
  }
  const avgDaysInStage = STAGES.filter((s) => s !== "lost" && s !== "won").map(
    (stage) => {
      const cur = stageDaysMap.get(stage)!;
      return {
        stage,
        avgDays: cur.n === 0 ? 0 : Math.round(cur.sum / cur.n),
        sampleSize: cur.n,
      };
    }
  );

  // Won summary
  const won = all.filter((l) => l.stage === "won");
  const wonSummary = {
    count: won.length,
    totalRecovered: won.reduce(
      (acc, l) => acc + ((l.estimated_surplus as number) ?? 0),
      0
    ),
    totalFees: won.reduce(
      (acc, l) =>
        acc +
        (((l.estimated_surplus as number) ?? 0) *
          ((l.recovery_fee_percent as number) ?? 0)) /
          100,
      0
    ),
    // Fix EEEEE: Est. Net Payout = (surplus × recovery fee %) − attorney cost.
    totalNetPayout: won.reduce(
      (acc, l) =>
        acc +
        ((((l.estimated_surplus as number) ?? 0) *
          ((l.recovery_fee_percent as number) ?? 0)) /
          100 -
          ((l.attorney_cost as number) ?? 0)),
      0
    ),
    avgDaysImportToWon:
      won.length === 0
        ? 0
        : Math.round(
            won.reduce(
              (acc, l) =>
                acc +
                Math.max(
                  0,
                  Math.floor(
                    (new Date(l.stage_changed_at as string).getTime() -
                      new Date(l.imported_at as string).getTime()) /
                      86_400_000
                  )
                ),
              0
            ) / won.length
          ),
  };

  // Lost breakdown
  const lost = all.filter((l) => l.stage === "lost");
  const lostMap = new Map<string, number>();
  for (const l of lost) {
    const reason = (l.lost_reason as string) || "(No reason)";
    lostMap.set(reason, (lostMap.get(reason) ?? 0) + 1);
  }
  const lostBreakdown = Array.from(lostMap.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      pct: lost.length === 0 ? 0 : (count / lost.length) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    pipelineByState,
    pipelineBySaleType,
    pipelineByStage,
    funnel,
    avgDaysInStage,
    wonSummary,
    lostBreakdown,
  };
}
