// Merge-field renderer for in-portal HTML templates.
//
// Supported syntax: {{field_name}} — replaced with the value from the
// provided context. Unknown fields are left intact (rendered as a literal
// "[Missing: field_name]" so the writer can see what's wrong on preview).

export type MergeContext = Record<string, string | number | null | undefined>;

const TOKEN_RE = /\{\{\s*([a-z0-9_.]+)\s*\}\}/gi;

export function renderMerge(body: string, context: MergeContext): string {
  return body.replace(TOKEN_RE, (_match, key: string) => {
    const value = context[key];
    if (value == null || value === "") return `[Missing: ${key}]`;
    return String(value);
  });
}

// The canonical merge field reference shown in the template editor. Each
// entry has a key (used in {{}} syntax), a human label, and which record
// type populates it. Callers can filter by where the template will be used.
export type MergeField = {
  key: string;
  label: string;
  example: string;
  // "recipient" covers any addressable party on the lead — Owner, Relative,
  // or Other Contact rows roll up here, since per-piece mail can go to any
  // of them. The merge keys themselves still use the `contact.` prefix for
  // backward compatibility with templates already authored.
  group: "recipient" | "lead" | "sender" | "system";
};

export const MERGE_FIELDS: MergeField[] = [
  // Recipient — whoever the letter is addressed to. Pulled from the lead's
  // Owner mailing-address rows, Relatives, or Other Contacts (lead_parties).
  // Examples use California to contrast with the Texas-based lead/property
  // examples below: the recipient often lives in a different state than
  // the property that generated the surplus.
  { key: "contact.first_name", label: "First Name", example: "Jane", group: "recipient" },
  { key: "contact.last_name", label: "Last Name", example: "Smith", group: "recipient" },
  { key: "contact.full_name", label: "Full Name", example: "Jane Smith", group: "recipient" },
  { key: "contact.address", label: "Mailing Address", example: "123 Main St, Los Angeles, CA 90001", group: "recipient" },
  { key: "contact.city", label: "City", example: "Los Angeles", group: "recipient" },
  { key: "contact.state", label: "State", example: "CA", group: "recipient" },
  { key: "contact.zip", label: "ZIP", example: "90001", group: "recipient" },

  // Lead — the surplus funds case itself (property, court case, sale).
  { key: "lead.id", label: "Lead ID", example: "L-2026-0042", group: "lead" },
  // Property address comes in three flavors: full one-liner, just the
  // street, and just the city/state/zip block. Templates can pick the
  // shape they need (e.g., street on one line, city/state/zip below).
  { key: "lead.property_address", label: "Property Address (Full)", example: "456 Oak Ave, Dallas, TX 75201", group: "lead" },
  { key: "lead.property_street_address", label: "Property Street Address", example: "456 Oak Ave", group: "lead" },
  { key: "lead.property_city_state_zip", label: "Property City, State ZIP", example: "Dallas, TX 75201", group: "lead" },
  { key: "lead.property_city", label: "Property City", example: "Dallas", group: "lead" },
  { key: "lead.property_state", label: "Property State", example: "TX", group: "lead" },
  { key: "lead.property_zip", label: "Property ZIP", example: "75201", group: "lead" },
  { key: "lead.county", label: "County", example: "Dallas", group: "lead" },
  { key: "lead.case_number", label: "Case Number", example: "DC-25-04321", group: "lead" },
  { key: "lead.parcel_number", label: "Parcel Number", example: "00000123456", group: "lead" },
  { key: "lead.sale_date", label: "Sale Date", example: "March 15, 2025", group: "lead" },
  { key: "lead.closing_bid", label: "Sale Price (Closing Bid)", example: "$185,000.00", group: "lead" },
  // Estimated Surplus = the "active surplus" the lead page uses
  // (confirmed > source > computed). Use Confirmed Surplus when you
  // need strictly the court-confirmed number.
  { key: "lead.estimated_surplus", label: "Estimated Surplus", example: "$42,500", group: "lead" },
  { key: "lead.confirmed_surplus", label: "Confirmed Surplus", example: "$42,500", group: "lead" },
  { key: "lead.owner_range", label: "Estimated Range To Owner", example: "$18,000 – $24,000", group: "lead" },
  { key: "lead.recovery_fee_pct", label: "Recovery Fee Percent", example: "30%", group: "lead" },
  { key: "lead.recovery_fee_amount", label: "Recovery Fee Amount", example: "$12,750", group: "lead" },
  { key: "lead.est_net_to_owner", label: "Est. Net To You", example: "$11,250", group: "lead" },

  // Sender — from org settings
  { key: "sender.company_name", label: "Company Name", example: "Moss Equity Partners", group: "sender" },
  { key: "sender.legal_name", label: "Legal Name", example: "Moss Equity Partners, LLC", group: "sender" },
  { key: "sender.signer_name", label: "Signer Name", example: "Bree Moss", group: "sender" },
  { key: "sender.signer_title", label: "Signer Title", example: "Managing Partner", group: "sender" },
  { key: "sender.signature_image", label: "Signature Image", example: "[signature image]", group: "sender" },
  { key: "sender.address", label: "Return Address (full)", example: "789 Business Blvd, Suite 100, Dallas, TX 75201", group: "sender" },

  // System
  { key: "system.today", label: "Today's Date", example: "5/19/2026", group: "system" },
  { key: "system.today_long", label: "Today's Date (long)", example: "May 19, 2026", group: "system" },
];

export const MERGE_GROUP_LABELS: Record<MergeField["group"], string> = {
  recipient: "Recipient",
  lead: "Property",
  sender: "Sender",
  system: "System",
};

export function fieldsByGroup(): Record<MergeField["group"], MergeField[]> {
  const out: Record<MergeField["group"], MergeField[]> = {
    recipient: [],
    lead: [],
    sender: [],
    system: [],
  };
  for (const f of MERGE_FIELDS) out[f.group].push(f);
  return out;
}
