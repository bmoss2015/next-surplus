// Shared (non-action) constants, types, and pure helpers for the import flow.
// These live outside _actions.ts because a "use server" module may only export
// async functions — exporting consts / sync functions / type values from it
// breaks the build.

// Sale type values accepted at import time. 'unknown' is the default when the
// CSV doesn't carry a sale type (added to the sale_type enum in migration 0021).
export type ImportSaleType = "TAX" | "MTG" | "unknown";

// Fix 95: how a detected duplicate row should be resolved on import.
//  - skip:          do not import the row at all
//  - update_blank:  only write into fields that are null/empty on the lead
//  - replace_all:   overwrite every importable field on the lead
export type DuplicateResolution = "skip" | "update_blank" | "replace_all";

export const DEFAULT_DUPLICATE_RESOLUTION: DuplicateResolution = "update_blank";

export function duplicateResolutionLabel(r: DuplicateResolution): string {
  switch (r) {
    case "skip":
      return "Skip";
    case "update_blank":
      return "Update Blank Fields Only";
    case "replace_all":
      return "Replace All";
  }
}

// Fix 95: one decision per CSV row the user wants to act on. New rows get
// "insert"; rows matched to an existing lead get one of the duplicate
// resolutions plus the existing lead id. Lives here (not in the "use server"
// _actions module) so it can be a plain type export.
export type ImportRowDecision =
  | { index: number; action: "insert" }
  | { index: number; action: DuplicateResolution; existingLeadId: string };

// The literal "Other" option appended to the lead-source dropdown — picking it
// reveals a free-text input for a brand-new source name (Fix 6).
export const OTHER_SOURCE_OPTION = "Other";

// 'Manual' is the source written when a lead is created by hand elsewhere; the
// import wizard offers it too, but it is just a normal seeded option now.
export const DEFAULT_LEAD_SOURCE = "Manual";

// ---------------------------------------------------------------------------
// Portal fields the wizard maps CSV columns onto (Fix 7 / Fix 8).
// Outstanding Debt and Court Costs are deliberately NOT here — they are not
// importable. Only address/city/state/zip are hard-required.
// ---------------------------------------------------------------------------

export type PortalFieldKey =
  | "address"
  | "city"
  | "state"
  | "zip"
  | "county"
  | "owner_first_name"
  | "owner_last_name"
  | "owner_full_name"
  | "closing_bid"
  | "opening_bid"
  | "sale_date"
  | "sale_type"
  | "case_number"
  | "surplus_amount"
  | "phone_1"
  | "phone_1_type"
  | "phone_1_dnc"
  | "phone_2"
  | "phone_2_type"
  | "phone_2_dnc"
  | "phone_3"
  | "phone_3_type"
  | "phone_3_dnc"
  | "phone_4"
  | "phone_4_type"
  | "phone_4_dnc"
  | "phone_5"
  | "phone_5_type"
  | "phone_5_dnc"
  | "email"
  | "email_2"
  | "email_3"
  | "email_4"
  | "email_5"
  | "mailing_address_1"
  | "mailing_address_2"
  | "owner_mailing_street"
  | "owner_mailing_city"
  | "owner_mailing_state"
  | "owner_mailing_zip"
  | "owner_age"
  | "owner_deceased_flag"
  | "lead_source";

// Relative fields (Relative 1..5) use generated string keys, e.g.
// "relative_1_first_name", "relative_2_phone_3_dnc" — see RELATIVE_COUNT below.
export type PortalField = {
  key: string;
  label: string;
  required: boolean;
  // Header aliases (already normalized — see normalizeHeader) used for auto-map.
  aliases: string[];
};

export const RELATIVE_COUNT = 5;
export const RELATIVE_PHONE_COUNT = 5;
export const RELATIVE_EMAIL_COUNT = 5;

// Normalize a header for matching: lowercase, strip everything that isn't a
// letter or digit. "Property Address" / "property_address" / "PROPERTYADDRESS"
// all collapse to "propertyaddress".
export function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Excess Elite carries a "Phone N: Type" column with values like "Mobile",
// "Wireless", "Residential", "LandLine", "VOIP", etc. Collapse to the three
// values the portal stores (or null when blank / unrecognized as a class).
export function parsePhoneType(raw: string): string | null {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return null;
  if (v.startsWith("m") || v.includes("cell") || v.includes("wireless") || v.includes("mobile"))
    return "Mobile";
  if (v.startsWith("r") || v.includes("land") || v.includes("home") || v.includes("residential"))
    return "Residential";
  return "Other";
}

// Excess Elite carries a "Phone N: DNC/Litigator" column. A "Y" (or "DNC")
// marks the number do-not-call; anything mentioning "litigator" additionally
// marks it litigation risk (which also implies DNC).
export function parseDncLitigator(raw: string): { is_dnc: boolean; is_litigator: boolean } {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return { is_dnc: false, is_litigator: false };
  const is_litigator = v.includes("litig");
  const yes = ["y", "yes", "t", "true", "1", "x"].includes(v);
  const is_dnc = is_litigator || yes || v.includes("dnc") || v.includes("do not call");
  return { is_dnc, is_litigator };
}

export const PORTAL_FIELDS: PortalField[] = [
  {
    key: "address",
    label: "Property Street Address",
    required: true,
    aliases: [
      "address",
      "addr",
      "street",
      "streetaddress",
      "propertyaddress",
      "propertystreet",
      "propertystreetaddress",
      "situsaddress",
      "siteaddress",
    ],
  },
  {
    key: "city",
    label: "Property City",
    required: true,
    aliases: ["city", "propertycity", "situscity", "town"],
  },
  {
    key: "state",
    label: "Property State",
    required: true,
    aliases: ["state", "st", "propertystate", "situsstate"],
  },
  {
    key: "zip",
    label: "Property Zip",
    required: true,
    aliases: [
      "zip",
      "zipcode",
      "postal",
      "postalcode",
      "propertyzip",
      "propertyzipcode",
      "situszip",
    ],
  },
  {
    key: "county",
    label: "County",
    required: false,
    aliases: ["county", "propertycounty", "saledistrict"],
  },
  {
    key: "owner_first_name",
    label: "Owner First Name",
    required: false,
    aliases: ["ownerfirst", "ownerfirstname", "firstname", "first", "fname"],
  },
  {
    key: "owner_last_name",
    label: "Owner Last Name",
    required: false,
    aliases: ["ownerlast", "ownerlastname", "lastname", "last", "lname", "surname"],
  },
  {
    key: "owner_full_name",
    label: "Owner Full Name",
    required: false,
    aliases: [
      "owner",
      "name",
      "ownername",
      "ownerfullname",
      "fullname",
      "propertyowner",
      "ownerofrecord",
      "defendant",
    ],
  },
  {
    key: "owner_age",
    label: "Owner Age",
    required: false,
    aliases: ["age", "ownerage", "primaryownerage"],
  },
  {
    key: "owner_deceased_flag",
    label: "Owner Deceased Flag",
    required: false,
    aliases: ["deceased", "deceasedflag", "isdeceased", "ownerdeceased", "deceasedindicator"],
  },
  {
    key: "closing_bid",
    label: "Closing Bid",
    required: false,
    aliases: [
      "closingbid",
      "winningbid",
      "finalbid",
      "soldamount",
      "saleprice",
      "saleamount",
      "bidamount",
      "highbid",
    ],
  },
  {
    key: "opening_bid",
    label: "Opening Bid",
    required: false,
    aliases: ["openingbid", "minimumbid", "minbid", "startingbid", "upsetbid"],
  },
  {
    key: "sale_date",
    label: "Sale Date",
    required: false,
    aliases: [
      "saledate",
      "dateofsale",
      "datesold",
      "solddate",
      "auctiondate",
      "foreclosuredate",
      "soldon",
      "salesdate",
    ],
  },
  {
    key: "sale_type",
    label: "Sale Type",
    required: false,
    aliases: ["saletype", "type", "saletypecode", "auctiontype", "category"],
  },
  {
    key: "case_number",
    label: "Case Number",
    required: false,
    aliases: [
      "casenumber",
      "caseno",
      "casenum",
      "docketnumber",
      "filenumber",
      "cause",
      "causenumber",
    ],
  },
  {
    key: "surplus_amount",
    label: "Surplus Amount",
    required: false,
    aliases: [
      "surplus",
      "surplusamount",
      "surplusfunds",
      "excessfunds",
      "excessproceeds",
      "overage",
      "overbid",
    ],
  },
  {
    key: "phone_1",
    label: "Phone 1",
    required: false,
    aliases: ["phone", "phone1", "primaryphone", "phonenumber", "phoneone", "tel"],
  },
  {
    key: "phone_1_type",
    label: "Phone 1 Type",
    required: false,
    aliases: ["phone1type", "phonetype", "phone1linetype"],
  },
  {
    key: "phone_1_dnc",
    label: "Phone 1 DNC/Litigator",
    required: false,
    aliases: ["phone1dnclitigator", "phone1dnc", "phone1litigator", "phonednclitigator"],
  },
  {
    key: "phone_2",
    label: "Phone 2",
    required: false,
    aliases: ["phone2", "secondaryphone", "phonetwo", "altphone", "alternatephone"],
  },
  {
    key: "phone_2_type",
    label: "Phone 2 Type",
    required: false,
    aliases: ["phone2type", "phone2linetype"],
  },
  {
    key: "phone_2_dnc",
    label: "Phone 2 DNC/Litigator",
    required: false,
    aliases: ["phone2dnclitigator", "phone2dnc", "phone2litigator"],
  },
  {
    key: "phone_3",
    label: "Phone 3",
    required: false,
    aliases: ["phone3", "phonethree", "thirdphone", "otherphone"],
  },
  {
    key: "phone_3_type",
    label: "Phone 3 Type",
    required: false,
    aliases: ["phone3type", "phone3linetype"],
  },
  {
    key: "phone_3_dnc",
    label: "Phone 3 DNC/Litigator",
    required: false,
    aliases: ["phone3dnclitigator", "phone3dnc", "phone3litigator"],
  },
  {
    key: "phone_4",
    label: "Phone 4",
    required: false,
    aliases: ["phone4", "phonefour", "fourthphone", "ownerphone4"],
  },
  {
    key: "phone_4_type",
    label: "Phone 4 Type",
    required: false,
    aliases: ["phone4type", "phone4linetype"],
  },
  {
    key: "phone_4_dnc",
    label: "Phone 4 DNC/Litigator",
    required: false,
    aliases: ["phone4dnclitigator", "phone4dnc", "phone4litigator"],
  },
  {
    key: "phone_5",
    label: "Phone 5",
    required: false,
    aliases: ["phone5", "phonefive", "fifthphone", "ownerphone5"],
  },
  {
    key: "phone_5_type",
    label: "Phone 5 Type",
    required: false,
    aliases: ["phone5type", "phone5linetype"],
  },
  {
    key: "phone_5_dnc",
    label: "Phone 5 DNC/Litigator",
    required: false,
    aliases: ["phone5dnclitigator", "phone5dnc", "phone5litigator"],
  },
  {
    key: "email",
    label: "Email",
    required: false,
    aliases: ["email", "email1", "emailaddress", "emailaddr", "owneremail"],
  },
  {
    key: "email_2",
    label: "Email 2",
    required: false,
    aliases: ["email2", "secondaryemail", "altemail", "alternateemail", "owneremail2"],
  },
  {
    key: "email_3",
    label: "Email 3",
    required: false,
    aliases: ["email3", "thirdemail", "owneremail3"],
  },
  {
    key: "email_4",
    label: "Email 4",
    required: false,
    aliases: ["email4", "fourthemail", "owneremail4"],
  },
  {
    key: "email_5",
    label: "Email 5",
    required: false,
    aliases: ["email5", "fifthemail", "owneremail5"],
  },
  {
    key: "mailing_address_1",
    label: "Mailing Address",
    required: false,
    aliases: [
      "mailingaddress",
      "mailaddress",
      "mailingaddress1",
      "ownermailingaddress",
      "owneraddress",
      "forwardingaddress",
      "lastknownaddress",
    ],
  },
  {
    key: "mailing_address_2",
    label: "Mailing Address 2",
    required: false,
    aliases: [
      "mailingaddress2",
      "secondmailingaddress",
      "altmailingaddress",
      "alternatemailingaddress",
      "mailingaddressb",
    ],
  },
  {
    key: "owner_mailing_street",
    label: "Owner Mailing Street",
    required: false,
    aliases: [
      "mailingstreet",
      "mailingstreetaddress",
      "ownermailingstreet",
      "mailingaddressline1",
      "mailingline1",
    ],
  },
  {
    key: "owner_mailing_city",
    label: "Owner Mailing City",
    required: false,
    aliases: ["mailingcity", "ownermailingcity", "mailcity"],
  },
  {
    key: "owner_mailing_state",
    label: "Owner Mailing State",
    required: false,
    aliases: ["mailingstate", "ownermailingstate", "mailstate"],
  },
  {
    key: "owner_mailing_zip",
    label: "Owner Mailing Zip",
    required: false,
    aliases: [
      "mailingzip",
      "mailingzipcode",
      "ownermailingzip",
      "mailingpostalcode",
      "mailzip",
    ],
  },
  {
    key: "lead_source",
    label: "Lead Source",
    required: false,
    aliases: ["leadsource", "source", "sourcename"],
  },
];

// --- Relative 1..5 mappable fields (Excess Elite "RELATIVE N: ..." columns) --
// Header normalization strips ":" and spaces, so "RELATIVE 1: Phone 1: Type"
// and "RELATIVE 1 Phone 1 Type" both collapse to "relative1phone1type".
export function relativeFieldKey(n: number, suffix: string): string {
  return `relative_${n}_${suffix}`;
}

for (let n = 1; n <= RELATIVE_COUNT; n++) {
  PORTAL_FIELDS.push(
    {
      key: relativeFieldKey(n, "first_name"),
      label: `Relative ${n} First Name`,
      required: false,
      aliases: [`relative${n}firstname`, `rel${n}firstname`],
    },
    {
      key: relativeFieldKey(n, "last_name"),
      label: `Relative ${n} Last Name`,
      required: false,
      aliases: [`relative${n}lastname`, `rel${n}lastname`],
    },
    {
      key: relativeFieldKey(n, "possible_type"),
      label: `Relative ${n} Possible Type`,
      required: false,
      aliases: [
        `relative${n}possibletype`,
        `relative${n}type`,
        `relative${n}relationship`,
        `rel${n}type`,
      ],
    },
    {
      key: relativeFieldKey(n, "age"),
      label: `Relative ${n} Age`,
      required: false,
      aliases: [`relative${n}age`, `rel${n}age`],
    }
  );
  for (let m = 1; m <= RELATIVE_PHONE_COUNT; m++) {
    PORTAL_FIELDS.push(
      {
        key: relativeFieldKey(n, `phone_${m}`),
        label: `Relative ${n} Phone ${m}`,
        required: false,
        aliases: [`relative${n}phone${m}`, `rel${n}phone${m}`],
      },
      {
        key: relativeFieldKey(n, `phone_${m}_type`),
        label: `Relative ${n} Phone ${m} Type`,
        required: false,
        aliases: [`relative${n}phone${m}type`, `rel${n}phone${m}type`],
      },
      {
        key: relativeFieldKey(n, `phone_${m}_dnc`),
        label: `Relative ${n} Phone ${m} DNC/Litigator`,
        required: false,
        aliases: [
          `relative${n}phone${m}dnclitigator`,
          `relative${n}phone${m}dnc`,
          `relative${n}phone${m}litigator`,
        ],
      }
    );
  }
  for (let m = 1; m <= RELATIVE_EMAIL_COUNT; m++) {
    PORTAL_FIELDS.push({
      key: relativeFieldKey(n, `email_${m}`),
      label: `Relative ${n} Email ${m}`,
      required: false,
      aliases: [`relative${n}email${m}`, `rel${n}email${m}`],
    });
  }
}

export const PORTAL_FIELD_KEYS: string[] = PORTAL_FIELDS.map((f) => f.key);

export const REQUIRED_PORTAL_FIELD_KEYS: string[] = PORTAL_FIELDS.filter(
  (f) => f.required
).map((f) => f.key);

export function portalFieldLabel(key: string): string {
  return PORTAL_FIELDS.find((f) => f.key === key)?.label ?? key;
}

/**
 * Auto-match CSV headers to portal fields by normalized name + aliases.
 * Returns a record of portalFieldKey -> csvHeader. Each CSV header is used at
 * most once; each portal field is filled at most once (first match wins).
 */
export function autoMapHeaders(headers: string[]): Record<string, string> {
  const used = new Set<string>();
  const result: Record<string, string> = {};
  const norm = headers.map((h) => normalizeHeader(h));

  for (const field of PORTAL_FIELDS) {
    for (const alias of field.aliases) {
      const idx = norm.findIndex((h, i) => h === alias && !used.has(headers[i]));
      if (idx !== -1) {
        result[field.key] = headers[idx];
        used.add(headers[idx]);
        break;
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Transport types between client wizard and server actions.
// ---------------------------------------------------------------------------

// One phone parsed off a CSV row — value plus its Excess Elite classification.
// phone_type is one of "Mobile" | "Residential" | "Other" (or null).
export type ImportPhone = {
  value: string;
  phone_type: string | null;
  is_dnc: boolean;
  is_litigator: boolean;
};

// A relative parsed off one CSV row. Phones/emails are already trimmed and
// non-empty; phones carry their type / DNC / litigator classification.
export type ImportRelative = {
  full_name: string | null;
  relationship: string | null;
  age: number | null;
  phones: ImportPhone[];
  emails: string[];
};

// One parsed CSV row reduced to the portal fields the user mapped. All values
// are post-transform (address/city already formatted, numerics parsed, etc.).
export type IncomingLead = {
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string | null;
  sale_type: ImportSaleType;
  sale_date: string | null;
  case_number: string | null;
  closing_bid: number | null;
  opening_bid: number | null;
  confirmed_surplus: number | null;
  lead_source: string | null; // per-row override from a mapped column; usually null
  owner_full_name: string | null;
  owner_age: number | null;
  owner_deceased: boolean;
  phones: ImportPhone[]; // each mapped phone column, in order (only the non-empty ones)
  emails: string[]; // each mapped email column, in order (only the non-empty ones)
  mailing_addresses: string[]; // each mapped mailing-address column (non-empty only)
  relatives: ImportRelative[]; // up to RELATIVE_COUNT, only the non-empty ones
};

export type ImportHistoryRow = {
  id: string;
  filename: string;
  uploaded_at: string;
  total_rows: number;
  imported_count: number;
  skipped_count: number;
  error_count: number;
  status: string;
};

export type SavedSourceMapping = {
  mapping: Record<string, string>; // portalFieldKey -> csvHeader
  dismissedColumns: string[]; // csv headers the user dismissed for this source
};
