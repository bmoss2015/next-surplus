import "server-only";
import { createClient } from "@/lib/supabase/server";
import { stateName, type LeadRow } from "./types";
import { fetchOrgStages } from "@/lib/stages/fetch";
import type { StageKind } from "@/lib/stages/types";
import { primaryOwner } from "./format";

export type DashboardFunnelStage = {
  id: string;
  name: string;
  kind: StageKind;
  count: number;
  amount: number;
};

export type DashboardData = {
  pipelineValue: number;
  activeLeadsCount: number;
  wonLast30Count: number;
  wonLast30Amount: number;
  conversionRate: number | null;
  overdueTasksCount: number;
  newThisWeekCount: number;
  totalActive: number;
  funnel: DashboardFunnelStage[];
  leadsNeedingAction: Array<{
    id: string;
    lead_id: string;
    address: string;
    city: string;
    state: string;
    stageName: string;
    estimated_surplus: number | null;
    days_in_stage: number;
    primary_owner: string;
    reason: string;
  }>;
  marketsByState: Array<{
    state: string;
    label: string;
    count: number;
    pipeline: number;
    inProgress: number;
  }>;
  upcomingDeadlines: Array<{
    type: string;
    title: string;
    sub: string;
    daysAway: number;
    formattedDate: string;
    leadId: string;
  }>;
};

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86_400_000);
}

export async function fetchDashboard(): Promise<DashboardData> {
  const sb = await createClient();
  const stages = await fetchOrgStages();
  const stageById = new Map(stages.map((s) => [s.id, s]));
  const openStageIds = new Set(stages.filter((s) => s.kind === "open").map((s) => s.id));
  const wonStageIds = new Set(stages.filter((s) => s.kind === "won").map((s) => s.id));
  const lostStageIds = new Set(stages.filter((s) => s.kind === "lost").map((s) => s.id));

  const { data: leadsRaw, error } = await sb
    .from("leads")
    .select(
      `id, lead_id, address, city, state, zip, county,
       sale_type, sale_date, stage, stage_id, stage_changed_at,
       closing_bid, estimated_surplus, confirmed_surplus, source_surplus, estimated_net_payout,
       recovery_fee_percent, attorney_cost,
       redemption_ends, filing_deadline,
       needs_action_flag, below_floor, archived, imported_at,
       owners(full_name, is_primary, status)`
    )
    .eq("archived", false)
    .order("estimated_surplus", { ascending: false });
  if (error) throw error;
  const allLeads = (leadsRaw ?? []) as LeadRow[];

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const funnelMap = new Map<string, { count: number; amount: number }>();
  for (const s of stages) funnelMap.set(s.id, { count: 0, amount: 0 });

  let pipelineValue = 0;
  let activeLeadsCount = 0;
  let wonLast30Count = 0;
  let wonLast30Amount = 0;
  let lostLast30Count = 0;
  let newThisWeekCount = 0;

  const stateAgg = new Map<
    string,
    { count: number; pipeline: number; inProgress: number }
  >();

  const openLeads: LeadRow[] = [];

  for (const lead of allLeads) {
    const stageId = lead.stage_id;
    const isOpen = stageId ? openStageIds.has(stageId) : false;
    const isWon = stageId ? wonStageIds.has(stageId) : false;
    const isLost = stageId ? lostStageIds.has(stageId) : false;
    const changedAt = new Date(lead.stage_changed_at);
    const inLast30 = changedAt >= thirtyDaysAgo;

    if (stageId) {
      const bucket = funnelMap.get(stageId);
      if (bucket) {
        const include = isOpen || ((isWon || isLost) && inLast30);
        if (include) {
          bucket.count += 1;
          bucket.amount += lead.estimated_surplus ?? 0;
        }
      }
    }

    if (isOpen) {
      activeLeadsCount += 1;
      pipelineValue += lead.estimated_surplus ?? 0;
      openLeads.push(lead);

      const agg = stateAgg.get(lead.state) ?? {
        count: 0,
        pipeline: 0,
        inProgress: 0,
      };
      agg.count += 1;
      agg.pipeline += lead.estimated_surplus ?? 0;
      agg.inProgress += 1;
      stateAgg.set(lead.state, agg);
    }

    if (isWon && inLast30) {
      wonLast30Count += 1;
      wonLast30Amount += lead.estimated_surplus ?? 0;
    }
    if (isLost && inLast30) {
      lostLast30Count += 1;
    }
    if (new Date(lead.imported_at) >= oneWeekAgo) newThisWeekCount += 1;
  }

  const conversionRate =
    wonLast30Count + lostLast30Count > 0
      ? wonLast30Count / (wonLast30Count + lostLast30Count)
      : null;

  // Funnel order: Open first (by position), then Won, then Lost. This is
  // independent of how customers arranged the stages in Settings so that a
  // new Open stage added late (high position) still appears before Won/Lost.
  const kindOrder: Record<StageKind, number> = { open: 0, won: 1, lost: 2 };
  const orderedStages = [...stages].sort((a, b) => {
    const k = kindOrder[a.kind] - kindOrder[b.kind];
    if (k !== 0) return k;
    return a.position - b.position;
  });
  const funnel: DashboardFunnelStage[] = orderedStages.map((s) => {
    const b = funnelMap.get(s.id) ?? { count: 0, amount: 0 };
    return {
      id: s.id,
      name: s.name,
      kind: s.kind,
      count: b.count,
      amount: b.amount,
    };
  });

  const { data: vCounts } = await sb
    .from("verification_items")
    .select("lead_id")
    .eq("checked", false);
  const verifyByLead = new Set<string>();
  for (const v of vCounts ?? []) verifyByLead.add(v.lead_id as string);

  const todayStr = new Date().toISOString().slice(0, 10);
  const { count: overdueTasksRaw } = await sb
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("completed", false)
    .lt("due_date", todayStr);
  const overdueTasksCount = overdueTasksRaw ?? 0;

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstOpen = stages.find((s) => s.kind === "open");
  const firstOpenId = firstOpen?.id ?? null;

  const candidates = openLeads
    .filter(
      (l) =>
        l.needs_action_flag ||
        verifyByLead.has(l.id) ||
        (firstOpenId && l.stage_id === firstOpenId)
    )
    .sort((a, b) => (b.estimated_surplus ?? 0) - (a.estimated_surplus ?? 0))
    .slice(0, 5);

  const leadsNeedingAction = candidates.map((l) => {
    const days = Math.max(0, daysBetween(now, new Date(l.stage_changed_at)));
    let reason = "";
    if (l.needs_action_flag) reason = "Manually Flagged";
    else if (verifyByLead.has(l.id)) reason = "Items Unchecked";
    else if (firstOpenId && l.stage_id === firstOpenId) reason = "New Lead";
    else reason = "Stale In Stage";
    const stg = l.stage_id ? stageById.get(l.stage_id) : null;
    return {
      id: l.id,
      lead_id: l.lead_id,
      address: l.address,
      city: l.city,
      state: l.state,
      stageName: stg?.name ?? "",
      estimated_surplus: l.estimated_surplus,
      days_in_stage: days,
      primary_owner: primaryOwner(l),
      reason,
    };
  });

  const totalPipelineByState = Math.max(
    ...Array.from(stateAgg.values()).map((a) => a.pipeline),
    1
  );
  const marketsByState = Array.from(stateAgg.entries())
    .map(([state, agg]) => ({
      state,
      label: stateName(state),
      count: agg.count,
      pipeline: agg.pipeline,
      inProgress: agg.inProgress,
      _ratio: agg.pipeline / totalPipelineByState,
    }))
    .sort((a, b) => b.pipeline - a.pipeline)
    .slice(0, 5);

  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 60);
  const deadlines: DashboardData["upcomingDeadlines"] = [];
  for (const lead of allLeads) {
    if (lead.redemption_ends) {
      const d = new Date(lead.redemption_ends + "T00:00:00");
      const days = daysBetween(d, today);
      if (days >= 0 && d <= horizon) {
        deadlines.push({
          type: "redemption",
          title: "Redemption Period Ends",
          sub: `${lead.lead_id} · ${lead.city}, ${lead.state}`,
          daysAway: days,
          formattedDate: d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          leadId: lead.id,
        });
      }
    }
    if (lead.filing_deadline) {
      const d = new Date(lead.filing_deadline + "T00:00:00");
      const days = daysBetween(d, today);
      if (days >= 0 && d <= horizon) {
        deadlines.push({
          type: "filing",
          title: "Filing Deadline",
          sub: `${lead.lead_id} · ${lead.city}, ${lead.state}`,
          daysAway: days,
          formattedDate: d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          leadId: lead.id,
        });
      }
    }
  }
  deadlines.sort((a, b) => a.daysAway - b.daysAway);

  return {
    pipelineValue,
    activeLeadsCount,
    wonLast30Count,
    wonLast30Amount,
    conversionRate,
    overdueTasksCount,
    newThisWeekCount,
    totalActive: activeLeadsCount,
    funnel,
    leadsNeedingAction,
    marketsByState,
    upcomingDeadlines: deadlines.slice(0, 6),
  };
}
