import "server-only";
import { createClient } from "@/lib/supabase/server";
import { currentAssignmentFilterId, litigatorLeadIdSet } from "./query";
import type { LeadRow } from "./types";

export type DailyWorkLead = LeadRow & {
  days_in_stage: number;
  unchecked_verifications: number;
  reason: string;
};

const ACTION_STAGES = ["qualifying", "outreach", "in_conversation"] as const;
const DAY_MS = 86_400_000;

export async function fetchDailyWork(): Promise<{
  needsAction: DailyWorkLead[];
  awaitingExternal: DailyWorkLead[];
}> {
  const sb = await createClient();

  // Fix 5: pull every active (not lost, not archived) lead and partition in
  // JS — the old query AND-ed `.in(stage,...)` with `.or(...)`, so the OR
  // branch (manually-flagged leads outside those stages) never matched, and it
  // had no "last activity > 24h" condition at all.
  let leadsReq = sb
    .from("leads")
    .select(
      `id, lead_id, address, city, state, zip, county,
       sale_type, sale_date, stage, stage_changed_at,
       closing_bid, estimated_surplus, confirmed_surplus, estimated_net_payout,
       recovery_fee_percent, attorney_cost,
       redemption_ends, filing_deadline,
       needs_action_flag, below_floor, archived, imported_at,
       owners(full_name, is_primary, status)`
    )
    .eq("archived", false)
    .neq("stage", "lost");
  // Fix 75: non-admins only see their own assigned leads on the Daily Work board.
  const assignFilter = await currentAssignmentFilterId();
  if (assignFilter) leadsReq = leadsReq.eq("assigned_to", assignFilter);
  const { data, error } = await leadsReq;

  if (error) throw error;
  const leads = (data ?? []) as LeadRow[];

  // Fix R: Pipeline Rules — the configurable inactivity threshold. When unset
  // (no row / JSON null / non-positive), there is NO automatic time-based
  // flagging; only manually flagged leads land in Needs Action. When set to N
  // days, leads idle longer than that in the ACTION_STAGES are also surfaced.
  const { data: thresholdSetting } = await sb
    .from("app_settings")
    .select("value")
    .eq("key", "needs_action_days_threshold")
    .maybeSingle();
  const rawThreshold = Number(thresholdSetting?.value);
  const needsActionDays =
    Number.isFinite(rawThreshold) && rawThreshold >= 1 ? Math.floor(rawThreshold) : null;
  const leadIds = leads.map((l) => l.id);
  const safeIds = leadIds.length ? leadIds : ["00000000-0000-0000-0000-000000000000"];

  const [actsRes, commentsRes] = await Promise.all([
    sb
      .from("activities")
      .select("lead_id, created_at")
      .in("lead_id", safeIds)
      .order("created_at", { ascending: false }),
    sb
      .from("discussion_comments")
      .select("lead_id, created_at")
      .in("lead_id", safeIds)
      .order("created_at", { ascending: false }),
  ]);
  const lastActivityByLead = new Map<string, string>();
  for (const a of actsRes.data ?? []) {
    const id = a.lead_id as string;
    const ts = a.created_at as string;
    const prev = lastActivityByLead.get(id);
    if (!prev || prev < ts) lastActivityByLead.set(id, ts);
  }
  for (const c of commentsRes.data ?? []) {
    const id = c.lead_id as string;
    const ts = c.created_at as string;
    const prev = lastActivityByLead.get(id);
    if (!prev || prev < ts) lastActivityByLead.set(id, ts);
  }

  // Unchecked verification counts per lead
  const { data: verifs } = await sb
    .from("verification_items")
    .select("lead_id")
    .in("lead_id", safeIds)
    .eq("checked", false);
  const uncheckedByLead = new Map<string, number>();
  for (const v of verifs ?? []) {
    const id = v.lead_id as string;
    uncheckedByLead.set(id, (uncheckedByLead.get(id) ?? 0) + 1);
  }

  // Required-but-missing documents per lead
  const { data: requiredDocs } = await sb
    .from("documents")
    .select("lead_id, received")
    .in("lead_id", safeIds)
    .eq("required", true);
  const missingDocsByLead = new Map<string, number>();
  for (const d of requiredDocs ?? []) {
    if (!d.received) {
      const id = d.lead_id as string;
      missingDocsByLead.set(id, (missingDocsByLead.get(id) ?? 0) + 1);
    }
  }

  const litigatorIds = await litigatorLeadIdSet(sb, leadIds);

  const now = Date.now();
  const enriched: DailyWorkLead[] = leads.map((l) => ({
    ...l,
    has_litigator: litigatorIds.has(l.id),
    days_in_stage: Math.max(0, Math.floor((now - new Date(l.stage_changed_at).getTime()) / DAY_MS)),
    unchecked_verifications: uncheckedByLead.get(l.id) ?? 0,
    reason: "",
  }));

  function hoursSinceLastActivity(l: DailyWorkLead): number {
    const iso = lastActivityByLead.get(l.id) ?? l.imported_at;
    return (now - new Date(iso).getTime()) / 3_600_000;
  }

  const needsAction: DailyWorkLead[] = [];
  const awaitingExternal: DailyWorkLead[] = [];

  for (const lead of enriched) {
    const staleHours = hoursSinceLastActivity(lead);
    // ACTION_STAGES excludes the "new" stage, so New Leads are never auto-flagged.
    const inActionStage = (ACTION_STAGES as readonly string[]).includes(lead.stage);

    if (lead.needs_action_flag) {
      needsAction.push({ ...lead, reason: "Flagged" });
    } else if (
      needsActionDays != null &&
      inActionStage &&
      staleHours > needsActionDays * 24
    ) {
      const days = Math.max(needsActionDays, Math.floor(staleHours / 24));
      needsAction.push({
        ...lead,
        reason: days === 1 ? "Idle Over A Day" : `Idle ${days} Days`,
      });
    } else if (lead.stage === "contract" && (missingDocsByLead.get(lead.id) ?? 0) > 0) {
      const n = missingDocsByLead.get(lead.id) ?? 0;
      needsAction.push({ ...lead, reason: `${n} Docs Missing` });
    } else if (lead.stage === "with_attorney") {
      const d = lead.days_in_stage;
      awaitingExternal.push({ ...lead, reason: `Attorney — ${d} ${d === 1 ? "Day" : "Days"}` });
    } else if (lead.stage === "claim_filed") {
      const d = lead.days_in_stage;
      awaitingExternal.push({ ...lead, reason: `County — ${d} ${d === 1 ? "Day" : "Days"}` });
    }
  }

  needsAction.sort((a, b) => (b.estimated_surplus ?? 0) - (a.estimated_surplus ?? 0));
  awaitingExternal.sort((a, b) => b.days_in_stage - a.days_in_stage);

  return { needsAction, awaitingExternal };
}
