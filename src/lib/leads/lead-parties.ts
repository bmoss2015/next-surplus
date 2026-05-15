import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LeadPartyRow } from "./lead-parties-types";

export async function fetchLeadParties(leadId: string): Promise<LeadPartyRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("lead_parties")
    .select(
      "id, lead_id, role, custom_role_label, name, organization, email, phone, notes, created_at"
    )
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LeadPartyRow[];
}

// Re-export the types so existing server-side imports still work.
export type {
  LeadPartyRole,
  LeadPartyRow,
} from "./lead-parties-types";
export { LEAD_PARTY_ROLE_LABELS } from "./lead-parties-types";
