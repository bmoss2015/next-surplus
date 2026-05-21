"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, getCurrentProfile } from "@/lib/auth/current-user";
import { STAGES, type Stage } from "@/lib/leads/types";
import { toProperCase } from "@/lib/format/proper-case";
import { validateSpecificPhones, type RelativePhoneBase } from "@/lib/phone-validate";

// Phone slots on the relatives table — used to reset per-slot validation
// state when a slot's value changes.
const RELATIVE_PHONE_BASES = ["phone", "phone_2", "phone_3", "phone_4", "phone_5"] as const satisfies readonly RelativePhoneBase[];

// Synchronous targeted validation for manual saves — validates ONLY the rows
// passed in and AWAITS the result so the action response carries the final
// status back to the client. ~500ms-1s per phone for Veriphone, fast enough
// to feel like part of the save instead of needing a background sweep.
// (Bulk imports stay async via after() since they can't block on N×500ms.)
async function runValidationFor(
  orgId: string | null,
  targets: {
    contactIds?: string[];
    relativeSlots?: Array<{ relativeId: string; base: RelativePhoneBase }>;
  }
): Promise<void> {
  if (!orgId) return;
  if ((!targets.contactIds || targets.contactIds.length === 0) && (!targets.relativeSlots || targets.relativeSlots.length === 0)) {
    return;
  }
  try {
    await validateSpecificPhones(orgId, targets);
  } catch (e) {
    console.error("[upsert] phone validation failed:", e);
  }
}

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

// Fix W: reopen a closed (lost/won) lead — put it back into the stage it was in
// right before it closed, read from the most recent stage_change activity (the
// DB trigger logs `{ from, to }` on every transition). Falls back to New Leads
// when that can't be determined.
export async function reopenLead(
  leadId: string
): Promise<{ ok: true; toStage: Stage } | { ok: false; error: string }> {
  const sb = await createClient();
  const { data: lead, error: leadErr } = await sb
    .from("leads")
    .select("stage")
    .eq("id", leadId)
    .single();
  if (leadErr || !lead) return { ok: false, error: leadErr?.message ?? "Lead not found" };
  const currentStage = lead.stage as Stage;
  if (currentStage !== "lost" && currentStage !== "won") {
    return { ok: false, error: "Lead is not closed." };
  }

  const { data: acts } = await sb
    .from("activities")
    .select("payload")
    .eq("lead_id", leadId)
    .eq("activity_type", "stage_change")
    .order("created_at", { ascending: false })
    .limit(1);
  const fromRaw = (acts?.[0]?.payload as Record<string, unknown> | undefined)?.from;
  const prior =
    typeof fromRaw === "string" && (STAGES as readonly string[]).includes(fromRaw)
      ? (fromRaw as Stage)
      : null;
  const toStage: Stage =
    prior && prior !== "lost" && prior !== "won" ? prior : "new_leads";

  const { error } = await sb.from("leads").update({ stage: toStage }).eq("id", leadId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads", "layout");
  return { ok: true, toStage };
}

// Flags the lead for review without changing stage. Fix XXXX: instead of a
// banner, this also auto-creates a high-priority "Needs Review" task (no due
// date) on the lead, so it surfaces at the top of the Tasks tab like any other
// high-priority task. Sets needs_action_flag + needs_action_note and writes a
// note-style activity row.
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

  // Auto-create the "Needs Review" task — but only if there isn't already an
  // open one on this lead.
  const { data: existing } = await sb
    .from("tasks")
    .select("id")
    .eq("lead_id", leadId)
    .eq("title", "Needs Review")
    .eq("completed", false)
    .limit(1);
  if (!existing || existing.length === 0) {
    await sb.from("tasks").insert({
      lead_id: leadId,
      title: "Needs Review",
      description: note,
      due_date: null,
      due_time: null,
      priority: "high",
      source: "system",
      completed: false,
      user_id: null,
    });
  }

  const { error: actErr } = await sb.from("activities").insert({
    lead_id: leadId,
    activity_type: "note",
    payload: { kind: "review_pause", reason: note },
    user_id: await currentUserId(),
  });
  if (actErr) return { ok: false, error: actErr.message };

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/tasks");
  return { ok: true };
}

// Clears the needs_action flag (used when a Reviewed lead is decided on).
// Fix XXXX / CCCCC: also completes any open "Needs Review" task on the lead and
// logs an activity entry.
export async function clearReviewFlag(
  leadId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb
    .from("leads")
    .update({ needs_action_flag: false, needs_action_note: null })
    .eq("id", leadId);
  if (error) return { ok: false, error: error.message };

  await sb
    .from("tasks")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("lead_id", leadId)
    .eq("title", "Needs Review")
    .eq("completed", false);

  await sb.from("activities").insert({
    lead_id: leadId,
    activity_type: "note",
    payload: { kind: "review_cleared", text: "Cleared the Needs Review flag" },
    user_id: await currentUserId(),
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/tasks");
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
  revalidatePath("/leads", "layout");
  return { ok: true };
}

// -- Hard delete (Fix U) -----------------------------------------------------
// Permanently removes the lead and every related record (owners, contacts,
// documents, activities, tasks, etc.) via the on-delete-cascade FKs. Not
// reversible. Admin-only (RLS also enforces this).
export async function hardDeleteLead(
  leadId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { error } = await sb.from("leads").delete().eq("id", leadId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads", "layout");
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
    source_surplus: true,
    recovery_fee_percent: true,
    attorney_cost: true,
    lead_source: true,
    attorney_id: true,
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
    parcel_number: true,
    data_source: true,
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

// Fix X: the Edit Lead modal saves all of its fields in one shot when the user
// clicks Save Changes (no more autosave-on-blur). One UPDATE; a tight whitelist.
export async function updateLeadCoreFields(
  leadId: string,
  patch: {
    address: string;
    city: string;
    state: string;
    zip: string;
    county: string | null;
    sale_type: string;
    sale_date: string | null;
    case_number: string | null;
    recovery_type: string | null;
    parcel_number: string | null;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!patch.address.trim()) return { ok: false, error: "Street Address is required" };
  if (!patch.city.trim()) return { ok: false, error: "City is required" };
  if (!patch.state.trim()) return { ok: false, error: "State is required" };
  if (!patch.zip.trim()) return { ok: false, error: "Zip is required" };

  const update = {
    address: patch.address.trim(),
    city: patch.city.trim(),
    state: patch.state,
    zip: patch.zip.trim(),
    county: patch.county,
    sale_type: patch.sale_type,
    sale_date: patch.sale_date,
    case_number: patch.case_number,
    recovery_type: patch.recovery_type,
    parcel_number: patch.parcel_number,
  };

  const sb = await createClient();
  const { error } = await sb.from("leads").update(update).eq("id", leadId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads", "layout");
  return { ok: true };
}

// Fix BB: assign / reassign a lead to a team member (or clear it) and log an
// `assignment_change` activity attributed to whoever made the change.
export async function assignLead(
  leadId: string,
  assigneeId: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();

  const { data: current } = await sb
    .from("leads")
    .select("assigned_to")
    .eq("id", leadId)
    .maybeSingle();
  const prev = (current?.assigned_to as string | null) ?? null;
  if (prev === assigneeId) return { ok: true };

  let fullName: string | null = null;
  if (assigneeId) {
    const { data: prof } = await sb
      .from("profiles")
      .select("full_name")
      .eq("id", assigneeId)
      .maybeSingle();
    fullName = (prof?.full_name as string | null) ?? null;
  }

  const { error } = await sb
    .from("leads")
    .update({ assigned_to: assigneeId })
    .eq("id", leadId);
  if (error) return { ok: false, error: error.message };

  await sb.from("activities").insert({
    lead_id: leadId,
    activity_type: "assignment_change",
    payload: assigneeId
      ? { assigned_to: assigneeId, full_name: fullName }
      : { assigned_to: null },
    user_id: await currentUserId(),
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads", "layout");
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

// Mailing addresses can belong to an owner, a relative, or a lead_party
// (migration 0119). The contacts table has a CHECK enforcing exactly one of
// owner_id / relative_id / lead_party_id is non-null, so the caller must
// specify which target the address belongs to via `target.kind`.
export type MailingAddressTarget =
  | { kind: "owner"; ownerId: string }
  | { kind: "relative"; relativeId: string }
  | { kind: "leadParty"; leadPartyId: string };

export async function addMailingAddress(
  leadId: string,
  target: MailingAddressTarget,
  address: string,
  // Full recipient label ("Jane Doe (Sister)" / "John Doe (Owner)" /
  // "ACME Title (Title Company)"). Display-only; derivable from the FK + the
  // related row's name. Stored so legacy readers without the join still get
  // a sensible label.
  recipientLabel?: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = address.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Address can't be empty" };
  }
  const sb = await createClient();
  const row: Record<string, unknown> = {
    lead_id: leadId,
    owner_id: target.kind === "owner" ? target.ownerId : null,
    relative_id: target.kind === "relative" ? target.relativeId : null,
    lead_party_id: target.kind === "leadParty" ? target.leadPartyId : null,
    channel: "mailing_address",
    value: trimmed,
    status: "untested",
    is_primary: false,
    mailed: false,
    mailed_at: null,
    recipient_label: recipientLabel?.trim() || null,
  };
  const { error } = await sb.from("contacts").insert(row);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function setMailingAddressMailed(
  contactId: string,
  mailed: boolean,
  leadId: string,
  address: string
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

  // Fix CC: log the mailer status flip on the lead's activity feed.
  const addr = (address ?? "").trim();
  await sb.from("activities").insert({
    lead_id: leadId,
    activity_type: "mailer_marked_sent",
    payload: {
      mailed,
      address: addr,
      text: mailed
        ? `Mailer Sent To ${addr}`
        : `Mailer Status Cleared For ${addr}`,
    },
    user_id: await currentUserId(),
  });

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

// Columns the client needs back to render the freshly-validated contact row
// without re-fetching the whole page.
const CONTACT_SELECT_COLUMNS =
  "id, owner_id, relative_id, lead_party_id, lead_id, channel, value, status, connection_status, source, last_attempted, is_primary, phone_type, is_dnc, is_litigator, mailed, mailed_at, recipient_label, validation_checked_at, validation_provider";

export async function upsertContact(
  leadId: string,
  ownerId: string,
  contactId: string | null,
  patch: {
    channel?: "phone" | "email" | "mailing_address";
    value?: string;
    status?: "untested" | "valid" | "invalid";
    is_primary?: boolean;
    phone_type?: string | null;
    is_dnc?: boolean;
    is_litigator?: boolean;
    recipient_label?: string | null;
  }
): Promise<
  { ok: true; id: string; row?: Record<string, unknown> | null } | { ok: false; error: string }
> {
  const sb = await createClient();
  const profile = await getCurrentProfile();
  const orgId = profile?.orgId ?? null;

  // When the value of a phone-channel row changes, reset its validation
  // state. patch overrides reset so an explicit pencil-edit status='valid'
  // still wins.
  const valueChanged = patch.value !== undefined;
  const resetValidation = valueChanged
    ? {
        status: "untested" as const,
        validation_checked_at: null,
        validation_provider: null,
        validation_raw: null,
      }
    : {};

  let resolvedId: string;
  if (contactId) {
    const { error } = await sb
      .from("contacts")
      .update({ ...resetValidation, ...patch })
      .eq("id", contactId);
    if (error) return { ok: false, error: error.message };
    resolvedId = contactId;
    if (valueChanged) {
      await runValidationFor(orgId, { contactIds: [contactId] });
    }
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
        recipient_label: patch.recipient_label ?? null,
        mailed: false,
        mailed_at: null,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    resolvedId = data.id as string;
    if (patch.channel === "phone") {
      await runValidationFor(orgId, { contactIds: [resolvedId] });
    }
  }

  // Fetch the row in its final state (post-validation) so the client can
  // replace its optimistic placeholder with the real status / metadata.
  const { data: refreshed } = await sb
    .from("contacts")
    .select(CONTACT_SELECT_COLUMNS)
    .eq("id", resolvedId)
    .maybeSingle();

  revalidatePath(`/leads/${leadId}`);
  return { ok: true, id: resolvedId, row: refreshed ?? null };
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
};

const RELATIVE_SELECT_COLUMNS =
  "id, lead_id, full_name, relationship, age, " +
  "phone, phone_type, phone_is_dnc, phone_is_litigator, phone_status, phone_validation_checked_at, phone_validation_provider, " +
  "phone_2, phone_2_type, phone_2_is_dnc, phone_2_is_litigator, phone_2_status, phone_2_validation_checked_at, phone_2_validation_provider, " +
  "phone_3, phone_3_type, phone_3_is_dnc, phone_3_is_litigator, phone_3_status, phone_3_validation_checked_at, phone_3_validation_provider, " +
  "phone_4, phone_4_type, phone_4_is_dnc, phone_4_is_litigator, phone_4_status, phone_4_validation_checked_at, phone_4_validation_provider, " +
  "phone_5, phone_5_type, phone_5_is_dnc, phone_5_is_litigator, phone_5_status, phone_5_validation_checked_at, phone_5_validation_provider, " +
  "email, email_2, email_3, email_4, email_5, " +
  "notes";

export async function upsertRelative(
  leadId: string,
  relativeId: string | null,
  patch: RelativePatch
): Promise<
  { ok: true; id: string; row?: Record<string, unknown> | null } | { ok: false; error: string }
> {
  const sb = await createClient();
  const profile = await getCurrentProfile();
  const orgId = profile?.orgId ?? null;

  const patchRecord = patch as Record<string, unknown>;
  const touchedPhoneSlots = RELATIVE_PHONE_BASES.filter(
    (base) => patchRecord[base] !== undefined
  );
  const resetSlots: Record<string, string | null> = {};
  for (const base of touchedPhoneSlots) {
    resetSlots[`${base}_status`] = "untested";
    resetSlots[`${base}_validation_checked_at`] = null;
    resetSlots[`${base}_validation_provider`] = null;
    resetSlots[`${base}_validation_raw`] = null;
  }

  let resolvedId: string;
  if (relativeId) {
    const { error } = await sb
      .from("relatives")
      .update({ ...resetSlots, ...patch })
      .eq("id", relativeId);
    if (error) return { ok: false, error: error.message };
    resolvedId = relativeId;
    const slotsToValidate = touchedPhoneSlots
      .filter((base) => typeof patchRecord[base] === "string" && (patchRecord[base] as string).trim().length > 0)
      .map((base) => ({ relativeId: resolvedId, base }));
    if (slotsToValidate.length > 0) {
      await runValidationFor(orgId, { relativeSlots: slotsToValidate });
    }
  } else {
    const fullName = (patch.full_name ?? "").trim();
    if (!fullName) return { ok: false, error: "Name is required" };
    const { data, error } = await sb
      .from("relatives")
      .insert({ ...resetSlots, ...patch, lead_id: leadId, full_name: fullName })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    resolvedId = data.id as string;
    const slotsToValidate = RELATIVE_PHONE_BASES.filter(
      (base) => typeof patchRecord[base] === "string" && (patchRecord[base] as string).trim().length > 0
    ).map((base) => ({ relativeId: resolvedId, base }));
    if (slotsToValidate.length > 0) {
      await runValidationFor(orgId, { relativeSlots: slotsToValidate });
    }
  }

  const { data: refreshed } = await sb
    .from("relatives")
    .select(RELATIVE_SELECT_COLUMNS)
    .eq("id", resolvedId)
    .maybeSingle();

  revalidatePath(`/leads/${leadId}`);
  return {
    ok: true,
    id: resolvedId,
    row: (refreshed as Record<string, unknown> | null) ?? null,
  };
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

// Fix MM: complete a task from the lead's right-rail Tasks card and log it on
// the lead's activity feed.
export async function completeLeadTask(
  taskId: string,
  leadId: string,
  title: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb
    .from("tasks")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", taskId);
  if (error) return { ok: false, error: error.message };

  await sb.from("activities").insert({
    lead_id: leadId,
    activity_type: "task_completed",
    payload: { title: title.trim() },
    user_id: await currentUserId(),
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/tasks");
  return { ok: true };
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

// -- Research (per-lead checklists + overall findings) -----------------------
// Fix JJJJ: a lead carries its own snapshot of one or more research checklists
// in lead_research_templates.steps (jsonb array of
// { name, url, instructions, done, findings }). Settings template edits never
// touch a lead that already has checklists.

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

type RawJsonStep = {
  name?: unknown;
  url?: unknown;
  instructions?: unknown;
  done?: unknown;
  findings?: unknown;
};

async function loadLeadResearchTemplate(
  sb: Awaited<ReturnType<typeof createClient>>,
  lrtId: string
): Promise<
  | { ok: true; lead_id: string; name: string; steps: RawJsonStep[] }
  | { ok: false; error: string }
> {
  const { data, error } = await sb
    .from("lead_research_templates")
    .select("lead_id, name, steps")
    .eq("id", lrtId)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Checklist not found" };
  return {
    ok: true,
    lead_id: data.lead_id as string,
    name: data.name as string,
    steps: Array.isArray(data.steps) ? (data.steps as RawJsonStep[]) : [],
  };
}

export async function setLeadResearchStepDone(
  leadResearchTemplateId: string,
  stepIndex: number,
  done: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const loaded = await loadLeadResearchTemplate(sb, leadResearchTemplateId);
  if (!loaded.ok) return loaded;
  const steps = [...loaded.steps];
  if (!steps[stepIndex]) return { ok: false, error: "Invalid step" };
  steps[stepIndex] = { ...steps[stepIndex], done };
  const { error } = await sb
    .from("lead_research_templates")
    .update({ steps })
    .eq("id", leadResearchTemplateId);
  if (error) return { ok: false, error: error.message };
  const stepName = String(steps[stepIndex].name ?? "Step");
  await logResearchUpdate(
    sb,
    loaded.lead_id,
    `${stepName} marked ${done ? "Done" : "Not Done"}`
  );
  revalidatePath(`/leads/${loaded.lead_id}`);
  return { ok: true };
}

export async function saveLeadResearchStepFindings(
  leadResearchTemplateId: string,
  stepIndex: number,
  findings: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const loaded = await loadLeadResearchTemplate(sb, leadResearchTemplateId);
  if (!loaded.ok) return loaded;
  const steps = [...loaded.steps];
  if (!steps[stepIndex]) return { ok: false, error: "Invalid step" };
  steps[stepIndex] = { ...steps[stepIndex], findings: findings.trim() || null };
  const { error } = await sb
    .from("lead_research_templates")
    .update({ steps })
    .eq("id", leadResearchTemplateId);
  if (error) return { ok: false, error: error.message };
  const stepName = String(steps[stepIndex].name ?? "Step");
  await logResearchUpdate(sb, loaded.lead_id, `${stepName} findings updated`);
  revalidatePath(`/leads/${loaded.lead_id}`);
  return { ok: true };
}

export async function setLeadResearchTemplateCollapsed(
  leadResearchTemplateId: string,
  collapsed: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb
    .from("lead_research_templates")
    .update({ collapsed })
    .eq("id", leadResearchTemplateId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

type NewLeadResearchTemplate = {
  id: string;
  sourceTemplateId: string | null;
  name: string;
  collapsed: boolean;
  steps: Array<{
    name: string;
    url: string | null;
    instructions: string | null;
    done: boolean;
    findings: string | null;
  }>;
};

export async function addResearchTemplateToLead(
  leadId: string,
  templateId: string
): Promise<{ ok: true; template: NewLeadResearchTemplate } | { ok: false; error: string }> {
  const sb = await createClient();
  const { data: tpl, error: e1 } = await sb
    .from("research_templates")
    .select("id, name, steps")
    .eq("id", templateId)
    .maybeSingle();
  if (e1) return { ok: false, error: e1.message };
  if (!tpl) return { ok: false, error: "Template not found" };

  // ZZZZ2 PART 5 item 8: never add the same Settings template to a lead twice.
  const { data: existing } = await sb
    .from("lead_research_templates")
    .select("id")
    .eq("lead_id", leadId)
    .eq("source_template_id", templateId)
    .maybeSingle();
  if (existing) return { ok: false, error: "This template is already on the lead." };

  const { data: last } = await sb
    .from("lead_research_templates")
    .select("position")
    .eq("lead_id", leadId)
    .order("position", { ascending: false })
    .limit(1);
  const nextPos =
    last && last.length > 0 ? ((last[0].position as number) ?? 0) + 1 : 0;

  const steps = (Array.isArray(tpl.steps) ? (tpl.steps as RawJsonStep[]) : []).map((s) => ({
    name: String(s.name ?? ""),
    url: (s.url as string | null) ?? null,
    instructions: (s.instructions as string | null) ?? null,
    done: false,
    findings: null as string | null,
  }));

  const { data: inserted, error } = await sb
    .from("lead_research_templates")
    .insert({
      lead_id: leadId,
      source_template_id: tpl.id,
      name: tpl.name,
      position: nextPos,
      steps,
    })
    .select("id")
    .single();
  if (error || !inserted) return { ok: false, error: error?.message ?? "Insert failed" };

  // Adding a template manually also counts as initializing the tab.
  await sb.from("leads").update({ research_initialized: true }).eq("id", leadId);
  await logResearchUpdate(sb, leadId, `Added research checklist "${tpl.name}"`);
  revalidatePath(`/leads/${leadId}`);
  return {
    ok: true,
    template: {
      id: inserted.id as string,
      sourceTemplateId: tpl.id as string,
      name: tpl.name as string,
      collapsed: false,
      steps,
    },
  };
}

// Fix SSSS2 PART 1: drop one checklist (and all its steps/findings) from this
// lead only. The source template in Settings is untouched and can be re-added.
export async function removeResearchTemplateFromLead(
  leadResearchTemplateId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const loaded = await loadLeadResearchTemplate(sb, leadResearchTemplateId);
  if (!loaded.ok) return loaded;
  const { error } = await sb
    .from("lead_research_templates")
    .delete()
    .eq("id", leadResearchTemplateId);
  if (error) return { ok: false, error: error.message };
  await logResearchUpdate(
    sb,
    loaded.lead_id,
    `Removed research checklist "${loaded.name}"`
  );
  revalidatePath(`/leads/${loaded.lead_id}`);
  return { ok: true };
}

export async function saveOverallFindings(
  leadId: string,
  findings: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const trimmed = findings.trim();
  const { error } = await sb
    .from("leads")
    .update({ research_overall_findings: trimmed || null })
    .eq("id", leadId);
  if (error) return { ok: false, error: error.message };
  await logResearchUpdate(sb, leadId, "Overall findings updated");
  // Fix JJJJ: surface the full findings text in the Notes feed (attributed to
  // whoever saved it, timestamped by the activity row's created_at).
  if (trimmed) {
    await sb.from("activities").insert({
      lead_id: leadId,
      activity_type: "note",
      payload: { body: trimmed, kind: "note", source: "research_findings" },
      user_id: await currentUserId(),
    });
  }
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

// -- Data sources (Fix JJJJ2) -----------------------------------------------
// Org-scoped list backing the Property Info "Data Source" dropdown.

export async function fetchDataSources(): Promise<string[]> {
  const sb = await createClient();
  const { data } = await sb
    .from("data_sources")
    .select("name")
    .order("name", { ascending: true });
  return ((data ?? []) as Array<{ name: string }>).map((r) => r.name);
}

export async function addDataSource(
  name: string
): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Name cannot be empty" };
  const sb = await createClient();
  const { error } = await sb
    .from("data_sources")
    .upsert({ name: trimmed }, { onConflict: "org_id,name", ignoreDuplicates: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true, name: trimmed };
}

// -- Attorney assignment + default cost (Fix NNNN2) -------------------------
// Assigns (or clears) the lead's attorney. When applyDefaultCost is true and
// the attorney has a default_cost, the lead's attorney_cost is set to it. The
// caller (the AttorneyAssignment component) decides whether to apply the
// default: it does so automatically when no attorney cost is set yet, and only
// after the user confirms an override when one already is.
export async function assignAttorney(
  leadId: string,
  attorneyId: string | null,
  applyDefaultCost: boolean
): Promise<{ ok: true; attorneyCost: number | null } | { ok: false; error: string }> {
  const sb = await createClient();
  const update: Record<string, unknown> = { attorney_id: attorneyId };
  let newCost: number | null = null;
  if (attorneyId && applyDefaultCost) {
    const { data: att } = await sb
      .from("attorneys")
      .select("default_cost")
      .eq("id", attorneyId)
      .maybeSingle();
    const dc = att?.default_cost as number | null | undefined;
    if (dc != null) {
      newCost = dc;
      update.attorney_cost = dc;
    }
  }
  const { error } = await sb.from("leads").update(update).eq("id", leadId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { ok: true, attorneyCost: newCost };
}
