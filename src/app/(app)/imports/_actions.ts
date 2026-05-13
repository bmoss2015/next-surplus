"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { formatAddress, formatCity, normalizeAddressForMatch } from "@/lib/imports/format-address";
import {
  DEFAULT_LEAD_SOURCE,
  type IncomingLead,
  type ImportRelative,
  type ImportHistoryRow,
  type SavedSourceMapping,
  type ImportRowDecision,
} from "./_shared";

// Fix 94: build the fuzzy dedupe key for a row — normalized address + zip.
function dedupeKey(address: string, zip: string): string {
  return `${normalizeAddressForMatch(address)}|${(zip ?? "").trim()}`;
}

// Fix 94 / Fix 95: check every CSV row against existing leads using a fuzzy
// (normalized) address + zip match. Returns, for each input row, the matching
// existing lead id (or null). The caller keys back into this by row order.
export async function checkDuplicates(
  rows: Array<{ address: string; zip: string }>
): Promise<{ matches: Array<string | null> }> {
  const sb = await createClient();

  const zips = Array.from(new Set(rows.map((r) => (r.zip ?? "").trim()).filter(Boolean)));
  if (zips.length === 0) return { matches: rows.map(() => null) };

  const { data } = await sb.from("leads").select("id, address, zip").in("zip", zips);

  // normalizedKey -> existing lead id (first wins on the rare collision).
  const existing = new Map<string, string>();
  for (const l of data ?? []) {
    const key = dedupeKey(l.address as string, l.zip as string);
    if (!existing.has(key)) existing.set(key, l.id as string);
  }

  const matches = rows.map((r) => existing.get(dedupeKey(r.address, r.zip)) ?? null);
  return { matches };
}

// ---------------------------------------------------------------------------
// Fix 6: lead sources
// ---------------------------------------------------------------------------

export async function fetchLeadSources(): Promise<string[]> {
  const sb = await createClient();
  const { data } = await sb
    .from("lead_sources")
    .select("name")
    .order("name", { ascending: true });
  const names = (data ?? []).map((r) => r.name as string);
  // Defensive: make sure the standard ones are always offered even if seeding
  // hasn't run yet for this org.
  for (const std of ["Excess Elite", "Montgomery County", DEFAULT_LEAD_SOURCE]) {
    if (!names.includes(std)) names.push(std);
  }
  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
}

export async function addLeadSource(
  name: string
): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return { ok: false, error: "Source name cannot be empty." };
  const sb = await createClient();
  const { error } = await sb
    .from("lead_sources")
    .upsert({ name: trimmed }, { onConflict: "org_id,name", ignoreDuplicates: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true, name: trimmed };
}

// ---------------------------------------------------------------------------
// Fix 7: per-source column mapping memory
// ---------------------------------------------------------------------------

export async function fetchSourceMapping(
  leadSource: string
): Promise<SavedSourceMapping | null> {
  const source = (leadSource ?? "").trim();
  if (!source) return null;
  const sb = await createClient();
  const { data } = await sb
    .from("import_source_mappings")
    .select("mapping, dismissed_columns")
    .eq("lead_source", source)
    .maybeSingle();
  if (!data) return null;
  return {
    mapping: (data.mapping ?? {}) as Record<string, string>,
    dismissedColumns: (data.dismissed_columns ?? []) as string[],
  };
}

export async function saveSourceMapping(
  leadSource: string,
  mapping: Record<string, string>,
  dismissedColumns: string[]
): Promise<void> {
  const source = (leadSource ?? "").trim();
  if (!source) return;
  const sb = await createClient();
  await sb.from("import_source_mappings").upsert(
    {
      lead_source: source,
      mapping,
      dismissed_columns: dismissedColumns,
    },
    { onConflict: "org_id,lead_source" }
  );
}

// ---------------------------------------------------------------------------
// Fix 90: recovery type prefill lookup (state + sale_type -> recovery_type).
// ---------------------------------------------------------------------------

async function loadRecoveryTypeLookup(
  sb: Awaited<ReturnType<typeof createClient>>
): Promise<Map<string, string>> {
  const { data } = await sb
    .from("recovery_type_lookup")
    .select("state, sale_type, recovery_type");
  const map = new Map<string, string>();
  for (const r of data ?? []) {
    map.set(`${r.state as string}|${r.sale_type as string}`, r.recovery_type as string);
  }
  return map;
}

// Fix S: when there's no lookup entry, leave recovery_type NULL rather than
// writing the literal "unknown". The leads.recovery_type column is nullable,
// and writing a value the enum may not carry was failing the whole insert.
function resolveRecoveryType(
  lookup: Map<string, string>,
  state: string,
  saleType: string
): string | null {
  return lookup.get(`${state}|${saleType}`) ?? null;
}

// ---------------------------------------------------------------------------
// Import execution
// ---------------------------------------------------------------------------

// Fields on `leads` we are willing to (re)write from a CSV row.
const LEAD_WRITABLE_FIELDS = [
  "address",
  "city",
  "state",
  "zip",
  "county",
  "sale_type",
  "sale_date",
  "case_number",
  "parcel_number",
  "closing_bid",
  "opening_bid",
  "attorney_cost",
  "source_surplus",
  "lead_source",
  "recovery_type",
] as const;

function leadFieldsFromRow(
  row: IncomingLead,
  rowSource: string | null,
  recoveryType: string | null
): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    address: formatAddress(row.address),
    city: formatCity(row.city),
    state: row.state,
    zip: row.zip,
    county: row.county ?? null,
    sale_type: row.sale_type,
    sale_date: row.sale_date ?? null,
    case_number: row.case_number ?? null,
    // parcel_number is always plain text — never parseInt'd or coerced — so any
    // leading zeros survive the import.
    parcel_number: row.parcel_number ?? null,
    closing_bid: row.closing_bid ?? null,
    opening_bid: row.opening_bid ?? null,
    // Fix LLL: the figure the lead source reported, kept distinct from the
    // computed estimate and the county-confirmed surplus.
    source_surplus: row.source_surplus ?? null,
    lead_source: rowSource,
    recovery_type: recoveryType,
  };
  // leads.attorney_cost is NOT NULL with a default — only write it when the CSV
  // actually carried a value, otherwise leave the column (and its default) alone.
  if (row.attorney_cost != null) fields.attorney_cost = row.attorney_cost;
  return fields;
}

function isBlank(v: unknown): boolean {
  return v == null || (typeof v === "string" && v.trim() === "");
}

// Map a parsed relative onto a `relatives` table row. Phone 1 lives in `phone`
// / `phone_type` / `phone_is_dnc` / `phone_is_litigator`; phones 2..5 in
// `phone_2` … `phone_5` with the parallel `_type` / `_is_dnc` / `_is_litigator`
// columns. Emails 1..5 in `email` / `email_2` … `email_5`.
const RELATIVE_PHONE_COLUMNS = ["phone", "phone_2", "phone_3", "phone_4", "phone_5"] as const;
const RELATIVE_EMAIL_COLUMNS = ["email", "email_2", "email_3", "email_4", "email_5"] as const;

function relativeRowFromImport(
  leadId: string,
  r: ImportRelative
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    lead_id: leadId,
    // A relative row with phones/emails but no name is still imported; it shows
    // as "Unknown" in the UI (relatives.full_name is NOT NULL, so store it).
    full_name: r.full_name || "Unknown",
    relationship: r.relationship ?? null,
    age: r.age ?? null,
  };
  RELATIVE_PHONE_COLUMNS.forEach((base, i) => {
    const p = r.phones[i];
    out[base] = p ? p.value.trim() : null;
    out[`${base}_type`] = p ? (p.phone_type ?? null) : null;
    out[`${base}_is_dnc`] = p ? p.is_dnc : false;
    out[`${base}_is_litigator`] = p ? p.is_litigator : false;
  });
  RELATIVE_EMAIL_COLUMNS.forEach((base, i) => {
    out[base] = r.emails[i] ?? null;
  });
  return out;
}

// Fix NNNN: how the import wizard decides each row's lead_source.
//   "file"     — use the value from the mapped column; leave it null if blank.
//   "fallback" — use the column value, falling back to `fallbackSource` when blank.
//   "force"    — write `fallbackSource` on every row, ignoring the column.
export type ImportSourceMode = "file" | "fallback" | "force";

export async function importLeads(
  filename: string,
  rows: IncomingLead[],
  decisions: ImportRowDecision[],
  sourceMode: ImportSourceMode,
  fallbackSource: string | null
): Promise<
  | {
      ok: true;
      importId: string;
      imported: number;
      skipped: number;
      updatedBlank: number;
      replaced: number;
      contactsWritten: number;
    }
  | { ok: false; error: string }
> {
  const sb = await createClient();

  // Fix BB: imported leads are assigned to whoever ran the import.
  const actorId = (await getCurrentProfile())?.id ?? null;

  const fallback = (fallbackSource && fallbackSource.trim()) || null;
  // "force" always needs a concrete source; if one wasn't supplied, fall back
  // to the default so we never write a NULL source on every row.
  const forcedSource = sourceMode === "force" ? fallback || DEFAULT_LEAD_SOURCE : null;

  // Track every source name actually written so the dropdown's "named sources"
  // list stays current — including ones that only appear inside the file.
  const usedSources = new Set<string>();
  if (fallback) usedSources.add(fallback);
  if (forcedSource) usedSources.add(forcedSource);

  const recoveryLookup = await loadRecoveryTypeLookup(sb);

  // Create the import row
  const { data: importRow, error: importErr } = await sb
    .from("imports")
    .insert({
      filename,
      total_rows: rows.length,
      imported_count: 0,
      skipped_count: 0,
      status: "processing",
      user_id: actorId,
    })
    .select("id")
    .single();
  if (importErr) return { ok: false, error: importErr.message };

  let imported = 0;
  let skipped = 0;
  let updatedBlank = 0;
  let replaced = 0;
  // IMPORT SUMMARY: count of `contacts` rows actually written across all leads.
  let contactsWritten = 0;
  // Fix S: track per-row failures so we can log them and refuse to report a
  // bogus "success" when nothing actually landed in the database.
  let errors = 0;
  let firstError: string | null = null;
  const importRowsLog: Array<Record<string, unknown>> = [];

  const decisionByIndex = new Map<number, ImportRowDecision>();
  for (const d of decisions) decisionByIndex.set(d.index, d);

  // Helper: write the owner + contact rows for a freshly created/updated lead.
  // Returns the number of `contacts` rows actually inserted (0 on skip/error).
  async function writeContactsForLead(leadId: string, row: IncomingLead): Promise<number> {
    const ownerName = (row.owner_full_name ?? "").trim();
    const phones = (row.phones ?? []).filter((p) => p.value.trim());
    const emails = (row.emails ?? []).map((e) => e.trim()).filter(Boolean);
    const mailingAddresses = (row.mailing_addresses ?? [])
      .map((m) => m.trim())
      .filter(Boolean);

    if (
      !ownerName &&
      phones.length === 0 &&
      emails.length === 0 &&
      mailingAddresses.length === 0 &&
      !row.owner_deceased &&
      row.owner_age == null
    ) {
      return 0;
    }

    const { data: ownerRow, error: ownerErr } = await sb
      .from("owners")
      .insert({
        lead_id: leadId,
        full_name: ownerName || "Unknown Owner",
        is_primary: true,
        // The DB trigger forces status='deceased' when is_deceased is true, but
        // set it here too so the value is right regardless of trigger state.
        status: row.owner_deceased ? "deceased" : row.owner_living ? "living" : "unknown",
        is_deceased: row.owner_deceased,
        age: row.owner_age ?? null,
      })
      .select("id")
      .single();
    // Fix S: a failed owner insert never rolls back the lead row (separate
    // statement) — but log it so the cause is visible during debugging.
    if (ownerErr || !ownerRow) {
      console.error(
        `[importLeads] owner insert failed for lead ${leadId}: ${ownerErr?.message ?? "no row returned"}`
      );
      return 0;
    }

    // Fix 93: every mapped phone / email / mailing-address column becomes its
    // own contacts row — nothing overwrites a single shared value. Each phone
    // carries its Excess Elite line type + DNC / litigator classification.
    //
    // Fix PPPP2 Verification: every row carries the SAME set of keys. A
    // Supabase/PostgREST bulk insert with heterogeneous objects fills any key
    // missing from a given object with NULL — not the column default — so an
    // email or mailing-address row that omitted phone_type / is_dnc /
    // is_litigator was writing NULL into the NOT NULL `contacts.is_dnc` /
    // `is_litigator` columns and failing the whole insert (no phones, no
    // emails, no mailing address landed). phone_type stays null and the two
    // flags default to false for non-phone channels.
    const contactRow = (
      channel: "phone" | "email" | "mailing_address",
      value: string,
      isPrimary: boolean,
      phone?: { phone_type: string | null; is_dnc: boolean; is_litigator: boolean }
    ) => ({
      owner_id: ownerRow.id,
      lead_id: leadId,
      channel,
      value: value.trim(),
      status: "untested",
      is_primary: isPrimary,
      phone_type: phone?.phone_type ?? null,
      is_dnc: phone?.is_dnc ?? false,
      is_litigator: phone?.is_litigator ?? false,
    });
    const contactRows: Array<Record<string, unknown>> = [];
    phones.forEach((p, idx) => {
      contactRows.push(contactRow("phone", p.value, idx === 0, p));
    });
    emails.forEach((value, idx) => {
      contactRows.push(contactRow("email", value, idx === 0 && phones.length === 0));
    });
    // Fix AAAAA PART 6: each mailing address (including the one composed from the
    // Mailing Street / City / State / ZIP columns) is written as a contacts row
    // with channel='mailing_address' and owner_id set, so it shows up under the
    // owner on the Contacts tab and in the Mailing Addresses section.
    mailingAddresses.forEach((value) => {
      contactRows.push(contactRow("mailing_address", value, false));
    });
    let written = 0;
    if (contactRows.length > 0) {
      const { error: contactsErr } = await sb.from("contacts").insert(contactRows);
      if (contactsErr) {
        console.error(
          `[importLeads] contacts insert failed for lead ${leadId}: ${contactsErr.message}`
        );
      } else {
        written = contactRows.length;
      }
    }

    // GAP / edge case: a lead whose every phone contact is flagged DNC (and that
    // has at least one phone) is itself a do-not-call lead. Re-check across ALL
    // of the lead's phone contacts (this import may be appending to one that
    // already had phones) and only flip leads.dnc on — never off.
    if (written > 0 && phones.length > 0) {
      const { data: phoneContacts } = await sb
        .from("contacts")
        .select("is_dnc")
        .eq("lead_id", leadId)
        .eq("channel", "phone");
      if (
        phoneContacts &&
        phoneContacts.length > 0 &&
        phoneContacts.every((c) => c.is_dnc === true)
      ) {
        await sb
          .from("leads")
          .update({ dnc: true, dnc_logged_at: new Date().toISOString() })
          .eq("id", leadId);
      }
    }
    return written;
  }

  // Helper: write the relatives parsed off a CSV row. The relatives table now
  // carries up to 5 discrete phones (each with type / DNC / litigator) and 5
  // emails, so the parsed values map straight onto those columns.
  async function writeRelativesForLead(leadId: string, row: IncomingLead) {
    const relatives = (row.relatives ?? []).filter(
      (r) => r.full_name || r.phones.length > 0 || r.emails.length > 0
    );
    if (relatives.length === 0) return;
    const relativeRows = relatives.map((r) => relativeRowFromImport(leadId, r));
    const { error: relativesErr } = await sb.from("relatives").insert(relativeRows);
    if (relativesErr) {
      console.error(
        `[importLeads] relatives insert failed for lead ${leadId}: ${relativesErr.message}`
      );
    }
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const decision = decisionByIndex.get(i);

    // No decision, or an explicit "skip" decision -> skipped by the user.
    if (!decision || decision.action === "skip") {
      skipped += 1;
      importRowsLog.push({
        import_id: importRow.id,
        raw_row: row,
        action_taken: decision?.action === "skip" ? "skipped_duplicate" : "skipped_user",
        lead_id: null,
        dedupe_match_id:
          decision && decision.action === "skip" ? decision.existingLeadId : null,
      });
      continue;
    }

    const fileSource = (row.lead_source && row.lead_source.trim()) || null;
    const rowSource: string | null =
      sourceMode === "force"
        ? forcedSource
        : sourceMode === "fallback"
          ? fileSource || fallback
          : fileSource;
    if (rowSource) usedSources.add(rowSource);
    const recoveryType = resolveRecoveryType(recoveryLookup, row.state, row.sale_type);
    const fields = leadFieldsFromRow(row, rowSource, recoveryType);

    if (decision.action === "insert") {
      // NOTE: deliberately do NOT touch the liens column (junior_liens /
      // total_liens) — leave it to its default.
      const { data: leadRow, error: leadErr } = await sb
        .from("leads")
        .insert({ ...fields, assigned_to: actorId })
        .select("id")
        .single();

      if (leadErr || !leadRow?.id) {
        const msg = leadErr?.message ?? "insert returned no row";
        errors += 1;
        if (!firstError) firstError = msg;
        console.error(
          `[importLeads] lead insert failed (row ${i + 1}: ${row.address}, ${row.city} ${row.state} ${row.zip}): ${msg}`
        );
        importRowsLog.push({
          import_id: importRow.id,
          raw_row: row,
          action_taken: "error",
          error_message: msg,
        });
        continue;
      }

      imported += 1;
      importRowsLog.push({
        import_id: importRow.id,
        raw_row: row,
        action_taken: "imported",
        lead_id: leadRow.id,
      });
      contactsWritten += await writeContactsForLead(leadRow.id as string, row);
      await writeRelativesForLead(leadRow.id as string, row);
      continue;
    }

    // Duplicate resolution against an existing lead.
    const leadId = decision.existingLeadId;
    let patch: Record<string, unknown>;

    if (decision.action === "replace_all") {
      patch = { ...fields };
    } else {
      // update_blank: only fill columns that are currently null/empty.
      const { data: current } = await sb
        .from("leads")
        .select(LEAD_WRITABLE_FIELDS.join(", "))
        .eq("id", leadId)
        .maybeSingle();
      patch = {};
      const currentRow = current as unknown as Record<string, unknown> | null;
      if (currentRow) {
        for (const f of LEAD_WRITABLE_FIELDS) {
          if (isBlank(currentRow[f]) && !isBlank(fields[f])) {
            patch[f] = fields[f];
          }
        }
      }
    }

    let updateErr: { message: string } | null = null;
    if (Object.keys(patch).length > 0) {
      const { error } = await sb.from("leads").update(patch).eq("id", leadId);
      updateErr = error;
    }

    if (updateErr) {
      errors += 1;
      if (!firstError) firstError = updateErr.message;
      console.error(
        `[importLeads] lead update failed (row ${i + 1}, existing lead ${leadId}): ${updateErr.message}`
      );
      importRowsLog.push({
        import_id: importRow.id,
        raw_row: row,
        action_taken: "error",
        error_message: updateErr.message,
        lead_id: leadId,
        dedupe_match_id: leadId,
      });
      continue;
    }

    if (decision.action === "replace_all") replaced += 1;
    else updatedBlank += 1;

    importRowsLog.push({
      import_id: importRow.id,
      raw_row: row,
      action_taken:
        decision.action === "replace_all" ? "updated_replace" : "updated_blank",
      lead_id: leadId,
      dedupe_match_id: leadId,
    });

    // Fix LLLL3 PART 3: record an explicit `lead_updated` activity for the
    // merged-into lead so the lead's history page no longer reads "Lead
    // Imported / today" (which would imply a brand-new record). Note: the
    // patch deliberately never touches imported_at, so the original first-
    // import timestamp survives unchanged regardless of merge strategy.
    await sb.from("activities").insert({
      lead_id: leadId,
      activity_type: "lead_updated",
      payload: {
        body:
          decision.action === "replace_all"
            ? "Lead data replaced via import"
            : "Lead updated via import — blank fields filled",
      },
      user_id: actorId,
    });

    // Contacts are additive — append the row's contact rows to the existing
    // lead rather than overwriting.
    contactsWritten += await writeContactsForLead(leadId, row);
    await writeRelativesForLead(leadId, row);
  }

  if (importRowsLog.length > 0) {
    await sb.from("import_rows").insert(importRowsLog);
  }

  // Make sure every source name we just wrote is in the picker list next time.
  if (usedSources.size > 0) {
    await sb
      .from("lead_sources")
      .upsert(
        [...usedSources].map((name) => ({ name })),
        { onConflict: "org_id,name", ignoreDuplicates: true }
      );
  }

  // Fix S: don't claim "completed" when nothing was written and rows failed —
  // mark the run "failed" and return an error so the wizard surfaces the cause
  // instead of a "0 leads imported" success popup.
  const wroteSomething = imported > 0 || updatedBlank > 0 || replaced > 0;
  const finalStatus = !wroteSomething && errors > 0 ? "failed" : "completed";
  await sb
    .from("imports")
    .update({
      imported_count: imported,
      skipped_count: skipped,
      status: finalStatus,
    })
    .eq("id", importRow.id);

  // Fix P / Fix 8: revalidate every Leads view so the new rows — and any new
  // states in the state filter — appear right away (the table moved to
  // /leads/table; Kanban is now /leads).
  revalidatePath("/imports");
  revalidatePath("/leads", "layout");

  if (finalStatus === "failed") {
    return {
      ok: false,
      error: `Import failed — no rows were written to the database${
        firstError ? ` (first error: ${firstError})` : ""
      }. Check the server console for details.`,
    };
  }

  return {
    ok: true,
    importId: importRow.id as string,
    imported,
    skipped,
    updatedBlank,
    replaced,
    contactsWritten,
  };
}

// ---------------------------------------------------------------------------
// Import history + revert (Fix 9)
// ---------------------------------------------------------------------------

export async function fetchImportHistory(): Promise<ImportHistoryRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("imports")
    .select(
      "id, filename, uploaded_at, total_rows, imported_count, skipped_count, status"
    )
    .order("uploaded_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as ImportHistoryRow[];
}

const REVERT_WINDOW_MS = 24 * 60 * 60 * 1000;
// Tolerance: a lead row is created with imported_at ≈ updated_at ≈ now(). Treat
// it as "edited after import" only if updated_at is meaningfully later.
const EDIT_TOLERANCE_MS = 2000;

async function classifyImportLeads(
  sb: Awaited<ReturnType<typeof createClient>>,
  importId: string
): Promise<{ removableIds: string[]; editedCount: number }> {
  const { data: rows } = await sb
    .from("import_rows")
    .select("lead_id")
    .eq("import_id", importId)
    .eq("action_taken", "imported")
    .not("lead_id", "is", null);

  const leadIds = Array.from(
    new Set((rows ?? []).map((r) => r.lead_id as string).filter(Boolean))
  );
  if (leadIds.length === 0) return { removableIds: [], editedCount: 0 };

  const { data: leads } = await sb
    .from("leads")
    .select("id, imported_at, updated_at")
    .in("id", leadIds);

  const removableIds: string[] = [];
  let editedCount = 0;
  for (const l of leads ?? []) {
    const importedAt = new Date(l.imported_at as string).getTime();
    const updatedAt = new Date(l.updated_at as string).getTime();
    if (updatedAt > importedAt + EDIT_TOLERANCE_MS) {
      editedCount += 1;
    } else {
      removableIds.push(l.id as string);
    }
  }
  return { removableIds, editedCount };
}

export async function previewRevertImport(
  importId: string
): Promise<
  | { ok: true; removable: number; edited: number }
  | { ok: false; error: string }
> {
  const sb = await createClient();
  const { data: imp, error } = await sb
    .from("imports")
    .select("uploaded_at")
    .eq("id", importId)
    .single();
  if (error || !imp) return { ok: false, error: "Import not found." };
  if (Date.now() - new Date(imp.uploaded_at as string).getTime() > REVERT_WINDOW_MS) {
    return { ok: false, error: "Revert window expired" };
  }
  const { removableIds, editedCount } = await classifyImportLeads(sb, importId);
  return { ok: true, removable: removableIds.length, edited: editedCount };
}

export async function revertImport(
  importId: string
): Promise<
  | { ok: true; removed: number; edited: number }
  | { ok: false; error: string }
> {
  const sb = await createClient();
  const { data: imp, error } = await sb
    .from("imports")
    .select("uploaded_at")
    .eq("id", importId)
    .single();
  if (error || !imp) return { ok: false, error: "Import not found." };
  if (Date.now() - new Date(imp.uploaded_at as string).getTime() > REVERT_WINDOW_MS) {
    return { ok: false, error: "Revert window expired" };
  }

  const { removableIds, editedCount } = await classifyImportLeads(sb, importId);

  if (removableIds.length > 0) {
    // Revert is available to anyone within the 24h window — not just admins —
    // but `leads` DELETE is admin-only under RLS. The ids here were derived
    // entirely from RLS-scoped reads above (this import's rows, this org's
    // leads), so deleting exactly those via the service client stays scoped to
    // the caller's org while letting non-admins undo a recent import.
    const admin = createServiceClient();
    const { error: delErr } = await admin.from("leads").delete().in("id", removableIds);
    if (delErr) return { ok: false, error: delErr.message };
  }

  await sb.from("imports").update({ status: "cancelled" }).eq("id", importId);

  revalidatePath("/imports");
  revalidatePath("/leads", "layout");
  return { ok: true, removed: removableIds.length, edited: editedCount };
}
