import "server-only";
import { createClient } from "@/lib/supabase/server";
import { STAGES, stateName, type Stage, type LeadRow } from "./types";
import { primaryOwner } from "./format";

// "Active" pipeline = a real lead being worked, qualifying through claim_filed.
// Excludes new_leads (not started), won (done), lost (dead).
export const ACTIVE_PIPELINE_STAGES: Stage[] = [
  "qualifying",
  "outreach",
  "in_conversation",
  "contract",
  "with_attorney",
  "claim_filed",
];

export type DashboardData = {
  pipelineValue: number;
  activeClaimsCount: number;
  activeClaimsAmount: number;
  activeConversationsCount: number;
  overdueTasksCount: number;
  newThisWeekCount: number;
  stagesCounts: Record<Stage, number>;
  totalActive: number;
  leadsNeedingAction: Array<{
    id: string;
    lead_id: string;
    address: string;
    city: string;
    state: string;
    stage: Stage;
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
    inConversation: number;
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

  // Pull active leads (everything except lost)
  const { data: leadsRaw, error } = await sb
    .from("leads")
    .select(
      `id, lead_id, address, city, state, zip, county,
       sale_type, sale_date, stage, stage_changed_at,
       closing_bid, estimated_surplus, confirmed_surplus, source_surplus, estimated_net_payout,
       recovery_fee_percent, attorney_cost,
       redemption_ends, filing_deadline,
       needs_action_flag, below_floor, archived, imported_at,
       owners(full_name, is_primary, status)`
    )
    .neq("stage", "lost")
    .order("estimated_surplus", { ascending: false });
  if (error) throw error;
  const leads = (leadsRaw ?? []) as LeadRow[];

  const stagesCounts: Record<Stage, number> = {} as Record<Stage, number>;
  for (const stage of STAGES) stagesCounts[stage] = 0;

  // Also fetch lost count for completeness on the strip
  const { count: lostCount } = await sb
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("stage", "lost");
  stagesCounts.lost = lostCount ?? 0;

  const activeStageSet = new Set<string>(ACTIVE_PIPELINE_STAGES);
  let pipelineValue = 0;
  let activeConversationsCount = 0;
  let activeClaimsCount = 0;
  let activeClaimsAmount = 0;
  let newThisWeekCount = 0;
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const stateAgg = new Map<
    string,
    { count: number; pipeline: number; inConversation: number }
  >();

  for (const lead of leads) {
    stagesCounts[lead.stage] += 1;
    if (activeStageSet.has(lead.stage)) {
      pipelineValue += lead.estimated_surplus ?? 0;
    }

    if (lead.stage === "in_conversation") activeConversationsCount += 1;
    if (
      lead.stage === "with_attorney" ||
      lead.stage === "claim_filed" ||
      lead.stage === "won"
    ) {
      activeClaimsCount += 1;
      activeClaimsAmount += lead.estimated_surplus ?? 0;
    }
    if (new Date(lead.imported_at) >= oneWeekAgo) newThisWeekCount += 1;

    const agg = stateAgg.get(lead.state) ?? {
      count: 0,
      pipeline: 0,
      inConversation: 0,
    };
    agg.count += 1;
    agg.pipeline += lead.estimated_surplus ?? 0;
    if (lead.stage === "in_conversation") agg.inConversation += 1;
    stateAgg.set(lead.state, agg);
  }

  // Still used to surface leads with open checklist items in "Leads Needing
  // Action" below — but no longer shown as its own dashboard card.
  const { data: vCounts } = await sb
    .from("verification_items")
    .select("lead_id")
    .eq("checked", false);
  const verifyByLead = new Set<string>();
  for (const v of vCounts ?? []) verifyByLead.add(v.lead_id as string);

  // Fix 74: Overdue Tasks card — tasks past due and not completed.
  const todayStr = new Date().toISOString().slice(0, 10);
  const { count: overdueTasksRaw } = await sb
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("completed", false)
    .lt("due_date", todayStr);
  const overdueTasksCount = overdueTasksRaw ?? 0;

  // Leads Needing Action — surface highest-value leads with a reason
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const candidates = leads
    .filter(
      (l) =>
        l.needs_action_flag ||
        verifyByLead.has(l.id) ||
        l.stage === "qualifying" ||
        l.stage === "new_leads"
    )
    .sort((a, b) => (b.estimated_surplus ?? 0) - (a.estimated_surplus ?? 0))
    .slice(0, 5);

  const leadsNeedingAction = candidates.map((l) => {
    const days = Math.max(
      0,
      daysBetween(now, new Date(l.stage_changed_at))
    );
    let reason = "";
    if (l.needs_action_flag) reason = "Manually flagged";
    else if (verifyByLead.has(l.id)) reason = "Items unchecked";
    else if (l.stage === "new_leads") reason = "New today";
    else if (l.stage === "qualifying") reason = "Awaiting research";
    else reason = "Stale in stage";
    return {
      id: l.id,
      lead_id: l.lead_id,
      address: l.address,
      city: l.city,
      state: l.state,
      stage: l.stage,
      estimated_surplus: l.estimated_surplus,
      days_in_stage: days,
      primary_owner: primaryOwner(l),
      reason,
    };
  });

  // Markets — top by pipeline, capped at 5
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
      inConversation: agg.inConversation,
      _ratio: agg.pipeline / totalPipelineByState,
    }))
    .sort((a, b) => b.pipeline - a.pipeline)
    .slice(0, 5);

  // Upcoming deadlines — redemption + filing within next 60 days
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 60);
  const deadlines: DashboardData["upcomingDeadlines"] = [];
  for (const lead of leads) {
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
    activeClaimsCount,
    activeClaimsAmount,
    activeConversationsCount,
    overdueTasksCount,
    newThisWeekCount,
    stagesCounts,
    totalActive: leads.length,
    leadsNeedingAction,
    marketsByState,
    upcomingDeadlines: deadlines.slice(0, 6),
  };
}
