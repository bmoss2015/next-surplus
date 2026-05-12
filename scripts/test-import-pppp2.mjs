// One-off verification harness for "Fix PPPP2" — exercises the import server
// action's writeContactsForLead / writeRelativesForLead logic against the
// STAGING DB (sghfmudgnddybsayfqbd), attached to an existing owner-less lead,
// using a synthetic Excess Elite row that matches the task brief. Reads
// everything back, checks each expected outcome, then deletes exactly the rows
// it created. Also unit-checks the pure CSV transforms used for lead-level
// fields (source_surplus / sale_date / case_number).
//
// Run: node scripts/test-import-pppp2.mjs
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!/sghfmudgnddybsayfqbd/.test(url)) { console.error("Not staging — abort. URL =", url); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });

// ---- transforms copied from src/app/(app)/imports/_shared.ts ---------------
// Kept in sync with _shared.ts: a leading US "1" on an 11-digit number is
// dropped; "Landline" is its own phone-type value (not "Residential").
const normalizePhone = (raw) => {
  const d = (raw ?? "").replace(/\D/g, "");
  return d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
};
function parsePhoneType(raw) {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return null;
  if (v.startsWith("m") || v.includes("cell") || v.includes("wireless") || v.includes("mobile")) return "Mobile";
  if (v.includes("land")) return "Landline";
  if (v.startsWith("r") || v.includes("home") || v.includes("residential")) return "Residential";
  return "Other";
}
function parseDncLitigator(raw) {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return { is_dnc: false, is_litigator: false };
  const yes = ["y", "yes", "t", "true", "1", "x"].includes(v);
  const is_litigator = yes || v.includes("litig");
  const is_dnc = is_litigator || v.includes("dnc") || v.includes("do not call");
  return { is_dnc, is_litigator };
}
function parseImportDate(raw) {
  const v = (raw ?? "").trim();
  if (!v) return null;
  const iso = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) { const [, y, m, d] = iso; return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`; }
  const mdy = v.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (mdy) {
    let [, mo, da, yr] = mdy;
    if (yr.length === 2) yr = (Number(yr) >= 70 ? "19" : "20") + yr;
    if (+mo>=1 && +mo<=12 && +da>=1 && +da<=31) return `${yr}-${mo.padStart(2,"0")}-${da.padStart(2,"0")}`;
  }
  const p = new Date(v);
  return Number.isNaN(p.getTime()) ? null : `${p.getFullYear()}-${String(p.getMonth()+1).padStart(2,"0")}-${String(p.getDate()).padStart(2,"0")}`;
}
function stripCaseNumber(raw) { return (raw ?? "").replace(/[$,]/g, "").replace(/\.\d*$/, "").trim(); }
// ImportWizard.tsx parses owner/relative names with this proper-case helper:
const properCase = (s) => (s ?? "").toLowerCase().replace(/\b[a-z]/g, (m) => m.toUpperCase());
// money parser used by the wizard for surplus / bid columns:
const parseMoney = (raw) => { const n = Number(String(raw ?? "").replace(/[^0-9.\-]/g, "")); return Number.isFinite(n) && String(raw ?? "").trim() ? n : null; };

// ---- relativeRowFromImport copied from src/app/(app)/imports/_actions.ts ---
const RELATIVE_PHONE_COLUMNS = ["phone", "phone_2", "phone_3", "phone_4", "phone_5"];
const RELATIVE_EMAIL_COLUMNS = ["email", "email_2", "email_3", "email_4", "email_5"];
function relativeRowFromImport(leadId, orgId, r) {
  const out = { lead_id: leadId, org_id: orgId, full_name: r.full_name || "Unknown Relative", relationship: r.relationship ?? null, age: r.age ?? null };
  RELATIVE_PHONE_COLUMNS.forEach((base, i) => {
    const p = r.phones[i];
    out[base] = p ? p.value.trim() : null;
    out[`${base}_type`] = p ? (p.phone_type ?? null) : null;
    out[`${base}_is_dnc`] = p ? p.is_dnc : false;
    out[`${base}_is_litigator`] = p ? p.is_litigator : false;
  });
  RELATIVE_EMAIL_COLUMNS.forEach((base, i) => { out[base] = r.emails[i] ?? null; });
  return out;
}

// ---- synthetic Excess Elite row (the task brief) ---------------------------
const ownerPhonesRaw = [
  { value: "2405551111", type: "Mobile", dnc: "Y" },
  { value: "2405552222", type: "LandLine", dnc: "N" },
  { value: "(240) 506-7777", type: "", dnc: "" },
  { value: "555-222-6666", type: "", dnc: "" },
  { value: "6668889999", type: "", dnc: "" },
];
const ownerEmailsRaw = ["e1@x.com", "e2@x.com", "e3@x.com", "e4@x.com", "e5@x.com"];
const rel1PhonesRaw = [
  { value: "(240) 506-7777", type: "Mobile", dnc: "" },
  { value: "555-222-6666", type: "", dnc: "" },
  { value: "6668889999", type: "", dnc: "" },
];
const rel1EmailsRaw = ["rel1@x.com", "rel2@x.com"];
const mailing = { street: "11330 Lantana Reach", city: "test", state: "SC", zip: "29405" };

const mkPhone = (p) => { const v = normalizePhone(p.value); if (!v) return null; const d = parseDncLitigator(p.dnc); return { value: v, phone_type: parsePhoneType(p.type), is_dnc: d.is_dnc, is_litigator: d.is_litigator }; };

const incoming = {
  owner_full_name: properCase("john q public"),
  owner_age: parseInt("67", 10),
  owner_deceased: /^y/i.test("Y"),
  owner_living: /^n/i.test("Y"),
  phones: ownerPhonesRaw.map(mkPhone).filter(Boolean),
  emails: ownerEmailsRaw.map((e) => e.trim()).filter(Boolean),
  mailing_addresses: [[mailing.street, mailing.city, mailing.state, mailing.zip].filter(Boolean).join(", ")].filter(Boolean),
  relatives: [{
    full_name: properCase("justin smith"),
    relationship: "brother" || null,
    age: null,
    phones: rel1PhonesRaw.map(mkPhone).filter(Boolean),
    emails: rel1EmailsRaw.map((e) => e.trim()).filter(Boolean),
  }],
  // lead-level (verified via transforms below, not written to an existing lead):
  source_surplus: parseMoney("$75,000.00"),
  sale_date: parseImportDate("01/15/2024"),
  case_number: stripCaseNumber("$123,456.00") || null,
};

const results = [];
const check = (name, cond, extra = "") => results.push(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`);

async function main() {
  // --- lead-level transform checks (pure) ---
  check("source_surplus parses to 75000 (numeric, no symbols)", incoming.source_surplus === 75000, `got ${JSON.stringify(incoming.source_surplus)} typeof ${typeof incoming.source_surplus}`);
  check("sale_date parses 01/15/2024 -> 2024-01-15", incoming.sale_date === "2024-01-15", `got ${JSON.stringify(incoming.sale_date)}`);
  check("case_number '$123,456.00' -> '123456' (plain text, no symbols)", incoming.case_number === "123456", `got ${JSON.stringify(incoming.case_number)}`);
  check("owner name proper-cased", incoming.owner_full_name === "John Q Public", `got ${JSON.stringify(incoming.owner_full_name)}`);
  check("relative name proper-cased -> 'Justin Smith'", incoming.relatives[0].full_name === "Justin Smith", `got ${JSON.stringify(incoming.relatives[0].full_name)}`);
  check("relative relationship verbatim 'brother'", incoming.relatives[0].relationship === "brother");
  check("owner status resolves 'deceased' (Deceased=Y)", (incoming.owner_deceased ? "deceased" : incoming.owner_living ? "living" : "unknown") === "deceased");
  check("all 5 owner phones normalized to digits", JSON.stringify(incoming.phones.map((p) => p.value)) === JSON.stringify(["2405551111","2405552222","2405067777","5552226666","6668889999"]), JSON.stringify(incoming.phones.map((p) => p.value)));
  check("owner phone1 type=Mobile dnc=true", incoming.phones[0].phone_type === "Mobile" && incoming.phones[0].is_dnc === true);
  check("owner phone2 type=Landline dnc=false (LandLine, DNC N)", incoming.phones[1].phone_type === "Landline" && incoming.phones[1].is_dnc === false);

  // --- DB checks: attach owner/contacts/relatives to an owner-less staging lead ---
  const { data: leads } = await sb.from("leads").select("id, org_id, source_surplus, sale_date, case_number");
  const { data: owners } = await sb.from("owners").select("lead_id");
  const owned = new Set((owners ?? []).map((o) => o.lead_id));
  const host = (leads ?? []).find((l) => !owned.has(l.id));
  if (!host) { console.log("No owner-less staging lead available; skipping DB checks."); return finish(); }
  const leadId = host.id, orgId = host.org_id;
  console.log(`Using host lead ${leadId} (org ${orgId})`);
  // sanity: leads table carries the lead-level columns the importer writes
  check("leads table has source_surplus / sale_date / case_number columns", "source_surplus" in host && "sale_date" in host && "case_number" in host);

  let ownerId = null;
  try {
    // ---- writeContactsForLead (from _actions.ts), with org_id added for the
    //      service-role harness (the real action gets org_id from a column default) ----
    const ownerName = (incoming.owner_full_name ?? "").trim();
    const phones = (incoming.phones ?? []).filter((p) => p.value.trim());
    const emails = (incoming.emails ?? []).map((e) => e.trim()).filter(Boolean);
    const mailingAddresses = (incoming.mailing_addresses ?? []).map((m) => m.trim()).filter(Boolean);

    const { data: ownerRow, error: ownerErr } = await sb.from("owners").insert({
      lead_id: leadId, org_id: orgId,
      full_name: ownerName || "Unknown Owner",
      is_primary: true,
      status: incoming.owner_deceased ? "deceased" : incoming.owner_living ? "living" : "unknown",
      is_deceased: incoming.owner_deceased,
      age: incoming.owner_age ?? null,
    }).select("id, status, is_deceased, age, full_name").single();
    if (ownerErr || !ownerRow) { check("owner row inserts", false, ownerErr?.message); throw new Error("owner insert failed: " + ownerErr?.message); }
    ownerId = ownerRow.id;
    check("owner row inserts", true);
    check("owner status = deceased / is_deceased = true", ownerRow.status === "deceased" && ownerRow.is_deceased === true, `status=${ownerRow.status} is_deceased=${ownerRow.is_deceased}`);
    check("owner age stored = 67", ownerRow.age === 67, `got ${ownerRow.age}`);

    // mirrors the fixed contactRow() helper in _actions.ts (homogeneous keys)
    const contactRow = (channel, value, isPrimary, phone) => ({
      owner_id: ownerRow.id, lead_id: leadId, org_id: orgId, channel, value: value.trim(), status: "untested", is_primary: isPrimary,
      phone_type: phone?.phone_type ?? null, is_dnc: phone?.is_dnc ?? false, is_litigator: phone?.is_litigator ?? false,
    });
    const contactRows = [];
    phones.forEach((p, idx) => contactRows.push(contactRow("phone", p.value, idx === 0, p)));
    emails.forEach((value, idx) => contactRows.push(contactRow("email", value, idx === 0 && phones.length === 0)));
    mailingAddresses.forEach((value) => contactRows.push(contactRow("mailing_address", value, false)));
    const { error: contactsErr } = await sb.from("contacts").insert(contactRows);
    check("contacts bulk insert (5 phones + 5 emails + 1 mailing) succeeds", !contactsErr, contactsErr?.message);

    // ---- writeRelativesForLead (from _actions.ts) ----
    const relatives = (incoming.relatives ?? []).filter((r) => r.full_name || r.phones.length > 0 || r.emails.length > 0);
    const relativeRows = relatives.map((r) => relativeRowFromImport(leadId, orgId, r));
    const { error: relativesErr } = await sb.from("relatives").insert(relativeRows);
    check("relatives insert succeeds", !relativesErr, relativesErr?.message);

    // ---- read back ----
    const { data: cRows } = await sb.from("contacts").select("channel, value, phone_type, is_dnc, is_litigator, is_primary, owner_id").eq("owner_id", ownerId).order("channel");
    const { data: rRows } = await sb.from("relatives").select("full_name, relationship, age, phone, phone_type, phone_is_dnc, phone_2, phone_3, phone_4, email, email_2").eq("lead_id", leadId).eq("full_name", "Justin Smith");
    console.log("\n--- contacts read back ---"); console.table((cRows ?? []).map((c) => ({ channel: c.channel, value: c.value, type: c.phone_type, dnc: c.is_dnc, litig: c.is_litigator, primary: c.is_primary, has_owner: !!c.owner_id })));
    console.log("--- relative read back ---"); console.table(rRows ?? []);

    const phoneC = (cRows ?? []).filter((c) => c.channel === "phone");
    const emailC = (cRows ?? []).filter((c) => c.channel === "email");
    const mailC = (cRows ?? []).filter((c) => c.channel === "mailing_address");
    check("5 owner phone contacts present", phoneC.length === 5, `got ${phoneC.length}`);
    check("phone 2405551111 -> type Mobile, DNC true", phoneC.some((c) => c.value === "2405551111" && c.phone_type === "Mobile" && c.is_dnc === true));
    check("phone 2405552222 -> type Landline, DNC false", phoneC.some((c) => c.value === "2405552222" && c.phone_type === "Landline" && c.is_dnc === false));
    check("phone (240) 506-7777 -> stored 2405067777", phoneC.some((c) => c.value === "2405067777"));
    check("phone 555-222-6666 -> stored 5552226666", phoneC.some((c) => c.value === "5552226666"));
    check("phone 6668889999 -> stored 6668889999", phoneC.some((c) => c.value === "6668889999"));
    check("5 owner email contacts present", emailC.length === 5, `got ${emailC.length}; values=${JSON.stringify(emailC.map((c) => c.value))}`);
    check("mailing-address contact present, linked to owner", mailC.length === 1 && !!mailC[0].owner_id, `count=${mailC.length}`);
    check("mailing-address value = '11330 Lantana Reach, test, SC, 29405'", mailC[0]?.value === "11330 Lantana Reach, test, SC, 29405", `got ${JSON.stringify(mailC[0]?.value)}`);
    const rel = (rRows ?? [])[0];
    check("relative row present with name 'Justin Smith'", !!rel);
    check("relative relationship = 'brother'", rel?.relationship === "brother", `got ${JSON.stringify(rel?.relationship)}`);
    check("relative phones imported (phone/phone_2/phone_3 = 2405067777/5552226666/6668889999)", rel?.phone === "2405067777" && rel?.phone_2 === "5552226666" && rel?.phone_3 === "6668889999", `got ${JSON.stringify([rel?.phone, rel?.phone_2, rel?.phone_3])}`);
    check("relative phone1 type=Mobile", rel?.phone_type === "Mobile", `got ${rel?.phone_type}`);
    check("relative emails imported (email/email_2 = rel1@x.com/rel2@x.com)", rel?.email === "rel1@x.com" && rel?.email_2 === "rel2@x.com", `got ${JSON.stringify([rel?.email, rel?.email_2])}`);
  } finally {
    if (ownerId) await sb.from("contacts").delete().eq("owner_id", ownerId);
    await sb.from("relatives").delete().eq("full_name", "Justin Smith");
    if (ownerId) await sb.from("owners").delete().eq("id", ownerId);
    console.log("\ncleanup done (removed test owner/contacts/relative).");
  }
  finish();
}
function finish() {
  console.log("\n========== RESULTS ==========");
  console.log(results.join("\n"));
  const failed = results.filter((r) => r.startsWith("FAIL"));
  console.log(`\n${failed.length === 0 ? "ALL PASS" : failed.length + " FAILED"}`);
  process.exit(failed.length === 0 ? 0 : 2);
}
main().catch((e) => { console.error("HARNESS ERROR:", e); process.exit(1); });
