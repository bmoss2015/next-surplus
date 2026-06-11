import "server-only";
import { createClient } from "@/lib/supabase/server";
import { currentAssignmentFilterId, withLitigatorFlags } from "./query";
import { type LeadRow } from "./types";
import { fetchOrgStages } from "@/lib/stages/fetch";
import type { OrgStage } from "@/lib/stages/types";

export type KanbanLead = LeadRow & {
  days_idle: number;
  days_in_stage: number;
  assignedName: string | null;
  overdueTaskCount: number;
};

export type KanbanData = {
  stages: OrgStage[];
  leadsByStage: Record<string, KanbanLead[]>;
  unstaged: KanbanLead[];
};

const DAY_MS = 86_400_000;

export async function fetchKanbanLeads(): Promise<KanbanData> {
  const sb = await createClient();
  const stages = await fetchOrgStages();

  let req = sb
    .from("leads")
    .select(
      `id, lead_id, address, city, state, zip, county,
       sale_type, sale_date, stage, stage_id, stage_changed_at,
       closing_bid, estimated_surplus, confirmed_surplus, source_surplus, estimated_net_payout,
       recovery_fee_percent, attorney_cost,
       redemption_ends, filing_deadline,
       needs_action_flag, below_floor, archived, imported_at, assigned_to,
       case_number,
       owners(full_name, is_primary, status)`
    )
    .eq("archived", false);
  const assignFilter = await currentAssignmentFilterId();
  if (assignFilter) req = req.eq("assigned_to", assignFilter);
  const { data, error } = await req;
  if (error) throw error;
  const baseLeads = await withLitigatorFlags(sb, (data ?? []) as LeadRow[]);

  const leadIds = baseLeads.map((l) => l.id);
  const safeIds = leadIds.length ? leadIds : ["00000000-0000-0000-0000-000000000000"];
  const todayStr = new Date().toISOString().slice(0, 10);
  const assignedIds = Array.from(
    new Set(
      baseLeads
        .map((l) => (l as LeadRow & { assigned_to?: string | null }).assigned_to)
        .filter((id): id is string => !!id)
    )
  );

  const [actsRes, commentsRes, tasksRes, profilesRes] = await Promise.all([
    sb.from("activities").select("lead_id, created_at").in("lead_id", safeIds),
    sb.from("discussion_comments").select("lead_id, created_at").in("lead_id", safeIds),
    sb
      .from("tasks")
      .select("lead_id")
      .in("lead_id", safeIds)
      .eq("completed", false)
      .lt("due_date", todayStr),
    assignedIds.length > 0
      ? sb.from("profiles").select("id, full_name, email").in("id", assignedIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; email: string | null }> }),
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
  const overdueByLead = new Map<string, number>();
  for (const t of (tasksRes.data ?? []) as Array<{ lead_id: string | null }>) {
    if (!t.lead_id) continue;
    overdueByLead.set(t.lead_id, (overdueByLead.get(t.lead_id) ?? 0) + 1);
  }
  const profileById = new Map<string, { full_name: string | null; email: string | null }>();
  for (const p of (profilesRes.data ?? []) as Array<{
    id: string;
    full_name: string | null;
    email: string | null;
  }>) {
    profileById.set(p.id, { full_name: p.full_name, email: p.email });
  }

  const now = Date.now();
  const leads: KanbanLead[] = baseLeads.map((l) => {
    const lastIso = lastActivityByLead.get(l.id) ?? l.imported_at;
    const days_idle = Math.max(0, Math.floor((now - new Date(lastIso).getTime()) / DAY_MS));
    const days_in_stage = Math.max(
      0,
      Math.floor((now - new Date(l.stage_changed_at).getTime()) / DAY_MS)
    );
    const assignedTo = (l as LeadRow & { assigned_to?: string | null }).assigned_to ?? null;
    const profile = assignedTo ? profileById.get(assignedTo) : undefined;
    const assignedName = profile?.full_name || profile?.email || null;
    return {
      ...l,
      days_idle,
      days_in_stage,
      assignedName,
      overdueTaskCount: overdueByLead.get(l.id) ?? 0,
    };
  });

  const leadsByStage: Record<string, KanbanLead[]> = {};
  for (const s of stages) leadsByStage[s.id] = [];
  const unstaged: KanbanLead[] = [];
  for (const lead of leads) {
    if (lead.stage_id && leadsByStage[lead.stage_id]) {
      leadsByStage[lead.stage_id].push(lead);
    } else {
      unstaged.push(lead);
    }
  }

  function deadlineRank(l: KanbanLead): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const r = l.redemption_ends ? new Date(l.redemption_ends + "T00:00:00").getTime() : null;
    const f = l.filing_deadline ? new Date(l.filing_deadline + "T00:00:00").getTime() : null;
    const candidates = [r, f].filter((v): v is number => v != null);
    if (candidates.length === 0) return Number.POSITIVE_INFINITY;
    return Math.min(...candidates);
  }
  function leadSortValue(a: KanbanLead, b: KanbanLead): number {
    if (a.needs_action_flag && !b.needs_action_flag) return -1;
    if (b.needs_action_flag && !a.needs_action_flag) return 1;
    if (a.overdueTaskCount > 0 && b.overdueTaskCount === 0) return -1;
    if (b.overdueTaskCount > 0 && a.overdueTaskCount === 0) return 1;
    const da = deadlineRank(a);
    const db = deadlineRank(b);
    if (da !== db) return da - db;
    return (b.estimated_surplus ?? 0) - (a.estimated_surplus ?? 0);
  }
  for (const sid of Object.keys(leadsByStage)) {
    leadsByStage[sid].sort(leadSortValue);
  }
  unstaged.sort(leadSortValue);

  return { stages, leadsByStage, unstaged };
}
