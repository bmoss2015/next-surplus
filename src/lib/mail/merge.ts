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
  group: "contact" | "lead" | "sender" | "system";
};

export const MERGE_FIELDS: MergeField[] = [
  // Contact (recipient) — populated from relative / lead_party / lead
  { key: "contact.first_name", label: "First Name", group: "contact" },
  { key: "contact.last_name", label: "Last Name", group: "contact" },
  { key: "contact.full_name", label: "Full Name", group: "contact" },
  { key: "contact.address", label: "Mailing Address (full)", group: "contact" },
  { key: "contact.city", label: "City", group: "contact" },
  { key: "contact.state", label: "State", group: "contact" },
  { key: "contact.zip", label: "ZIP", group: "contact" },

  // Lead — surplus funds case context
  { key: "lead.id", label: "Lead ID", group: "lead" },
  { key: "lead.property_address", label: "Property Address", group: "lead" },
  { key: "lead.county", label: "County", group: "lead" },
  { key: "lead.state", label: "State", group: "lead" },
  { key: "lead.case_number", label: "Case Number", group: "lead" },
  { key: "lead.parcel_number", label: "Parcel Number", group: "lead" },
  { key: "lead.sale_date", label: "Sale Date", group: "lead" },
  { key: "lead.estimated_surplus", label: "Estimated Surplus", group: "lead" },
  { key: "lead.owner_range", label: "Estimated Range To Owner", group: "lead" },

  // Sender — from org settings
  { key: "sender.company_name", label: "Company Name", group: "sender" },
  { key: "sender.legal_name", label: "Legal Name", group: "sender" },
  { key: "sender.signer_name", label: "Signer Name", group: "sender" },
  { key: "sender.signer_title", label: "Signer Title", group: "sender" },
  { key: "sender.signature_image", label: "Signature Image", group: "sender" },
  { key: "sender.address", label: "Return Address (full)", group: "sender" },

  // System
  { key: "system.today", label: "Today's Date", group: "system" },
  { key: "system.today_long", label: "Today's Date (long)", group: "system" },
];

export function fieldsByGroup(): Record<MergeField["group"], MergeField[]> {
  const out: Record<MergeField["group"], MergeField[]> = {
    contact: [],
    lead: [],
    sender: [],
    system: [],
  };
  for (const f of MERGE_FIELDS) out[f.group].push(f);
  return out;
}
