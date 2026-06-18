export const CURRENT_LEAD = {
  name: "Cornelius J. Hayes Jr.",
  relationship: "Son of Deceased Owner",
  phone: "(216) 555-1947",
  address: "4218 Heights Blvd, Cleveland OH 44106",
  surplus: "$146,132",
  surplusLabel: "Net to Firm",
  leadId: "L-2026-0218",
  talkTimer: "04:32",
  state: "Connected",
  initials: "CH",
  contactIndex: 1,
  contactTotal: 4,
  estate: "Hayes Estate",
};

export const NEXT_LEAD = {
  name: "Otis Crockett",
  relationship: "Cousin of Heir",
  estate: "Crockett Estate",
  countdown: "0:03",
  cooldownDefaultSeconds: 3,
};

export const ESTATE = {
  caseNumber: "2026-PR-04188",
  county: "Cuyahoga County, OH",
  taxSaleDate: "May 6, 2026",
  monthsSinceSale: "1 Month",
  closingBid: "$312,000",
  netToFirm: "$146,132",
  recoveryFee: "30%",
  ownerStatus: "Deceased, March 2025",
  attorney: "Chen & Park",
  heirsOfRecord: 3,
};

export const AI_SUMMARY = {
  source: "Gemini",
  generated: "Just Now",
  bullets: [
    "Father passed March 2025; tax sale 1 month ago in Cuyahoga County cleared $146,132 in surplus the firm has not yet claimed.",
    "Cornelius is the eldest son; sister Loretta handles paperwork. He is the path to her, not the decision maker alone.",
    "Last call (June 14) he was receptive but asked for documentation by mail before signing. Open to 30%; wanted Mossy Land letterhead.",
    "Cold prior to June 8; firm only has the probate filing on record. Likely needs heir verification and a sibling alignment before signing.",
  ],
};

export const ACTIVITY = [
  { when: "June 15, 2026", what: "Letter Delivered" },
  { when: "June 14, 2026", what: "Call (12 min), Receptive" },
  { when: "June 12, 2026", what: "Mail Sent" },
  { when: "June 08, 2026", what: "Call (4 min), Screened" },
  { when: "June 05, 2026", what: "Lead Imported" },
];

export const CONTACTS = [
  {
    name: "Cornelius J. Hayes Jr.",
    relationship: "Son of Deceased Owner",
    phone: "(216) 555-1947",
    active: true,
  },
  {
    name: "Loretta Hayes Bell",
    relationship: "Sister of Cornelius",
    phone: "(216) 555-2204",
  },
  {
    name: "Marcus Bell",
    relationship: "Brother in Law",
    phone: "(440) 555-8819",
  },
  {
    name: "Diane Chen",
    relationship: "Probate Attorney",
    phone: "(216) 555-0044",
  },
];

export type QueueItem = {
  id: string;
  name: string;
  relationship: string;
  estate: string;
  surplus: string;
  county: string;
  state?: "active" | "done";
};

export const QUEUE: QueueItem[] = [
  {
    id: "L-2026-0218",
    name: "Cornelius J. Hayes Jr.",
    relationship: "Son of Deceased Owner",
    estate: "Hayes Estate",
    surplus: "$146K",
    county: "Cuyahoga OH",
    state: "active",
  },
  {
    id: "L-2026-0219",
    name: "Otis Crockett",
    relationship: "Cousin of Heir",
    estate: "Crockett Estate",
    surplus: "$89K",
    county: "Franklin OH",
  },
  {
    id: "L-2026-0220",
    name: "Reginald T. Whitfield",
    relationship: "Relationship Unknown",
    estate: "Whitfield Estate",
    surplus: "$51K",
    county: "Hamilton OH",
  },
  {
    id: "L-2026-0221",
    name: "Yolanda Beauchamp",
    relationship: "Daughter of Heir",
    estate: "Beauchamp Estate",
    surplus: "$112K",
    county: "Cuyahoga OH",
  },
  {
    id: "L-2026-0222",
    name: "Trevor McKinley",
    relationship: "Spouse of Owner",
    estate: "McKinley Estate",
    surplus: "$34K",
    county: "Summit OH",
  },
  {
    id: "L-2026-0223",
    name: "Sandra Vega Romero",
    relationship: "Niece of Owner",
    estate: "Vega Estate",
    surplus: "$77K",
    county: "Lucas OH",
  },
  {
    id: "L-2026-0224",
    name: "Adelaide Whitlock",
    relationship: "Daughter of Owner",
    estate: "Whitlock Estate",
    surplus: "$58K",
    county: "Mahoning OH",
  },
];

export const SESSION_STATS = [
  { label: "Dials", value: "47", target: "Target 60", direction: "up" as const },
  { label: "Connects", value: "9", target: "Above Session Avg", direction: "up" as const, pulse: true },
  { label: "Rate", value: "19%", target: "Above 30 Day Avg", direction: "up" as const },
  { label: "Talk", value: "38m", target: "Paced", direction: "flat" as const },
];

export const QUEUE_TOTAL = 100;
export const QUEUE_POSITION = 3;

export const CANVAS_W = 1280;
export const CANVAS_H = 800;
