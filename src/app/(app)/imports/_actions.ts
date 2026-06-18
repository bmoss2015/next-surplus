"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentProfile } from "@/lib/auth/current-user";
type RelativePhoneBase = "phone" | "phone_2" | "phone_3" | "phone_4" | "phone_5";
import { formatAddress, formatCity, normalizeAddressForMatch } from "@/lib/imports/format-address";
import {
  parseAddressString,
  smartParseAddress,
  formatAddressForStorage,
} from "@/lib/mail/address";
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
// Fix CCCC4: `owner_full_name` is a selectable replace field but it lives on
// the `owners` table, so it's filtered out of the leads SELECT and merged in
// from a parallel query below.
const LEAD_REPLACE_COMPARE_COLUMNS = [
  "id",
  ...SELECTABLE_REPLACE_FIELDS.filter((f) => f !== "owner_full_name"),
  "outstanding_debt", // shown for context though it's not importable
].join(", ");

export async function fetchLeadsForReplaceSelect(
  leadIds: string[]
): Promise<Record<string, Record<string, unknown>>> {
  if (leadIds.length === 0) return {};
  const sb = await createClient();
  const [leadsRes, ownersRes] = await Promise.all([
    sb.from("leads").select(LEAD_REPLACE_COMPARE_COLUMNS).in("id", leadIds),
    sb
      .from("owners")
      .select("lead_id, full_name")
      .in("lead_id", leadIds)
      .eq("is_primary", true),
  ]);
  if (leadsRes.error) return {};
  const ownerByLead = new Map<string, string | null>();
  for (const o of (ownersRes.data ?? []) as Array<{
    lead_id: string;
    full_name: string | null;
  }>) {
    ownerByLead.set(o.lead_id, o.full_name);
  }
  const rows = (leadsRes.data ?? []) as unknown as Array<Record<string, unknown>>;
  const out: Record<string, Record<string, unknown>> = {};
  for (const row of rows) {
    const id = row.id as string | undefined;
    if (id) {
      out[id] = {
        ...row,
        owner_full_name: ownerByLead.get(id) ?? null,
      };
    }
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
  const profile = await getCurrentProfile();
  const actorId = profile?.id ?? null;
  const orgId = profile?.orgId ?? null;

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

  // Fix 3/4: every freshly imported lead needs a stage_id so it shows up
  // in the Kanban view and can be moved between columns. Look up the org's
  // first active stage once and reuse it on every insert. Migration 0139
  // also installs a trigger as a backstop.
  let defaultStageId: string | null = null;
  {
    const { data: firstStage } = await sb
      .from("org_stages")
      .select("id")
      .eq("is_active", true)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();
    defaultStageId = firstStage?.id ?? null;
  }

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

  // Collect IDs of phones inserted during this run so the post-import
  // validation only hits brand new rows — never the org's existing
  // untested backlog.
  const newPhoneContactIds: string[] = [];
  const newRelativeSlots: Array<{ relativeId: string; base: RelativePhoneBase }> = [];

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
  // Fix BBBB4: `updateExistingOwner` gates the in-place UPDATE of the
  // primary owner row. true only for `insert` (no existing anyway) and
  // `replace_all` (the user explicitly said "blind overwrite"). On
  // `update_blank` we leave the existing owner row alone.
  // Fix DDDD4: `replace_selected` no longer reaches this function at all —
  // it follows a surgical path that touches only the checked fields and
  // does its own minimal owner.full_name UPDATE when Owner Name was picked.
  async function writeContactsForLead(
    leadId: string,
    row: IncomingLead,
    updateExistingOwner: boolean
  ): Promise<{ written: number; errors: string[]; newPhoneContactIds: string[] }> {
    const ownerName = (row.owner_full_name ?? "").trim();
    const phones = (row.phones ?? []).filter((p) => p.value.trim());
    const emails = (row.emails ?? []).map((e) => e.trim()).filter(Boolean);
    const mailingAddresses = (row.mailing_addresses ?? [])
      .map((m) => m.trim())
      .filter(Boolean);

    const errors: string[] = [];
    let written = 0;
    // Track newly-inserted phone-channel contacts so the post-import
    // validation pass only hits brand new rows, not the org's whole untested
    // backlog.
    const newPhoneContactIds: string[] = [];

    if (
      !ownerName &&
      phones.length === 0 &&
      emails.length === 0 &&
      mailingAddresses.length === 0 &&
      !row.owner_deceased &&
      row.owner_age == null
    ) {
      return { written, errors, newPhoneContactIds };
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
      // Fix BBBB4: only blind-overwrite existing owner on insert / replace_all.
      if (updateExistingOwner) {
        const { error: updErr } = await sb
          .from("owners")
          .update(ownerPayload)
          .eq("id", existingOwner.id as string);
        if (updErr) {
          errors.push(`owner update failed (${updErr.message})`);
          return { written, errors, newPhoneContactIds };
        }
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
        return { written, errors, newPhoneContactIds };
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
        const { data, error } = await sb
          .from("contacts")
          .insert({
            owner_id: ownerId,
            lead_id: leadId,
            channel: "phone",
            value: p.value.trim(),
            status: "untested",
            is_primary: i === 0 && !ownerHasPhone,
            phone_type: p.phone_type ?? null,
            is_dnc: p.is_dnc,
            is_litigator: p.is_litigator,
          })
          .select("id")
          .single();
        if (error) {
          errors.push(
            `phone insert failed for "${p.value.trim()}" (${error.message})`
          );
        } else {
          written += 1;
          const insertedId = data?.id as string | undefined;
          if (insertedId) newPhoneContactIds.push(insertedId);
          if (norm) phoneIndex.set(norm, insertedId ?? "");
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
    //
    // Normalize each incoming value before insert so the Send Mail parser
    // (which requires "line1, city, ST ZIP") never gets a malformed row.
    // If it's already canonical → keep as-is. If smartParseAddress can
    // recover the structure → rewrite to canonical. If neither → store
    // the raw value so the user can fix it later via per-card Edit.
    for (const value of mailingAddresses) {
      let normalizedValue = value;
      if (!parseAddressString(value)) {
        const parsed = smartParseAddress(value);
        if (parsed) normalizedValue = formatAddressForStorage(parsed);
      }
      const norm = normalizedValue.toLowerCase().trim();
      if (mailingIndex.has(norm)) continue;
      const { error } = await sb.from("contacts").insert({
        owner_id: ownerId,
        lead_id: leadId,
        channel: "mailing_address",
        value: normalizedValue,
        status: "untested",
        is_primary: false,
        phone_type: null,
        is_dnc: false,
        is_litigator: false,
      });
      if (error) {
        errors.push(
          `mailing address insert failed for "${normalizedValue}" (${error.message})`
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
    return { written, errors, newPhoneContactIds };
  }

  // Fix NNNN3 PART 3: merge incoming relatives into the lead's existing
  // relatives instead of blindly appending. Existing relatives matched by
  // case-insensitive full_name get UPDATEd (age/relationship overwritten;
  // phone and email slots deduped by normalized digits / lowercased trim);
  // unmatched relatives are INSERTed. Prevents the duplicate explosion that
  // repeated replace imports of the same lead would otherwise produce.
  // Fix BBBB4: `updateExistingRelatives` mirrors the owner flag — true only on
  // `insert` / `replace_all`. On `replace_selected` / `update_blank` we insert
  // brand-new relatives but never overwrite an existing relative's fields.
  async function writeRelativesForLead(
    leadId: string,
    row: IncomingLead,
    updateExistingRelatives: boolean
  ): Promise<{ errors: string[]; newRelativeSlots: Array<{ relativeId: string; base: RelativePhoneBase }> }> {
    const errors: string[] = [];
    const newRelativeSlots: Array<{ relativeId: string; base: RelativePhoneBase }> = [];
    const incoming = (row.relatives ?? []).filter(
      (r) => r.full_name || r.phones.length > 0 || r.emails.length > 0
    );
    if (incoming.length === 0) return { errors, newRelativeSlots };

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
      // Fix BBBB4: existing relative matched by name — only merge in place
      // when the action allows it. Otherwise leave the row alone.
      if (match && !updateExistingRelatives) {
        continue;
      }
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
        const { data, error } = await sb
          .from("relatives")
          .insert(newRow)
          .select("id")
          .single();
        if (error) {
          errors.push(`relative insert failed for "${name}" (${error.message})`);
        } else {
          const insertedId = data?.id as string | undefined;
          if (insertedId) {
            // Validate only the slots that actually have a phone number.
            for (const base of RELATIVE_PHONE_COLUMNS) {
              const value = (newRow as Record<string, unknown>)[base];
              if (typeof value === "string" && value.trim().length > 0) {
                newRelativeSlots.push({ relativeId: insertedId, base: base as RelativePhoneBase });
              }
            }
          }
        }
      }
    }
    return { errors, newRelativeSlots };
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
      const insertPayload: Record<string, unknown> = { ...fields, assigned_to: actorId };
      if (defaultStageId) insertPayload.stage_id = defaultStageId;
      const { data: leadRow, error: leadErr } = await sb
        .from("leads")
        .insert(insertPayload)
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
        // Fix BBBB4: insert action — no prior owner/relative row, so
        // "update existing" is moot. Pass true for symmetry with replace_all.
        const cw = await writeContactsForLead(leadRow.id as string, row, true);
        contactsWritten += cw.written;
        newPhoneContactIds.push(...cw.newPhoneContactIds);
        const rw = await writeRelativesForLead(leadRow.id as string, row, true);
        newRelativeSlots.push(...rw.newRelativeSlots);
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
    // Fix FFFF4: snapshot the full lead row + the primary owner row before
    // any UPDATE runs so revertImport can restore them. Captured here at the
    // top of the duplicate-resolution path, used as importRowsLog.prior_state.
    const [{ data: priorLeadRow }, { data: priorOwnerRow }] = await Promise.all([
      sb.from("leads").select("*").eq("id", leadId).single(),
      sb
        .from("owners")
        .select("*")
        .eq("lead_id", leadId)
        .eq("is_primary", true)
        .maybeSingle(),
    ]);
    const priorState = {
      lead: (priorLeadRow as Record<string, unknown> | null) ?? null,
      owner: (priorOwnerRow as Record<string, unknown> | null) ?? null,
    };
    let patch: Record<string, unknown>;

    if (decision.action === "replace_all") {
      // Fix WWWW3: "Replace All Fields" is the blind path — overwrite every
      // importable field on the existing lead with the CSV row's value.
      // attorney_cost is included here when the CSV carried it (matches the
      // pre-VVVV3 behaviour of replace_all).
      patch = { ...fields };
    } else if (decision.action === "replace_selected") {
      // Fix WWWW3: "Replace Selected Fields" — only write the fields the
      // user explicitly confirmed on the field-selection screen. Anything
      // not in selectedFields is dropped from the patch — never written,
      // never blanked. attorney_cost (not in SELECTABLE_REPLACE_FIELDS) is
      // therefore never touched on a selected-replace either.
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

    // Fix WWWW3: both replace flavours count as a "replace" and write the
    // same activity body — only update_blank gets the blank-fill wording.
    const isReplace =
      decision.action === "replace_all" || decision.action === "replace_selected";
    if (isReplace) replaced += 1;
    else updatedBlank += 1;

    importRowsLog.push({
      import_id: importRow.id,
      raw_row: row,
      action_taken: isReplace ? "updated_replace" : "updated_blank",
      lead_id: leadId,
      dedupe_match_id: leadId,
      // Fix FFFF4: stash the pre-update snapshot so revertImport can roll
      // this row back to its prior state.
      prior_state: priorState,
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
        body: isReplace
          ? "Lead data replaced via import"
          : "Lead updated via import — blank fields filled",
      },
      user_id: actorId,
    });

    // Fix DDDD4: `replace_selected` is now surgical — touches ONLY the
    // leads-table columns the user explicitly checked + (optionally) the
    // owner's full_name when Owner Name was checked. No phone/email/mailing
    // merge, no relatives merge, no owner status/age/deceased overwrite.
    // The contact + relative merge logic only runs for `insert` (handled
    // above), `replace_all` (blind overwrite), and `update_blank`
    // (fill-blanks; BBBB4 already keeps existing owner intact).
    if (decision.action === "replace_selected") {
      if (decision.selectedFields.includes("owner_full_name")) {
        const ownerName = (row.owner_full_name ?? "").trim();
        if (ownerName) {
          const { data: existing } = await sb
            .from("owners")
            .select("id")
            .eq("lead_id", leadId)
            .eq("is_primary", true)
            .maybeSingle();
          if (existing) {
            const { error: updErr } = await sb
              .from("owners")
              .update({ full_name: ownerName })
              .eq("id", existing.id as string);
            if (updErr) {
              warnings.push(
                `Lead ${row.address} owner name update failed: ${updErr.message}`
              );
            }
          }
        }
      }
    } else {
      // Fix BBBB4: only `replace_all` is allowed to UPDATE an existing owner
      // row in place. `update_blank` (fill-blanks contract) attaches contacts
      // to whatever owner already exists but never overwrites the owner row.
      // Same gating applies to matched relatives.
      const updateExisting = decision.action === "replace_all";
      const cw = await writeContactsForLead(leadId, row, updateExisting);
      contactsWritten += cw.written;
      newPhoneContactIds.push(...cw.newPhoneContactIds);
      const rw = await writeRelativesForLead(leadId, row, updateExisting);
      newRelativeSlots.push(...rw.newRelativeSlots);
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

  // Phone validation provider was removed (R4). Imported phones now persist
  // with their stored validation status untouched; no background sweep runs.
  void orgId;
  void newPhoneContactIds;
  void newRelativeSlots;

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
// Fix FFFF4: for updated rows we don't have imported_at as an anchor (it
// holds the lead's original insert time, long before this import). Compare
// instead to the import's uploaded_at + a window big enough to cover a
// realistic batch's runtime. Anything later than that is treated as a
// post-import manual edit and skipped on restore.
const UPDATE_EDIT_TOLERANCE_MS = 60 * 1000;

type PriorState = {
  lead: Record<string, unknown> | null;
  owner: Record<string, unknown> | null;
};

async function classifyImportLeads(
  sb: Awaited<ReturnType<typeof createClient>>,
  importId: string,
  importUploadedAtIso: string
): Promise<{
  removableIds: string[];
  restorableUpdates: Array<{ lead_id: string; prior_state: PriorState }>;
  editedCount: number;
}> {
  const { data: rows } = await sb
    .from("import_rows")
    .select("lead_id, action_taken, prior_state")
    .eq("import_id", importId)
    .not("lead_id", "is", null);

  const insertedIds: string[] = [];
  const updatedRows: Array<{ lead_id: string; prior_state: PriorState }> = [];
  for (const r of (rows ?? []) as Array<{
    lead_id: string;
    action_taken: string;
    prior_state: PriorState | null;
  }>) {
    if (r.action_taken === "imported") {
      insertedIds.push(r.lead_id);
    } else if (
      (r.action_taken === "updated_replace" ||
        r.action_taken === "updated_blank") &&
      r.prior_state
    ) {
      updatedRows.push({ lead_id: r.lead_id, prior_state: r.prior_state });
    }
  }

  if (insertedIds.length === 0 && updatedRows.length === 0) {
    return { removableIds: [], restorableUpdates: [], editedCount: 0 };
  }

  const allLeadIds = Array.from(
    new Set([...insertedIds, ...updatedRows.map((u) => u.lead_id)])
  );
  const { data: leads } = await sb
    .from("leads")
    .select("id, imported_at, updated_at")
    .in("id", allLeadIds);
  const leadInfo = new Map<
    string,
    { imported_at: string; updated_at: string }
  >();
  for (const l of (leads ?? []) as Array<{
    id: string;
    imported_at: string;
    updated_at: string;
  }>) {
    leadInfo.set(l.id, { imported_at: l.imported_at, updated_at: l.updated_at });
  }

  const removableIds: string[] = [];
  const restorableUpdates: Array<{
    lead_id: string;
    prior_state: PriorState;
  }> = [];
  let editedCount = 0;

  // Inserted leads — delete unless edited after import.
  for (const id of insertedIds) {
    const info = leadInfo.get(id);
    if (!info) continue;
    const importedAt = new Date(info.imported_at).getTime();
    const updatedAt = new Date(info.updated_at).getTime();
    if (updatedAt > importedAt + EDIT_TOLERANCE_MS) {
      editedCount += 1;
    } else {
      removableIds.push(id);
    }
  }

  // Updated leads — restore from snapshot unless edited after this import.
  const importAnchor = new Date(importUploadedAtIso).getTime();
  for (const u of updatedRows) {
    const info = leadInfo.get(u.lead_id);
    if (!info) continue;
    const updatedAt = new Date(info.updated_at).getTime();
    if (updatedAt > importAnchor + UPDATE_EDIT_TOLERANCE_MS) {
      editedCount += 1;
    } else {
      restorableUpdates.push(u);
    }
  }

  return { removableIds, restorableUpdates, editedCount };
}

export async function previewRevertImport(
  importId: string
): Promise<
  | { ok: true; removable: number; restorable: number; edited: number }
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
  const { removableIds, restorableUpdates, editedCount } =
    await classifyImportLeads(sb, importId, imp.uploaded_at as string);
  return {
    ok: true,
    removable: removableIds.length,
    restorable: restorableUpdates.length,
    edited: editedCount,
  };
}

export async function revertImport(
  importId: string
): Promise<
  | { ok: true; removed: number; restored: number; edited: number }
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

  const { removableIds, restorableUpdates, editedCount } =
    await classifyImportLeads(sb, importId, imp.uploaded_at as string);

  // Revert is available to anyone within the 24h window — not just admins —
  // but `leads` DELETE is admin-only under RLS. The ids here were derived
  // entirely from RLS-scoped reads above (this import's rows, this org's
  // leads), so deleting / updating exactly those via the service client stays
  // scoped to the caller's org while letting non-admins undo a recent import.
  const admin = createServiceClient();

  if (removableIds.length > 0) {
    const { error: delErr } = await admin
      .from("leads")
      .delete()
      .in("id", removableIds);
    if (delErr) return { ok: false, error: delErr.message };
  }

  // Fix FFFF4: restore each updated lead + its primary owner from the
  // snapshot captured before the import ran. id / created_at / lead_id are
  // dropped from the patch so we never try to overwrite an identity column.
  let restoredCount = 0;
  for (const u of restorableUpdates) {
    const prior = u.prior_state;
    if (prior.lead) {
      const leadPatch: Record<string, unknown> = { ...prior.lead };
      delete leadPatch.id;
      delete leadPatch.created_at;
      const { error: leadErr } = await admin
        .from("leads")
        .update(leadPatch)
        .eq("id", u.lead_id);
      if (leadErr) {
        return { ok: false, error: `Restore failed: ${leadErr.message}` };
      }
    }
    if (prior.owner && prior.owner.id) {
      const ownerPatch: Record<string, unknown> = { ...prior.owner };
      const ownerId = ownerPatch.id as string;
      delete ownerPatch.id;
      delete ownerPatch.created_at;
      delete ownerPatch.lead_id;
      const { error: ownerErr } = await admin
        .from("owners")
        .update(ownerPatch)
        .eq("id", ownerId);
      if (ownerErr) {
        return { ok: false, error: `Owner restore failed: ${ownerErr.message}` };
      }
    }
    restoredCount += 1;
  }

  await sb.from("imports").update({ status: "cancelled" }).eq("id", importId);

  revalidatePath("/imports");
  revalidatePath("/leads", "layout");
  return {
    ok: true,
    removed: removableIds.length,
    restored: restoredCount,
    edited: editedCount,
  };
}
