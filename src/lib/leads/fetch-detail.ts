import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LeadRow, OwnerStatus } from "./types";

export type VerificationItem = {
  id: string;
  label: string;
  checked: boolean;
  checked_at: string | null;
  created_at: string;
};

export type ContactRow = {
  id: string;
  owner_id: string;
  lead_id: string;
  channel: "phone" | "email" | "mailing_address";
  value: string;
  status: "untested" | "valid" | "invalid" | "dnc";
  connection_status: string | null;
  source: string | null;
  last_attempted: string | null;
  is_primary: boolean;
  mailed: boolean;
  mailed_at: string | null;
  notes: string | null;
};

export type OwnerRowFull = {
  id: string;
  lead_id: string;
  full_name: string;
  status: OwnerStatus;
  date_of_death: string | null;
  is_primary: boolean;
  relationship: string | null;
  notes: string | null;
};

export type LienRow = {
  id: string;
  lead_id: string;
  name: string;
  amount: number;
  position: number;
};

export type LeadDetail = LeadRow & {
  opening_bid: number | null;
  outstanding_debt: number | null;
  court_costs: number | null;
  total_liens: number;
  confirmed_surplus: number | null;
  recovery_type: string | null;
  redemption_period_months: number | null;
  lost_reason: string | null;
  lead_source: string | null;
  attorney_id: string | null;
  assigned_to: string | null;
  needs_action_note: string | null;
  court_records: Record<string, unknown>;
  custom_data: Record<string, unknown>;
  dnc: boolean;
  research_notes: string | null;
  research_overall_findings: string | null;
  viability: "pursue" | "review" | "skip" | null;
  attorney: { name: string } | null;
};

export type LeadDetailWithCounts = LeadDetail & {
  unchecked_verification_count: number;
  total_verification_count: number;
  liens: LienRow[];
};

export async function fetchLeadDetail(
  leadId: string
): Promise<LeadDetailWithCounts | null> {
  const sb = await createClient();

  const { data, error } = await sb
    .from("leads")
    .select(
      `id, lead_id, address, city, state, zip, county,
       sale_type, sale_date, stage, stage_changed_at,
       closing_bid, opening_bid, outstanding_debt, court_costs, total_liens,
       estimated_surplus, confirmed_surplus, estimated_net_payout,
       recovery_fee_percent, attorney_cost, case_number,
       redemption_ends, redemption_period_months, filing_deadline,
       recovery_type, needs_action_flag, needs_action_note,
       below_floor, archived, lost_reason, lead_source, attorney_id, assigned_to, dnc,
       court_records, custom_data, imported_at,
       research_notes, research_overall_findings, viability,
       owners(full_name, is_primary, status),
       attorney:attorneys(name)`
    )
    .eq("id", leadId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { count: total } = await sb
    .from("verification_items")
    .select("*", { count: "exact", head: true })
    .eq("lead_id", leadId);

  const { count: unchecked } = await sb
    .from("verification_items")
    .select("*", { count: "exact", head: true })
    .eq("lead_id", leadId)
    .eq("checked", false);

  const { data: lienRows } = await sb
    .from("liens")
    .select("id, lead_id, name, amount, position")
    .eq("lead_id", leadId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  return {
    ...(data as unknown as LeadDetail),
    unchecked_verification_count: unchecked ?? 0,
    total_verification_count: total ?? 0,
    liens: (lienRows ?? []) as LienRow[],
  };
}

export type AttorneyOption = { id: string; name: string };

export async function fetchAttorneyOptions(): Promise<AttorneyOption[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("attorneys")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AttorneyOption[];
}

export async function fetchVerificationItems(
  leadId: string
): Promise<VerificationItem[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("verification_items")
    .select("id, label, checked, checked_at, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as VerificationItem[];
}

export async function fetchOwnersWithContacts(leadId: string): Promise<{
  owners: OwnerRowFull[];
  contacts: ContactRow[];
}> {
  const sb = await createClient();
  const [ownersResult, contactsResult] = await Promise.all([
    sb
      .from("owners")
      .select(
        "id, lead_id, full_name, status, date_of_death, is_primary, relationship, notes"
      )
      .eq("lead_id", leadId)
      .order("is_primary", { ascending: false })
      .order("full_name", { ascending: true }),
    sb
      .from("contacts")
      .select(
        "id, owner_id, lead_id, channel, value, status, connection_status, source, last_attempted, is_primary, mailed, mailed_at, notes"
      )
      .eq("lead_id", leadId)
      .order("channel", { ascending: true })
      .order("is_primary", { ascending: false }),
  ]);
  if (ownersResult.error) throw ownersResult.error;
  if (contactsResult.error) throw contactsResult.error;
  return {
    owners: (ownersResult.data ?? []) as OwnerRowFull[],
    contacts: (contactsResult.data ?? []) as ContactRow[],
  };
}

export type RelativeRow = {
  id: string;
  lead_id: string;
  full_name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
};

export async function fetchRelatives(leadId: string): Promise<RelativeRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("relatives")
    .select(
      "id, lead_id, full_name, relationship, phone, email, notes, street, city, state, zip"
    )
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as RelativeRow[];
}
