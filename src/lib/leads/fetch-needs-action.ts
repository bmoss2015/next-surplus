import "server-only";
import { createClient } from "@/lib/supabase/server";
import { currentAssignmentFilterId, litigatorLeadIdSet } from "./query";
import { fetchOrgStages } from "@/lib/stages/fetch";
import type { OrgStage } from "@/lib/stages/types";
import type { LeadRow } from "./types";

export type NeedsActionReason =
  | "Manually Flagged"
  | "Overdue Task"
  | "Idle"
  | "New Lead"
  | "Items Unchecked"
  | "Docs Missing";

export type NeedsActionLead = LeadRow & {
  stageName: string;
  days_in_stage: number;
  days_idle: number;
  reason: NeedsActionReason;
  reasonDetail: string;
  overdueTaskCount: number;
  missingDocCount: number;
  uncheckedVerifications: number;
};

export type AwaitingExternalLead = LeadRow & {
  stageName: string;
  days_in_stage: number;
  reason: string;
};

const DAY_MS = 86_400_000;

function hoursBetween(now: number, iso: string): number {
  return (now - new Date(iso).getTime()) / 3_600_000;
}

export async function fetchNeedsActionLeads(options?: {
  limit?: number;
}): Promise<{
  needsAction: NeedsActionLead[];
  awaitingExternal: AwaitingExternalLead[];
  stages: OrgStage[];
}> {
  const sb = await createClient();
  const stages = await fetchOrgStages();
  const stageById = new Map(stages.map((s) => [s.id, s]));
  const openStages = stages.filter((s) => s.kind === "open").sort((a, b) => a.position - b.position);
  const firstOpenId = openStages[0]?.id ?? null;

  let leadsReq = sb
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
    .neq("stage", "lost");
  const assignFilter = await currentAssignmentFilterId();
  if (assignFilter) leadsReq = leadsReq.eq("assigned_to", assignFilter);

  const { data, error } = await leadsReq;
  if (error) throw error;
  const leads = (data ?? []) as LeadRow[];
  const leadIds = leads.map((l) => l.id);
  const safeIds = leadIds.length ? leadIds : ["00000000-0000-0000-0000-000000000000"];

  const todayStr = new Date().toISOString().slice(0, 10);
  const [actsRes, commentsRes, verifsRes, docsRes, tasksRes, litIds] = await Promise.all([
    sb.from("activities").select("lead_id, created_at").in("lead_id", safeIds),
    sb.from("discussion_comments").select("lead_id, created_at").in("lead_id", safeIds),
    sb.from("verification_items").select("lead_id").in("lead_id", safeIds).eq("checked", false),
    sb.from("documents").select("lead_id, received").in("lead_id", safeIds).eq("required", true),
    sb
      .from("tasks")
      .select("lead_id, due_date, completed")
      .in("lead_id", safeIds)
      .eq("completed", false)
      .lt("due_date", todayStr),
    litigatorLeadIdSet(sb, leadIds),
  ]);

  const lastActivityByLead = new Map<string, string>();
  for (const a of (actsRes.data ?? []) as Array<{ lead_id: string; created_at: string }>) {
    const prev = lastActivityByLead.get(a.lead_id);
    if (!prev || prev < a.created_at) lastActivityByLead.set(a.lead_id, a.created_at);
  }
  for (const c of (commentsRes.data ?? []) as Array<{ lead_id: string; created_at: string }>) {
    const prev = lastActivityByLead.get(c.lead_id);
    if (!prev || prev < c.created_at) lastActivityByLead.set(c.lead_id, c.created_at);
  }

  const uncheckedByLead = new Map<string, number>();
  for (const v of (verifsRes.data ?? []) as Array<{ lead_id: string }>) {
    uncheckedByLead.set(v.lead_id, (uncheckedByLead.get(v.lead_id) ?? 0) + 1);
  }

  const missingDocsByLead = new Map<string, number>();
  for (const d of (docsRes.data ?? []) as Array<{ lead_id: string; received: boolean }>) {
    if (!d.received) {
      missingDocsByLead.set(d.lead_id, (missingDocsByLead.get(d.lead_id) ?? 0) + 1);
    }
  }

  const overdueTasksByLead = new Map<string, number>();
  for (const t of (tasksRes.data ?? []) as Array<{ lead_id: string | null }>) {
    if (!t.lead_id) continue;
    overdueTasksByLead.set(t.lead_id, (overdueTasksByLead.get(t.lead_id) ?? 0) + 1);
  }

  const now = Date.now();
  const needsAction: NeedsActionLead[] = [];
  const awaitingExternal: AwaitingExternalLead[] = [];

  for (const lead of leads) {
    const stage = lead.stage_id ? stageById.get(lead.stage_id) : null;
    const stageName = stage?.name ?? "";
    const lastActivityIso = lastActivityByLead.get(lead.id) ?? lead.imported_at;
    const idleHours = hoursBetween(now, lastActivityIso);
    const daysIdle = Math.max(0, Math.floor(idleHours / 24));
    const daysInStage = Math.max(
      0,
      Math.floor((now - new Date(lead.stage_changed_at).getTime()) / DAY_MS)
    );
    const overdueTaskCount = overdueTasksByLead.get(lead.id) ?? 0;
    const uncheckedVerifications = uncheckedByLead.get(lead.id) ?? 0;
    const missingDocCount = missingDocsByLead.get(lead.id) ?? 0;

    const base: Omit<NeedsActionLead, "reason" | "reasonDetail"> = {
      ...lead,
      has_litigator: litIds.has(lead.id),
      stageName,
      days_in_stage: daysInStage,
      days_idle: daysIdle,
      overdueTaskCount,
      missingDocCount,
      uncheckedVerifications,
    };

    if (lead.needs_action_flag) {
      needsAction.push({ ...base, reason: "Manually Flagged", reasonDetail: "Flagged" });
      continue;
    }
    if (overdueTaskCount > 0) {
      needsAction.push({
        ...base,
        reason: "Overdue Task",
        reasonDetail:
          overdueTaskCount === 1 ? "1 Overdue Task" : `${overdueTaskCount} Overdue Tasks`,
      });
      continue;
    }
    if (stage && stage.kind === "open" && stage.rotDays != null && daysIdle >= stage.rotDays) {
      needsAction.push({
        ...base,
        reason: "Idle",
        reasonDetail:
          daysIdle === 1 ? "Idle 1 Day" : `Idle ${daysIdle} Days`,
      });
      continue;
    }
    if (firstOpenId && lead.stage_id === firstOpenId) {
      needsAction.push({ ...base, reason: "New Lead", reasonDetail: "New Lead" });
      continue;
    }
    if (uncheckedVerifications > 0 && stage && stage.kind === "open") {
      needsAction.push({
        ...base,
        reason: "Items Unchecked",
        reasonDetail:
          uncheckedVerifications === 1
            ? "1 Item Unchecked"
            : `${uncheckedVerifications} Items Unchecked`,
      });
      continue;
    }
    if (lead.stage === "contract" && missingDocCount > 0) {
      needsAction.push({
        ...base,
        reason: "Docs Missing",
        reasonDetail:
          missingDocCount === 1 ? "1 Doc Missing" : `${missingDocCount} Docs Missing`,
      });
      continue;
    }
    if (lead.stage === "with_attorney") {
      awaitingExternal.push({
        ...lead,
        has_litigator: litIds.has(lead.id),
        stageName,
        days_in_stage: daysInStage,
        reason:
          daysInStage === 1 ? "Attorney — 1 Day" : `Attorney — ${daysInStage} Days`,
      });
      continue;
    }
    if (lead.stage === "claim_filed") {
      awaitingExternal.push({
        ...lead,
        has_litigator: litIds.has(lead.id),
        stageName,
        days_in_stage: daysInStage,
        reason: daysInStage === 1 ? "County — 1 Day" : `County — ${daysInStage} Days`,
      });
      continue;
    }
  }

  needsAction.sort((a, b) => {
    if (a.reason === "Overdue Task" && b.reason !== "Overdue Task") return -1;
    if (b.reason === "Overdue Task" && a.reason !== "Overdue Task") return 1;
    if (a.reason === "Overdue Task" && b.reason === "Overdue Task") {
      return b.overdueTaskCount - a.overdueTaskCount;
    }
    if (a.reason === "Manually Flagged" && b.reason !== "Manually Flagged") return -1;
    if (b.reason === "Manually Flagged" && a.reason !== "Manually Flagged") return 1;
    return (b.estimated_surplus ?? 0) - (a.estimated_surplus ?? 0);
  });
  awaitingExternal.sort((a, b) => b.days_in_stage - a.days_in_stage);

  if (options?.limit != null) {
    return { needsAction: needsAction.slice(0, options.limit), awaitingExternal, stages };
  }
  return { needsAction, awaitingExternal, stages };
}

export function isStageRotting(stage: OrgStage, daysIdle: number): boolean {
  return stage.kind === "open" && stage.rotDays != null && daysIdle >= stage.rotDays;
}
