// Pure types and constants for the lead_parties table. NO server-only
// imports — this file is safe to import from client components too.

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
