import "server-only";
import { createClient } from "@/lib/supabase/server";
import { currentAssignmentFilterId } from "./query";
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
       closing_bid, estimated_surplus, estimated_net_payout,
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
  const leadIds = leads.map((l) => l.id);
  const safeIds = leadIds.length ? leadIds : ["00000000-0000-0000-0000-000000000000"];

  // Latest activity timestamp per lead (rows arrive newest-first, so the first
  // one we see for a lead wins). Falls back to imported_at when there's none.
  const { data: acts } = await sb
    .from("activities")
    .select("lead_id, created_at")
    .in("lead_id", safeIds)
    .order("created_at", { ascending: false });
  const lastActivityByLead = new Map<string, string>();
  for (const a of acts ?? []) {
    const id = a.lead_id as string;
    if (!lastActivityByLead.has(id)) lastActivityByLead.set(id, a.created_at as string);
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

  const now = Date.now();
  const enriched: DailyWorkLead[] = leads.map((l) => ({
    ...l,
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
    const inActionStage = (ACTION_STAGES as readonly string[]).includes(lead.stage);

    if (lead.needs_action_flag) {
      needsAction.push({ ...lead, reason: "Flagged" });
    } else if (inActionStage && staleHours > 24) {
      const days = Math.max(1, Math.floor(staleHours / 24));
      needsAction.push({
        ...lead,
        reason: days === 1 ? "Idle Over A Day" : `Idle ${days} Days`,
      });
    } else if (lead.stage === "contract" && (missingDocsByLead.get(lead.id) ?? 0) > 0) {
      const n = missingDocsByLead.get(lead.id) ?? 0;
      needsAction.push({ ...lead, reason: `${n} Docs Missing` });
    } else if (lead.stage === "with_attorney") {
      awaitingExternal.push({ ...lead, reason: `Attorney • ${lead.days_in_stage}d` });
    } else if (lead.stage === "claim_filed") {
      awaitingExternal.push({ ...lead, reason: `County • ${lead.days_in_stage}d` });
    }
  }

  needsAction.sort((a, b) => (b.estimated_surplus ?? 0) - (a.estimated_surplus ?? 0));
  awaitingExternal.sort((a, b) => b.days_in_stage - a.days_in_stage);

  return { needsAction, awaitingExternal };
}
