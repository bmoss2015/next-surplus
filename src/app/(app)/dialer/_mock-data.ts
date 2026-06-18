export type DialerContactStatus = "pending" | "active" | "done" | "skipped";
export type CallOutcome =
  | "Called"
  | "Voicemail"
  | "No Answer"
  | "Wrong Number"
  | "Disconnected";

export type DialerContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  address: string;
  status: DialerContactStatus;
  outcome?: CallOutcome;
};

export type DialerActivity = {
  id: string;
  type: "Call" | "Email" | "Letter" | "Note" | "Stage";
  title: string;
  detail: string;
  author: string;
  at: string;
};

export type DialerLead = {
  id: string;
  caseNumber: string;
  saleType: "Tax Sale" | "Mortgage Foreclosure";
  ownerType: "Deceased" | "Living";
  primaryName: string;
  primaryRelationship: string;
  county: string;
  state: string;
  propertyAddress: string;
  surplus: number;
  recoveryFeePct: number;
  attorneyCost: number;
  caseDetails: { label: string; value: string }[];
  summary: string[];
  contacts: DialerContact[];
  activities: DialerActivity[];
  completed: boolean;
};

export const TEST_LEADS: DialerLead[] = [
  {
    id: "L-4192",
    caseNumber: "2024-CV-04192",
    saleType: "Tax Sale",
    ownerType: "Deceased",
    primaryName: "Margaret Hayes",
    primaryRelationship: "Daughter of Deceased Owner",
    county: "Travis County",
    state: "TX",
    propertyAddress: "4218 Brookhaven Drive, Austin, TX 78745",
    surplus: 521900,
    recoveryFeePct: 30,
    attorneyCost: 10438,
    caseDetails: [
      { label: "Case Number", value: "2024-CV-04192" },
      { label: "Sale Type", value: "Tax Sale" },
      { label: "Sale Date", value: "October 14, 2025" },
      { label: "County", value: "Travis County, TX" },
      { label: "Owner Status", value: "Deceased (2023)" },
      { label: "Heirs Located", value: "4 of 4" },
      { label: "Stage", value: "Contact Made" },
    ],
    summary: [
      "Deceased owner left 4 adult children. Margaret is the eldest and acted as informal executor.",
      "No probate filed; family open to working with a single recovery firm if fee is reasonable.",
      "Sister Linda mentioned a competing offer at 35 percent. Lead with our 30 percent and faster timeline.",
    ],
    contacts: [
      {
        id: "C-1",
        name: "Margaret Hayes",
        relationship: "Daughter of Deceased Owner",
        phone: "(512) 555-2841",
        address: "4218 Brookhaven Drive, Austin, TX 78745",
        status: "active",
      },
      {
        id: "C-2",
        name: "Linda Hayes Carter",
        relationship: "Daughter of Deceased Owner",
        phone: "(512) 555-7193",
        address: "812 Westridge Lane, Round Rock, TX 78664",
        status: "pending",
      },
      {
        id: "C-3",
        name: "Robert Hayes Jr.",
        relationship: "Son of Deceased Owner",
        phone: "(737) 555-0218",
        address: "2904 Lakeline Boulevard, Cedar Park, TX 78613",
        status: "pending",
      },
      {
        id: "C-4",
        name: "James Hayes",
        relationship: "Son of Deceased Owner",
        phone: "(254) 555-6620",
        address: "118 Pecan Grove Road, Waco, TX 76712",
        status: "pending",
      },
    ],
    activities: [
      {
        id: "A-1",
        type: "Letter",
        title: "Initial Outreach Letter Sent",
        detail: "Sent via Lob to 4218 Brookhaven Dr. Tracking confirms delivery.",
        author: "System",
        at: "May 24, 2026 at 9:14 AM",
      },
      {
        id: "A-2",
        type: "Email",
        title: "Heir Locator Report Received",
        detail: "4 of 4 heirs identified. Contact info validated for 3 of 4.",
        author: "System",
        at: "May 26, 2026 at 11:02 AM",
      },
      {
        id: "A-3",
        type: "Call",
        title: "First Call With Margaret",
        detail: "Brief intro, sent her our 1 page summary. She asked to call back today.",
        author: "Rick Donovan",
        at: "June 14, 2026 at 2:30 PM",
      },
      {
        id: "A-4",
        type: "Note",
        title: "Sister Mentioned Competing Offer",
        detail: "Linda told Margaret a different firm pitched 35 percent. Worth a counter at 27 to 30.",
        author: "Rick Donovan",
        at: "June 14, 2026 at 2:42 PM",
      },
      {
        id: "A-5",
        type: "Stage",
        title: "Stage Changed To Contact Made",
        detail: "Auto advanced after first connected call.",
        author: "System",
        at: "June 14, 2026 at 2:45 PM",
      },
    ],
    completed: false,
  },
  {
    id: "L-3781",
    caseNumber: "2025-FC-03781",
    saleType: "Mortgage Foreclosure",
    ownerType: "Living",
    primaryName: "David Pemberton",
    primaryRelationship: "Property Owner",
    county: "Mecklenburg County",
    state: "NC",
    propertyAddress: "1147 Oakmont Court, Charlotte, NC 28210",
    surplus: 287400,
    recoveryFeePct: 25,
    attorneyCost: 8200,
    caseDetails: [
      { label: "Case Number", value: "2025-FC-03781" },
      { label: "Sale Type", value: "Mortgage Foreclosure" },
      { label: "Sale Date", value: "January 22, 2026" },
      { label: "County", value: "Mecklenburg County, NC" },
      { label: "Owner Status", value: "Living" },
      { label: "Contacts On File", value: "2" },
      { label: "Stage", value: "Researched" },
    ],
    summary: [
      "Mortgage foreclosure, owner still living and reachable at the property's forwarding address.",
      "No competing claims yet. Surplus deposited with the clerk pending claim.",
      "Pemberton mentioned he had no idea funds were owed to him. Lead with education, not the pitch.",
    ],
    contacts: [
      {
        id: "C-5",
        name: "David Pemberton",
        relationship: "Property Owner",
        phone: "(704) 555-9012",
        address: "5821 Forestbrook Drive, Charlotte, NC 28212",
        status: "pending",
      },
      {
        id: "C-6",
        name: "Sarah Pemberton",
        relationship: "Spouse",
        phone: "(704) 555-9014",
        address: "5821 Forestbrook Drive, Charlotte, NC 28212",
        status: "pending",
      },
    ],
    activities: [
      {
        id: "A-6",
        type: "Letter",
        title: "Initial Outreach Letter Sent",
        detail: "Delivered to forwarding address at 5821 Forestbrook Dr.",
        author: "System",
        at: "March 02, 2026 at 10:11 AM",
      },
      {
        id: "A-7",
        type: "Email",
        title: "Surplus Confirmation From Clerk",
        detail: "Mecklenburg clerk confirmed $287,400 on deposit, no competing claims.",
        author: "System",
        at: "March 18, 2026 at 4:25 PM",
      },
    ],
    completed: false,
  },
  {
    id: "L-2940",
    caseNumber: "2024-CV-02940",
    saleType: "Tax Sale",
    ownerType: "Deceased",
    primaryName: "Helen Vasquez",
    primaryRelationship: "Surviving Spouse",
    county: "Maricopa County",
    state: "AZ",
    propertyAddress: "8902 N 38th Street, Phoenix, AZ 85028",
    surplus: 192800,
    recoveryFeePct: 28,
    attorneyCost: 6900,
    caseDetails: [
      { label: "Case Number", value: "2024-CV-02940" },
      { label: "Sale Type", value: "Tax Sale" },
      { label: "Sale Date", value: "September 09, 2025" },
      { label: "County", value: "Maricopa County, AZ" },
      { label: "Owner Status", value: "Deceased (2024)" },
      { label: "Heirs Located", value: "1 of 1" },
      { label: "Stage", value: "Awaiting Signature" },
    ],
    summary: [
      "Surviving spouse is sole heir. No probate complications expected.",
      "Helen verbally agreed last call, contract sent for e signature.",
      "Today's call is a soft check in to keep momentum on the signature.",
    ],
    contacts: [
      {
        id: "C-7",
        name: "Helen Vasquez",
        relationship: "Surviving Spouse",
        phone: "(602) 555-4421",
        address: "8902 N 38th Street, Phoenix, AZ 85028",
        status: "pending",
      },
    ],
    activities: [
      {
        id: "A-8",
        type: "Call",
        title: "Verbal Agreement",
        detail: "Helen agreed to 28 percent recovery fee on a recorded call.",
        author: "Rick Donovan",
        at: "June 09, 2026 at 1:08 PM",
      },
      {
        id: "A-9",
        type: "Email",
        title: "Engagement Sent For Signature",
        detail: "Standard engagement letter sent via secure link.",
        author: "Rick Donovan",
        at: "June 09, 2026 at 1:42 PM",
      },
    ],
    completed: false,
  },
  {
    id: "L-5012",
    caseNumber: "2025-FC-05012",
    saleType: "Mortgage Foreclosure",
    ownerType: "Living",
    primaryName: "Marcus Bell",
    primaryRelationship: "Property Owner",
    county: "Fulton County",
    state: "GA",
    propertyAddress: "2204 Peachtree Battle Avenue, Atlanta, GA 30327",
    surplus: 418600,
    recoveryFeePct: 30,
    attorneyCost: 11200,
    caseDetails: [
      { label: "Case Number", value: "2025-FC-05012" },
      { label: "Sale Type", value: "Mortgage Foreclosure" },
      { label: "Sale Date", value: "February 17, 2026" },
      { label: "County", value: "Fulton County, GA" },
      { label: "Owner Status", value: "Living" },
      { label: "Contacts On File", value: "1" },
      { label: "Stage", value: "First Contact" },
    ],
    summary: [
      "Large surplus, motivated owner who lost the property to mortgage default.",
      "Last call he asked for a callback this afternoon between 2 and 4.",
      "Avoid the word foreclosure on the open. He's defensive about it.",
    ],
    contacts: [
      {
        id: "C-8",
        name: "Marcus Bell",
        relationship: "Property Owner",
        phone: "(404) 555-8801",
        address: "1182 Howell Mill Road, Atlanta, GA 30318",
        status: "pending",
      },
    ],
    activities: [
      {
        id: "A-10",
        type: "Call",
        title: "Asked For Callback Today",
        detail: "Marcus asked to be called back between 2 and 4 PM today.",
        author: "Rick Donovan",
        at: "June 16, 2026 at 11:42 AM",
      },
    ],
    completed: false,
  },
  {
    id: "L-6633",
    caseNumber: "2024-CV-06633",
    saleType: "Tax Sale",
    ownerType: "Deceased",
    primaryName: "Theodore Whitman",
    primaryRelationship: "Son of Deceased Owner",
    county: "Cuyahoga County",
    state: "OH",
    propertyAddress: "3318 Lakeshore Boulevard, Cleveland, OH 44108",
    surplus: 96400,
    recoveryFeePct: 33,
    attorneyCost: 4800,
    caseDetails: [
      { label: "Case Number", value: "2024-CV-06633" },
      { label: "Sale Type", value: "Tax Sale" },
      { label: "Sale Date", value: "November 18, 2025" },
      { label: "County", value: "Cuyahoga County, OH" },
      { label: "Owner Status", value: "Deceased (2022)" },
      { label: "Heirs Located", value: "2 of 2" },
      { label: "Stage", value: "Researched" },
    ],
    summary: [
      "Smaller surplus, two cooperating heirs. Lead with the simplicity of a single call to close.",
      "Theodore manages his elderly mother's affairs, calls her on his behalf.",
      "Highlight no out of pocket cost. Mother is on fixed income.",
    ],
    contacts: [
      {
        id: "C-9",
        name: "Theodore Whitman",
        relationship: "Son of Deceased Owner",
        phone: "(216) 555-3344",
        address: "4422 W 130th Street, Cleveland, OH 44135",
        status: "pending",
      },
      {
        id: "C-10",
        name: "Doris Whitman",
        relationship: "Surviving Spouse",
        phone: "(216) 555-3340",
        address: "4422 W 130th Street, Cleveland, OH 44135",
        status: "pending",
      },
    ],
    activities: [
      {
        id: "A-11",
        type: "Letter",
        title: "Initial Outreach Letter",
        detail: "Sent via Lob, delivered.",
        author: "System",
        at: "April 12, 2026 at 9:00 AM",
      },
    ],
    completed: false,
  },
];

export function getQueueLeads(): DialerLead[] {
  const padded: DialerLead[] = [];
  for (let i = 0; i < 20; i++) {
    const base = TEST_LEADS[i % TEST_LEADS.length];
    padded.push({
      ...base,
      id: i < TEST_LEADS.length ? base.id : `${base.id}-${i}`,
      completed: i > 14,
    });
  }
  return padded;
}
