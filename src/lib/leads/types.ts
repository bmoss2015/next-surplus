export const STAGES = [
  "new_leads",
  "qualifying",
  "outreach",
  "in_conversation",
  "contract",
  "with_attorney",
  "claim_filed",
  "won",
  "lost",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  new_leads: "New Leads",
  qualifying: "Qualifying",
  outreach: "Outreach",
  in_conversation: "In Conversation",
  contract: "Contract",
  with_attorney: "With Attorney",
  claim_filed: "Claim Filed",
  won: "Won",
  lost: "Lost",
};

// US state code -> display name. Used to label the (dynamic) state filter and
// market rows. Codes not in the map fall back to the raw code.
export const US_STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District Of Columbia",
};

export function stateName(code: string): string {
  return US_STATE_NAMES[code] ?? code;
}

export const SALE_TYPES = ["TAX", "MTG"] as const;
export type SaleType = (typeof SALE_TYPES)[number];

export const SALE_TYPE_LABELS: Record<SaleType, string> = {
  TAX: "Tax Sale",
  MTG: "Mortgage",
};

export const OWNER_STATUSES = [
  "living",
  "deceased",
  "unknown",
  "incarcerated",
] as const;
export type OwnerStatus = (typeof OWNER_STATUSES)[number];

export const OWNER_STATUS_LABELS: Record<OwnerStatus, string> = {
  living: "Living",
  deceased: "Deceased",
  unknown: "Unknown",
  incarcerated: "Incarcerated",
};

export type LeadRow = {
  id: string;
  lead_id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string | null;
  sale_type: SaleType;
  sale_date: string | null;
  stage: Stage;
  stage_changed_at: string;
  closing_bid: number | null;
  estimated_surplus: number | null;
  confirmed_surplus: number | null;
  source_surplus: number | null;
  estimated_net_payout: number | null;
  recovery_fee_percent: number;
  attorney_cost: number;
  case_number: string | null;
  redemption_ends: string | null;
  filing_deadline: string | null;
  needs_action_flag: boolean;
  below_floor: boolean | null;
  archived: boolean;
  imported_at: string;
  owners: Array<{
    full_name: string;
    is_primary: boolean;
    status: OwnerStatus;
  }>;
  // Fix G: true when any contact or relative on this lead carries a
  // litigator-risk phone. Populated by the list / kanban / daily-work fetchers.
  has_litigator?: boolean;
  // Fix O: true when this lead has had at least one activity beyond the
  // auto-logged "lead created" record. Populated by the Leads-table fetcher;
  // used to show a "New" pill in the Status column for untouched new leads.
  has_activity?: boolean;
};

export type SortColumn =
  | "lead_id"
  | "address"
  | "owner"
  | "stage"
  | "sale_type"
  | "estimated_surplus"
  | "days_since_sale"
  | "stage_changed_at";

export type SortDir = "asc" | "desc";
