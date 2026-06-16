export const CURRENT_LEAD = {
  name: "Cornelius J. Hayes Jr.",
  phone: "(832) 555-1947",
  address: "4218 Heights Blvd, Houston TX 77008",
  surplus: "$146,500",
  surplusShort: "$146K",
  leadId: "L-2026-0218",
  talkTimer: "04:32",
  state: "Connected",
  initials: "CH",
};

export const ESTATE = {
  causeNumber: "2026-PR-04188",
  closingBid: "$312,000",
  estimatedSurplus: "$146,500",
  surplusFloor: "$25,000",
  recoveryFee: "30%",
  netToOwner: "$98,950",
  probateFiled: "April 03, 2026",
  attorney: "Chen & Park",
  heirsOfRecord: 3,
};

export const LAST_CONVERSATION = {
  date: "June 14, 2026",
  duration: "12 min",
  summary:
    "Cornelius asked for documentation by mail before signing. Mentioned his sister Loretta handles paperwork; will loop her in next call. Open to 30% recovery fee but wants Mossy Land letterhead. Mood: receptive, slightly skeptical. Best callback window: weekday mornings.",
  mood: "Receptive",
  nextStep: "Send documentation packet, loop in sister Loretta",
};

export const ACTIVITY = [
  { when: "June 15, 2026", what: "Letter Delivered" },
  { when: "June 14, 2026", what: "Call (12 min), Receptive" },
  { when: "June 12, 2026", what: "Mail Sent" },
  { when: "June 08, 2026", what: "Call (4 min), Screened" },
  { when: "June 05, 2026", what: "Lead Imported" },
];

export const CONTACTS = [
  { name: "Cornelius J. Hayes Jr.", role: "Primary", phone: "(832) 555-1947" },
  { name: "Loretta Hayes-Bell", role: "Sister", phone: "(832) 555-2204" },
  { name: "Marcus Bell", role: "Brother in Law", phone: "(713) 555-8819" },
  { name: "Diane Chen", role: "Attorney", phone: "(713) 555-0044" },
];

export type QueueItem = {
  id: string;
  name: string;
  surplus: string;
  city: string;
  state?: "active" | "done";
};

export const QUEUE: QueueItem[] = [
  { id: "L-2026-0218", name: "Cornelius J. Hayes Jr.", surplus: "$146K", city: "Houston TX", state: "active" },
  { id: "L-2026-0219", name: "Mariella Acosta-Diaz", surplus: "$89K", city: "Spring TX" },
  { id: "L-2026-0220", name: "Reginald T. Whitfield", surplus: "$51K", city: "Pasadena TX" },
  { id: "L-2026-0221", name: "Yolanda Beauchamp", surplus: "$112K", city: "Sugar Land TX" },
  { id: "L-2026-0222", name: "Trevor McKinley", surplus: "$34K", city: "Houston TX" },
  { id: "L-2026-0223", name: "Sandra Vega-Romero", surplus: "$77K", city: "Katy TX" },
  { id: "L-2026-0224", name: "Adelaide Whitlock", surplus: "$58K", city: "Pearland TX" },
  { id: "L-2026-0225", name: "Boniface Okonjo", surplus: "$94K", city: "Missouri City TX" },
];

export const COMPLETED_TODAY = [
  { id: "L-2026-0214", name: "Estelle Marchetti", surplus: "$41K", outcome: "Voicemail" },
  { id: "L-2026-0215", name: "Harold Tinsley", surplus: "$63K", outcome: "No Answer" },
  { id: "L-2026-0216", name: "Pilar Ortega-Reyes", surplus: "$28K", outcome: "Connected" },
  { id: "L-2026-0217", name: "Walden Ambrose", surplus: "$117K", outcome: "Connected" },
];

export const SESSION_STATS = {
  dials: 47,
  connects: 9,
  rate: "19%",
  talk: "38m",
};

export const CANVAS_W = 1280;
export const CANVAS_H = 760;
