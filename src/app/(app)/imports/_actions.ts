"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatAddress, formatCity } from "@/lib/imports/format-address";
import {
  DEFAULT_LEAD_SOURCE,
  type IncomingLead,
  type ImportHistoryRow,
  type SavedSourceMapping,
} from "./_shared";

export async function checkDuplicates(
  rows: Array<{ address: string; zip: string }>
): Promise<{ duplicates: Set<string> }> {
  const sb = await createClient();
  const keys = rows.map((r) => `${r.address.toLowerCase()}|${r.zip}`);

  // Pull all existing leads with the matching addresses for these ZIPs
  const zips = Array.from(new Set(rows.map((r) => r.zip).filter(Boolean)));
  if (zips.length === 0) return { duplicates: new Set() };

  const { data } = await sb
    .from("leads")
    .select("address, zip")
    .in("zip", zips);

  const existing = new Set(
    (data ?? []).map(
      (l) => `${(l.address as string).toLowerCase()}|${l.zip as string}`
    )
  );

  const dupes = new Set<string>();
  for (const k of keys) {
    if (existing.has(k)) dupes.add(k);
  }
  return { duplicates: dupes };
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
// Import execution
// ---------------------------------------------------------------------------

export async function importLeads(
  filename: string,
  rows: IncomingLead[],
  rowsToImport: number[], // indices into rows[]
  leadSource: string
): Promise<
  | { ok: true; importId: string; imported: number; skipped: number }
  | { ok: false; error: string }
> {
  const sb = await createClient();

  const batchSource = (leadSource && leadSource.trim()) || DEFAULT_LEAD_SOURCE;

  // Make sure the chosen source exists in the list for next time.
  await sb
    .from("lead_sources")
    .upsert({ name: batchSource }, { onConflict: "org_id,name", ignoreDuplicates: true });

  // Create the import row
  const { data: importRow, error: importErr } = await sb
    .from("imports")
    .insert({
      filename,
      total_rows: rows.length,
      imported_count: 0,
      skipped_count: 0,
      error_count: 0,
      status: "processing",
      user_id: null,
    })
    .select("id")
    .single();
  if (importErr) return { ok: false, error: importErr.message };

  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const importRowsLog: Array<Record<string, unknown>> = [];

  const importToSet = new Set(rowsToImport);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const isImporting = importToSet.has(i);

    if (!isImporting) {
      skipped += 1;
      importRowsLog.push({
        import_id: importRow.id,
        raw_row: row,
        action_taken: "skipped_user",
        lead_id: null,
        dedupe_match_id: null,
      });
      continue;
    }

    // Fix 10: format address + city before writing.
    const address = formatAddress(row.address);
    const city = formatCity(row.city);

    // A per-row mapped lead_source column overrides the batch source.
    const rowSource = (row.lead_source && row.lead_source.trim()) || batchSource;

    // NOTE: deliberately do NOT touch the liens column (junior_liens /
    // total_liens) — leave it to its default.
    const { data: leadRow, error: leadErr } = await sb
      .from("leads")
      .insert({
        address,
        city,
        state: row.state,
        zip: row.zip,
        county: row.county ?? null,
        sale_type: row.sale_type,
        sale_date: row.sale_date ?? null,
        closing_bid: row.closing_bid ?? null,
        opening_bid: row.opening_bid ?? null,
        confirmed_surplus: row.confirmed_surplus ?? null,
        lead_source: rowSource,
        assigned_to: null,
      })
      .select("id")
      .single();

    if (leadErr) {
      errors += 1;
      importRowsLog.push({
        import_id: importRow.id,
        raw_row: row,
        action_taken: "error",
        error_message: leadErr.message,
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

    // Owner: insert a primary owner if a name was mapped for this row.
    const ownerName = (row.owner_full_name ?? "").trim();
    const phones = (row.phones ?? []).map((p) => p.trim()).filter(Boolean);
    const email = (row.email ?? "").trim();

    if (ownerName || phones.length > 0 || email) {
      const { data: ownerRow } = await sb
        .from("owners")
        .insert({
          lead_id: leadRow.id,
          full_name: ownerName || "Unknown Owner",
          is_primary: true,
          status: "unknown",
        })
        .select("id")
        .single();

      if (ownerRow) {
        const contactRows: Array<Record<string, unknown>> = [];
        phones.forEach((value, idx) => {
          contactRows.push({
            owner_id: ownerRow.id,
            lead_id: leadRow.id,
            channel: "phone",
            value,
            status: "untested",
            is_primary: idx === 0,
          });
        });
        if (email) {
          contactRows.push({
            owner_id: ownerRow.id,
            lead_id: leadRow.id,
            channel: "email",
            value: email,
            status: "untested",
            is_primary: false,
          });
        }
        if (contactRows.length > 0) {
          await sb.from("contacts").insert(contactRows);
        }
      }
    }
  }

  if (importRowsLog.length > 0) {
    await sb.from("import_rows").insert(importRowsLog);
  }

  await sb
    .from("imports")
    .update({
      imported_count: imported,
      skipped_count: skipped,
      error_count: errors,
      status: "completed",
    })
    .eq("id", importRow.id);

  revalidatePath("/imports");
  revalidatePath("/leads");
  return {
    ok: true,
    importId: importRow.id as string,
    imported,
    skipped,
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
      "id, filename, uploaded_at, total_rows, imported_count, skipped_count, error_count, status"
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
    const { error: delErr } = await sb.from("leads").delete().in("id", removableIds);
    if (delErr) return { ok: false, error: delErr.message };
  }

  await sb.from("imports").update({ status: "cancelled" }).eq("id", importId);

  revalidatePath("/imports");
  revalidatePath("/leads");
  return { ok: true, removed: removableIds.length, edited: editedCount };
}
