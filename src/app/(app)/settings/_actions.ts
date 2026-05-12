"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentProfile, requireAdmin } from "@/lib/auth/current-user";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

// -- Team / invites ----------------------------------------------------------

export async function inviteMember(
  email: string,
  role: "admin" | "member",
  fullName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) {
    return { ok: false, error: "Only admins can invite members" };
  }
  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
    return { ok: false, error: "Enter a valid email address" };
  }
  const cleanName = (fullName ?? "").trim().replace(/\s+/g, " ");
  if (cleanName.length === 0) {
    return { ok: false, error: "First and last name are required" };
  }
  // Only "admin" and "member" are valid roles — anything else (including a
  // missing/garbled value) falls back to "member". Admin is never granted
  // unless it was explicitly selected.
  const safeRole: "admin" | "member" = role === "admin" ? "admin" : "member";

  // inviteUserByEmail sends the invite email and stamps the org + role + full
  // name into the new user's metadata; the on_auth_user_created trigger turns
  // that into a profile row, so the invitee lands in the right org with their
  // name already set.
  const admin = createServiceClient();
  const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(cleanEmail, {
    data: { org_id: profile.orgId, role: safeRole, full_name: cleanName },
    redirectTo: `${SITE_URL}/accept-invite`,
  });
  if (error) return { ok: false, error: error.message };

  // Fix P / Fix 9: don't rely solely on the auth trigger — write the chosen
  // role straight onto the profile (service client, bypasses RLS) so the role
  // pill in the Team section always reflects what was selected at invite time.
  const invitedId = invited?.user?.id;
  if (invitedId) {
    await admin.from("profiles").upsert(
      {
        id: invitedId,
        org_id: profile.orgId,
        role: safeRole,
        full_name: cleanName,
        email: cleanEmail,
      },
      { onConflict: "id" }
    );
  }
  revalidatePath("/settings");
  return { ok: true };
}

export async function setMemberRole(
  userId: string,
  role: "admin" | "member"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) return { ok: false, error: "Only admins can change roles" };
  if (userId === profile.id) {
    return { ok: false, error: "You can't change your own role" };
  }
  const safeRole: "admin" | "member" = role === "admin" ? "admin" : "member";
  const sb = await createClient();
  const { error } = await sb.from("profiles").update({ role: safeRole }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

// -- App settings ------------------------------------------------------------

export async function updateAppSetting(
  key: "default_recovery_fee_percent" | "default_attorney_cost" | "surplus_floor",
  value: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  // app_settings rows are seeded per org; RLS scopes this update to the
  // caller's org, so a plain update by key hits exactly their row.
  const sb = await createClient();
  const { error } = await sb
    .from("app_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/leads");
  return { ok: true };
}

// -- Pipeline rules (Fix R) --------------------------------------------------

// Save (or clear) the "Needs Action" inactivity threshold. A positive integer
// enables automatic flagging after that many days of no activity; null / blank
// / anything non-positive disables it (the row is removed — absent reads the
// same as disabled).
export async function setNeedsActionThreshold(
  days: number | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  if (days != null && Number.isFinite(days) && days >= 1) {
    const value = Math.floor(days);
    const { error } = await sb
      .from("app_settings")
      .upsert(
        {
          key: "needs_action_days_threshold",
          value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "org_id,key" }
      );
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await sb
      .from("app_settings")
      .delete()
      .eq("key", "needs_action_days_threshold");
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/settings");
  revalidatePath("/leads");
  return { ok: true };
}

// -- Attorneys ---------------------------------------------------------------

export async function upsertAttorney(input: {
  id?: string | null;
  name: string;
  email: string | null;
  states_covered: string[];
  default_cost: number | null;
  notes: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (!input.name.trim()) return { ok: false, error: "Name is required" };
  const sb = await createClient();
  if (input.id) {
    const { error } = await sb
      .from("attorneys")
      .update({
        name: input.name,
        email: input.email,
        states_covered: input.states_covered,
        default_cost: input.default_cost,
        notes: input.notes,
      })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/settings");
    return { ok: true, id: input.id };
  } else {
    const { data, error } = await sb
      .from("attorneys")
      .insert({
        name: input.name,
        email: input.email,
        states_covered: input.states_covered,
        default_cost: input.default_cost,
        notes: input.notes,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/settings");
    return { ok: true, id: data.id as string };
  }
}

export async function deleteAttorney(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { error } = await sb.from("attorneys").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

// -- Lost reasons admin ------------------------------------------------------

export async function setLostReasonArchived(
  id: string,
  archived: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { error } = await sb
    .from("lost_reasons")
    .update({ archived })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/leads");
  return { ok: true };
}

export async function addLostReason(
  label: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const clean = label.trim();
  if (!clean) return { ok: false, error: "Enter a reason" };
  const sb = await createClient();
  const { data, error } = await sb
    .from("lost_reasons")
    .insert({ label: clean })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/leads");
  return { ok: true, id: data.id as string };
}

export async function deleteLostReason(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  // Look up the reason first so we can report its name and check usage. Leads
  // store the lost reason as plain text (leads.lost_reason), so we match on the
  // label rather than a foreign key.
  const { data: existing, error: lookupError } = await sb
    .from("lost_reasons")
    .select("label, is_default")
    .eq("id", id)
    .single();
  if (lookupError || !existing) {
    return { ok: false, error: lookupError?.message ?? "Reason not found" };
  }
  if (existing.is_default) {
    return {
      ok: false,
      error: "Default reasons can only be archived, not deleted.",
    };
  }
  const { count, error: countError } = await sb
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("lost_reason", existing.label as string);
  if (countError) return { ok: false, error: countError.message };
  const used = count ?? 0;
  if (used > 0) {
    return {
      ok: false,
      error: `This reason is used by ${used} leads. Reassign those leads before deleting.`,
    };
  }
  const { error } = await sb.from("lost_reasons").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/leads");
  return { ok: true };
}

// -- Templates --------------------------------------------------------------

export async function upsertTemplate(input: {
  id?: string | null;
  name: string;
  channel: "sms" | "email";
  state: string | null;
  subject: string | null;
  body: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (!input.name.trim() || !input.body.trim()) {
    return { ok: false, error: "Name and body are required" };
  }
  const sb = await createClient();
  if (input.id) {
    const { error } = await sb
      .from("templates")
      .update({
        name: input.name,
        channel: input.channel,
        state: input.state,
        subject: input.subject,
        body: input.body,
      })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/settings");
    return { ok: true, id: input.id };
  } else {
    const { data, error } = await sb
      .from("templates")
      .insert({
        name: input.name,
        channel: input.channel,
        state: input.state,
        subject: input.subject,
        body: input.body,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/settings");
    return { ok: true, id: data.id as string };
  }
}

export async function deleteTemplate(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { error } = await sb.from("templates").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

// -- Scripts (Fix 64) --------------------------------------------------------

export async function upsertScript(input: {
  id?: string | null;
  name: string;
  state: string | null;
  channel: "Call" | "SMS" | "Email";
  body: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (!input.name.trim()) return { ok: false, error: "Name is required" };
  const channel: "Call" | "SMS" | "Email" =
    input.channel === "SMS" || input.channel === "Email" ? input.channel : "Call";
  const sb = await createClient();
  if (input.id) {
    const { error } = await sb
      .from("scripts")
      .update({
        name: input.name.trim(),
        state: input.state,
        channel,
        body: input.body,
      })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/settings");
    return { ok: true, id: input.id };
  }
  const { data, error } = await sb
    .from("scripts")
    .insert({
      name: input.name.trim(),
      state: input.state,
      channel,
      body: input.body,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true, id: data.id as string };
}

export async function deleteScript(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { error } = await sb.from("scripts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

// -- State phone numbers (Fix 66) --------------------------------------------

export async function setStatePhoneNumber(
  state: string,
  phone: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const cleanState = state.trim().toUpperCase();
  if (!cleanState) return { ok: false, error: "State is required" };
  const cleanPhone = phone && phone.trim() ? phone.trim() : null;
  const sb = await createClient();
  const { error } = await sb
    .from("state_phone_numbers")
    .upsert({ state: cleanState, phone: cleanPhone }, { onConflict: "org_id,state" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

// -- Research templates (Fix 36) ---------------------------------------------

type ResearchStepInput = {
  name: string;
  url: string | null;
  instructions: string | null;
};

function cleanResearchSteps(steps: ResearchStepInput[]): ResearchStepInput[] {
  return steps
    .map((s) => ({
      name: (s.name ?? "").trim(),
      url: s.url && s.url.trim() ? s.url.trim() : null,
      instructions:
        s.instructions && s.instructions.trim() ? s.instructions.trim() : null,
    }))
    .filter((s) => s.name.length > 0);
}

export async function upsertResearchTemplate(input: {
  id?: string | null;
  name: string;
  state: string | null;
  sale_type: "TAX" | "MTG" | null;
  steps: ResearchStepInput[];
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (!input.name.trim()) return { ok: false, error: "Name is required" };
  const saleType: "TAX" | "MTG" | null =
    input.sale_type === "TAX" || input.sale_type === "MTG" ? input.sale_type : null;
  const steps = cleanResearchSteps(input.steps);
  const sb = await createClient();
  if (input.id) {
    const { error } = await sb
      .from("research_templates")
      .update({
        name: input.name.trim(),
        state: input.state,
        sale_type: saleType,
        steps,
      })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/settings");
    return { ok: true, id: input.id };
  }
  const { data, error } = await sb
    .from("research_templates")
    .insert({
      name: input.name.trim(),
      state: input.state,
      sale_type: saleType,
      steps,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true, id: data.id as string };
}

export async function deleteResearchTemplate(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { error } = await sb.from("research_templates").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}
