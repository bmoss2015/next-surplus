#!/usr/bin/env node
// One-off seeder for test email threads on STAGING. Picks the first lead
// that has both a connected Gmail account in the org AND at least one
// lead_party with an email, then creates a 3-message thread between them
// so the Messages tab has something to render (including the new pinned
// reply bar at the bottom of the right column).
//
// Run: npm run seed:test-emails
// Idempotent: skips the lead if it already has a test thread tagged with
//   metadata.seed_tag = 'test-emails-v1'.

import fsSync from "node:fs";
import path from "node:path";

const REPO_ROOT = path.join(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/(\w):/, "$1:"),
  ".."
);

function readEnvLocalValue(key) {
  const envPath = path.join(REPO_ROOT, ".env.local");
  if (!fsSync.existsSync(envPath)) return null;
  const text = fsSync.readFileSync(envPath, "utf-8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i);
    if (!m || m[1] !== key) continue;
    let v = m[2];
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
      v = v.slice(1, -1);
    }
    return v;
  }
  return null;
}

const PAT = process.env.SUPABASE_PAT || readEnvLocalValue("SUPABASE_PAT");
const PROJECT_REF = "qfanroxcoepunmrmjabo";
const API = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

if (!PAT) {
  console.error("SUPABASE_PAT not set. Same PAT as db:push:staging.");
  process.exit(1);
}

async function runSql(query) {
  const res = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  return JSON.parse(text);
}

function rowsOf(result) {
  return Array.isArray(result) ? result : result.result ?? [];
}

function esc(s) {
  return String(s).replace(/'/g, "''");
}

async function main() {
  console.log("Looking for a lead with a connected account + a contact email…");
  const candidates = rowsOf(
    await runSql(`
      select
        ca.id   as account_id,
        ca.org_id,
        ca.address as account_address,
        ca.display_name as account_name,
        l.id    as lead_uuid,
        l.lead_id as lead_id_text,
        lp.id   as party_id,
        lp.name as party_name,
        lp.email as party_email
      from channel_accounts ca
      join leads l         on l.org_id = ca.org_id
      join lead_parties lp on lp.lead_id = l.id
      where ca.status = 'active'
        and ca.provider = 'gmail'
        and lp.email is not null
        and lp.email <> ''
      order by l.created_at desc
      limit 5
    `)
  );

  if (candidates.length === 0) {
    console.error("No viable lead found. Need: an active Gmail channel_account in some org AND at least one lead with a lead_party email in that org.");
    process.exit(1);
  }

  // Filter out leads that already have our seed-tagged thread.
  let picked = null;
  for (const cand of candidates) {
    const existing = rowsOf(
      await runSql(`
        select 1 from conversations
        where lead_id = '${esc(cand.lead_uuid)}'
          and (participants->>'seed_tag') = 'test-emails-v1'
        limit 1
      `)
    );
    if (existing.length === 0) {
      picked = cand;
      break;
    }
  }
  if (!picked) {
    console.log("All viable leads already have a seeded test thread. Nothing to do.");
    return;
  }

  console.log(`Seeding lead ${picked.lead_id_text} (${picked.lead_uuid})`);
  console.log(`  Contact: ${picked.party_name} <${picked.party_email}>`);
  console.log(`  Account: ${picked.account_address}`);

  // 3-message thread spanning ~4 days. Inbound from contact → outbound
  // reply from us → another inbound reply, so the pinned reply bar lights
  // up against an inbound (most realistic "user has work to do" state).
  const threadKey = `seed-test-emails-v1-${picked.lead_uuid.slice(0, 8)}`;
  const subject = "Surplus funds from the tax sale";
  const accountAddr = picked.account_address;
  const accountName = picked.account_name || "Bree Moss";
  const contactEmail = picked.party_email;
  const contactName = picked.party_name || contactEmail.split("@")[0];

  const now = new Date();
  const t1 = new Date(now.getTime() - 4 * 86400_000).toISOString(); // 4 days ago, inbound
  const t2 = new Date(now.getTime() - 3 * 86400_000).toISOString(); // 3 days ago, outbound
  const t3 = new Date(now.getTime() - 1 * 86400_000).toISOString(); // 1 day ago, inbound

  const m1Body = `Hi ${accountName.split(" ")[0] || "there"},<br><br>I got a letter saying there are surplus funds from a tax sale on my old property. Is this legit? I'd like to understand the next steps before signing anything.<br><br>Thanks,<br>${contactName}`;
  const m2Body = `Hi ${contactName.split(" ")[0] || "there"},<br><br>Yes — this is legitimate. When properties are sold at tax sale for more than the back taxes owed, the surplus belongs to the prior owner. We file the claim with the county on your behalf at no upfront cost.<br><br>Quick summary:<ul><li>Estimated surplus: <strong>$42,500</strong></li><li>Our recovery fee: 30%</li><li>Your estimated net: <strong>~$29,750</strong></li></ul>Most claims resolve within 90–180 days. Happy to hop on a 10-minute call to walk through it. What time works for you this week?<br><br>${accountName}<br>Managing Partner, Moss Equity Partners`;
  const m3Body = `That works — Thursday around 2pm CT? Also, do I need to provide any documents up front, or do you handle that side?<br><br>${contactName}`;

  // Build a conversation row first so we have its id for messages.
  const conv = rowsOf(
    await runSql(`
      insert into conversations (
        org_id, channel_account_id, channel, provider_thread_key, subject, lead_id,
        participants, last_message_at, last_message_preview, unread_count
      ) values (
        '${esc(picked.org_id)}', '${esc(picked.account_id)}', 'gmail',
        '${esc(threadKey)}', '${esc(subject)}', '${esc(picked.lead_uuid)}',
        jsonb_build_object(
          'seed_tag', 'test-emails-v1',
          'addresses', array['${esc(accountAddr)}','${esc(contactEmail)}']
        ),
        '${t3}', '${esc(m3Body.replace(/<[^>]+>/g, ' ').slice(0, 140))}',
        1
      )
      returning id
    `)
  );
  const conversationId = conv[0]?.id;
  if (!conversationId) {
    console.error("Failed to create conversation.");
    process.exit(1);
  }

  async function insertMsg({ direction, fromAddress, fromName, toAddress, body, sentAt, providerMessageId }) {
    const snippet = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140);
    await runSql(`
      insert into messages (
        org_id, conversation_id, channel, direction,
        from_address, from_name, to_addresses,
        subject, body_text, body_html, snippet,
        provider_message_id, sent_at, is_read,
        metadata
      ) values (
        '${esc(picked.org_id)}', '${esc(conversationId)}', 'gmail', '${direction}',
        '${esc(fromAddress)}', '${esc(fromName)}', array['${esc(toAddress)}'],
        '${esc(subject)}', '${esc(body.replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n").trim())}',
        '${esc(body)}', '${esc(snippet)}',
        '${esc(providerMessageId)}', '${sentAt}', ${direction === "inbound" && sentAt === "${t3}" ? "false" : "true"},
        jsonb_build_object('seed_tag', 'test-emails-v1')
      )
    `);
  }

  // m1 inbound from contact
  await insertMsg({
    direction: "inbound",
    fromAddress: contactEmail,
    fromName: contactName,
    toAddress: accountAddr,
    body: m1Body,
    sentAt: t1,
    providerMessageId: `${threadKey}-m1`,
  });
  // m2 outbound from us
  await insertMsg({
    direction: "outbound",
    fromAddress: accountAddr,
    fromName: accountName,
    toAddress: contactEmail,
    body: m2Body,
    sentAt: t2,
    providerMessageId: `${threadKey}-m2`,
  });
  // m3 inbound from contact (most recent, unread → drives the pinned Reply bar)
  await insertMsg({
    direction: "inbound",
    fromAddress: contactEmail,
    fromName: contactName,
    toAddress: accountAddr,
    body: m3Body,
    sentAt: t3,
    providerMessageId: `${threadKey}-m3`,
  });
  // Mark only m3 unread
  await runSql(`
    update messages
    set is_read = case when provider_message_id = '${esc(threadKey)}-m3' then false else true end
    where conversation_id = '${esc(conversationId)}'
  `);

  console.log("\nSeeded.");
  console.log(`Open: /leads/${picked.lead_uuid}?tab=conversation`);
  console.log(`Lead ID text: ${picked.lead_id_text}`);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
