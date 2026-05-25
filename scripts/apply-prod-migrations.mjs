#!/usr/bin/env node
// One-shot migration applier that hits Supabase's Management API
// directly. Uses a Personal Access Token (PAT) for auth — bypasses
// the DB-password / CLI auth path entirely, which is useful when
// the Vercel-Supabase password sync is broken.
//
// Setup:
//   1. Create a PAT at https://supabase.com/dashboard/account/tokens
//   2. Export it: export SUPABASE_PAT='sbp_...'
//   3. Run: node scripts/apply-prod-migrations.mjs
//
// Behavior:
//   - Reads every .sql file from supabase/migrations/
//   - Queries the prod schema_migrations table to find what's already
//     applied
//   - Applies the missing ones in order
//   - Inserts a schema_migrations row after each successful apply so
//     future `supabase db push` runs stay in sync
//   - Stops on first failure with the exact error from Supabase

import fs from "node:fs/promises";
import path from "node:path";

const PAT = process.env.SUPABASE_PAT;
const PROJECT_REF = "qvyhdexoicoppgrvvtov";
const MIGRATIONS_DIR = path.join(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/(\w):/, "$1:"),
  "..",
  "supabase",
  "migrations"
);
const API = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

if (!PAT) {
  console.error("Set SUPABASE_PAT env var first.");
  console.error("Create one at https://supabase.com/dashboard/account/tokens");
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
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return JSON.parse(text);
}

async function main() {
  console.log(`Reading migrations from ${MIGRATIONS_DIR}`);
  const files = (await fs.readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  console.log(`Found ${files.length} migration files.`);

  // Pull already-applied versions from prod. If the table doesn't
  // exist yet (very fresh project), the catch creates it.
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
      "Could not read schema_migrations (table may not exist yet). Will create it."
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
    console.log("Nothing to apply. Prod is current.");
    return;
  }
  console.log(`Pending: ${pending.length} migrations.`);

  // PostgreSQL SQLSTATE codes for "object already exists" — these
  // mean the migration was applied out-of-band at some point (SQL
  // editor, another tool) but not recorded in schema_migrations.
  // Treat them as "already done", record the version, and continue.
  const alreadyAppliedCodes = [
    "42P07", // duplicate_table
    "42710", // duplicate_object (functions, triggers, types)
    "42P06", // duplicate_schema
    "42701", // duplicate_column
    "42P03", // duplicate_cursor
    "42712", // duplicate_alias
  ];
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
        // Schema is already in this state — just record the version.
        console.log("ALREADY APPLIED (recording)");
        recordedExisting++;
      } else {
        console.log("FAILED");
        console.error(`\n  Error in ${file}:\n  ${err.message}\n`);
        process.exit(1);
      }
    }
    // Always record in schema_migrations so future CLI runs are in sync.
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
    `\nApplied ${appliedNow} migration(s). Recorded ${recordedExisting} as already-applied. Prod is current.`
  );
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
