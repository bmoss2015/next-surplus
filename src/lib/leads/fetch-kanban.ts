import "server-only";
import { createClient } from "@/lib/supabase/server";
import { currentAssignmentFilterId, withLitigatorFlags } from "./query";
import { STAGES, type LeadRow, type Stage } from "./types";

export async function fetchKanbanLeads(): Promise<Record<Stage, LeadRow[]>> {
  const sb = await createClient();
  let req = sb
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
    .eq("archived", false);
  const assignFilter = await currentAssignmentFilterId();
  if (assignFilter) req = req.eq("assigned_to", assignFilter);
  const { data, error } = await req.order("imported_at", { ascending: false });

  if (error) throw error;
  const leads = await withLitigatorFlags(sb, (data ?? []) as LeadRow[]);

  const grouped: Record<Stage, LeadRow[]> = {} as Record<Stage, LeadRow[]>;
  for (const stage of STAGES) grouped[stage] = [];
  for (const lead of leads) {
    grouped[lead.stage].push(lead);
  }
  return grouped;
}
