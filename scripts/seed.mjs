// Seed demo data for visual development.
// Run: node --env-file=.env.local scripts/seed.mjs
// Idempotent: clears leads/owners/contacts/verification_items/attorneys then re-inserts.
// User-scoped tables (tasks, notes, imports, settings) are skipped — seeded later
// once auth is wired and a real user exists.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("Run with: node --env-file=.env.local scripts/seed.mjs");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const STAGES = [
  "new_leads",
  "qualifying",
  "outreach",
  "in_conversation",
  "contract",
  "with_attorney",
  "claim_filed",
  "won",
  "lost",
];

// Distribution: weighted toward earlier stages (matches portal_tour.html numbers
// proportionally — most leads are early-stage, fewer in late stages).
// Total = 42 leads to land in the 30–50 target.
const STAGE_DISTRIBUTION = {
  new_leads: 12,
  qualifying: 6,
  outreach: 10,
  in_conversation: 4,
  contract: 3,
  with_attorney: 2,
  claim_filed: 2,
  won: 1,
  lost: 2,
};

const STREETS_BY_CITY = {
  "Charleston, SC": ["Magnolia Ave", "King St", "Calhoun St", "Edgewater Dr", "Ashley River Rd"],
  "Columbia, SC": ["Riverside Dr", "Devine St", "Bull St", "Two Notch Rd"],
  "Greenville, SC": ["Bent Creek Ln", "Spring Hill Rd", "Augusta Rd", "Pelham Rd"],
  "Mount Pleasant, SC": ["Long Point Rd", "Coleman Blvd", "Rifle Range Rd"],
  "Memphis, TN": ["Oakwood Dr", "Poplar Ave", "Madison Ave", "Cooper St"],
  "Nashville, TN": ["Belmont Blvd", "Elliston Pl", "Music Sq E", "Charlotte Pike"],
  "Knoxville, TN": ["Kingston Pike", "Cumberland Ave", "Sutherland Ave"],
  "Philadelphia, PA": ["Chestnut St", "Locust St", "Walnut St", "Spruce St", "Pine St"],
  "Pittsburgh, PA": ["Forbes Ave", "Fifth Ave", "Liberty Ave"],
};

const FIRST_NAMES = [
  "Marcus", "Patricia", "James", "Linda", "Robert", "Jennifer", "Michael",
  "Mary", "David", "Susan", "William", "Karen", "Richard", "Nancy", "Joseph",
  "Helen", "Thomas", "Lisa", "Charles", "Betty", "Donald", "Ruth", "Steven",
  "Barbara", "Paul", "Margaret",
];
const LAST_NAMES = [
  "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Carter",
  "Hayes", "Klein", "Patterson", "Robinson", "Greene", "Walker", "Holcomb",
];

const OWNER_STATUS_OPTIONS = ["living", "deceased", "unknown"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fakePhone() {
  return `${randInt(200, 999)}-${randInt(200, 999)}-${randInt(1000, 9999)}`;
}

function fakeEmail(name) {
  const base = name.toLowerCase().replace(/\s+/g, ".").replace(/[^\w.]/g, "");
  return `${base}@example.com`;
}

function fakeZip(state) {
  if (state === "SC") return String(randInt(29000, 29999));
  if (state === "TN") return String(randInt(37000, 38599));
  if (state === "PA") return String(randInt(15000, 19699));
  return String(randInt(10000, 99999));
}

function makeLead(idx, stage) {
  const cityKey = pick(Object.keys(STREETS_BY_CITY));
  const [city, state] = cityKey.split(", ");
  const street = pick(STREETS_BY_CITY[cityKey]);
  const houseNum = randInt(100, 9999);
  const saleType = Math.random() > 0.4 ? "TAX" : "MTG";

  // Sale dates spread over the past 6 months
  const daysAgo = randInt(7, 180);
  const saleDate = new Date();
  saleDate.setDate(saleDate.getDate() - daysAgo);

  // Closing bid: realistic surplus-fund range
  const closingBid = randInt(80000, 350000);
  const outstandingDebt = Math.floor(closingBid * (0.3 + Math.random() * 0.4));
  const courtCosts = randInt(2000, 5000);
  const recoveryFeePct = pick([25, 30, 30, 33, 35]);
  const attorneyCost = pick([2000, 2500, 3000]);

  return {
    address: `${houseNum} ${street}`,
    city,
    state,
    zip: fakeZip(state),
    county: city === "Charleston" ? "Charleston" : city === "Memphis" ? "Shelby" : city === "Philadelphia" ? "Philadelphia" : `${city} County`,
    sale_type: saleType,
    sale_date: saleDate.toISOString().slice(0, 10),
    closing_bid: closingBid,
    opening_bid: Math.floor(outstandingDebt + courtCosts),
    outstanding_debt: outstandingDebt,
    court_costs: courtCosts,
    junior_liens: 0,
    recovery_fee_percent: recoveryFeePct,
    attorney_cost: attorneyCost,
    stage,
    lost_reason: stage === "lost" ? pick(["Owner uncooperative", "Below floor after research", "Title issue", "Already claimed by heir", "Contested by another firm"]) : null,
    lead_source: pick(["Excess Elite", "County notification", "Manual entry", "Referral"]),
    needs_action_flag: stage === "qualifying" && Math.random() > 0.7,
    needs_action_note: null,
    court_records: {},
    custom_data: {},
  };
}

function makeOwners(leadId) {
  const numOwners = Math.random() > 0.7 ? 2 : 1;
  return Array.from({ length: numOwners }).map((_, i) => {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    return {
      lead_id: leadId,
      full_name: name,
      status: pick(OWNER_STATUS_OPTIONS),
      is_primary: i === 0,
      relationship: i === 0 ? null : pick(["Spouse", "Heir", "Joint owner"]),
      _name: name, // local helper, not inserted
    };
  });
}

function makeContacts(ownerId, leadId, ownerName) {
  const contacts = [];
  // Always add a mailing address
  contacts.push({
    owner_id: ownerId,
    lead_id: leadId,
    channel: "mailing_address",
    value: `${randInt(100, 9999)} ${pick(["Hillside", "Oak", "Maple", "Cedar"])} ${pick(["Dr", "Ave", "Ln"])}, ${pick(["Charleston", "Atlanta", "Charlotte"])} ${pick(["SC", "GA", "NC"])} ${randInt(28000, 30999)}`,
    status: "untested",
    is_primary: true,
    mailed: Math.random() > 0.5,
    mailed_at: Math.random() > 0.5 ? new Date(Date.now() - randInt(1, 30) * 86400000).toISOString() : null,
  });
  // Sometimes a phone
  if (Math.random() > 0.3) {
    contacts.push({
      owner_id: ownerId,
      lead_id: leadId,
      channel: "phone",
      value: fakePhone(),
      status: pick(["untested", "valid", "invalid"]),
      is_primary: true,
      mailed: false,
      mailed_at: null,
    });
  }
  // Sometimes an email
  if (Math.random() > 0.6) {
    contacts.push({
      owner_id: ownerId,
      lead_id: leadId,
      channel: "email",
      value: fakeEmail(ownerName),
      status: pick(["untested", "valid"]),
      is_primary: true,
      mailed: false,
      mailed_at: null,
    });
  }
  return contacts;
}

function makeVerificationItems(leadId) {
  const all = [
    "Confirm titleholder via county land records",
    "Pull court docket for case",
    "Verify no active bankruptcy stay",
    "Check unclaimed property database",
    "Verify owner not deceased (obituary search)",
    "Confirm surplus on county Treasurer list",
  ];
  const num = randInt(2, 4);
  const selected = [...all].sort(() => Math.random() - 0.5).slice(0, num);
  return selected.map((label) => ({
    lead_id: leadId,
    label,
    checked: Math.random() > 0.6,
  }));
}

async function clear() {
  // Delete in dependency order
  const tables = [
    "verification_items",
    "contacts",
    "owners",
    "import_rows",
    "imports",
    "documents",
    "notes",
    "tasks",
    "activities",
    "leads",
    "attorneys",
  ];
  for (const t of tables) {
    const { error } = await sb.from(t).delete().not("id", "is", null);
    if (error) console.error(`clear ${t}:`, error.message);
    else console.log(`  cleared ${t}`);
  }
}

async function seedAttorneys() {
  const attorneys = [
    { name: "Sarah Blessed", email: "sblessed@blessedlaw.example", states_covered: ["SC"], default_cost: 2500 },
    { name: "Marcus Thornton", email: "mthornton@thornton.example", states_covered: ["TN"], default_cost: 2750 },
    { name: "Daniel Reeves", email: "dreeves@reevespa.example", states_covered: ["PA"], default_cost: 3000 },
  ];
  const { data, error } = await sb.from("attorneys").insert(attorneys).select();
  if (error) throw error;
  console.log(`  inserted ${data.length} attorneys`);
}

async function seedLeads() {
  // Build flat list of leads to insert
  const leadRows = [];
  let idx = 0;
  for (const stage of STAGES) {
    const count = STAGE_DISTRIBUTION[stage] ?? 0;
    for (let i = 0; i < count; i++, idx++) {
      leadRows.push(makeLead(idx, stage));
    }
  }

  // Insert leads (returns IDs and lead_id)
  const { data: insertedLeads, error: leadsErr } = await sb
    .from("leads")
    .insert(leadRows)
    .select("id, lead_id, stage");
  if (leadsErr) throw leadsErr;
  console.log(`  inserted ${insertedLeads.length} leads`);

  // Build owners
  const ownerRowsByLead = insertedLeads.map((lead) => ({
    leadId: lead.id,
    owners: makeOwners(lead.id),
  }));
  const ownerRowsToInsert = ownerRowsByLead
    .flatMap((x) => x.owners)
    .map(({ _name, ...rest }) => rest);
  const { data: insertedOwners, error: ownersErr } = await sb
    .from("owners")
    .insert(ownerRowsToInsert)
    .select("id, lead_id, full_name");
  if (ownersErr) throw ownersErr;
  console.log(`  inserted ${insertedOwners.length} owners`);

  // Build contacts (one set per owner)
  const contactRows = insertedOwners.flatMap((o) =>
    makeContacts(o.id, o.lead_id, o.full_name)
  );
  const { data: insertedContacts, error: contactsErr } = await sb
    .from("contacts")
    .insert(contactRows)
    .select("id");
  if (contactsErr) throw contactsErr;
  console.log(`  inserted ${insertedContacts.length} contacts`);

  // Build verification_items
  const vItemRows = insertedLeads.flatMap((l) => makeVerificationItems(l.id));
  const { data: insertedVItems, error: vItemsErr } = await sb
    .from("verification_items")
    .insert(vItemRows)
    .select("id");
  if (vItemsErr) throw vItemsErr;
  console.log(`  inserted ${insertedVItems.length} verification items`);
}

async function main() {
  console.log("Clearing existing demo data...");
  await clear();
  console.log("Seeding attorneys...");
  await seedAttorneys();
  console.log("Seeding leads / owners / contacts / verification items...");
  await seedLeads();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
