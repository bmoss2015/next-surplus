import "server-only";
import { createClient } from "@/lib/supabase/server";

export type LeadPartyRole =
  | "attorney_for_owner"
  | "trustee"
  | "successor_heir"
  | "county_clerk"
  | "court"
  | "opposing_counsel"
  | "title_company"
  | "realtor"
  | "notary"
  | "guardian"
  | "other";

export type LeadPartyRow = {
  id: string;
  lead_id: string;
  role: LeadPartyRole;
  custom_role_label: string | null;
  name: string;
  organization: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

export const LEAD_PARTY_ROLE_LABELS: Record<LeadPartyRole, string> = {
  attorney_for_owner: "Owner's Attorney",
  trustee: "Trustee",
  successor_heir: "Successor / Heir",
  county_clerk: "County Clerk",
  court: "Court",
  opposing_counsel: "Opposing Counsel",
  title_company: "Title Company",
  realtor: "Realtor",
  notary: "Notary",
  guardian: "Guardian",
  other: "Other",
};

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
