#!/usr/bin/env node
// Same engine as apply-prod-migrations.mjs but targets the STAGING
// project. Uses the existing SUPABASE_PAT — no DB password ever.
//
// Reads supabase/migrations/*.sql, finds what's missing in staging's
// schema_migrations, applies it, records each version. Safe to re-run.

import fs from "node:fs/promises";
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
    if (!m) continue;
    if (m[1] !== key) continue;
    let v = m[2];
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
      v = v.slice(1, -1);
    }
    return v;
  }
  return null;
}

const PAT = process.env.SUPABASE_PAT || readEnvLocalValue("SUPABASE_PAT");
const PROJECT_REF = "sghfmudgnddybsayfqbd";
const MIGRATIONS_DIR = path.join(REPO_ROOT, "supabase", "migrations");
const API = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

if (!PAT) {
  console.error("SUPABASE_PAT is not set. Same PAT as the prod migrator — see CLAUDE.md.");
  process.exit(1);
}

async function runSql(query) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function main() {
  console.log(`Reading migrations from ${MIGRATIONS_DIR}`);
  const files = (await fs.readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  console.log(`Found ${files.length} migration files.`);

  let applied = new Set();
  try {
    const result = await runSql(
      "select version from supabase_migrations.schema_migrations order by version"
    );
    const rows = Array.isArray(result) ? result : result.result ?? [];
    for (const row of rows) applied.add(String(row.version));
    console.log(`Already applied: ${applied.size} migrations.`);
  } catch (err) {
    console.log(
      "Could not read schema_migrations (table may not exist yet). Creating it."
    );
    await runSql(`
      create schema if not exists supabase_migrations;
      create table if not exists supabase_migrations.schema_migrations (
        version text primary key,
        statements text[],
        name text
      );
    `);
  }

  const pending = files.filter((f) => {
    const version = f.split("_")[0];
    return !applied.has(version);
  });

  if (pending.length === 0) {
    console.log("Nothing to apply. Staging is current.");
    return;
  }
  console.log(`Pending: ${pending.length} migrations.`);

  const alreadyAppliedCodes = ["42P07", "42710", "42P06", "42701", "42P03", "42712"];
  function isAlreadyAppliedError(message) {
    return alreadyAppliedCodes.some((code) => message.includes(code));
  }

  let appliedNow = 0;
  let recordedExisting = 0;
  for (const file of pending) {
    const version = file.split("_")[0];
    const sqlPath = path.join(MIGRATIONS_DIR, file);
    const sql = await fs.readFile(sqlPath, "utf-8");
    process.stdout.write(`  ${file} ... `);
    let appliedSuccessfully = false;
    try {
      await runSql(sql);
      appliedSuccessfully = true;
    } catch (err) {
      if (isAlreadyAppliedError(err.message)) {
        console.log("ALREADY APPLIED (recording)");
        recordedExisting++;
      } else {
        console.log("FAILED");
        console.error(`\n  Error in ${file}:\n  ${err.message}\n`);
        process.exit(1);
      }
    }
    const escapedName = file
      .replace(/\.sql$/, "")
      .replace(/^[0-9]+_/, "")
      .replace(/'/g, "''");
    await runSql(
      `insert into supabase_migrations.schema_migrations (version, name) values ('${version}', '${escapedName}') on conflict (version) do nothing;`
    );
    if (appliedSuccessfully) {
      console.log("OK");
      appliedNow++;
    }
  }
  console.log(
    `\nApplied ${appliedNow} migration(s). Recorded ${recordedExisting} as already-applied. Staging is current.`
  );
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
