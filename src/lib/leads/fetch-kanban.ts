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

  // Fix VVVV4: attach the most recent activity per lead from the
  // lead_latest_activity view. One batched query, then map back. Used by the
  // Kanban card's "Last action" line.
  const leadIds = leads.map((l) => l.id);
  if (leadIds.length > 0) {
    const { data: latest } = await sb
      .from("lead_latest_activity")
      .select("lead_id, activity_type, payload, created_at")
      .in("lead_id", leadIds);
    if (latest) {
      const byId = new Map<string, NonNullable<LeadRow["last_activity"]>>();
      for (const row of latest as Array<{
        lead_id: string;
        activity_type: string;
        payload: Record<string, unknown>;
        created_at: string;
      }>) {
        byId.set(row.lead_id, {
          activity_type: row.activity_type,
          payload: row.payload,
          created_at: row.created_at,
        });
      }
      for (const lead of leads) {
        lead.last_activity = byId.get(lead.id) ?? null;
      }
    }
  }

  const grouped: Record<Stage, LeadRow[]> = {} as Record<Stage, LeadRow[]>;
  for (const stage of STAGES) grouped[stage] = [];
  for (const lead of leads) {
    grouped[lead.stage].push(lead);
  }
  return grouped;
}
