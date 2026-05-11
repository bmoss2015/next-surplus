"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, getCurrentProfile } from "@/lib/auth/current-user";
import { STAGES, type Stage } from "@/lib/leads/types";
import { toProperCase } from "@/lib/format/proper-case";

// Resolves the signed-in user's id for activity attribution (null when there is
// no session — those rows render as "System").
async function currentUserId(): Promise<string | null> {
  const profile = await getCurrentProfile();
  return profile?.id ?? null;
}

// Validates and applies a stage transition. The DB triggers handle the activity
// log entry and stamp `stage_changed_at`.
export async function advanceStage(
  leadId: string,
  toStage: Stage,
  options?: { lostReason?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!STAGES.includes(toStage)) {
    return { ok: false, error: "Invalid stage" };
  }

  const update: Record<string, unknown> = { stage: toStage };
  if (toStage === "lost") {
    if (!options?.lostReason || options.lostReason.trim().length === 0) {
      return { ok: false, error: "Lost reason is required when marking lost" };
    }
    update.lost_reason = options.lostReason.trim();
  }

  const sb = await createClient();
  const { error } = await sb.from("leads").update(update).eq("id", leadId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { ok: true };
}

// Flags the lead for review without changing stage. Sets needs_action_flag
// + needs_action_note and writes a note-style activity row.
export async function pauseForReview(
  leadId: string,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const note = reason.trim();
  if (note.length === 0) {
    return { ok: false, error: "Reason is required to pause for review" };
  }

  const sb = await createClient();

  const { error: updateErr } = await sb
    .from("leads")
    .update({ needs_action_flag: true, needs_action_note: note })
    .eq("id", leadId);
  if (updateErr) return { ok: false, error: updateErr.message };

  const { error: actErr } = await sb.from("activities").insert({
    lead_id: leadId,
    activity_type: "note",
    payload: { kind: "review_pause", reason: note },
    user_id: await currentUserId(),
  });
  if (actErr) return { ok: false, error: actErr.message };

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { ok: true };
}

// Clears the needs_action flag (used when a Reviewed lead is decided on).
export async function clearReviewFlag(
  leadId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb
    .from("leads")
    .update({ needs_action_flag: false, needs_action_note: null })
    .eq("id", leadId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { ok: true };
}

// Adds a custom lost reason to the shared list. Idempotent: if a reason
// with the same case-insensitive label already exists, returns the existing
// canonical label. The label is also returned to the client so it can keep
// its local options list in sync without a re-fetch.
export async function addLostReason(
  rawLabel: string
): Promise<{ ok: true; label: string } | { ok: false; error: string }> {
  // Normalize to Proper Case so the dropdown stays consistent regardless of
  // how the user typed it. Acronyms in all-caps (DNC, IRS) are preserved.
  const label = toProperCase(rawLabel);
  if (label.length === 0) {
    return { ok: false, error: "Reason can't be empty" };
  }
  if (label.length > 200) {
    return { ok: false, error: "Reason is too long (max 200 characters)" };
  }

  const sb = await createClient();

  const { data: existing, error: lookupErr } = await sb
    .from("lost_reasons")
    .select("label")
    .ilike("label", label)
    .maybeSingle();
  if (lookupErr) return { ok: false, error: lookupErr.message };
  if (existing) {
    return { ok: true, label: existing.label as string };
  }

  const { data: inserted, error: insertErr } = await sb
    .from("lost_reasons")
    .insert({ label, is_default: false })
    .select("label")
    .single();
  if (insertErr) return { ok: false, error: insertErr.message };

  revalidatePath(`/leads`);
  return { ok: true, label: inserted.label as string };
}

// Archives a non-default lost reason (soft delete via archived=true).
// Default reasons cannot be archived from this UI — they're managed in Settings.
export async function archiveLostReason(
  label: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();

  const { data: existing, error: lookupErr } = await sb
    .from("lost_reasons")
    .select("id, is_default")
    .ilike("label", label)
    .maybeSingle();
  if (lookupErr) return { ok: false, error: lookupErr.message };
  if (!existing) {
    return { ok: false, error: "Reason not found" };
  }
  if (existing.is_default) {
    return {
      ok: false,
      error: "Default reasons can't be removed here. Manage them in Settings.",
    };
  }

  const { error } = await sb
    .from("lost_reasons")
    .update({ archived: true })
    .eq("id", existing.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/leads");
  return { ok: true };
}

// -- Soft delete (Fix 6) -----------------------------------------------------

export async function setLeadArchived(
  leadId: string,
  archived: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb.from("leads").update({ archived }).eq("id", leadId);
  if (error) return { ok: false, error: error.message };

  await sb.from("activities").insert({
    lead_id: leadId,
    activity_type: "note",
    payload: { kind: "note", body: archived ? "Lead archived." : "Lead restored from archive." },
    user_id: await currentUserId(),
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { ok: true };
}

// -- Overview body actions ---------------------------------------------------

export async function updateLeadField<K extends string>(
  leadId: string,
  field: K,
  value: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Whitelist editable fields; never let the client write arbitrary columns
  const ALLOWED: Record<string, true> = {
    research_notes: true,
    research_overall_findings: true,
    viability: true,
    closing_bid: true,
    opening_bid: true,
    outstanding_debt: true,
    court_costs: true,
    confirmed_surplus: true,
    recovery_fee_percent: true,
    attorney_cost: true,
    lead_source: true,
    attorney_id: true,
    assigned_to: true,
    court_records: true,
    custom_data: true,
    dnc: true,
    address: true,
    city: true,
    state: true,
    zip: true,
    county: true,
    sale_type: true,
    sale_date: true,
    case_number: true,
    recovery_type: true,
  };
  if (!ALLOWED[field]) {
    return { ok: false, error: `Field "${field}" is not editable here` };
  }

  const sb = await createClient();
  const { error } = await sb
    .from("leads")
    .update({ [field]: value })
    .eq("id", leadId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { ok: true };
}

export async function addVerificationItem(
  leadId: string,
  rawLabel: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const label = rawLabel.trim();
  if (label.length === 0) return { ok: false, error: "Label can't be empty" };
  const sb = await createClient();
  const { data, error } = await sb
    .from("verification_items")
    .insert({ lead_id: leadId, label })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leads/${leadId}`);
  return { ok: true, id: data.id as string };
}

export async function toggleVerificationItem(
  itemId: string,
  checked: boolean,
  leadId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb
    .from("verification_items")
    .update({ checked })
    .eq("id", itemId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function deleteVerificationItem(
  itemId: string,
  leadId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { error } = await sb
    .from("verification_items")
    .delete()
    .eq("id", itemId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

// -- Mailing addresses (channel = mailing_address contacts) ------------------

export async function addMailingAddress(
  leadId: string,
  ownerId: string,
  address: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = address.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Address can't be empty" };
  }
  const sb = await createClient();
  const { error } = await sb.from("contacts").insert({
    lead_id: leadId,
    owner_id: ownerId,
    channel: "mailing_address",
    value: trimmed,
    status: "untested",
    is_primary: false,
    mailed: false,
    mailed_at: null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function setMailingAddressMailed(
  contactId: string,
  mailed: boolean,
  leadId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb
    .from("contacts")
    .update({
      mailed,
      mailed_at: mailed ? new Date().toISOString() : null,
    })
    .eq("id", contactId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function deleteContact(
  contactId: string,
  leadId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { error } = await sb.from("contacts").delete().eq("id", contactId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function upsertContact(
  leadId: string,
  ownerId: string,
  contactId: string | null,
  patch: {
    channel?: "phone" | "email" | "mailing_address";
    value?: string;
    status?: "untested" | "valid" | "invalid" | "dnc";
    is_primary?: boolean;
    phone_type?: string | null;
    is_dnc?: boolean;
    is_litigator?: boolean;
    notes?: string | null;
  }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const sb = await createClient();
  if (contactId) {
    const { error } = await sb.from("contacts").update(patch).eq("id", contactId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/leads/${leadId}`);
    return { ok: true, id: contactId };
  } else {
    if (!patch.channel || !patch.value) {
      return { ok: false, error: "Channel and value are required" };
    }
    const { data, error } = await sb
      .from("contacts")
      .insert({
        lead_id: leadId,
        owner_id: ownerId,
        channel: patch.channel,
        value: patch.value,
        status: patch.status ?? "untested",
        is_primary: patch.is_primary ?? false,
        phone_type: patch.phone_type ?? null,
        is_dnc: patch.is_dnc ?? false,
        is_litigator: patch.is_litigator ?? false,
        notes: patch.notes ?? null,
        mailed: false,
        mailed_at: null,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/leads/${leadId}`);
    return { ok: true, id: data.id as string };
  }
}

// -- Owners ------------------------------------------------------------------

// Keep owners.is_deceased and owners.status consistent in both directions:
// picking "Deceased" sets the flag; picking any other status clears it; setting
// the flag forces status = 'deceased'. (A DB trigger also forces status when the
// flag is true, so we must clear the flag whenever the status moves away.)
function reconcileOwnerDeceased<T extends { status?: string; is_deceased?: boolean }>(
  patch: T
): T {
  if (patch.is_deceased === true) return { ...patch, status: "deceased", is_deceased: true };
  if (patch.status !== undefined) {
    return { ...patch, is_deceased: patch.status === "deceased" };
  }
  return patch;
}

export async function upsertOwner(
  leadId: string,
  ownerId: string | null,
  patch: {
    full_name?: string;
    status?: "living" | "deceased" | "unknown" | "incarcerated";
    date_of_death?: string | null;
    relationship?: string | null;
    is_primary?: boolean;
    is_deceased?: boolean;
    age?: number | null;
    notes?: string | null;
  }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const sb = await createClient();
  const reconciled = reconcileOwnerDeceased(patch);
  if (ownerId) {
    const { error } = await sb.from("owners").update(reconciled).eq("id", ownerId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/leads/${leadId}`);
    return { ok: true, id: ownerId };
  } else {
    if (!reconciled.full_name) return { ok: false, error: "Owner name is required" };
    const { data, error } = await sb
      .from("owners")
      .insert({
        lead_id: leadId,
        full_name: reconciled.full_name,
        status: reconciled.status ?? "unknown",
        date_of_death: reconciled.date_of_death ?? null,
        relationship: reconciled.relationship ?? null,
        is_primary: reconciled.is_primary ?? false,
        is_deceased: reconciled.is_deceased ?? false,
        age: reconciled.age ?? null,
        notes: reconciled.notes ?? null,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/leads/${leadId}`);
    return { ok: true, id: data.id as string };
  }
}

export async function deleteOwner(
  ownerId: string,
  leadId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { error } = await sb.from("owners").delete().eq("id", ownerId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

// -- Relatives (heirs, spouses, family who aren't on the deed) ----------------

export type RelativePatch = {
  full_name?: string;
  relationship?: string | null;
  age?: number | null;
  phone?: string | null;
  phone_type?: string | null;
  phone_is_dnc?: boolean;
  phone_is_litigator?: boolean;
  phone_2?: string | null;
  phone_2_type?: string | null;
  phone_2_is_dnc?: boolean;
  phone_2_is_litigator?: boolean;
  phone_3?: string | null;
  phone_3_type?: string | null;
  phone_3_is_dnc?: boolean;
  phone_3_is_litigator?: boolean;
  phone_4?: string | null;
  phone_4_type?: string | null;
  phone_4_is_dnc?: boolean;
  phone_4_is_litigator?: boolean;
  phone_5?: string | null;
  phone_5_type?: string | null;
  phone_5_is_dnc?: boolean;
  phone_5_is_litigator?: boolean;
  email?: string | null;
  email_2?: string | null;
  email_3?: string | null;
  email_4?: string | null;
  email_5?: string | null;
  notes?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

export async function upsertRelative(
  leadId: string,
  relativeId: string | null,
  patch: RelativePatch
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const sb = await createClient();
  if (relativeId) {
    const { error } = await sb
      .from("relatives")
      .update(patch)
      .eq("id", relativeId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/leads/${leadId}`);
    return { ok: true, id: relativeId };
  }
  const fullName = (patch.full_name ?? "").trim();
  if (!fullName) return { ok: false, error: "Name is required" };
  const { data, error } = await sb
    .from("relatives")
    .insert({ ...patch, lead_id: leadId, full_name: fullName })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leads/${leadId}`);
  return { ok: true, id: data.id as string };
}

export async function deleteRelative(
  relativeId: string,
  leadId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { error } = await sb.from("relatives").delete().eq("id", relativeId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

// -- Documents ---------------------------------------------------------------

const DOCUMENT_CATEGORIES = [
  "agreement",
  "id_copy",
  "deed",
  "court_filing",
  "settlement_statement",
  "other",
] as const;

export async function uploadDocument(
  formData: FormData
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const file = formData.get("file");
  const leadId = formData.get("leadId");
  const category = formData.get("category");
  const customNameRaw = formData.get("customName");

  if (!(file instanceof File)) {
    return { ok: false, error: "Missing file" };
  }
  if (typeof leadId !== "string" || !leadId) {
    return { ok: false, error: "Missing lead id" };
  }
  if (
    typeof category !== "string" ||
    !DOCUMENT_CATEGORIES.includes(category as (typeof DOCUMENT_CATEGORIES)[number])
  ) {
    return { ok: false, error: "Invalid category" };
  }
  const customName =
    typeof customNameRaw === "string" ? customNameRaw.trim() : "";
  if (category === "other" && customName.length === 0) {
    return { ok: false, error: "Document Name is required when category is Other" };
  }
  if (file.size === 0) {
    return { ok: false, error: "File is empty" };
  }
  if (file.size > 50 * 1024 * 1024) {
    return { ok: false, error: "File too large (max 50 MB)" };
  }

  const sb = await createClient();

  // Storage objects are scoped by org via a `<org_id>/...` path prefix (see the
  // documents bucket RLS policies). Derive the org from the lead.
  const { data: leadRow, error: leadErr } = await sb
    .from("leads")
    .select("org_id")
    .eq("id", leadId)
    .maybeSingle();
  if (leadErr) return { ok: false, error: leadErr.message };
  if (!leadRow) return { ok: false, error: "Lead not found" };

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${leadRow.org_id}/${leadId}/${Date.now()}_${safeName}`;

  const { error: uploadErr } = await sb.storage
    .from("documents")
    .upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
  if (uploadErr) return { ok: false, error: uploadErr.message };

  const { data: row, error: insertErr } = await sb
    .from("documents")
    .insert({
      lead_id: leadId,
      category,
      filename: file.name,
      custom_name: customName.length > 0 ? customName : null,
      storage_path: storagePath,
      received: true,
      required: false,
    })
    .select("id")
    .single();
  if (insertErr) return { ok: false, error: insertErr.message };

  await sb.from("activities").insert({
    lead_id: leadId,
    activity_type: "document_uploaded",
    payload: {
      filename: file.name,
      category,
      ...(customName.length > 0 ? { custom_name: customName } : {}),
    },
    user_id: await currentUserId(),
  });

  revalidatePath(`/leads/${leadId}`);
  return { ok: true, id: row.id as string };
}

export async function deleteDocument(
  documentId: string,
  leadId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { data: doc } = await sb
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .single();

  if (doc?.storage_path) {
    await sb.storage.from("documents").remove([doc.storage_path]);
  }

  const { error } = await sb.from("documents").delete().eq("id", documentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function getDocumentSignedUrl(
  storagePath: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const sb = await createClient();
  const { data, error } = await sb.storage
    .from("documents")
    .createSignedUrl(storagePath, 60); // 1 minute
  if (error) return { ok: false, error: error.message };
  return { ok: true, url: data.signedUrl };
}

// -- Notes -------------------------------------------------------------------
// v0 has no auth; use a fixed system user_id placeholder. When auth lands,
// switch to auth.uid() in a user-scoped client.

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function addNote(
  leadId: string,
  body: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const trimmed = body.trim();
  if (trimmed.length === 0) return { ok: false, error: "Note can't be empty" };

  const sb = await createClient();
  // Notes table requires user_id NOT NULL with FK to auth.users. Until auth is
  // wired we instead persist as an activity row of type='note'. The UI reads
  // notes from activities filtered by activity_type='note' (sans review_pause).
  const { data, error } = await sb
    .from("activities")
    .insert({
      lead_id: leadId,
      activity_type: "note",
      payload: { body: trimmed, kind: "note" },
      user_id: await currentUserId(),
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/leads/${leadId}`);
  return { ok: true, id: data.id as string };
}

export async function deleteNote(
  activityId: string,
  leadId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { error } = await sb.from("activities").delete().eq("id", activityId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

// -- Tasks (right rail "Add Task" card) --------------------------------------

export async function createLeadTask(input: {
  leadId: string;
  title: string;
  due_date: string | null;
  priority: "high" | "medium" | "low";
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Title is required" };
  if (!["high", "medium", "low"].includes(input.priority)) {
    return { ok: false, error: "Invalid priority" };
  }

  const sb = await createClient();
  const userId = await currentUserId();
  const { data, error } = await sb
    .from("tasks")
    .insert({
      title,
      due_date: input.due_date || null,
      due_time: null,
      priority: input.priority,
      source: "manual",
      lead_id: input.leadId,
      notes: null,
      user_id: userId,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await sb.from("activities").insert({
    lead_id: input.leadId,
    activity_type: "task_created",
    payload: { title, priority: input.priority },
    user_id: userId,
  });

  revalidatePath(`/leads/${input.leadId}`);
  revalidatePath("/tasks");
  return { ok: true, id: data.id as string };
}

// -- Liens (dynamic list; DB triggers keep leads.total_liens in sync) --------

export async function addLien(
  leadId: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const sb = await createClient();
  const { count } = await sb
    .from("liens")
    .select("*", { count: "exact", head: true })
    .eq("lead_id", leadId);
  const { data, error } = await sb
    .from("liens")
    .insert({ lead_id: leadId, name: "", amount: 0, position: count ?? 0 })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { ok: true, id: data.id as string };
}

export async function updateLien(
  lienId: string,
  leadId: string,
  patch: { name?: string; amount?: number | null }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.amount !== undefined) update.amount = patch.amount ?? 0;
  if (Object.keys(update).length === 0) return { ok: true };
  const sb = await createClient();
  const { error } = await sb.from("liens").update(update).eq("id", lienId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { ok: true };
}

export async function removeLien(
  lienId: string,
  leadId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb.from("liens").delete().eq("id", lienId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { ok: true };
}

// -- Research (per-step progress + overall findings) -------------------------

async function logResearchUpdate(
  sb: Awaited<ReturnType<typeof createClient>>,
  leadId: string,
  text: string
): Promise<void> {
  await sb.from("activities").insert({
    lead_id: leadId,
    activity_type: "research_update",
    payload: { text },
    user_id: await currentUserId(),
  });
}

export async function setResearchStepStatus(
  leadId: string,
  templateId: string,
  stepIndex: number,
  status: string,
  stepName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const VALID = ["Not Started", "In Progress", "Done", "Blocked"];
  if (!VALID.includes(status)) return { ok: false, error: "Invalid status" };
  const sb = await createClient();
  const { error } = await sb
    .from("research_step_progress")
    .upsert(
      {
        lead_id: leadId,
        template_id: templateId,
        step_index: stepIndex,
        status,
      },
      { onConflict: "lead_id,template_id,step_index" }
    );
  if (error) return { ok: false, error: error.message };
  await logResearchUpdate(sb, leadId, `${stepName} marked ${status}`);
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function saveResearchStepFindings(
  leadId: string,
  templateId: string,
  stepIndex: number,
  findings: string,
  stepName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb
    .from("research_step_progress")
    .upsert(
      {
        lead_id: leadId,
        template_id: templateId,
        step_index: stepIndex,
        findings: findings.trim() || null,
      },
      { onConflict: "lead_id,template_id,step_index" }
    );
  if (error) return { ok: false, error: error.message };
  await logResearchUpdate(sb, leadId, `${stepName} findings updated`);
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function saveOverallFindings(
  leadId: string,
  findings: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb
    .from("leads")
    .update({ research_overall_findings: findings.trim() || null })
    .eq("id", leadId);
  if (error) return { ok: false, error: error.message };
  await logResearchUpdate(sb, leadId, "Overall findings updated");
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}
