import type { Stage } from "@/lib/leads/types";

export type DialerContact = {
  id: string;
  name: string;
  role: "Primary Owner" | "Co Owner" | "Heir" | "Relative" | "Attorney";
  numbers: Array<{
    id: string;
    label: "Mobile" | "Home" | "Work" | "Other";
    e164: string;
    formatted: string;
    status: "active" | "wrong" | "disconnected";
  }>;
};

export type DialerNote = {
  id: string;
  author: string;
  createdAt: string;
  body: string;
};

export type DialerLead = {
  id: string;
  leadId: string;
  ownerName: string;
  propertyAddress: string;
  county: string;
  state: string;
  saleDate: string;
  saleType: "Tax Sale" | "Mortgage";
  estimatedSurplus: number;
  recoveryFeePercent: number;
  ownerStatus: "Living" | "Deceased" | "Unknown";
  stage: Stage;
  daysSinceContact: number;
  tags: string[];
  contacts: DialerContact[];
  notes: DialerNote[];
};

function payout(surplus: number, pct: number) {
  return Math.round(surplus * (pct / 100));
}

const NOTE_AUTHORS = [
  "Bree Moss",
  "Carla Linden",
  "Devon Park",
  "Marcus Reed",
];

function makeNotes(seed: number): DialerNote[] {
  const templates = [
    "Left voicemail with callback number. Mailbox said it was the right person.",
    "Spoke with daughter, she will pass message to her mother. Said best window is evenings after 6pm.",
    "Number rang twice and went to a generic voicemail. No name on the box.",
    "Reached primary, asked for time to talk to family before signing. Follow up in three business days.",
    "Got the wrong number, person on the line said no relation. Will mark number invalid after confirming alt.",
    "Sent intro letter via certified mail on May 22, 2026. Tracking confirms delivered.",
    "Long conversation about the sale process. Owner believes there is no surplus, gave their attorney's name.",
    "Heir says owner is in assisted living. Wants paperwork mailed to her address going forward.",
    "Asked us to call back next week, traveling out of state until then.",
    "Confirmed contact details against probate filing. Spelling matches court record.",
  ];
  const out: DialerNote[] = [];
  for (let i = 0; i < 7; i += 1) {
    const daysAgo = Math.floor(((seed + i * 3) % 60) + 1);
    const d = new Date(2026, 5, 15);
    d.setDate(d.getDate() - daysAgo);
    out.push({
      id: `note-${seed}-${i}`,
      author: NOTE_AUTHORS[(seed + i) % NOTE_AUTHORS.length],
      createdAt: d.toISOString(),
      body: templates[(seed * 2 + i) % templates.length],
    });
  }
  return out;
}

function mkLead(args: {
  id: string;
  leadId: string;
  ownerName: string;
  propertyAddress: string;
  county: string;
  state: string;
  saleDate: string;
  saleType: "Tax Sale" | "Mortgage";
  estimatedSurplus: number;
  recoveryFeePercent: number;
  ownerStatus: "Living" | "Deceased" | "Unknown";
  stage: Stage;
  daysSinceContact: number;
  tags: string[];
  contacts: DialerContact[];
  seed: number;
}): DialerLead {
  return {
    id: args.id,
    leadId: args.leadId,
    ownerName: args.ownerName,
    propertyAddress: args.propertyAddress,
    county: args.county,
    state: args.state,
    saleDate: args.saleDate,
    saleType: args.saleType,
    estimatedSurplus: args.estimatedSurplus,
    recoveryFeePercent: args.recoveryFeePercent,
    ownerStatus: args.ownerStatus,
    stage: args.stage,
    daysSinceContact: args.daysSinceContact,
    tags: args.tags,
    contacts: args.contacts,
    notes: makeNotes(args.seed),
  };
}

function c(
  id: string,
  name: string,
  role: DialerContact["role"],
  numbers: Array<[DialerContact["numbers"][number]["label"], string, DialerContact["numbers"][number]["status"]?]>
): DialerContact {
  return {
    id,
    name,
    role,
    numbers: numbers.map(([label, digits, status], idx) => ({
      id: `${id}-n${idx}`,
      label,
      e164: `+1${digits.replace(/\D/g, "")}`,
      formatted: `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`,
      status: status ?? "active",
    })),
  };
}

export const DIALER_LEADS: DialerLead[] = [
  mkLead({
    id: "l1",
    leadId: "LD-2284",
    ownerName: "Marcus T. Whitfield",
    propertyAddress: "412 Magnolia Crest, Decatur, GA 30030",
    county: "DeKalb County",
    state: "GA",
    saleDate: "March 4, 2026",
    saleType: "Tax Sale",
    estimatedSurplus: 184500,
    recoveryFeePercent: 30,
    ownerStatus: "Living",
    stage: "new_leads",
    daysSinceContact: 6,
    tags: ["Probate Filed", "Heir Match"],
    seed: 11,
    contacts: [
      c("l1c1", "Marcus T. Whitfield", "Primary Owner", [
        ["Mobile", "4045550182"],
        ["Home", "7705550114", "disconnected"],
      ]),
      c("l1c2", "Diane Whitfield", "Heir", [["Mobile", "4045550199"]]),
    ],
  }),
  mkLead({
    id: "l2",
    leadId: "LD-2291",
    ownerName: "Estate of Helen Brewster",
    propertyAddress: "88 Beacon Ridge Rd, Greenville, SC 29609",
    county: "Greenville County",
    state: "SC",
    saleDate: "January 14, 2026",
    saleType: "Mortgage",
    estimatedSurplus: 312800,
    recoveryFeePercent: 28,
    ownerStatus: "Deceased",
    stage: "qualifying",
    daysSinceContact: 12,
    tags: ["Heir Search"],
    seed: 22,
    contacts: [
      c("l2c1", "Robert Brewster", "Heir", [
        ["Mobile", "8645550177"],
        ["Work", "8645550140"],
      ]),
      c("l2c2", "Anna Brewster-Hill", "Heir", [["Mobile", "8645550161"]]),
      c("l2c3", "Theo Brewster", "Relative", [
        ["Mobile", "8645550133", "wrong"],
      ]),
    ],
  }),
  mkLead({
    id: "l3",
    leadId: "LD-2304",
    ownerName: "Otis & Marlene Crockett",
    propertyAddress: "1209 Sycamore Bend, Knoxville, TN 37920",
    county: "Knox County",
    state: "TN",
    saleDate: "April 22, 2026",
    saleType: "Tax Sale",
    estimatedSurplus: 76300,
    recoveryFeePercent: 30,
    ownerStatus: "Living",
    stage: "outreach",
    daysSinceContact: 3,
    tags: [],
    seed: 33,
    contacts: [
      c("l3c1", "Otis Crockett", "Primary Owner", [
        ["Home", "8655550148"],
        ["Mobile", "8655550172"],
      ]),
      c("l3c2", "Marlene Crockett", "Co Owner", [["Mobile", "8655550155"]]),
    ],
  }),
  mkLead({
    id: "l4",
    leadId: "LD-2317",
    ownerName: "Patricia A. Donnelly",
    propertyAddress: "57 Locust Hollow Ln, Allentown, PA 18103",
    county: "Lehigh County",
    state: "PA",
    saleDate: "February 18, 2026",
    saleType: "Mortgage",
    estimatedSurplus: 41200,
    recoveryFeePercent: 32,
    ownerStatus: "Living",
    stage: "new_leads",
    daysSinceContact: 18,
    tags: ["Senior"],
    seed: 44,
    contacts: [
      c("l4c1", "Patricia A. Donnelly", "Primary Owner", [
        ["Home", "6105550111"],
        ["Mobile", "6105550128", "disconnected"],
      ]),
    ],
  }),
  mkLead({
    id: "l5",
    leadId: "LD-2325",
    ownerName: "Cornelius J. Hayes",
    propertyAddress: "1818 Erie Crossing, Cleveland, OH 44114",
    county: "Cuyahoga County",
    state: "OH",
    saleDate: "May 6, 2026",
    saleType: "Tax Sale",
    estimatedSurplus: 521900,
    recoveryFeePercent: 28,
    ownerStatus: "Deceased",
    stage: "in_conversation",
    daysSinceContact: 1,
    tags: ["High Value", "Heir Match"],
    seed: 55,
    contacts: [
      c("l5c1", "Cornelius J. Hayes Jr.", "Heir", [
        ["Mobile", "2165550147"],
        ["Work", "2165550193"],
      ]),
      c("l5c2", "Yvette Hayes-Brown", "Heir", [["Mobile", "2165550175"]]),
      c("l5c3", "Karen Hayes", "Relative", [
        ["Mobile", "2165550168", "wrong"],
      ]),
    ],
  }),
  mkLead({
    id: "l6",
    leadId: "LD-2331",
    ownerName: "Roosevelt Bell",
    propertyAddress: "42 Hudson Bluff Rd, Newburgh, NY 12550",
    county: "Orange County",
    state: "NY",
    saleDate: "March 27, 2026",
    saleType: "Mortgage",
    estimatedSurplus: 138700,
    recoveryFeePercent: 30,
    ownerStatus: "Living",
    stage: "qualifying",
    daysSinceContact: 9,
    tags: [],
    seed: 66,
    contacts: [
      c("l6c1", "Roosevelt Bell", "Primary Owner", [
        ["Mobile", "8455550136"],
      ]),
      c("l6c2", "Loretta Bell", "Co Owner", [
        ["Home", "8455550129"],
        ["Mobile", "8455550174"],
      ]),
    ],
  }),
  mkLead({
    id: "l7",
    leadId: "LD-2340",
    ownerName: "Beatrice Tomlin",
    propertyAddress: "611 Peach Tree Cove, Savannah, GA 31405",
    county: "Chatham County",
    state: "GA",
    saleDate: "February 9, 2026",
    saleType: "Tax Sale",
    estimatedSurplus: 28400,
    recoveryFeePercent: 33,
    ownerStatus: "Living",
    stage: "new_leads",
    daysSinceContact: 22,
    tags: [],
    seed: 77,
    contacts: [
      c("l7c1", "Beatrice Tomlin", "Primary Owner", [
        ["Home", "9125550181"],
      ]),
    ],
  }),
  mkLead({
    id: "l8",
    leadId: "LD-2347",
    ownerName: "Dale & Frances Pickering",
    propertyAddress: "923 Ironwood Glen, Memphis, TN 38117",
    county: "Shelby County",
    state: "TN",
    saleDate: "April 1, 2026",
    saleType: "Mortgage",
    estimatedSurplus: 96800,
    recoveryFeePercent: 30,
    ownerStatus: "Living",
    stage: "outreach",
    daysSinceContact: 5,
    tags: ["Spouse Co Owner"],
    seed: 88,
    contacts: [
      c("l8c1", "Dale Pickering", "Primary Owner", [
        ["Mobile", "9015550173"],
        ["Work", "9015550162"],
      ]),
      c("l8c2", "Frances Pickering", "Co Owner", [
        ["Mobile", "9015550158"],
      ]),
    ],
  }),
  mkLead({
    id: "l9",
    leadId: "LD-2352",
    ownerName: "Estate of Wallace Pemberton",
    propertyAddress: "27 Willow Knoll Way, Lancaster, PA 17601",
    county: "Lancaster County",
    state: "PA",
    saleDate: "January 30, 2026",
    saleType: "Tax Sale",
    estimatedSurplus: 217600,
    recoveryFeePercent: 28,
    ownerStatus: "Deceased",
    stage: "in_conversation",
    daysSinceContact: 4,
    tags: ["Probate Filed"],
    seed: 99,
    contacts: [
      c("l9c1", "Edith Pemberton-Lee", "Heir", [
        ["Mobile", "7175550131"],
      ]),
      c("l9c2", "Aaron Pemberton", "Heir", [
        ["Mobile", "7175550152"],
        ["Home", "7175550107", "disconnected"],
      ]),
    ],
  }),
  mkLead({
    id: "l10",
    leadId: "LD-2360",
    ownerName: "Quinton Beasley",
    propertyAddress: "144 Cedar Pond Dr, Charleston, SC 29407",
    county: "Charleston County",
    state: "SC",
    saleDate: "May 19, 2026",
    saleType: "Mortgage",
    estimatedSurplus: 64900,
    recoveryFeePercent: 32,
    ownerStatus: "Living",
    stage: "new_leads",
    daysSinceContact: 14,
    tags: [],
    seed: 101,
    contacts: [
      c("l10c1", "Quinton Beasley", "Primary Owner", [
        ["Mobile", "8435550143"],
      ]),
      c("l10c2", "Lashonda Beasley", "Relative", [
        ["Mobile", "8435550185"],
      ]),
    ],
  }),
  mkLead({
    id: "l11",
    leadId: "LD-2368",
    ownerName: "Estate of Harriet Moss-Wilkes",
    propertyAddress: "303 Riverstone Ct, Columbus, OH 43215",
    county: "Franklin County",
    state: "OH",
    saleDate: "February 25, 2026",
    saleType: "Tax Sale",
    estimatedSurplus: 154300,
    recoveryFeePercent: 30,
    ownerStatus: "Deceased",
    stage: "qualifying",
    daysSinceContact: 8,
    tags: ["Heir Match"],
    seed: 102,
    contacts: [
      c("l11c1", "Cyrus Wilkes", "Heir", [
        ["Mobile", "6145550112"],
      ]),
      c("l11c2", "Janelle Moss-Wilkes", "Heir", [
        ["Mobile", "6145550196"],
      ]),
      c("l11c3", "Sterling Moss", "Heir", [
        ["Mobile", "6145550138", "wrong"],
      ]),
    ],
  }),
  mkLead({
    id: "l12",
    leadId: "LD-2375",
    ownerName: "Audrey & Wendell Tatum",
    propertyAddress: "78 Bluestem Way, Athens, GA 30606",
    county: "Clarke County",
    state: "GA",
    saleDate: "March 16, 2026",
    saleType: "Tax Sale",
    estimatedSurplus: 102500,
    recoveryFeePercent: 30,
    ownerStatus: "Living",
    stage: "outreach",
    daysSinceContact: 11,
    tags: [],
    seed: 103,
    contacts: [
      c("l12c1", "Wendell Tatum", "Primary Owner", [
        ["Mobile", "7065550121"],
      ]),
      c("l12c2", "Audrey Tatum", "Co Owner", [
        ["Mobile", "7065550197"],
      ]),
    ],
  }),
  mkLead({
    id: "l13",
    leadId: "LD-2382",
    ownerName: "Estate of Jerome Lansing",
    propertyAddress: "1502 Black Oak Ridge, Pittsburgh, PA 15217",
    county: "Allegheny County",
    state: "PA",
    saleDate: "April 12, 2026",
    saleType: "Mortgage",
    estimatedSurplus: 89300,
    recoveryFeePercent: 30,
    ownerStatus: "Deceased",
    stage: "new_leads",
    daysSinceContact: 25,
    tags: ["Heir Search"],
    seed: 104,
    contacts: [
      c("l13c1", "Maxine Lansing", "Heir", [
        ["Mobile", "4125550117"],
      ]),
      c("l13c2", "Theodore Lansing", "Heir", [
        ["Mobile", "4125550149"],
      ]),
    ],
  }),
  mkLead({
    id: "l14",
    leadId: "LD-2391",
    ownerName: "Lemuel Cartwright",
    propertyAddress: "215 Sunset Bay Dr, Murrells Inlet, SC 29576",
    county: "Georgetown County",
    state: "SC",
    saleDate: "May 3, 2026",
    saleType: "Tax Sale",
    estimatedSurplus: 47800,
    recoveryFeePercent: 32,
    ownerStatus: "Living",
    stage: "qualifying",
    daysSinceContact: 7,
    tags: [],
    seed: 105,
    contacts: [
      c("l14c1", "Lemuel Cartwright", "Primary Owner", [
        ["Mobile", "8435550104"],
        ["Home", "8435550195", "disconnected"],
      ]),
    ],
  }),
  mkLead({
    id: "l15",
    leadId: "LD-2398",
    ownerName: "Ophelia Rinehart",
    propertyAddress: "61 Tanglewood Ln, Toledo, OH 43614",
    county: "Lucas County",
    state: "OH",
    saleDate: "January 21, 2026",
    saleType: "Mortgage",
    estimatedSurplus: 19400,
    recoveryFeePercent: 33,
    ownerStatus: "Living",
    stage: "new_leads",
    daysSinceContact: 30,
    tags: [],
    seed: 106,
    contacts: [
      c("l15c1", "Ophelia Rinehart", "Primary Owner", [
        ["Mobile", "4195550168"],
      ]),
    ],
  }),
  mkLead({
    id: "l16",
    leadId: "LD-2405",
    ownerName: "Estate of Marvin & Etta Lockhart",
    propertyAddress: "904 Hollybrook Ave, Brooklyn, NY 11226",
    county: "Kings County",
    state: "NY",
    saleDate: "March 9, 2026",
    saleType: "Mortgage",
    estimatedSurplus: 596200,
    recoveryFeePercent: 27,
    ownerStatus: "Deceased",
    stage: "in_conversation",
    daysSinceContact: 2,
    tags: ["High Value", "Probate Filed"],
    seed: 107,
    contacts: [
      c("l16c1", "Demetria Lockhart-Pierce", "Heir", [
        ["Mobile", "7185550129"],
        ["Work", "7185550141"],
      ]),
      c("l16c2", "Reginald Lockhart", "Heir", [
        ["Mobile", "7185550183"],
      ]),
      c("l16c3", "Vernon Lockhart", "Heir", [
        ["Mobile", "7185550159"],
      ]),
    ],
  }),
  mkLead({
    id: "l17",
    leadId: "LD-2412",
    ownerName: "Tobias Vandermeer",
    propertyAddress: "33 Glen Aspen Trl, Chattanooga, TN 37411",
    county: "Hamilton County",
    state: "TN",
    saleDate: "April 28, 2026",
    saleType: "Tax Sale",
    estimatedSurplus: 73600,
    recoveryFeePercent: 30,
    ownerStatus: "Living",
    stage: "qualifying",
    daysSinceContact: 16,
    tags: [],
    seed: 108,
    contacts: [
      c("l17c1", "Tobias Vandermeer", "Primary Owner", [
        ["Mobile", "4235550115"],
      ]),
    ],
  }),
  mkLead({
    id: "l18",
    leadId: "LD-2420",
    ownerName: "Eleanor Caldwell",
    propertyAddress: "227 Highpoint Crest, Buffalo, NY 14215",
    county: "Erie County",
    state: "NY",
    saleDate: "February 4, 2026",
    saleType: "Tax Sale",
    estimatedSurplus: 31800,
    recoveryFeePercent: 32,
    ownerStatus: "Living",
    stage: "new_leads",
    daysSinceContact: 28,
    tags: ["Senior"],
    seed: 109,
    contacts: [
      c("l18c1", "Eleanor Caldwell", "Primary Owner", [
        ["Home", "7165550178"],
      ]),
      c("l18c2", "Marisol Caldwell", "Relative", [
        ["Mobile", "7165550133"],
      ]),
    ],
  }),
  mkLead({
    id: "l19",
    leadId: "LD-2428",
    ownerName: "Estate of Conrad Pillsbury",
    propertyAddress: "1041 Maplewind Dr, Erie, PA 16505",
    county: "Erie County",
    state: "PA",
    saleDate: "May 24, 2026",
    saleType: "Mortgage",
    estimatedSurplus: 5900,
    recoveryFeePercent: 35,
    ownerStatus: "Deceased",
    stage: "qualifying",
    daysSinceContact: 13,
    tags: ["Low Value"],
    seed: 110,
    contacts: [
      c("l19c1", "Phoebe Pillsbury", "Heir", [
        ["Mobile", "8145550146"],
      ]),
    ],
  }),
  mkLead({
    id: "l20",
    leadId: "LD-2435",
    ownerName: "Ruthie Cassidy",
    propertyAddress: "508 Heritage Oak Pl, Augusta, GA 30909",
    county: "Richmond County",
    state: "GA",
    saleDate: "March 22, 2026",
    saleType: "Mortgage",
    estimatedSurplus: 245600,
    recoveryFeePercent: 28,
    ownerStatus: "Living",
    stage: "outreach",
    daysSinceContact: 4,
    tags: [],
    seed: 111,
    contacts: [
      c("l20c1", "Ruthie Cassidy", "Primary Owner", [
        ["Mobile", "7065550162"],
        ["Home", "7065550150"],
      ]),
      c("l20c2", "Calvin Cassidy", "Co Owner", [
        ["Mobile", "7065550177"],
      ]),
    ],
  }),
  mkLead({
    id: "l21",
    leadId: "LD-2441",
    ownerName: "Dexter & Mavis Holland",
    propertyAddress: "76 Falcon Ridge Rd, Spartanburg, SC 29307",
    county: "Spartanburg County",
    state: "SC",
    saleDate: "April 16, 2026",
    saleType: "Tax Sale",
    estimatedSurplus: 121400,
    recoveryFeePercent: 30,
    ownerStatus: "Living",
    stage: "qualifying",
    daysSinceContact: 6,
    tags: [],
    seed: 112,
    contacts: [
      c("l21c1", "Dexter Holland", "Primary Owner", [
        ["Mobile", "8645550130"],
      ]),
      c("l21c2", "Mavis Holland", "Co Owner", [
        ["Mobile", "8645550185"],
      ]),
    ],
  }),
  mkLead({
    id: "l22",
    leadId: "LD-2449",
    ownerName: "Estate of Ferdinand Brock",
    propertyAddress: "1287 Stonebridge Way, Akron, OH 44313",
    county: "Summit County",
    state: "OH",
    saleDate: "January 7, 2026",
    saleType: "Mortgage",
    estimatedSurplus: 68200,
    recoveryFeePercent: 30,
    ownerStatus: "Deceased",
    stage: "new_leads",
    daysSinceContact: 35,
    tags: ["Heir Search"],
    seed: 113,
    contacts: [
      c("l22c1", "Gloria Brock-Sims", "Heir", [
        ["Mobile", "3305550139"],
      ]),
    ],
  }),
  mkLead({
    id: "l23",
    leadId: "LD-2456",
    ownerName: "Sylvester McAllister",
    propertyAddress: "190 Crestwood Hollow, Rochester, NY 14624",
    county: "Monroe County",
    state: "NY",
    saleDate: "March 30, 2026",
    saleType: "Tax Sale",
    estimatedSurplus: 53700,
    recoveryFeePercent: 32,
    ownerStatus: "Living",
    stage: "outreach",
    daysSinceContact: 10,
    tags: [],
    seed: 114,
    contacts: [
      c("l23c1", "Sylvester McAllister", "Primary Owner", [
        ["Mobile", "5855550172"],
        ["Work", "5855550114"],
      ]),
    ],
  }),
  mkLead({
    id: "l24",
    leadId: "LD-2463",
    ownerName: "Estate of Yolanda Greer",
    propertyAddress: "844 Saddle Creek Ln, Greer, SC 29651",
    county: "Greenville County",
    state: "SC",
    saleDate: "February 14, 2026",
    saleType: "Tax Sale",
    estimatedSurplus: 38400,
    recoveryFeePercent: 33,
    ownerStatus: "Deceased",
    stage: "new_leads",
    daysSinceContact: 20,
    tags: [],
    seed: 115,
    contacts: [
      c("l24c1", "Tasha Greer", "Heir", [
        ["Mobile", "8645550158"],
      ]),
      c("l24c2", "Daryl Greer", "Heir", [
        ["Mobile", "8645550172"],
      ]),
    ],
  }),
];

export const CALLER_IDS = [
  { id: "cid-ga", state: "GA", formatted: "(404) 555-0101" },
  { id: "cid-sc", state: "SC", formatted: "(864) 555-0102" },
  { id: "cid-tn", state: "TN", formatted: "(615) 555-0103" },
  { id: "cid-pa", state: "PA", formatted: "(215) 555-0104" },
  { id: "cid-oh", state: "OH", formatted: "(216) 555-0105" },
  { id: "cid-ny", state: "NY", formatted: "(212) 555-0106" },
];

export function payoutAt(surplus: number, feePct: number) {
  return payout(surplus, feePct);
}

export function dialableNumberCount(lead: DialerLead): number {
  let n = 0;
  for (const contact of lead.contacts) {
    for (const num of contact.numbers) {
      if (num.status === "active") n += 1;
    }
  }
  return n;
}

export function firstDialable(lead: DialerLead) {
  for (const contact of lead.contacts) {
    for (const num of contact.numbers) {
      if (num.status === "active") return { contact, num };
    }
  }
  return null;
}

export function nextDialable(
  lead: DialerLead,
  currentContactId: string,
  currentNumId: string
) {
  let passed = false;
  for (const contact of lead.contacts) {
    for (const num of contact.numbers) {
      if (passed && num.status === "active") return { contact, num };
      if (contact.id === currentContactId && num.id === currentNumId) {
        passed = true;
      }
    }
  }
  return null;
}
