"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { formatAddress, formatCity, normalizeAddressForMatch } from "@/lib/imports/format-address";
import {
  DEFAULT_LEAD_SOURCE,
  normalizePhone,
  SELECTABLE_REPLACE_FIELDS,
  type IncomingLead,
  type ImportRelative,
  type ImportHistoryRow,
  type SavedSourceMapping,
  type ImportRowDecision,
  type SelectableReplaceField,
} from "./_shared";

// Fix VVVV3: the columns the field-selection screen reads off the existing
// lead so the user can see "current vs CSV" before confirming the replace.
const REPLACE_COMPARE_COLUMNS = [
  "id",
  ...SELECTABLE_REPLACE_FIELDS,
  "outstanding_debt", // shown for context though it's not importable
].join(", ");

export async function fetchLeadsForReplaceSelect(
  leadIds: string[]
): Promise<Record<string, Record<string, unknown>>> {
  if (leadIds.length === 0) return {};
  const sb = await createClient();
  const { data, error } = await sb
    .from("leads")
    .select(REPLACE_COMPARE_COLUMNS)
    .in("id", leadIds);
  if (error) return {};
  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  const out: Record<string, Record<string, unknown>> = {};
  for (const row of rows) {
    const id = row.id as string | undefined;
    if (id) out[id] = row;
  }
  return out;
}

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
      // Fix NNNN3 PART 5: per-lead warnings — non-fatal contact/relative
      // write failures that the user should see in the import summary.
      warnings: string[];
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
  // Fix NNNN3 PART 5: collected per-row warnings so the wizard can show the
  // user a list of leads whose contact / relative writes failed.
  const warnings: string[] = [];
  // Fix S: track per-row failures so we can log them and refuse to report a
  // bogus "success" when nothing actually landed in the database.
  let errors = 0;
  let firstError: string | null = null;
  const importRowsLog: Array<Record<string, unknown>> = [];

  const decisionByIndex = new Map<number, ImportRowDecision>();
  for (const d of decisions) decisionByIndex.set(d.index, d);

  // Fix NNNN3: write the owner + contact rows for a freshly created OR
  // existing lead, merging into whatever's already on the lead instead of
  // unconditionally inserting. The previous insert-only path tripped on the
  // partial unique index `owners_one_primary_per_lead` whenever an existing
  // lead already had a primary owner, then swallowed the unique-violation —
  // so every replace import silently failed to update owner/contact data.
  //
  // The return value reports written contact rows AND any per-field errors;
  // the caller surfaces those in the import summary so the user can act on
  // them instead of discovering missing data later.
  async function writeContactsForLead(
    leadId: string,
    row: IncomingLead
  ): Promise<{ written: number; errors: string[] }> {
    const ownerName = (row.owner_full_name ?? "").trim();
    const phones = (row.phones ?? []).filter((p) => p.value.trim());
    const emails = (row.emails ?? []).map((e) => e.trim()).filter(Boolean);
    const mailingAddresses = (row.mailing_addresses ?? [])
      .map((m) => m.trim())
      .filter(Boolean);

    const errors: string[] = [];
    let written = 0;

    if (
      !ownerName &&
      phones.length === 0 &&
      emails.length === 0 &&
      mailingAddresses.length === 0 &&
      !row.owner_deceased &&
      row.owner_age == null
    ) {
      return { written, errors };
    }

    // PART 1: resolve the primary owner. If one already exists for this lead
    // (the common case on replace_all/update_blank), UPDATE it in place; only
    // INSERT when none exists. Avoids tripping the partial unique index that
    // permits exactly one primary owner per lead.
    const ownerPayload = {
      full_name: ownerName || "Unknown Owner",
      status: row.owner_deceased
        ? "deceased"
        : row.owner_living
          ? "living"
          : "unknown",
      is_deceased: row.owner_deceased,
      age: row.owner_age ?? null,
    };

    const { data: existingOwner } = await sb
      .from("owners")
      .select("id")
      .eq("lead_id", leadId)
      .eq("is_primary", true)
      .maybeSingle();

    let ownerId: string;
    if (existingOwner) {
      const { error: updErr } = await sb
        .from("owners")
        .update(ownerPayload)
        .eq("id", existingOwner.id as string);
      if (updErr) {
        errors.push(`owner update failed (${updErr.message})`);
        return { written, errors };
      }
      ownerId = existingOwner.id as string;
    } else {
      const { data: ownerRow, error: ownerErr } = await sb
        .from("owners")
        .insert({ lead_id: leadId, is_primary: true, ...ownerPayload })
        .select("id")
        .single();
      if (ownerErr || !ownerRow) {
        errors.push(
          `owner insert failed (${ownerErr?.message ?? "no row returned"})`
        );
        return { written, errors };
      }
      ownerId = ownerRow.id as string;
    }

    // PART 2: merge contacts. Fetch every existing contact for this owner up
    // front so we can dedupe phone (by 10-digit normalized), email
    // (lowercased trim), and mailing_address (lowercased trim) without an
    // extra round-trip per row.
    const { data: existingContacts } = await sb
      .from("contacts")
      .select("id, channel, value")
      .eq("lead_id", leadId)
      .eq("owner_id", ownerId);

    const phoneIndex = new Map<string, string>();
    const emailIndex = new Map<string, string>();
    const mailingIndex = new Map<string, string>();
    for (const c of existingContacts ?? []) {
      const channel = c.channel as string;
      const value = (c.value as string) ?? "";
      if (channel === "phone") {
        const norm = normalizePhone(value);
        if (norm) phoneIndex.set(norm, c.id as string);
      } else if (channel === "email") {
        const norm = value.toLowerCase().trim();
        if (norm) emailIndex.set(norm, c.id as string);
      } else if (channel === "mailing_address") {
        const norm = value.trim().toLowerCase();
        if (norm) mailingIndex.set(norm, c.id as string);
      }
    }

    // Phones — dedupe by 10-digit normalized number. Update flags
    // (is_dnc/is_litigator/phone_type) on match, insert otherwise. The first
    // incoming phone takes is_primary when no phone exists for this owner.
    for (let i = 0; i < phones.length; i++) {
      const p = phones[i];
      const norm = normalizePhone(p.value);
      const existingId = norm ? phoneIndex.get(norm) : undefined;
      if (existingId) {
        const { error } = await sb
          .from("contacts")
          .update({
            is_dnc: p.is_dnc,
            is_litigator: p.is_litigator,
            phone_type: p.phone_type ?? null,
          })
          .eq("id", existingId);
        if (error) {
          errors.push(
            `phone update failed for "${p.value.trim()}" (${error.message})`
          );
        } else {
          written += 1;
        }
      } else {
        const ownerHasPhone = phoneIndex.size > 0;
        const { error } = await sb.from("contacts").insert({
          owner_id: ownerId,
          lead_id: leadId,
          channel: "phone",
          value: p.value.trim(),
          status: "untested",
          is_primary: i === 0 && !ownerHasPhone,
          phone_type: p.phone_type ?? null,
          is_dnc: p.is_dnc,
          is_litigator: p.is_litigator,
        });
        if (error) {
          errors.push(
            `phone insert failed for "${p.value.trim()}" (${error.message})`
          );
        } else {
          written += 1;
          if (norm) phoneIndex.set(norm, "");
        }
      }
    }

    // Emails — dedupe by lowercased trim. No update needed when present
    // (email rows carry no flags); insert when missing.
    for (let i = 0; i < emails.length; i++) {
      const value = emails[i];
      const norm = value.toLowerCase().trim();
      if (emailIndex.has(norm)) continue;
      const ownerHasContact = phoneIndex.size > 0 || emailIndex.size > 0;
      const { error } = await sb.from("contacts").insert({
        owner_id: ownerId,
        lead_id: leadId,
        channel: "email",
        value,
        status: "untested",
        is_primary: i === 0 && phones.length === 0 && !ownerHasContact,
        phone_type: null,
        is_dnc: false,
        is_litigator: false,
      });
      if (error) {
        errors.push(`email insert failed for "${value}" (${error.message})`);
      } else {
        written += 1;
        emailIndex.set(norm, "");
      }
    }

    // Mailing addresses — dedupe by lowercased trim so repeated imports of
    // the same lead don't accumulate identical mailing rows. Mailing has no
    // mergeable flags, so an existing match is a no-op.
    for (const value of mailingAddresses) {
      const norm = value.toLowerCase().trim();
      if (mailingIndex.has(norm)) continue;
      const { error } = await sb.from("contacts").insert({
        owner_id: ownerId,
        lead_id: leadId,
        channel: "mailing_address",
        value,
        status: "untested",
        is_primary: false,
        phone_type: null,
        is_dnc: false,
        is_litigator: false,
      });
      if (error) {
        errors.push(
          `mailing address insert failed for "${value}" (${error.message})`
        );
      } else {
        written += 1;
        mailingIndex.set(norm, "");
      }
    }

    // PART 4: DNC flag re-check — runs whenever this row brought any phone
    // data, regardless of whether the writes above were inserts or updates
    // (the previous gate on `written > 0` skipped the check after a replace
    // import where every phone matched an existing contact). Only flips the
    // flag on, never off.
    if (phones.length > 0) {
      const { data: allPhones } = await sb
        .from("contacts")
        .select("is_dnc")
        .eq("lead_id", leadId)
        .eq("channel", "phone");
      if (
        allPhones &&
        allPhones.length > 0 &&
        allPhones.every((c) => c.is_dnc === true)
      ) {
        const { error } = await sb
          .from("leads")
          .update({ dnc: true, dnc_logged_at: new Date().toISOString() })
          .eq("id", leadId);
        if (error) {
          errors.push(`dnc flag update failed (${error.message})`);
        }
      }
    }
    return { written, errors };
  }

  // Fix NNNN3 PART 3: merge incoming relatives into the lead's existing
  // relatives instead of blindly appending. Existing relatives matched by
  // case-insensitive full_name get UPDATEd (age/relationship overwritten;
  // phone and email slots deduped by normalized digits / lowercased trim);
  // unmatched relatives are INSERTed. Prevents the duplicate explosion that
  // repeated replace imports of the same lead would otherwise produce.
  async function writeRelativesForLead(
    leadId: string,
    row: IncomingLead
  ): Promise<{ errors: string[] }> {
    const errors: string[] = [];
    const incoming = (row.relatives ?? []).filter(
      (r) => r.full_name || r.phones.length > 0 || r.emails.length > 0
    );
    if (incoming.length === 0) return { errors };

    const { data: existing } = await sb
      .from("relatives")
      .select("*")
      .eq("lead_id", leadId);

    const byName = new Map<string, Record<string, unknown>>();
    for (const r of (existing ?? []) as Array<Record<string, unknown>>) {
      const key = ((r.full_name as string | null) ?? "").trim().toLowerCase();
      if (key) byName.set(key, r);
    }

    for (const rel of incoming) {
      const name = (rel.full_name ?? "Unknown").trim();
      const match = byName.get(name.toLowerCase());
      if (match) {
        // Merge into the existing relative row. Build the merged phone slots
        // by indexing existing slots by their normalized number, then
        // overlaying incoming phones (replace flags if the number was already
        // present, occupy the next slot otherwise). Cap at the slot count.
        type Slot = {
          value: string;
          type: string | null;
          is_dnc: boolean;
          is_litigator: boolean;
        };
        const phoneSlotMap = new Map<string, Slot>();
        for (const base of RELATIVE_PHONE_COLUMNS) {
          const raw = (match[base] as string | null) ?? "";
          const norm = normalizePhone(raw);
          if (norm && !phoneSlotMap.has(norm)) {
            phoneSlotMap.set(norm, {
              value: raw,
              type: (match[`${base}_type`] as string | null) ?? null,
              is_dnc: Boolean(match[`${base}_is_dnc`]),
              is_litigator: Boolean(match[`${base}_is_litigator`]),
            });
          }
        }
        for (const p of rel.phones) {
          const norm = normalizePhone(p.value);
          if (!norm) continue;
          phoneSlotMap.set(norm, {
            value: p.value.trim(),
            type: p.phone_type ?? null,
            is_dnc: p.is_dnc,
            is_litigator: p.is_litigator,
          });
        }
        const slots = Array.from(phoneSlotMap.values()).slice(
          0,
          RELATIVE_PHONE_COLUMNS.length
        );

        const emailMap = new Map<string, string>();
        for (const base of RELATIVE_EMAIL_COLUMNS) {
          const raw = ((match[base] as string | null) ?? "").trim();
          const norm = raw.toLowerCase();
          if (norm && !emailMap.has(norm)) emailMap.set(norm, raw);
        }
        for (const e of rel.emails) {
          const norm = e.toLowerCase().trim();
          if (!norm) continue;
          if (!emailMap.has(norm)) emailMap.set(norm, e);
        }
        const emailList = Array.from(emailMap.values()).slice(
          0,
          RELATIVE_EMAIL_COLUMNS.length
        );

        const mergedPayload: Record<string, unknown> = {
          relationship: rel.relationship ?? (match.relationship as string | null) ?? null,
          age: rel.age ?? (match.age as number | null) ?? null,
        };
        RELATIVE_PHONE_COLUMNS.forEach((base, idx) => {
          const s = slots[idx];
          mergedPayload[base] = s ? s.value : null;
          mergedPayload[`${base}_type`] = s ? s.type : null;
          mergedPayload[`${base}_is_dnc`] = s ? s.is_dnc : false;
          mergedPayload[`${base}_is_litigator`] = s ? s.is_litigator : false;
        });
        RELATIVE_EMAIL_COLUMNS.forEach((base, idx) => {
          mergedPayload[base] = emailList[idx] ?? null;
        });

        const { error } = await sb
          .from("relatives")
          .update(mergedPayload)
          .eq("id", match.id as string);
        if (error) {
          errors.push(`relative update failed for "${name}" (${error.message})`);
        }
      } else {
        const newRow = relativeRowFromImport(leadId, rel);
        const { error } = await sb.from("relatives").insert(newRow);
        if (error) {
          errors.push(`relative insert failed for "${name}" (${error.message})`);
        }
      }
    }
    return { errors };
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
      {
        const cw = await writeContactsForLead(leadRow.id as string, row);
        contactsWritten += cw.written;
        const rw = await writeRelativesForLead(leadRow.id as string, row);
        const rowErrors = [...cw.errors, ...rw.errors];
        if (rowErrors.length > 0) {
          warnings.push(
            `Lead ${row.address} imported but some contact data could not be written — check activity log`
          );
          for (const e of rowErrors) {
            console.error(`[importLeads] ${row.address}: ${e}`);
          }
        }
      }
      continue;
    }

    // Duplicate resolution against an existing lead.
    const leadId = decision.existingLeadId;
    let patch: Record<string, unknown>;

    if (decision.action === "replace_all") {
      // Fix VVVV3: only write the fields the user explicitly confirmed on the
      // "Select Fields to Replace" screen. Anything not in selectedFields is
      // dropped from the patch — never written, never blanked. attorney_cost
      // (not in SELECTABLE_REPLACE_FIELDS) is therefore never touched on a
      // replace either, which matches the screen's behaviour.
      const selected = new Set<SelectableReplaceField>(decision.selectedFields);
      patch = {};
      for (const f of SELECTABLE_REPLACE_FIELDS) {
        if (!selected.has(f)) continue;
        if (f in fields) {
          patch[f] = (fields as Record<string, unknown>)[f];
        }
      }
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

    // Fix NNNN3: contacts are merged (not appended) — owner row is upserted
    // by leads.is_primary, and each phone/email/mailing dedupes by its
    // normalized value before deciding insert-vs-update. Errors don't
    // silently disappear: they accumulate on `warnings` for the import
    // summary.
    {
      const cw = await writeContactsForLead(leadId, row);
      contactsWritten += cw.written;
      const rw = await writeRelativesForLead(leadId, row);
      const rowErrors = [...cw.errors, ...rw.errors];
      if (rowErrors.length > 0) {
        warnings.push(
          `Lead ${row.address} imported but some contact data could not be written — check activity log`
        );
        for (const e of rowErrors) {
          console.error(`[importLeads] ${row.address}: ${e}`);
        }
      }
    }
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
    warnings,
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
