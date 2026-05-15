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

// Distinct custom role labels previously used across this org's lead_parties.
// RLS scopes to the caller's org automatically. Returned sorted, deduped.
export async function fetchOrgCustomRoles(): Promise<string[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("lead_parties")
    .select("custom_role_label")
    .eq("role", "other")
    .not("custom_role_label", "is", null);
  if (error) throw error;
  const set = new Set<string>();
  for (const r of data ?? []) {
    const v = (r as { custom_role_label: string | null }).custom_role_label;
    if (v && v.trim()) set.add(v.trim());
  }
  return Array.from(set).sort();
}

// Re-export the types so existing server-side imports still work.
export type {
  LeadPartyRole,
  LeadPartyRow,
} from "./lead-parties-types";
export { LEAD_PARTY_ROLE_LABELS } from "./lead-parties-types";
