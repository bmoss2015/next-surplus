export type SampleContact = {
  id: string;
  name: string;
  role: "Primary Owner" | "Co Owner" | "Heir" | "Relative" | "Attorney";
  initials: string;
  numbers: Array<{
    id: string;
    label: "Mobile" | "Home" | "Work" | "Other";
    formatted: string;
    state: "active" | "wrong" | "disconnected" | "no_answer";
    lastAttempt?: string;
  }>;
};

export type SampleNote = {
  id: string;
  author: string;
  authorInitials: string;
  createdAt: string;
  body: string;
};

export type SampleActivity = {
  id: string;
  kind: "call" | "voicemail" | "mail" | "note" | "stage" | "email";
  at: string;
  label: string;
  detail?: string;
};

export type SampleLead = {
  id: string;
  leadId: string;
  ownerName: string;
  propertyAddress: string;
  city: string;
  state: string;
  county: string;
  saleDate: string;
  saleProcess: "Tax Sale" | "Mortgage";
  estimatedSurplus: number;
  recoveryFeePercent: number;
  estimatedNet: number;
  ownerStatus: "Living" | "Deceased" | "Unknown";
  stageLabel: string;
  daysSinceContact: number;
  tags: string[];
  contacts: SampleContact[];
  notes: SampleNote[];
  activity: SampleActivity[];
  bestTimeMatrix: number[][];
};

const TIMES = ["6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const HOUR_LABELS = TIMES;
export const DAY_LABELS = DAYS;

function bestTimeMatrixFor(): number[][] {
  return [
    [0, 0, 0, 1, 1, 0],
    [0, 1, 2, 3, 2, 1],
    [0, 2, 3, 4, 4, 2],
    [0, 2, 4, 5, 4, 2],
    [0, 3, 4, 5, 5, 3],
    [0, 2, 3, 4, 3, 1],
    [0, 0, 1, 2, 1, 0],
  ];
}

export const ACTIVE_LEAD: SampleLead = {
  id: "l5",
  leadId: "LD-2325",
  ownerName: "Cornelius J. Hayes",
  propertyAddress: "1818 Erie Crossing",
  city: "Cleveland",
  state: "OH",
  county: "Cuyahoga County",
  saleDate: "May 6, 2026",
  saleProcess: "Tax Sale",
  estimatedSurplus: 521900,
  recoveryFeePercent: 28,
  estimatedNet: 146132,
  ownerStatus: "Deceased",
  stageLabel: "In Conversation",
  daysSinceContact: 1,
  tags: ["High Value", "Heir Match", "Probate Filed"],
  contacts: [
    {
      id: "c1",
      name: "Cornelius J. Hayes Jr.",
      role: "Heir",
      initials: "CH",
      numbers: [
        { id: "n1", label: "Mobile", formatted: "(216) 555-0147", state: "active" },
        { id: "n2", label: "Work", formatted: "(216) 555-0193", state: "active", lastAttempt: "May 28, 2026" },
      ],
    },
    {
      id: "c2",
      name: "Yvette Hayes-Brown",
      role: "Heir",
      initials: "YH",
      numbers: [
        { id: "n3", label: "Mobile", formatted: "(216) 555-0175", state: "active", lastAttempt: "June 8, 2026" },
      ],
    },
    {
      id: "c3",
      name: "Karen Hayes",
      role: "Relative",
      initials: "KH",
      numbers: [
        { id: "n4", label: "Mobile", formatted: "(216) 555-0168", state: "wrong", lastAttempt: "May 22, 2026" },
      ],
    },
    {
      id: "c4",
      name: "Estate of Cornelius J. Hayes Sr.",
      role: "Primary Owner",
      initials: "EH",
      numbers: [
        { id: "n5", label: "Home", formatted: "(216) 555-0102", state: "disconnected", lastAttempt: "May 14, 2026" },
      ],
    },
  ],
  notes: [
    {
      id: "nt1",
      author: "Bree Moss",
      authorInitials: "BM",
      createdAt: "June 14, 2026",
      body: "Spoke with Cornelius Jr. He confirmed his father passed in late February and that probate was filed in Cuyahoga in March. He is willing to talk after he speaks with his sister Yvette. Wants a follow up Tuesday morning.",
    },
    {
      id: "nt2",
      author: "Carla Linden",
      authorInitials: "CL",
      createdAt: "June 8, 2026",
      body: "Yvette picked up but had to step away. She asked us to call back during her lunch window, around 12:30 to 1:30 PM ET.",
    },
    {
      id: "nt3",
      author: "Bree Moss",
      authorInitials: "BM",
      createdAt: "May 28, 2026",
      body: "Sent intro letter via certified mail to the address on the probate filing. Tracking confirms delivered May 30.",
    },
    {
      id: "nt4",
      author: "Devon Park",
      authorInitials: "DP",
      createdAt: "May 22, 2026",
      body: "Karen Hayes answered. She said she is a cousin and has not been in contact with the family in years. Marked her number as wrong contact.",
    },
    {
      id: "nt5",
      author: "Bree Moss",
      authorInitials: "BM",
      createdAt: "May 14, 2026",
      body: "Old home phone on the estate is disconnected. Will pivot to the children listed on the probate filing.",
    },
  ],
  activity: [
    { id: "a1", kind: "call", at: "June 14, 2026", label: "Outbound call to Cornelius Jr.", detail: "Connected, 7 min 12 sec, scheduled callback" },
    { id: "a2", kind: "stage", at: "June 14, 2026", label: "Stage moved to In Conversation", detail: "From Qualifying" },
    { id: "a3", kind: "call", at: "June 8, 2026", label: "Outbound call to Yvette", detail: "Connected, 2 min 06 sec, callback requested" },
    { id: "a4", kind: "mail", at: "May 28, 2026", label: "Certified letter delivered", detail: "USPS tracking 9214 8901 ... confirmed" },
    { id: "a5", kind: "voicemail", at: "May 26, 2026", label: "Voicemail left for Cornelius Jr." },
    { id: "a6", kind: "call", at: "May 22, 2026", label: "Outbound call to Karen Hayes", detail: "Marked wrong number" },
    { id: "a7", kind: "call", at: "May 14, 2026", label: "Outbound call to estate line", detail: "Number out of service" },
    { id: "a8", kind: "note", at: "May 12, 2026", label: "Probate filing matched", detail: "Cuyahoga County case 2026-PR-0488" },
  ],
  bestTimeMatrix: bestTimeMatrixFor(),
};

export type SampleQueueLead = {
  id: string;
  position: number;
  ownerName: string;
  state: string;
  city: string;
  stageLabel: string;
  surplus: number;
  contactCount: number;
  estReady: string;
  status: "queued" | "active" | "done";
};

export const QUEUE: SampleQueueLead[] = [
  { id: "q1", position: 1, ownerName: "Marcus T. Whitfield",         state: "GA", city: "Decatur",       stageLabel: "New Leads",      surplus: 184500, contactCount: 2, estReady: "Done",        status: "done" },
  { id: "q2", position: 2, ownerName: "Estate of Helen Brewster",     state: "SC", city: "Greenville",    stageLabel: "Qualifying",     surplus: 312800, contactCount: 3, estReady: "Done",        status: "done" },
  { id: "q3", position: 3, ownerName: "Cornelius J. Hayes",           state: "OH", city: "Cleveland",     stageLabel: "In Conversation",surplus: 521900, contactCount: 4, estReady: "Now",         status: "active" },
  { id: "q4", position: 4, ownerName: "Otis & Marlene Crockett",      state: "TN", city: "Knoxville",     stageLabel: "Outreach",       surplus:  76300, contactCount: 2, estReady: "In 4 min",    status: "queued" },
  { id: "q5", position: 5, ownerName: "Roosevelt Bell",               state: "NY", city: "Newburgh",      stageLabel: "Qualifying",     surplus: 138700, contactCount: 2, estReady: "In 7 min",    status: "queued" },
  { id: "q6", position: 6, ownerName: "Patricia A. Donnelly",         state: "PA", city: "Allentown",     stageLabel: "New Leads",      surplus:  41200, contactCount: 1, estReady: "In 10 min",   status: "queued" },
  { id: "q7", position: 7, ownerName: "Estate of Wallace Pemberton",  state: "PA", city: "Lancaster",     stageLabel: "In Conversation",surplus: 217600, contactCount: 2, estReady: "In 13 min",   status: "queued" },
  { id: "q8", position: 8, ownerName: "Dale & Frances Pickering",     state: "TN", city: "Memphis",       stageLabel: "Outreach",       surplus:  96800, contactCount: 2, estReady: "In 17 min",   status: "queued" },
  { id: "q9", position: 9, ownerName: "Estate of Marvin Lockhart",    state: "NY", city: "Brooklyn",      stageLabel: "In Conversation",surplus: 596200, contactCount: 3, estReady: "In 20 min",   status: "queued" },
  { id: "q10", position: 10, ownerName: "Ruthie Cassidy",             state: "GA", city: "Augusta",       stageLabel: "Outreach",       surplus: 245600, contactCount: 2, estReady: "In 24 min",   status: "queued" },
];

export function fmtMoney(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
