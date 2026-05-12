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
  | "attorney_cost"
  | "sale_date"
  | "sale_type"
  | "case_number"
  | "surplus_amount"
  | "phone_1"
  | "phone_1_type"
  | "phone_1_dnc"
  | "phone_1_litigator"
  | "phone_2"
  | "phone_2_type"
  | "phone_2_dnc"
  | "phone_2_litigator"
  | "phone_3"
  | "phone_3_type"
  | "phone_3_dnc"
  | "phone_3_litigator"
  | "phone_4"
  | "phone_4_type"
  | "phone_4_dnc"
  | "phone_4_litigator"
  | "phone_5"
  | "phone_5_type"
  | "phone_5_dnc"
  | "phone_5_litigator"
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
  | "parcel_number"
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

// Fix AAAA3 PART 7: a "Phone N: Type" column carries one of "Mobile" /
// "Residential" / "Landline" / "Other Phone". Map each explicitly to its stored
// value; a blank or unrecognized value is null (not "Other").
export function parsePhoneType(raw: string): string | null {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return null;
  if (v === "mobile" || v === "cell" || v === "cell phone" || v === "wireless") return "Mobile";
  if (v === "landline" || v === "land line") return "Landline";
  if (v === "residential" || v === "home" || v === "home phone") return "Residential";
  if (v === "other" || v === "other phone") return "Other";
  return null;
}

// Fix AAAA3 PART 3: DNC and Litigator are now two fully independent CSV columns.
// Each is a plain yes/no flag — "Y" (or yes/true/1) → true, "N" or blank → false.
// Nothing is ever inferred from the other.
export function parseImportFlag(raw: string): boolean {
  return ["y", "yes", "t", "true", "1", "x"].includes((raw ?? "").trim().toLowerCase());
}

// Strip everything but digits from a phone string — accepts "(240) 506-7777",
// "555-222-6666", "6668889999", "240.506.7777", "12405067777", etc. A leading
// US country code "1" on an 11-digit result is dropped. Returns "" when nothing
// numeric is left.
export function normalizePhone(raw: string): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

// GAP 1: like normalizePhone, but only returns the number when it is a valid
// 10-digit US phone. Anything else (too short, too long, junk) returns null —
// the caller skips that phone contact row and logs "Invalid phone: …".
export function normalizePhoneStrict(raw: string): string | null {
  const digits = normalizePhone(raw);
  return digits.length === 10 ? digits : null;
}

// Three-letter-prefix month index ("january"/"jan"/"JANUARY" -> 1, ...).
const MONTH_INDEX: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};
function monthFromName(name: string): number | null {
  return MONTH_INDEX[name.slice(0, 3).toLowerCase()] ?? null;
}
function expandYear(yr: string): string {
  return yr.length === 2 ? (Number(yr) >= 70 ? "19" : "20") + yr : yr;
}

// Parse a CSV date cell to an ISO "YYYY-MM-DD" string. Accepts: "2024-01-15",
// "01/15/2024", "1/2/24", "M-D-YYYY", "15-Jan-2024" / "15 Jan 2024", and
// "January 15, 2024" / "Jan 15 2024". Returns null when nothing parses (the
// caller imports the lead with sale_date = null and logs "Unparseable date: …").
export function parseImportDate(raw: string): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  // Already ISO-ish.
  const iso = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // M/D/YYYY or M-D-YYYY (also 2-digit year).
  const mdy = v.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (mdy) {
    const mo = mdy[1];
    const da = mdy[2];
    const yr = expandYear(mdy[3]);
    const n = (s: string) => Number(s);
    if (n(mo) >= 1 && n(mo) <= 12 && n(da) >= 1 && n(da) <= 31) {
      return `${yr}-${mo.padStart(2, "0")}-${da.padStart(2, "0")}`;
    }
  }
  // "15-Jan-2024" / "15 Jan 2024" / "15-January-2024".
  const dMonY = v.match(/^(\d{1,2})[\s\-/]+([A-Za-z]{3,})[\s\-/]+(\d{2,4})$/);
  if (dMonY) {
    const da = dMonY[1];
    const mo = monthFromName(dMonY[2]);
    const yr = expandYear(dMonY[3]);
    if (mo && Number(da) >= 1 && Number(da) <= 31) {
      return `${yr}-${String(mo).padStart(2, "0")}-${da.padStart(2, "0")}`;
    }
  }
  // "January 15, 2024" / "Jan 15 2024" / "January 15th 2024".
  const monDY = v.match(/^([A-Za-z]{3,})[\s.]+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{2,4})$/);
  if (monDY) {
    const mo = monthFromName(monDY[1]);
    const da = monDY[2];
    const yr = expandYear(monDY[3]);
    if (mo && Number(da) >= 1 && Number(da) <= 31) {
      return `${yr}-${String(mo).padStart(2, "0")}-${da.padStart(2, "0")}`;
    }
  }
  const parsed = new Date(v);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  }
  return null;
}

// ZIP CODE: stored as text; pad with leading zeros to 5 chars when shorter
// (a New England "8901" becomes "08901"). Longer values / ZIP+4 pass through.
export function padZip(raw: string): string {
  const v = (raw ?? "").trim();
  return /^\d{1,4}$/.test(v) ? v.padStart(5, "0") : v;
}

// COUNTY: drop a trailing " County" / " Co." / " Co" before storing, e.g.
// "Charleston County" -> "Charleston", "CHARLESTON CO" -> "CHARLESTON". Case is
// fixed up separately (Proper Case) by the caller.
export function stripCountySuffix(raw: string): string {
  return (raw ?? "").replace(/[\s,]+(county|co\.?)\s*$/i, "").trim();
}

// Fix JJJJJ PART 5: case numbers in some feeds arrive like "$123,456.00" — strip
// the dollar sign and commas, drop any trailing decimal (".00"), and keep the
// rest as plain alphanumeric text. "$123,456.00" -> "123456".
export function stripCaseNumber(raw: string): string {
  return (raw ?? "")
    .replace(/[$,]/g, "")
    .replace(/\.\d*$/, "")
    .trim();
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
    // GAP 5: leads.attorney_cost already exists (numeric, NOT NULL default
    // 2500.00) — expose it as a mappable column. When unmapped, the import
    // leaves the column to its default rather than writing NULL.
    key: "attorney_cost",
    label: "Attorney Cost",
    required: false,
    aliases: ["attorneyfee", "attorneycost", "legalfee", "attorneyfees", "legalfees"],
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
      "dateofforeclosure",
      "soldon",
      "salesdate",
    ],
  },
  {
    key: "sale_type",
    label: "Sale Type",
    required: false,
    aliases: [
      "saletype",
      "type",
      "saletypecode",
      "auctiontype",
      "category",
      "typeofforeclosure",
      "foreclosuretype",
      "deedtype",
      "taxdeed",
      "mortgage",
      "mtg",
      "tax",
    ],
  },
  {
    key: "parcel_number",
    label: "Parcel Number",
    required: false,
    aliases: ["parcelnumber", "parcelno", "apn", "taxid", "parcelid", "parcel"],
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
    label: "Source Surplus",
    required: false,
    aliases: [
      "surplus",
      "surplusamount",
      "surplusfunds",
      "sourcesurplus",
      "excess",
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
    label: "Phone 1 DNC",
    required: false,
    aliases: ["phone1dnc", "dnc1"],
  },
  {
    key: "phone_1_litigator",
    label: "Phone 1 Litigator",
    required: false,
    aliases: ["phone1litigator", "litigator1"],
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
    label: "Phone 2 DNC",
    required: false,
    aliases: ["phone2dnc", "dnc2"],
  },
  {
    key: "phone_2_litigator",
    label: "Phone 2 Litigator",
    required: false,
    aliases: ["phone2litigator", "litigator2"],
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
    label: "Phone 3 DNC",
    required: false,
    aliases: ["phone3dnc", "dnc3"],
  },
  {
    key: "phone_3_litigator",
    label: "Phone 3 Litigator",
    required: false,
    aliases: ["phone3litigator", "litigator3"],
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
    label: "Phone 4 DNC",
    required: false,
    aliases: ["phone4dnc", "dnc4"],
  },
  {
    key: "phone_4_litigator",
    label: "Phone 4 Litigator",
    required: false,
    aliases: ["phone4litigator", "litigator4"],
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
    label: "Phone 5 DNC",
    required: false,
    aliases: ["phone5dnc", "dnc5"],
  },
  {
    key: "phone_5_litigator",
    label: "Phone 5 Litigator",
    required: false,
    aliases: ["phone5litigator", "litigator5"],
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
      // Stored verbatim — never Proper-Cased. "RELATIVE n: Possible Type" maps
      // here whether it arrives as "relativeNpossibletype" or "rNpossibletype".
      key: relativeFieldKey(n, "possible_type"),
      label: `Relative ${n} Possible Type`,
      required: false,
      aliases: [
        `relative${n}possibletype`,
        `r${n}possibletype`,
        `relative${n}type`,
        `relative${n}relationship`,
        `rel${n}type`,
        `rel${n}relationship`,
        `r${n}relationship`,
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
        label: `Relative ${n} Phone ${m} DNC`,
        required: false,
        aliases: [`relative${n}phone${m}dnc`, `rel${n}phone${m}dnc`],
      },
      {
        key: relativeFieldKey(n, `phone_${m}_litigator`),
        label: `Relative ${n} Phone ${m} Litigator`,
        required: false,
        aliases: [`relative${n}phone${m}litigator`, `rel${n}phone${m}litigator`],
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
  parcel_number: string | null;
  closing_bid: number | null;
  opening_bid: number | null;
  attorney_cost: number | null; // null when the column wasn't mapped (keep DB default)
  source_surplus: number | null;
  lead_source: string | null; // per-row override from a mapped column; usually null
  owner_full_name: string | null;
  owner_age: number | null;
  owner_deceased: boolean;
  owner_living: boolean; // true when the Deceased column is an explicit "N"
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
  // Fix R: error counts are no longer tracked or shown — invalid rows are
  // blocked on the preview step before an import ever runs.
  status: string;
};

export type SavedSourceMapping = {
  mapping: Record<string, string>; // portalFieldKey -> csvHeader
  dismissedColumns: string[]; // csv headers the user dismissed for this source
};
