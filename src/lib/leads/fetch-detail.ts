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
  // Exactly one of owner_id / relative_id / lead_party_id is non-null
  // (migration 0119). Phone + email rows always belong to an owner; mailing
  // address rows can belong to any of the three.
  owner_id: string | null;
  relative_id: string | null;
  lead_party_id: string | null;
  lead_id: string;
  channel: "phone" | "email" | "mailing_address";
  value: string;
  status: "untested" | "valid" | "invalid";
  connection_status: string | null;
  source: string | null;
  last_attempted: string | null;
  is_primary: boolean;
  phone_type: string | null;
  is_dnc: boolean;
  is_litigator: boolean;
  mailed: boolean;
  mailed_at: string | null;
  // Number of physical mailings sent to this address (migration 0132).
  // Pairs with mailed_at for the "Mailed 2x . last May 24" chip.
  // Optional: stays 0 / undefined until migration 0132 has been
  // applied. The chip falls back to "Mailed [date]" when count is
  // not > 1.
  mail_count?: number;
  // Only meaningful for channel='mailing_address' rows. Stores the recipient
  // label shown in the picker (e.g. "John Doe (Owner)"). Phone/email rows
  // write null. Renamed from `notes` in migration 0107.
  recipient_label: string | null;
  validation_checked_at: string | null;
  validation_provider: string | null;
};

export type OwnerRowFull = {
  id: string;
  lead_id: string;
  full_name: string;
  status: OwnerStatus;
  date_of_death: string | null;
  is_primary: boolean;
  is_deceased: boolean;
  age: number | null;
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
  parcel_number: string | null;
  source_surplus: number | null;
  lost_reason: string | null;
  lead_source: string | null;
  data_source: string | null;
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
       sale_type, sale_date, stage, stage_id, stage_changed_at,
       closing_bid, opening_bid, outstanding_debt, court_costs, total_liens,
       estimated_surplus, confirmed_surplus, source_surplus, estimated_net_payout,
       recovery_fee_percent, attorney_cost, case_number, parcel_number,
       redemption_ends, redemption_period_months, filing_deadline,
       recovery_type, needs_action_flag, needs_action_note,
       below_floor, archived, lost_reason, lead_source, data_source, attorney_id, assigned_to, dnc,
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

export type AttorneyOption = {
  id: string;
  name: string;
  states_covered: string[];
  default_cost: number | null;
};

export async function fetchAttorneyOptions(): Promise<AttorneyOption[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("attorneys")
    .select("id, name, states_covered, default_cost")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((a) => ({
    id: a.id as string,
    name: a.name as string,
    states_covered: (a.states_covered as string[] | null) ?? [],
    default_cost: (a.default_cost as number | null) ?? null,
  }));
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
        "id, lead_id, full_name, status, date_of_death, is_primary, is_deceased, age, relationship, notes"
      )
      .eq("lead_id", leadId)
      .order("is_primary", { ascending: false })
      .order("full_name", { ascending: true }),
    sb
      .from("contacts")
      .select(
        "id, owner_id, relative_id, lead_party_id, lead_id, channel, value, status, connection_status, source, last_attempted, is_primary, phone_type, is_dnc, is_litigator, mailed, mailed_at, recipient_label, validation_checked_at, validation_provider"
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

export type RelativePhoneSlotStatus = "untested" | "valid" | "invalid";

export type RelativeRow = {
  id: string;
  lead_id: string;
  full_name: string;
  relationship: string | null;
  age: number | null;
  phone: string | null;
  phone_type: string | null;
  phone_is_dnc: boolean;
  phone_is_litigator: boolean;
  phone_status: RelativePhoneSlotStatus;
  phone_validation_checked_at: string | null;
  phone_validation_provider: string | null;
  phone_2: string | null;
  phone_2_type: string | null;
  phone_2_is_dnc: boolean;
  phone_2_is_litigator: boolean;
  phone_2_status: RelativePhoneSlotStatus;
  phone_2_validation_checked_at: string | null;
  phone_2_validation_provider: string | null;
  phone_3: string | null;
  phone_3_type: string | null;
  phone_3_is_dnc: boolean;
  phone_3_is_litigator: boolean;
  phone_3_status: RelativePhoneSlotStatus;
  phone_3_validation_checked_at: string | null;
  phone_3_validation_provider: string | null;
  phone_4: string | null;
  phone_4_type: string | null;
  phone_4_is_dnc: boolean;
  phone_4_is_litigator: boolean;
  phone_4_status: RelativePhoneSlotStatus;
  phone_4_validation_checked_at: string | null;
  phone_4_validation_provider: string | null;
  phone_5: string | null;
  phone_5_type: string | null;
  phone_5_is_dnc: boolean;
  phone_5_is_litigator: boolean;
  phone_5_status: RelativePhoneSlotStatus;
  phone_5_validation_checked_at: string | null;
  phone_5_validation_provider: string | null;
  email: string | null;
  email_2: string | null;
  email_3: string | null;
  email_4: string | null;
  email_5: string | null;
  notes: string | null;
};

const RELATIVE_COLUMNS =
  "id, lead_id, full_name, relationship, age, " +
  "phone, phone_type, phone_is_dnc, phone_is_litigator, phone_status, phone_validation_checked_at, phone_validation_provider, " +
  "phone_2, phone_2_type, phone_2_is_dnc, phone_2_is_litigator, phone_2_status, phone_2_validation_checked_at, phone_2_validation_provider, " +
  "phone_3, phone_3_type, phone_3_is_dnc, phone_3_is_litigator, phone_3_status, phone_3_validation_checked_at, phone_3_validation_provider, " +
  "phone_4, phone_4_type, phone_4_is_dnc, phone_4_is_litigator, phone_4_status, phone_4_validation_checked_at, phone_4_validation_provider, " +
  "phone_5, phone_5_type, phone_5_is_dnc, phone_5_is_litigator, phone_5_status, phone_5_validation_checked_at, phone_5_validation_provider, " +
  "email, email_2, email_3, email_4, email_5, " +
  "notes";

export async function fetchRelatives(leadId: string): Promise<RelativeRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("relatives")
    .select(RELATIVE_COLUMNS)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as RelativeRow[];
}
