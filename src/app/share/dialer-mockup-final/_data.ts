export type CaseType = "estate" | "foreclosure" | "other";

export type Phone = {
  number: string;
  type: "Mobile" | "Work" | "Home" | "Office";
};

export type Contact = {
  name: string;
  relationship: string;
  phones: Phone[];
  callable: boolean;
  active?: boolean;
};

export type Lead = {
  id: string;
  title: string;
  relationship: string;
  phone: string;
  address: string;
  caseType: CaseType;
  contactIndex: number;
  contactTotal: number;
  recoveryFee: string;
  surplus: string;
  netToFirm: string;
  talkTimer: string;
  estate: {
    caseNumber: string;
    county: string;
    saleType: string;
    saleDate: string;
    timeSinceSale: string;
    closingBid: string;
    ownerStatus: string;
    attorney: string;
  };
  leadSummary: string[];
  activity: { when: string; what: string }[];
  contacts: Contact[];
};

export const HAYES: Lead = {
  id: "L-2026-0218",
  title: "Cornelius J. Hayes Jr.",
  relationship: "Son of Cornelius Sr.",
  phone: "(216) 555-1947",
  address: "4218 Heights Blvd, Cleveland OH 44106",
  caseType: "estate",
  contactIndex: 1,
  contactTotal: 4,
  recoveryFee: "30%",
  surplus: "$521,900",
  netToFirm: "$146,132",
  talkTimer: "04:32",
  estate: {
    caseNumber: "L-2026-0218",
    county: "Cuyahoga County, OH",
    saleType: "Tax Sale",
    saleDate: "May 6, 2026",
    timeSinceSale: "1 Month",
    closingBid: "$312,000",
    ownerStatus: "Deceased, March 2025",
    attorney: "Chen & Park",
  },
  leadSummary: [
    "Father passed March 2025; tax sale 1 month ago in Cuyahoga County cleared $146,132 in surplus the firm has not yet claimed.",
    "Cornelius is the eldest son; sister Loretta handles paperwork. He is the path to her, not the decision maker alone.",
    "Last call (June 14) he was receptive but asked for documentation by mail before signing. Open to 30%; wanted Mossy Land letterhead.",
  ],
  activity: [
    { when: "June 15, 2026", what: "Letter Delivered" },
    { when: "June 14, 2026", what: "Call (12 min), Receptive" },
    { when: "June 12, 2026", what: "Mail Sent" },
    { when: "June 08, 2026", what: "Call (4 min), Screened" },
    { when: "June 05, 2026", what: "Lead Imported" },
  ],
  contacts: [
    {
      name: "Cornelius J. Hayes Jr.",
      relationship: "Son of Cornelius Sr.",
      phones: [
        { number: "(216) 555-1947", type: "Mobile" },
        { number: "(216) 555-2048", type: "Work" },
      ],
      callable: true,
      active: true,
    },
    {
      name: "Loretta Hayes Bell",
      relationship: "Sister of Cornelius Jr.",
      phones: [{ number: "(216) 555-2204", type: "Mobile" }],
      callable: true,
    },
    {
      name: "Marcus Bell",
      relationship: "Brother in Law",
      phones: [{ number: "(440) 555-8819", type: "Mobile" }],
      callable: true,
    },
    {
      name: "Diane Chen",
      relationship: "Probate Attorney",
      phones: [{ number: "(216) 555-0044", type: "Office" }],
      callable: false,
    },
  ],
};

export const PEMBERTON: Lead = {
  id: "L-2026-0331",
  title: "Wallace Pemberton",
  relationship: "Property Owner",
  phone: "(717) 555-0334",
  address: "829 Maple Ave, Lancaster PA 17602",
  caseType: "foreclosure",
  contactIndex: 1,
  contactTotal: 2,
  recoveryFee: "30%",
  surplus: "$725,333",
  netToFirm: "$217,600",
  talkTimer: "02:14",
  estate: {
    caseNumber: "L-2026-0331",
    county: "Lancaster County, PA",
    saleType: "Sheriff Sale",
    saleDate: "September 12, 2026",
    timeSinceSale: "8 Days",
    closingBid: "$445,000",
    ownerStatus: "Living (Divorced)",
    attorney: "None",
  },
  leadSummary: [
    "Foreclosure sheriff sale 8 days ago in Lancaster County cleared $217,600 in surplus owed to the property owner.",
    "Wallace is the sole owner; recently divorced. Co-owner Linda Pemberton is on the deed but has not lived at the property since 2024.",
    "No prior contact attempted. Standard intro outreach.",
  ],
  activity: [
    { when: "September 20, 2026", what: "Lead Imported" },
  ],
  contacts: [
    {
      name: "Wallace Pemberton",
      relationship: "Property Owner",
      phones: [{ number: "(717) 555-0334", type: "Mobile" }],
      callable: true,
      active: true,
    },
    {
      name: "Linda Pemberton",
      relationship: "Co Owner, Ex Spouse",
      phones: [{ number: "(717) 555-0712", type: "Mobile" }],
      callable: true,
    },
  ],
};

export const CASE_TYPE_PREFIX: Record<CaseType, string> = {
  estate: "Same Estate",
  foreclosure: "Same Property",
  other: "Same Case",
};

export type QueueItem = {
  id: string;
  name: string;
  relationship: string;
  surplus: string;
  city: string;
  state?: "done" | "active" | "future";
};

export const QUEUE_DEFAULT: QueueItem[] = [
  { id: "L-2026-0218", name: "Cornelius J. Hayes Jr.", relationship: "Son of Cornelius Sr.", surplus: "$146K", city: "Cleveland OH", state: "active" },
  { id: "L-2026-0219", name: "Otis Crockett", relationship: "Cousin of Heir", surplus: "$89K", city: "Columbus OH" },
  { id: "L-2026-0220", name: "Reginald T. Whitfield", relationship: "Relationship Unknown", surplus: "$51K", city: "Cincinnati OH" },
  { id: "L-2026-0221", name: "Yolanda Beauchamp", relationship: "Daughter of Heir", surplus: "$112K", city: "Cleveland OH" },
  { id: "L-2026-0222", name: "Trevor McKinley", relationship: "Spouse of Owner", surplus: "$34K", city: "Akron OH" },
  { id: "L-2026-0223", name: "Sandra Vega Romero", relationship: "Niece of Owner", surplus: "$77K", city: "Toledo OH" },
  { id: "L-2026-0224", name: "Adelaide Whitlock", relationship: "Daughter of Owner", surplus: "$58K", city: "Youngstown OH" },
];

export const QUEUE_PROGRESSED: QueueItem[] = [
  { id: "L-2026-0215", name: "Estelle Marchetti", relationship: "Daughter of Owner", surplus: "$41K", city: "Lakewood OH", state: "done" },
  { id: "L-2026-0216", name: "Harold Tinsley", relationship: "Property Owner", surplus: "$63K", city: "Parma OH", state: "done" },
  { id: "L-2026-0218", name: "Cornelius J. Hayes Jr.", relationship: "Son of Cornelius Sr.", surplus: "$146K", city: "Cleveland OH", state: "active" },
  { id: "L-2026-0219", name: "Otis Crockett", relationship: "Cousin of Heir", surplus: "$89K", city: "Columbus OH" },
  { id: "L-2026-0220", name: "Reginald T. Whitfield", relationship: "Relationship Unknown", surplus: "$51K", city: "Cincinnati OH" },
  { id: "L-2026-0221", name: "Yolanda Beauchamp", relationship: "Daughter of Heir", surplus: "$112K", city: "Cleveland OH" },
  { id: "L-2026-0222", name: "Trevor McKinley", relationship: "Spouse of Owner", surplus: "$34K", city: "Akron OH" },
];

export const QUEUE_PEMBERTON: QueueItem[] = [
  { id: "L-2026-0331", name: "Wallace Pemberton", relationship: "Property Owner", surplus: "$217K", city: "Lancaster PA", state: "active" },
  { id: "L-2026-0332", name: "Maeve Lindgren", relationship: "Property Owner", surplus: "$84K", city: "York PA" },
  { id: "L-2026-0333", name: "Calvin Drews", relationship: "Property Owner", surplus: "$129K", city: "Harrisburg PA" },
  { id: "L-2026-0334", name: "Imelda Brackett", relationship: "Heir of Owner", surplus: "$56K", city: "Reading PA" },
  { id: "L-2026-0335", name: "Stefan Voorhis", relationship: "Property Owner", surplus: "$92K", city: "Allentown PA" },
  { id: "L-2026-0336", name: "Renata Mercer", relationship: "Property Owner", surplus: "$43K", city: "Bethlehem PA" },
];

export type StatItem = {
  label: string;
  value: string;
  direction: "up" | "down" | "flat";
  tooltip: string;
  pulse?: boolean;
};

export const SESSION_STATS: StatItem[] = [
  { label: "Dials", value: "47", direction: "up", tooltip: "Session 47 · 30 day avg 39" },
  { label: "Connects", value: "9", direction: "up", pulse: true, tooltip: "Session 9 · 30 day avg 6" },
  { label: "Rate", value: "19%", direction: "up", tooltip: "Session 19% · 30 day avg 14%" },
  { label: "Session Talk", value: "38m", direction: "up", tooltip: "Session 38m · 30 day avg 34m" },
];

export const NEXT_LEAD_HAYES = {
  name: "Otis Crockett",
  relationship: "Cousin of Heir",
  countdown: "0:03",
};

export const NEXT_LEAD_PEMBERTON = {
  name: "Maeve Lindgren",
  relationship: "Property Owner",
  countdown: "0:03",
};

export const NOTE_TIMESTAMP = "Saves at 3:47 PM";

export const QUEUE_TOTAL = 100;
export const QUEUE_POSITION = 3;

export const CANVAS_W = 1280;
export const CANVAS_H = 820;
