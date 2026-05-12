"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
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

  // Fix OOOOO: Supabase Auth's built-in SMTP isn't configured for this project,
  // so we don't let it send the invite email. generateLink with type "invite"
  // still creates the user record and stamps the org + role + full name into the
  // metadata (the on_auth_user_created trigger turns that into a profile row, so
  // the invitee lands in the right org with their name already set) — it just
  // hands us the confirmation URL instead of mailing it. We then deliver that
  // link ourselves via the Resend API.
  const admin = createServiceClient();
  const { data: invited, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: cleanEmail,
    options: {
      data: { org_id: profile.orgId, role: safeRole, full_name: cleanName },
      redirectTo: `${SITE_URL}/accept-invite`,
    },
  });
  if (error) return { ok: false, error: error.message };

  const inviteUrl = invited?.properties?.action_link;
  if (!inviteUrl) {
    return { ok: false, error: "Could not generate the invite link" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: emailError } = await resend.emails.send({
    from: "bree@mossequitypartners.com",
    to: cleanEmail,
    subject: "You have been invited to Moss Equity Partners",
    html: `<div style="font-family:Inter,Arial,sans-serif;color:#0f1729;max-width:480px;margin:0 auto;padding:24px;">
  <h1 style="margin:0;font-size:20px;font-weight:600;color:#0a3d4a;">You Have Been Invited</h1>
  <p style="margin:20px 0 0;font-size:14px;line-height:1.6;">Hello ${cleanName},</p>
  <p style="margin:16px 0 0;font-size:14px;line-height:1.6;">An account has been created for you on the Moss Equity Partners portal using <strong>${cleanEmail}</strong>. Click the button below to set your password and finish signing in.</p>
  <p style="margin:24px 0 0;">
    <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(90deg,#0a3d4a,#0d6c7d);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:6px;">Accept Invite</a>
  </p>
  <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#64748b;">If the button does not work, copy and paste this link into your browser:<br>${inviteUrl}</p>
</div>`,
  });
  if (emailError) {
    return {
      ok: false,
      error: `Invite created but the email failed to send: ${emailError.message}`,
    };
  }

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

  // Capture the prior role for the audit entry, then write the change.
  const { data: prior } = await sb
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", userId)
    .maybeSingle();
  const fromRole = (prior?.role as string | null) ?? null;

  const { error } = await sb.from("profiles").update({ role: safeRole }).eq("id", userId);
  if (error) return { ok: false, error: error.message };

  // Fix JJ: audit sensitive permission changes (org_id defaults to auth_org_id()).
  await sb.from("audit_log").insert({
    actor_id: profile.id,
    action: "team_role_changed",
    payload: {
      target_user_id: userId,
      target_name: (prior?.full_name as string | null) ?? (prior?.email as string | null) ?? null,
      from_role: fromRole,
      to_role: safeRole,
    },
  });

  revalidatePath("/settings");
  return { ok: true };
}

// Fix GGG: remove a team member — deactivates them (admin-only, never yourself)
// and records it in the audit log. The team list filters out deactivated rows.
export async function removeMember(
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) return { ok: false, error: "Only admins can remove members" };
  if (userId === profile.id) return { ok: false, error: "You cannot remove yourself." };

  const sb = await createClient();
  const { data: prior } = await sb
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();

  const { error } = await sb
    .from("profiles")
    .update({ deactivated: true })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  await sb.from("audit_log").insert({
    actor_id: profile.id,
    action: "team_member_removed",
    payload: {
      target_user_id: userId,
      target_name: (prior?.full_name as string | null) ?? (prior?.email as string | null) ?? null,
    },
  });

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
