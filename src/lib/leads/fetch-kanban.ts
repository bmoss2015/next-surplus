import "server-only";
import { createClient } from "@/lib/supabase/server";
import { currentAssignmentFilterId, withLitigatorFlags } from "./query";
import { type LeadRow } from "./types";
import { fetchOrgStages } from "@/lib/stages/fetch";
import type { OrgStage } from "@/lib/stages/types";

export type KanbanData = {
  stages: OrgStage[];
  leadsByStage: Record<string, LeadRow[]>;
  unstaged: LeadRow[];
};

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
       needs_action_flag, below_floor, archived, imported_at,
       owners(full_name, is_primary, status)`
    )
    .eq("archived", false);
  const assignFilter = await currentAssignmentFilterId();
  if (assignFilter) req = req.eq("assigned_to", assignFilter);
  const { data, error } = await req.order("imported_at", { ascending: false });

  if (error) throw error;
  const leads = await withLitigatorFlags(sb, (data ?? []) as LeadRow[]);

  const leadsByStage: Record<string, LeadRow[]> = {};
  for (const s of stages) leadsByStage[s.id] = [];
  const unstaged: LeadRow[] = [];
  for (const lead of leads) {
    if (lead.stage_id && leadsByStage[lead.stage_id]) {
      leadsByStage[lead.stage_id].push(lead);
    } else {
      unstaged.push(lead);
    }
  }
  return { stages, leadsByStage, unstaged };
}
