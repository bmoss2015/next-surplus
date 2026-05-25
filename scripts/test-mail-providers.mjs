#!/usr/bin/env node
// Standalone integration test for Click2Mail and Lob sandboxes.
// Calls each provider's real test endpoints with realistic payloads
// and reports pass/fail per scenario. Use this to verify provider
// integration without running the harness through a browser session.
//
// Reads keys from .env.local — same keys the portal uses. Lob keys
// must start with "test_" to hit the sandbox; live keys would create
// real billable pieces.
//
// Usage:  node scripts/test-mail-providers.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.join(__dirname, "..", ".env.local");

function loadEnv() {
  // Minimal .env parser — does NOT use shell-style expansion (the
  // SUPABASE_DB_PASSWORD has $$ which bash would treat as a PID).
  const out = {};
  let raw = "";
  try {
    raw = readFileSync(ENV_PATH, "utf8");
  } catch {
    return out;
  }
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = loadEnv();
const C2M_USER = env.CLICK2MAIL_USERNAME ?? "";
const C2M_PASS = env.CLICK2MAIL_PASSWORD ?? "";
const C2M_BASE = env.CLICK2MAIL_BASE_URL ?? "https://rest.click2mail.com/molpro";
const LOB_KEY = env.LOB_API_KEY ?? "";
const LOB_BASE = env.LOB_BASE_URL ?? "https://api.lob.com/v1";

const results = [];

function record(scenario, ok, detail) {
  results.push({ scenario, ok, detail });
  const mark = ok ? "✓" : "✗";
  console.log(`  ${mark} ${scenario}`);
  if (detail) {
    const text = typeof detail === "string" ? detail : JSON.stringify(detail);
    console.log(`     ${text.split("\n").join("\n     ")}`);
  }
}

function c2mAuth() {
  return `Basic ${Buffer.from(`${C2M_USER}:${C2M_PASS}`).toString("base64")}`;
}
function lobAuth() {
  return `Basic ${Buffer.from(`${LOB_KEY}:`).toString("base64")}`;
}

async function testC2MAuth() {
  if (!C2M_USER || !C2M_PASS) {
    record("C2M auth", false, "CLICK2MAIL_USERNAME / CLICK2MAIL_PASSWORD not set in .env.local");
    return false;
  }
  try {
    // C2M's REST API doesn't have a stable "ping" endpoint, so we
    // smoke-test auth by submitting an intentionally-bad documents
    // create call. A 401/403 means auth failed; anything else (200,
    // 400, 422) confirms creds are accepted.
    const fd = new FormData();
    fd.append("documentName", "auth-probe");
    const res = await fetch(`${C2M_BASE}/documents/create2`, {
      method: "POST",
      headers: { Authorization: c2mAuth(), Accept: "application/json" },
      body: fd,
    });
    const ok = res.status !== 401 && res.status !== 403;
    record(
      "C2M auth",
      ok,
      `HTTP ${res.status} ${ok ? "(credentials accepted)" : "(rejected)"}`
    );
    return ok;
  } catch (err) {
    record("C2M auth", false, err.message);
    return false;
  }
}

async function testLobAuth() {
  if (!LOB_KEY) {
    record("Lob auth", false, "LOB_API_KEY not set in .env.local");
    return false;
  }
  if (!LOB_KEY.startsWith("test_")) {
    record(
      "Lob auth",
      false,
      `LOB_API_KEY is not a test key (starts with "${LOB_KEY.slice(0, 5)}"). Refusing to run — would create real billable pieces.`
    );
    return false;
  }
  try {
    const res = await fetch(`${LOB_BASE}/bank_accounts?limit=1`, {
      method: "GET",
      headers: { Authorization: lobAuth(), Accept: "application/json" },
    });
    const ok = res.status === 200;
    record(
      "Lob auth",
      ok,
      `HTTP ${res.status} ${ok ? "(authenticated, sandbox)" : await res.text().then((t) => t.slice(0, 200))}`
    );
    return ok;
  } catch (err) {
    record("Lob auth", false, err.message);
    return false;
  }
}

async function testC2MSendLetter() {
  if (!C2M_USER || !C2M_PASS) return;
  // Build a minimal letter document and submit a job. C2M's test
  // environment accepts the same payloads as production but bills $0.
  const correlationId = `script_${Date.now()}`;
  try {
    // 1. Create the document
    const docRes = await fetch(`${C2M_BASE}/documents/create2`, {
      method: "POST",
      headers: { Authorization: c2mAuth(), Accept: "application/json" },
      body: (() => {
        const fd = new FormData();
        fd.append("documentName", `script-${correlationId}`);
        fd.append("documentClass", "Letter 8.5 x 11");
        const html = `<!doctype html><html><body><p>Integration script test letter — ${correlationId}.</p></body></html>`;
        fd.append("file", new Blob([html], { type: "text/html" }), "letter.html");
        return fd;
      })(),
    });
    if (!docRes.ok) {
      record("C2M create letter document", false, `HTTP ${docRes.status} ${await docRes.text().then((t) => t.slice(0, 300))}`);
      return;
    }
    const docJson = await docRes.json();
    record("C2M create letter document", true, `documentId=${docJson.id}`);

    // 2. Create an address list with one test recipient
    const addrRes = await fetch(`${C2M_BASE}/addressLists`, {
      method: "POST",
      headers: {
        Authorization: c2mAuth(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        addressListName: `script-${correlationId}`,
        addressMappingId: 1,
        firstRowHeader: "false",
        addresses: [
          [
            "Test Recipient",
            "123 Test Lane",
            "",
            "Austin",
            "TX",
            "78701",
            "US",
          ],
        ],
      }),
    });
    if (!addrRes.ok) {
      record("C2M create address list", false, `HTTP ${addrRes.status} ${await addrRes.text().then((t) => t.slice(0, 300))}`);
      return;
    }
    const addrJson = await addrRes.json();
    record("C2M create address list", true, `addressListId=${addrJson.id}`);

    // 3. Submit the job (test mode bills $0)
    const jobRes = await fetch(`${C2M_BASE}/jobs/submitJob`, {
      method: "POST",
      headers: {
        Authorization: c2mAuth(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        documentClass: "Letter 8.5 x 11",
        layout: "Address on Separate Page",
        productionTime: "Next Day",
        envelope: "#10 Single Window",
        color: "Black and White",
        paperType: "White 24#",
        printOption: "Single-sided",
        mailClass: "First Class",
        documentId: docJson.id,
        addressId: addrJson.id,
        jobName: `script-${correlationId}`,
      }),
    });
    if (!jobRes.ok) {
      record("C2M submit job", false, `HTTP ${jobRes.status} ${await jobRes.text().then((t) => t.slice(0, 300))}`);
      return;
    }
    const jobJson = await jobRes.json();
    record(
      "C2M submit job",
      true,
      `jobId=${jobJson.id}, totalCost=${jobJson.totalCost ?? "(not returned)"}`
    );
  } catch (err) {
    record("C2M send letter pipeline", false, err.message);
  }
}

async function testLobCreateBank() {
  if (!LOB_KEY || !LOB_KEY.startsWith("test_")) return;
  try {
    // Lob's published sandbox bank fixture — these test values
    // verify with amounts [11, 35].
    const createRes = await fetch(`${LOB_BASE}/bank_accounts`, {
      method: "POST",
      headers: {
        Authorization: lobAuth(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        routing_number: "322271627",
        account_number: "123456789",
        signatory: "Script Test Bank",
        account_type: "company",
      }),
    });
    if (!createRes.ok) {
      record("Lob create bank account", false, `HTTP ${createRes.status} ${await createRes.text().then((t) => t.slice(0, 300))}`);
      return;
    }
    const createJson = await createRes.json();
    record("Lob create bank account", true, `bnk=${createJson.id}`);

    // Verify with the sandbox-specific amounts
    const verifyRes = await fetch(`${LOB_BASE}/bank_accounts/${createJson.id}/verify`, {
      method: "POST",
      headers: {
        Authorization: lobAuth(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ amounts: [11, 35] }),
    });
    if (!verifyRes.ok) {
      record("Lob verify bank account", false, `HTTP ${verifyRes.status} ${await verifyRes.text().then((t) => t.slice(0, 300))}`);
      return null;
    }
    record("Lob verify bank account", true, `bnk=${createJson.id} verified`);
    return createJson.id;
  } catch (err) {
    record("Lob bank pipeline", false, err.message);
    return null;
  }
}

async function testLobSendCheck(bnkId) {
  if (!LOB_KEY || !LOB_KEY.startsWith("test_") || !bnkId) return;
  const correlationId = `script_${Date.now()}`;
  try {
    const res = await fetch(`${LOB_BASE}/checks`, {
      method: "POST",
      headers: {
        Authorization: lobAuth(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        bank_account: bnkId,
        amount: "12.34",
        memo: "Script test",
        to: {
          name: "Test Recipient",
          address_line1: "123 Test Lane",
          address_city: "Austin",
          address_state: "TX",
          address_zip: "78701",
          address_country: "US",
        },
        from: {
          name: "Moss Equity Partners",
          address_line1: "100 Main St",
          address_city: "Austin",
          address_state: "TX",
          address_zip: "78701",
          address_country: "US",
        },
        check_bottom: `<html><body><p>Script test ${correlationId}</p></body></html>`,
        mail_type: "usps_first_class",
        metadata: { correlation_id: correlationId },
      }),
    });
    if (!res.ok) {
      record("Lob send check", false, `HTTP ${res.status} ${await res.text().then((t) => t.slice(0, 300))}`);
      return;
    }
    const json = await res.json();
    record(
      "Lob send check",
      true,
      `chk=${json.id}, tracking=${json.tracking_number ?? "(none)"}, url=${json.url ? "(present)" : "(none)"}`
    );
  } catch (err) {
    record("Lob send check", false, err.message);
  }
}

async function testLobAddressVerification() {
  if (!LOB_KEY || !LOB_KEY.startsWith("test_")) return;
  // The address verification API ($0.20/verification on Developer
  // tier) is what we'd use for pre-send validation per the failure-
  // handling doc. Smoke test that the endpoint responds.
  try {
    const res = await fetch(`${LOB_BASE}/us_verifications`, {
      method: "POST",
      headers: {
        Authorization: lobAuth(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        primary_line: "1600 Pennsylvania Ave NW",
        city: "Washington",
        state: "DC",
        zip_code: "20500",
      }),
    });
    if (!res.ok) {
      record("Lob address verify", false, `HTTP ${res.status} ${await res.text().then((t) => t.slice(0, 300))}`);
      return;
    }
    const json = await res.json();
    record(
      "Lob address verify",
      true,
      `deliverability=${json.deliverability}, recipient=${json.recipient ?? "(none)"}, zip4=${json.components?.zip_code_plus_4 ?? "(none)"}`
    );
  } catch (err) {
    record("Lob address verify", false, err.message);
  }
}

async function main() {
  console.log("Mail provider integration test");
  console.log("------------------------------");
  console.log(`C2M base:  ${C2M_BASE}`);
  console.log(`Lob base:  ${LOB_BASE}`);
  console.log(`Lob key:   ${LOB_KEY.slice(0, 5)}... (${LOB_KEY.startsWith("test_") ? "sandbox" : "LIVE — will not test"})`);
  console.log("");

  console.log("Auth checks:");
  const c2mOk = await testC2MAuth();
  const lobOk = await testLobAuth();
  console.log("");

  if (c2mOk) {
    console.log("Click2Mail letter send:");
    await testC2MSendLetter();
    console.log("");
  }

  if (lobOk) {
    console.log("Lob bank account + check send:");
    const bnk = await testLobCreateBank();
    if (bnk) await testLobSendCheck(bnk);
    console.log("");

    console.log("Lob address verification (for future pre-send gate):");
    await testLobAddressVerification();
    console.log("");
  }

  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log("------------------------------");
  console.log(`Result: ${passed} / ${total} passed`);
  if (passed < total) {
    console.log("");
    console.log("Failures:");
    for (const r of results.filter((r) => !r.ok)) {
      console.log(`  ✗ ${r.scenario}`);
      if (r.detail) {
        const text = typeof r.detail === "string" ? r.detail : JSON.stringify(r.detail);
        console.log(`    ${text.split("\n").join("\n    ")}`);
      }
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
