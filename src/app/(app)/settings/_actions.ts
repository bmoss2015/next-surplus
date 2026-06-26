"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentProfile, requireAdmin } from "@/lib/auth/current-user";
import {
  renderEmailShell,
  renderEmailButton,
  renderEmailEyebrow,
  renderEmailHeadline,
  renderEmailIntro,
  renderEmailDataBlock,
  escapeHtml,
} from "@/lib/email-template";

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_ENV === "production") {
    return "https://app.nextsurplus.com";
  }
  // Per-branch previews share the staging Supabase project, so the staging
  // alias is a valid invite/callback host even when the email was emitted
  // from a *.vercel.app preview. Prefer it over the per-deploy URL so the
  // links in transactional emails stay clean and stable.
  if (process.env.VERCEL_ENV) {
    return "https://staging.nextsurplus.com";
  }
  return "http://localhost:3000";
}
const SITE_URL = resolveSiteUrl();

// -- My Profile (self-edit) --------------------------------------------------

// Lets the signed-in user update their own display name and email. Both are
// required — the rest of the app assumes a profile row always has both
// (TeamSection, @mention picker, mention emails, audit log all read these).
// Email change uses the admin API so the auth user's email is updated
// immediately without a separate confirmation round-trip — staging UX choice.
export async function updateMyProfile(
  fullName: string,
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };

  const cleanName = (fullName ?? "").trim().replace(/\s+/g, " ");
  if (cleanName.length === 0) {
    return { ok: false, error: "Name is required" };
  }
  const cleanEmail = (email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
    return { ok: false, error: "Enter a valid email address" };
  }

  const admin = createServiceClient();

  // If the email is changing, refuse if some *other* auth user already owns it.
  if (cleanEmail !== (profile.email ?? "").toLowerCase()) {
    const existing = await findAuthUserByEmail(admin, cleanEmail);
    if (existing && existing.id !== profile.id) {
      return { ok: false, error: "That email address is already in use." };
    }
    const { error: authErr } = await admin.auth.admin.updateUserById(profile.id, {
      email: cleanEmail,
      email_confirm: true,
    });
    if (authErr) return { ok: false, error: authErr.message };
  }

  const { error: profileErr } = await admin
    .from("profiles")
    .update({ full_name: cleanName, email: cleanEmail })
    .eq("id", profile.id);
  if (profileErr) return { ok: false, error: profileErr.message };

  revalidatePath("/settings");
  return { ok: true };
}

// Lets the signed-in user change their own password. We require the current
// password (verified via a fresh, sessionless signInWithPassword against the
// anon endpoint — does not touch the caller's cookie session) so a walk-up
// attacker on an unlocked tab can't silently swap the credential. The actual
// update goes through the service client so we never have to refresh the
// user's session token.
export async function changeMyPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  if (!profile.email) return { ok: false, error: "Your account has no email on file" };

  if (typeof currentPassword !== "string" || currentPassword.length === 0) {
    return { ok: false, error: "Enter your current password" };
  }
  if (typeof newPassword !== "string" || newPassword.length < 12) {
    return { ok: false, error: "New password must be at least 12 characters" };
  }
  if (newPassword === currentPassword) {
    return { ok: false, error: "New password must be different from the current one" };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anon) {
    return { ok: false, error: "Auth is not configured" };
  }
  const verifier = createSupabaseClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: verifyErr } = await verifier.auth.signInWithPassword({
    email: profile.email,
    password: currentPassword,
  });
  if (verifyErr) {
    return { ok: false, error: "Current password is incorrect" };
  }

  const admin = createServiceClient();
  const { error: updateErr } = await admin.auth.admin.updateUserById(profile.id, {
    password: newPassword,
  });
  if (updateErr) return { ok: false, error: updateErr.message };

  return { ok: true };
}

// Used by the accept-invite page so the new user can confirm/correct the name
// the admin typed at invite time. Email is bound to the invite token and stays
// fixed — only the name is editable here, but it must be non-empty.
export async function completeInviteProfile(
  fullName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  const cleanName = (fullName ?? "").trim().replace(/\s+/g, " ");
  if (cleanName.length === 0) {
    return { ok: false, error: "First and last name are required" };
  }
  const admin = createServiceClient();
  const { error } = await admin
    .from("profiles")
    .update({ full_name: cleanName })
    .eq("id", profile.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// -- Team / invites ----------------------------------------------------------

// Look up an existing auth user by email. There's no admin "get by email", so we
// page through listUsers — team rosters are tiny, this is one request in practice.
async function findAuthUserByEmail(
  admin: ReturnType<typeof createServiceClient>,
  email: string
) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return null;
    const users = data?.users ?? [];
    const match = users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (match) return match;
    if (users.length < 100) return null;
  }
  return null;
}

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
  // hands us the token instead of mailing it.
  const admin = createServiceClient();

  // generateLink refuses an email that still has an auth user — which is exactly
  // what's left behind when someone is removed (legacy removeMember only
  // deactivated the profile) or after a stray manual deletion. Clear out any such
  // stale account first so the address can be re-invited; refuse only if the
  // email genuinely belongs to an active member.
  const existing = await findAuthUserByEmail(admin, cleanEmail);
  if (existing) {
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("org_id, deactivated")
      .eq("id", existing.id)
      .maybeSingle();
    const ownedByThisOrg = !existingProfile || existingProfile.org_id === profile.orgId;
    if (existingProfile && existingProfile.deactivated === false) {
      return {
        ok: false,
        error: ownedByThisOrg
          ? "That person is already on your team."
          : "That email address is already in use.",
      };
    }
    if (!ownedByThisOrg) {
      return { ok: false, error: "That email address is already in use." };
    }
    const { error: cleanupErr } = await admin.auth.admin.deleteUser(existing.id);
    if (cleanupErr) return { ok: false, error: cleanupErr.message };
  }

  const { data: invited, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: cleanEmail,
    options: {
      data: { org_id: profile.orgId, role: safeRole, full_name: cleanName },
      redirectTo: `${SITE_URL}/accept-invite`,
    },
  });
  if (error) return { ok: false, error: error.message };

  // Build the link to our own page carrying the single-use token hash, not
  // Supabase's verify URL. The accept-invite page calls verifyOtp() with this
  // hash, which establishes a session for the *invited* user (the action_link's
  // implicit-flow hash is ignored by the PKCE browser client, which is why the
  // page used to show whoever was already signed in).
  const tokenHash = invited?.properties?.hashed_token;
  if (!tokenHash) {
    return { ok: false, error: "Could not generate the invite link" };
  }
  const inviteUrl = `${SITE_URL}/accept-invite?token_hash=${encodeURIComponent(tokenHash)}&type=invite`;

  const { data: orgRow } = await admin
    .from("orgs")
    .select("name")
    .eq("id", profile.orgId)
    .maybeSingle();
  const orgName = (orgRow?.name as string | null)?.trim() || "your team";

  const resend = new Resend(process.env.RESEND_API_KEY);
  const inviteSubject = `Join ${orgName} on Next Surplus`;
  const inviteFirstName = cleanName.split(/\s+/)[0] || cleanName;
  const invitePreheader = `${profile.fullName} invited you to join ${orgName} on Next Surplus.`;
  const roleLabel = safeRole === "admin" ? "Admin" : "Member";
  const inviteBody = `
    ${renderEmailEyebrow("Team Invite")}
    ${renderEmailHeadline(`You've Been Invited to ${orgName}`)}
    ${renderEmailIntro(`${escapeHtml(profile.fullName)} added you to their workspace on Next Surplus. Accept the invite to set your password and sign in.`)}
    ${renderEmailDataBlock([
      { label: "Workspace", value: orgName },
      { label: "Invited By", value: profile.fullName },
      { label: "Your Role", value: roleLabel },
    ])}
    ${renderEmailButton({ href: inviteUrl, label: "Accept Invite" })}
  `;
  const inviteFooter = `You received this because ${escapeHtml(profile.fullName)} invited you to the ${escapeHtml(orgName)} team.`;
  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? "Next Surplus <noreply@nextsurplus.com>",
    to: cleanEmail,
    subject: inviteSubject,
    html: renderEmailShell({
      subject: inviteSubject,
      bodyHtml: inviteBody,
      preheader: invitePreheader,
      footerLine: inviteFooter,
    }),
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

// Fix GGG / Fix OOOOO: remove a team member (admin-only, never yourself) and
// record it in the audit log. We delete the auth user — the profile row cascades
// away — so the email address is freed and the person can be invited again later.
// (Previously this only set profiles.deactivated, which left the auth user behind
// and made every re-invite fail with "already been registered".) The audit entry
// keeps a snapshot of their name; FKs that pointed at the user are set null.
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

  const admin = createServiceClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
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

export async function resendInvite(
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) return { ok: false, error: "Only admins can resend invites" };
  if (userId === profile.id) return { ok: false, error: "You can't resend your own invite" };

  const admin = createServiceClient();
  const { data: target, error: targetErr } = await admin
    .from("profiles")
    .select("id, org_id, role, full_name, email")
    .eq("id", userId)
    .maybeSingle();
  if (targetErr) return { ok: false, error: targetErr.message };
  if (!target) return { ok: false, error: "That invite could not be found" };
  if (target.org_id !== profile.orgId) {
    return { ok: false, error: "That invite is not in your organization" };
  }

  const cleanEmail = (target.email as string | null)?.trim().toLowerCase();
  if (!cleanEmail) return { ok: false, error: "That invite has no email on file" };
  const cleanName = ((target.full_name as string | null) ?? "").trim();
  const safeRole: "admin" | "member" =
    target.role === "admin" ? "admin" : "member";

  const { error: cleanupErr } = await admin.auth.admin.deleteUser(userId);
  if (cleanupErr) return { ok: false, error: cleanupErr.message };

  const { data: invited, error: linkErr } = await admin.auth.admin.generateLink({
    type: "invite",
    email: cleanEmail,
    options: {
      data: { org_id: profile.orgId, role: safeRole, full_name: cleanName },
      redirectTo: `${SITE_URL}/accept-invite`,
    },
  });
  if (linkErr) return { ok: false, error: linkErr.message };

  const tokenHash = invited?.properties?.hashed_token;
  if (!tokenHash) return { ok: false, error: "Could not generate the invite link" };
  const inviteUrl = `${SITE_URL}/accept-invite?token_hash=${encodeURIComponent(tokenHash)}&type=invite`;

  const { data: orgRow } = await admin
    .from("orgs")
    .select("name")
    .eq("id", profile.orgId)
    .maybeSingle();
  const orgName = (orgRow?.name as string | null)?.trim() || "your team";

  const resend = new Resend(process.env.RESEND_API_KEY);
  const inviteSubject = `Join ${orgName} on Next Surplus`;
  const inviteFirstName = (cleanName || cleanEmail).split(/\s+/)[0] || cleanEmail;
  const invitePreheader = `${profile.fullName} resent your invite to join ${orgName} on Next Surplus.`;
  const roleLabel = safeRole === "admin" ? "Admin" : "Member";
  const inviteBody = `
    ${renderEmailEyebrow("Team Invite")}
    ${renderEmailHeadline(`You've Been Invited to ${orgName}`)}
    ${renderEmailIntro(`${escapeHtml(profile.fullName)} added you to their workspace on Next Surplus. Accept the invite to set your password and sign in.`)}
    ${renderEmailDataBlock([
      { label: "Workspace", value: orgName },
      { label: "Invited By", value: profile.fullName },
      { label: "Your Role", value: roleLabel },
    ])}
    ${renderEmailButton({ href: inviteUrl, label: "Accept Invite" })}
  `;
  const inviteFooter = `You received this because ${escapeHtml(profile.fullName)} invited you to the ${escapeHtml(orgName)} team.`;
  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? "Next Surplus <noreply@nextsurplus.com>",
    to: cleanEmail,
    subject: inviteSubject,
    html: renderEmailShell({
      subject: inviteSubject,
      bodyHtml: inviteBody,
      preheader: invitePreheader,
      footerLine: inviteFooter,
    }),
  });
  if (emailError) {
    return {
      ok: false,
      error: `Invite refreshed but the email failed to send: ${emailError.message}`,
    };
  }

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

  const sb = await createClient();
  await sb.from("audit_log").insert({
    actor_id: profile.id,
    action: "team_invite_resent",
    payload: {
      target_user_id: invitedId ?? userId,
      target_email: cleanEmail,
      target_name: cleanName || null,
    },
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function getInviteLink(
  userId: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) return { ok: false, error: "Only admins can copy invite links" };
  if (userId === profile.id) return { ok: false, error: "You can't copy your own invite link" };

  const admin = createServiceClient();
  const { data: target, error: targetErr } = await admin
    .from("profiles")
    .select("id, org_id, role, full_name, email")
    .eq("id", userId)
    .maybeSingle();
  if (targetErr) return { ok: false, error: targetErr.message };
  if (!target) return { ok: false, error: "That invite could not be found" };
  if (target.org_id !== profile.orgId) {
    return { ok: false, error: "That invite is not in your organization" };
  }

  const cleanEmail = (target.email as string | null)?.trim().toLowerCase();
  if (!cleanEmail) return { ok: false, error: "That invite has no email on file" };
  const cleanName = ((target.full_name as string | null) ?? "").trim();
  const safeRole: "admin" | "member" =
    target.role === "admin" ? "admin" : "member";

  const { error: cleanupErr } = await admin.auth.admin.deleteUser(userId);
  if (cleanupErr) return { ok: false, error: cleanupErr.message };

  const { data: invited, error: linkErr } = await admin.auth.admin.generateLink({
    type: "invite",
    email: cleanEmail,
    options: {
      data: { org_id: profile.orgId, role: safeRole, full_name: cleanName },
      redirectTo: `${SITE_URL}/accept-invite`,
    },
  });
  if (linkErr) return { ok: false, error: linkErr.message };

  const tokenHash = invited?.properties?.hashed_token;
  if (!tokenHash) return { ok: false, error: "Could not generate the invite link" };
  const inviteUrl = `${SITE_URL}/accept-invite?token_hash=${encodeURIComponent(tokenHash)}&type=invite`;

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

  const sb = await createClient();
  await sb.from("audit_log").insert({
    actor_id: profile.id,
    action: "team_invite_link_copied",
    payload: {
      target_user_id: invitedId ?? userId,
      target_email: cleanEmail,
      target_name: cleanName || null,
    },
  });

  revalidatePath("/settings");
  return { ok: true, url: inviteUrl };
}

export async function cancelInvite(
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) return { ok: false, error: "Only admins can cancel invites" };
  if (userId === profile.id) return { ok: false, error: "You can't cancel your own invite" };

  const sb = await createClient();
  const { data: prior } = await sb
    .from("profiles")
    .select("org_id, full_name, email")
    .eq("id", userId)
    .maybeSingle();
  if (prior?.org_id && prior.org_id !== profile.orgId) {
    return { ok: false, error: "That invite is not in your organization" };
  }

  const admin = createServiceClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };

  await sb.from("audit_log").insert({
    actor_id: profile.id,
    action: "team_invite_cancelled",
    payload: {
      target_user_id: userId,
      target_email: (prior?.email as string | null) ?? null,
      target_name: (prior?.full_name as string | null) ?? null,
    },
  });

  revalidatePath("/settings");
  return { ok: true };
}

// -- Company info ------------------------------------------------------------

// Admins update their org's display name, legal name, contact details, and
// mailing address. RLS already restricts this row to the caller's org; the
// admin guard here is just for a nicer error message.
export async function updateOrgInfo(input: {
  name: string;
  legal_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const norm = (v: string | null) => {
    if (v == null) return null;
    const t = v.trim();
    return t.length === 0 ? null : t;
  };
  // Company Name can be left blank — we fall back to Legal Name in that case.
  // One of the two must be present so the org always has *some* display name.
  const rawName = (input.name ?? "").trim();
  const legal = norm(input.legal_name);
  const cleanName = rawName || legal || "";
  if (!cleanName) {
    return { ok: false, error: "Enter a Legal Name or Company Name" };
  }
  const cleanEmail = norm(input.email);
  if (cleanEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
    return { ok: false, error: "Enter a valid email address" };
  }
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  const sb = await createClient();
  const { error } = await sb
    .from("orgs")
    .update({
      name: cleanName,
      legal_name: legal,
      email: cleanEmail,
      phone: norm(input.phone),
      website: norm(input.website),
      address_line1: norm(input.address_line1),
      address_line2: norm(input.address_line2),
      city: norm(input.city),
      region: norm(input.region),
      postal_code: norm(input.postal_code),
      country: norm(input.country),
    })
    .eq("id", profile.orgId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

// -- Mail settings ----------------------------------------------------------

// Admins update the human-facing mail fields (signer + default class) on the
// org row. Signature image upload is a separate flow (storage bucket).
// Admin-editable Lob rate schedule. Values stored as cents in
// orgs.lob_pricing_cents (JSONB). The send-letter / send-check code
// reads this to compute per-piece cost since Lob doesn't return cost
// at send time. Defaults match Lob's published Developer-tier rates;
// override per-org to reflect actual contract pricing.
export async function updateLobPricing(input: {
  tier_label: string;
  check_base: number;
  check_extra_attachment_page: number;
  letter_first_class_bw: number;
  letter_first_class_color: number;
  letter_standard_bw: number;
  letter_standard_color: number;
  letter_certified_bw: number;
  letter_certified_color: number;
  letter_extra_page_bw: number;
  letter_extra_page_color: number;
  auto_sync: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };

  const numericKeys = [
    "check_base",
    "check_extra_attachment_page",
    "letter_first_class_bw",
    "letter_first_class_color",
    "letter_standard_bw",
    "letter_standard_color",
    "letter_certified_bw",
    "letter_certified_color",
    "letter_extra_page_bw",
    "letter_extra_page_color",
  ] as const;

  const pricing: Record<string, string | number> = {
    tier_label: input.tier_label.trim() || "Custom",
  };
  for (const k of numericKeys) {
    const v = input[k];
    if (!Number.isFinite(v) || v < 0) {
      return { ok: false, error: `${k} must be a non-negative number` };
    }
    pricing[k] = Math.round(v);
  }

  const sb = await createClient();
  const { error } = await sb
    .from("orgs")
    .update({
      lob_pricing_cents: pricing,
      lob_pricing_auto_sync: Boolean(input.auto_sync),
    })
    .eq("id", profile.orgId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateMailSettings(input: {
  signer_name: string | null;
  signer_title: string | null;
  default_mail_class: "standard" | "first_class" | "certified";
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const norm = (v: string | null) => {
    if (v == null) return null;
    const t = v.trim();
    return t.length === 0 ? null : t;
  };
  const dmc =
    input.default_mail_class === "standard" ||
    input.default_mail_class === "certified"
      ? input.default_mail_class
      : "first_class";
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  const sb = await createClient();
  const { error } = await sb
    .from("orgs")
    .update({
      signer_name: norm(input.signer_name),
      signer_title: norm(input.signer_title),
      default_mail_class: dmc,
    })
    .eq("id", profile.orgId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

// -- Signature image upload -------------------------------------------------

// Org admins upload a handwritten signature image (PNG/JPEG, <= 5 MB) into the
// private `signatures` bucket. The path is stored on orgs.signature_image_path
// and resolved to a short-lived signed URL at mail-send time so Lob can fetch
// it during rendering. Files are namespaced by org_id so a future tightening
// of storage RLS doesn't need any code changes.
export async function uploadSignatureImage(
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pick an image to upload" };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Image must be 5 MB or smaller" };
  }
  const type = file.type.toLowerCase();
  if (type !== "image/png" && type !== "image/jpeg") {
    return { ok: false, error: "Use a PNG or JPEG image" };
  }
  const ext = type === "image/png" ? "png" : "jpg";
  const path = `${profile.orgId}/sig-${Date.now()}.${ext}`;

  const admin = createServiceClient();

  // Drop any prior signature for this org so the bucket doesn't accumulate
  // orphans. Listing the folder is cheap (small N) and gives us the exact
  // names to remove.
  const { data: existing } = await admin.storage
    .from("signatures")
    .list(profile.orgId);
  if (existing && existing.length > 0) {
    await admin.storage
      .from("signatures")
      .remove(existing.map((f) => `${profile.orgId}/${f.name}`));
  }

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadErr } = await admin.storage
    .from("signatures")
    .upload(path, new Uint8Array(arrayBuffer), {
      contentType: type,
      upsert: true,
    });
  if (uploadErr) return { ok: false, error: uploadErr.message };

  const sb = await createClient();
  const { error: updateErr } = await sb
    .from("orgs")
    .update({ signature_image_path: path })
    .eq("id", profile.orgId);
  if (updateErr) return { ok: false, error: updateErr.message };

  revalidatePath("/settings");
  return { ok: true };
}

export async function removeSignatureImage(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };

  const admin = createServiceClient();
  const { data: existing } = await admin.storage
    .from("signatures")
    .list(profile.orgId);
  if (existing && existing.length > 0) {
    await admin.storage
      .from("signatures")
      .remove(existing.map((f) => `${profile.orgId}/${f.name}`));
  }

  const sb = await createClient();
  const { error } = await sb
    .from("orgs")
    .update({ signature_image_path: null })
    .eq("id", profile.orgId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}

// -- Mail bank accounts -----------------------------------------------------

import {
  lobCreateBankAccount,
  lobDeleteBankAccount,
  lobGetBankAccount,
  lobVerifyBankAccount,
} from "@/lib/mail";

// Bank accounts are added by manual routing + account number entry.
// After the row is inserted, the mail provider sends micro-deposits
// to the bank account. The format depends on the receiving bank
// (decided by the provider, not configurable):
//
//   - microdeposit_type = "amounts" (traditional banks like Chase,
//     BofA, credit unions). Two random small deposits arrive over
//     1-2 business days. User enters both amounts in the Verify
//     Manually modal.
//   - microdeposit_type = "descriptor_code" (fintech banks like
//     Mercury, Brex, Novo, Rho, Ramp). One $0.01 deposit arrives
//     with a 6-character verification code in the ACH descriptor
//     starting with "SM". User enters that code in the Verify
//     Manually modal.
//
// We store the type on the row at add time and the Verify Manually
// modal branches its UI accordingly so the customer sees the right
// input regardless of bank type.

export async function addMailBankAccountManually(input: {
  routing_number: string;
  account_number: string;
  account_holder_name: string;
  account_type: "company" | "individual";
  bank_name?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const routing = input.routing_number.replace(/\D/g, "");
  const account = input.account_number.replace(/\D/g, "");
  const holder = input.account_holder_name.trim();
  if (routing.length !== 9) {
    return { ok: false, error: "Routing number must be 9 digits" };
  }
  if (account.length < 4 || account.length > 17) {
    return { ok: false, error: "Account number must be 4 to 17 digits" };
  }
  if (!holder) {
    return { ok: false, error: "Account holder name is required" };
  }
  const lobRes = await lobCreateBankAccount({
    routing_number: routing,
    account_number: account,
    account_holder_name: holder,
    account_type:
      input.account_type === "individual" ? "individual" : "company",
  });
  if (!lobRes.ok) return { ok: false, error: lobRes.error };

  // Ask the provider which micro-deposit format it assigned for this
  // receiving bank. Stored on the row so the verify modal renders the
  // right input. Failure to read is non-fatal; we just insert with
  // null and the verify modal falls back to the two-amounts UI.
  let microdepositType: string | null = null;
  const lobState = await lobGetBankAccount(lobRes.lob_bank_account_id);
  if (lobState.ok) {
    const mdType = (lobState.raw as { microdeposit_type?: string | null })
      .microdeposit_type;
    if (mdType === "amounts" || mdType === "descriptor_code") {
      microdepositType = mdType;
    }
  }

  const sb = await createClient();
  const { data, error } = await sb
    .from("mail_bank_accounts")
    .insert({
      lob_bank_account_id: lobRes.lob_bank_account_id,
      bank_name: lobRes.bank_name ?? input.bank_name?.trim() ?? null,
      account_holder_name: holder,
      routing_last_four: lobRes.routing_last_four,
      account_last_four: lobRes.account_last_four,
      verified_via: "micro_deposits",
      microdeposit_type: microdepositType,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true, id: data.id as string };
}

export async function deleteMailBankAccount(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { data: row, error: lookupErr } = await sb
    .from("mail_bank_accounts")
    .select("lob_bank_account_id")
    .eq("id", id)
    .single();
  if (lookupErr || !row) {
    return { ok: false, error: "Bank account not found" };
  }
  const lobId = (row.lob_bank_account_id as string | null) ?? "";
  if (lobId.startsWith("bank_")) {
    const lobRes = await lobDeleteBankAccount(lobId);
    if (!lobRes.ok) return { ok: false, error: lobRes.error };
  }
  const { error } = await sb.from("mail_bank_accounts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

// Set a verified bank as the org's primary funding source. Clears
// is_primary on every other bank in the org first, then sets it on
// this one. Partial unique index in the DB enforces single-primary-
// per-org at the constraint layer too, so a race here can't end with
// two primaries.
export async function setMailBankAccountPrimary(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { data: row, error: lookupErr } = await sb
    .from("mail_bank_accounts")
    .select("id, org_id, status")
    .eq("id", id)
    .single();
  if (lookupErr || !row) {
    return { ok: false, error: "Bank account not found" };
  }
  if (row.status !== "verified") {
    return {
      ok: false,
      error: "Verify this bank account first before making it primary.",
    };
  }
  const orgId = row.org_id as string;
  const { error: clearErr } = await sb
    .from("mail_bank_accounts")
    .update({ is_primary: false })
    .eq("org_id", orgId)
    .eq("is_primary", true);
  if (clearErr) return { ok: false, error: clearErr.message };
  const { error: setErr } = await sb
    .from("mail_bank_accounts")
    .update({ is_primary: true })
    .eq("id", id);
  if (setErr) return { ok: false, error: setErr.message };
  revalidatePath("/settings");
  return { ok: true };
}

// Micro-deposit verification. Operator enters either two cent
// amounts (traditional banks) or a single 6-character code starting
// with "SM" (fintech banks). The modal picks the input shape based
// on the bank's microdeposit_type. Lob locks the bank account after
// 3 failed /verify calls.
export type VerifyMailBankAccountInput =
  | { bank_account_id: string; amount1_cents: number; amount2_cents: number }
  | { bank_account_id: string; descriptor_code: string };

export async function verifyMailBankAccountManually(
  input: VerifyMailBankAccountInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { data: row, error: lookupErr } = await sb
    .from("mail_bank_accounts")
    .select("lob_bank_account_id, status, verify_attempts, microdeposit_type")
    .eq("id", input.bank_account_id)
    .single();
  if (lookupErr || !row) {
    return { ok: false, error: "Bank account not found" };
  }
  if (row.status === "verified") {
    return { ok: false, error: "This bank account is already verified" };
  }
  const lobId = (row.lob_bank_account_id as string | null) ?? "";
  if (!lobId.startsWith("bank_")) {
    return { ok: false, error: "Bank account is missing a Lob reference" };
  }

  let verifyInput: import("@/lib/mail").LobVerifyInput;
  if ("descriptor_code" in input) {
    const code = input.descriptor_code.trim().toUpperCase();
    if (!/^SM[A-Z0-9]{4}$/.test(code)) {
      return {
        ok: false,
        error: "Enter the 6 character code starting with SM that appears in your bank statement.",
      };
    }
    verifyInput = { kind: "descriptor_code", code };
  } else {
    const a1 = Math.round(input.amount1_cents);
    const a2 = Math.round(input.amount2_cents);
    if (!Number.isFinite(a1) || !Number.isFinite(a2)) {
      return { ok: false, error: "Both amounts are required" };
    }
    if (a1 < 1 || a1 > 99 || a2 < 1 || a2 > 99) {
      return {
        ok: false,
        error: "Each amount must be between 1 and 99 cents",
      };
    }
    verifyInput = { kind: "amounts", amounts: [a1, a2] };
  }

  const lobRes = await lobVerifyBankAccount(lobId, verifyInput);
  const nowIso = new Date().toISOString();
  if (!lobRes.ok) {
    await sb
      .from("mail_bank_accounts")
      .update({
        verify_attempts: ((row.verify_attempts as number | null) ?? 0) + 1,
        last_verify_error: lobRes.error,
        last_verify_attempt_at: nowIso,
      })
      .eq("id", input.bank_account_id);
    revalidatePath("/settings");
    return { ok: false, error: lobRes.error };
  }
  const { error: updateErr } = await sb
    .from("mail_bank_accounts")
    .update({
      status: "verified",
      verified_at: nowIso,
      verify_attempts: ((row.verify_attempts as number | null) ?? 0) + 1,
      last_verify_error: null,
      last_verify_attempt_at: nowIso,
    })
    .eq("id", input.bank_account_id);
  if (updateErr) return { ok: false, error: updateErr.message };
  revalidatePath("/settings");
  return { ok: true };
}

// Convenience wrapper for the descriptor_code path so the UI can call a
// single-purpose function without juggling the discriminated input shape.
// All validation and Lob dispatch happens through verifyMailBankAccountManually.
export async function verifyMailBankAccountWithCode(input: {
  bank_account_id: string;
  descriptor_code: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return verifyMailBankAccountManually({
    bank_account_id: input.bank_account_id,
    descriptor_code: input.descriptor_code,
  });
}

// -- Mail templates ---------------------------------------------------------

export async function upsertMailTemplate(input: {
  id?: string | null;
  name: string;
  folder_id?: string | null;
  // A template is either HTML-backed (built in TipTap) or file-backed
  // (uploaded .docx edited in SuperDoc / uploaded .pdf used as-is).
  // Exactly one of body_html / docx_path is set. attachment_paths is an
  // ordered list of extra PDFs/DOCXs included in the same envelope.
  body_html: string;
  docx_path?: string | null;
  attachment_paths?: string[];
  default_mail_class: "standard" | "first_class" | "certified";
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Template name is required" };
  const body = input.body_html.trim();
  const docxPath = input.docx_path?.trim() || null;
  const attachmentPaths = (input.attachment_paths ?? []).filter(
    (p) => typeof p === "string" && p.trim().length > 0
  );
  if (!body && !docxPath)
    return { ok: false, error: "Template body or .docx is required" };
  const dmc =
    input.default_mail_class === "standard" ||
    input.default_mail_class === "certified"
      ? input.default_mail_class
      : "first_class";
  const folderId = input.folder_id?.trim() || null;
  const sb = await createClient();
  if (input.id) {
    const { error } = await sb
      .from("mail_templates")
      .update({
        name,
        folder_id: folderId,
        body_html: body,
        docx_path: docxPath,
        attachment_paths: attachmentPaths,
        default_mail_class: dmc,
      })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/settings");
    return { ok: true, id: input.id };
  }
  const { data, error } = await sb
    .from("mail_templates")
    .insert({
      name,
      folder_id: folderId,
      body_html: body,
      docx_path: docxPath,
      attachment_paths: attachmentPaths,
      default_mail_class: dmc,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true, id: data.id as string };
}

// -- DOCX template storage --------------------------------------------------

// Uploads a template file (.docx or .pdf) to the private `mail-templates`
// bucket and returns the storage path plus inferred type. The path is
// intentionally non-guessable (uuid prefix) so leaked URLs can't be
// brute-forced. The type is inferred from the extension and drives the
// send-time payload (DOCX gets merge-rendered, PDF prints as-is).
export async function uploadMailTemplateDocx(
  formData: FormData
): Promise<
  | { ok: true; path: string; file_type: "docx" | "pdf" }
  | { ok: false; error: string }
> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pick a .docx or .pdf file" };
  }
  // No artificial size cap here — the real ceiling is whichever is
  // tightest of: Next.js Server Action bodySizeLimit (configured in
  // next.config.ts), Vercel's per-plan request body limit, and the
  // mail-templates Supabase storage bucket policy. Letting the
  // platform enforce its own limits avoids guessing what's reasonable.
  const nameLower = (file.name ?? "").toLowerCase();
  let fileType: "docx" | "pdf";
  let contentType: string;
  if (nameLower.endsWith(".docx")) {
    fileType = "docx";
    contentType =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  } else if (nameLower.endsWith(".pdf")) {
    fileType = "pdf";
    contentType = "application/pdf";
  } else {
    return { ok: false, error: "Only .docx and .pdf files are supported" };
  }
  // For .docx, rewrite any "[OWNER FIRST NAME]"-style bracket
  // placeholders into docxtemplater's single-brace syntax so the merge
  // engine finds them at send time. PDFs are stored as-is.
  let uploadBlob: Blob = file;
  if (fileType === "docx") {
    try {
      const PizZip = (await import("pizzip")).default;
      const buf = Buffer.from(await file.arrayBuffer());
      const zip = new PizZip(buf);
      let touched = false;
      for (const xmlPath of ["word/document.xml", "word/header1.xml", "word/footer1.xml"]) {
        const xml = zip.file(xmlPath)?.asText();
        if (!xml) continue;
        const updated = xml.replace(
          /[\[\{]([A-Za-z][A-Za-z _]{1,40})[\]\}]/g,
          (whole, inner: string) => {
            const key = inner.replace(/[^a-z]/gi, "").toLowerCase();
            const tokenKey = BRACKET_TOKEN_MAP[key];
            return tokenKey ? `{${tokenKey}}` : whole;
          }
        );
        if (updated !== xml) {
          zip.file(xmlPath, updated);
          touched = true;
        }
      }
      if (touched) {
        const newBuf = zip.generate({ type: "nodebuffer" });
        uploadBlob = new Blob([new Uint8Array(newBuf)], { type: contentType });
      }
    } catch {
      // Best-effort — if the docx is malformed for any reason, fall
      // back to storing the original. The user can fix brackets in
      // the editor manually.
    }
  }
  const sb = await createClient();
  const path = `${crypto.randomUUID()}.${fileType}`;
  const { error } = await sb.storage
    .from("mail-templates")
    .upload(path, uploadBlob, { contentType, upsert: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, path, file_type: fileType };
}

// Returns a short-lived signed URL the SuperDoc editor can fetch the
// .docx bytes from. Bucket is private, so we can't hand out the public
// URL — signed URLs scope access to the current admin session.
export async function getMailTemplateDocxUrl(
  path: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (!path) return { ok: false, error: "Missing template path" };
  const sb = await createClient();
  const { data, error } = await sb.storage
    .from("mail-templates")
    .createSignedUrl(path, 60 * 10);
  if (error || !data) return { ok: false, error: error?.message ?? "No URL" };
  return { ok: true, url: data.signedUrl };
}

export async function deleteMailTemplate(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { error } = await sb.from("mail_templates").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

// -- DOCX template import ----------------------------------------------------

// Word docs typically use bracket placeholders ("Dear [OWNER FIRST NAME],").
// Our merge engine uses {{contact.first_name}} syntax. Map common brackets
// to the matching token so a fresh import already has clickable chips
// instead of plain text. Keys are normalized to lowercase letters only so
// "[OWNER FIRST NAME]", "[Owner first name]", and "[OWNERFIRSTNAME]" all
// match the same entry.
const BRACKET_TOKEN_MAP: Record<string, string> = {
  date: "system.today_long",
  today: "system.today",
  todaylong: "system.today_long",
  ownerfirstname: "contact.first_name",
  ownerfirst: "contact.first_name",
  firstname: "contact.first_name",
  ownerlastname: "contact.last_name",
  ownerlast: "contact.last_name",
  lastname: "contact.last_name",
  ownerfullname: "contact.full_name",
  fullname: "contact.full_name",
  recipient: "contact.full_name",
  fulladdress: "contact.address",
  mailingaddress: "contact.address",
  address: "contact.address",
  city: "contact.city",
  zip: "contact.zip",
  zipcode: "contact.zip",
  postalcode: "contact.zip",
  leadid: "lead.id",
  propertyaddress: "lead.property_address",
  county: "lead.county",
  state: "lead.state",
  casenumber: "lead.case_number",
  caseno: "lead.case_number",
  parcelnumber: "lead.parcel_number",
  parcelno: "lead.parcel_number",
  saledate: "lead.sale_date",
  // Sale price / closing bid map to the actual final auction bid
  // (lead.closing_bid). Gross / estimated surplus map to the surplus
  // amount AFTER debt + liens are deducted (lead.estimated_surplus).
  // Previously all four mapped to estimated_surplus which made
  // "Final Sale Price" and "Gross Surplus" render the same number.
  saleprice: "lead.closing_bid",
  closingbid: "lead.closing_bid",
  finalsaleprice: "lead.closing_bid",
  grosssurplus: "lead.estimated_surplus",
  estimatedsurplus: "lead.estimated_surplus",
  estimatedrange: "lead.owner_range",
  estimatedrangetoowner: "lead.owner_range",
  rangetoowner: "lead.owner_range",
  companyname: "sender.company_name",
  legalname: "sender.legal_name",
  signername: "sender.signer_name",
  signertitle: "sender.signer_title",
  returnaddress: "sender.address",
};

function applyBracketTokenMap(html: string): string {
  return html.replace(/\[([^\]]+)\]/g, (whole, inner: string) => {
    const key = inner.replace(/[^a-z]/gi, "").toLowerCase();
    const tokenKey = BRACKET_TOKEN_MAP[key];
    return tokenKey ? `{{${tokenKey}}}` : whole;
  });
}


// Admins upload a .docx with their letter design (logo headers, formatted
// paragraphs, etc.); we convert it to HTML in-memory with mammoth and hand
// the HTML back to the editor. The user then sprinkles {{merge_fields}}
// where they want personalization. No file is stored — only the resulting
// HTML, which lives on mail_templates.body_html.
export async function convertDocxToHtml(
  formData: FormData
): Promise<{ ok: true; html: string } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pick a .docx file" };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: "File must be 10 MB or smaller" };
  }
  const name = (file.name ?? "").toLowerCase();
  if (!name.endsWith(".docx")) {
    return { ok: false, error: "File must be a .docx" };
  }
  try {
    const mammoth = (await import("mammoth")) as typeof import("mammoth");
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.convertToHtml({ buffer });
    // Word templates almost always use bracket placeholders like
    // "[OWNER FIRST NAME]" or "[DATE]". Convert the common variants to
    // our {{merge_field}} tokens so they render as chips immediately
    // instead of as literal text. Anything we can't match is left
    // alone so the user can fix it manually in the editor.
    const html = applyBracketTokenMap(result.value);
    return { ok: true, html };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Could not parse the .docx: ${err.message}`
          : "Could not parse the .docx",
    };
  }
}

// -- Mail template folders --------------------------------------------------

// Admins create, rename, and delete folders to organize templates the way
// they want (no opinionated category enum). Deleting a folder leaves its
// templates with folder_id = null — they fall back to "Unfiled" in the UI.
export async function createMailTemplateFolder(
  name: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const clean = name.trim();
  if (!clean) return { ok: false, error: "Folder name is required" };
  const sb = await createClient();
  const { data, error } = await sb
    .from("mail_template_folders")
    .insert({ name: clean })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true, id: data.id as string };
}

export async function renameMailTemplateFolder(
  id: string,
  name: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const clean = name.trim();
  if (!clean) return { ok: false, error: "Folder name is required" };
  const sb = await createClient();
  const { error } = await sb
    .from("mail_template_folders")
    .update({ name: clean, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteMailTemplateFolder(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { error } = await sb.from("mail_template_folders").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

// -- Email templates ---------------------------------------------------------

export async function upsertEmailTemplate(input: {
  id?: string | null;
  name: string;
  folder_id?: string | null;
  subject: string;
  body_html: string;
  attachments?: { filename: string; mimeType: string; size: number; base64: string }[];
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  const name = (input.name ?? "").trim();
  if (!name) return { ok: false, error: "Name is required" };
  const attachments = (input.attachments ?? []).map((a) => ({
    filename: a.filename,
    mimeType: a.mimeType,
    size: a.size,
    base64: a.base64,
  }));
  const sb = await createClient();
  if (input.id) {
    const { error } = await sb
      .from("email_templates")
      .update({
        name,
        folder_id: input.folder_id ?? null,
        subject: (input.subject ?? "").trim(),
        body_html: input.body_html ?? "",
        attachments,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/settings");
    return { ok: true, id: input.id };
  }
  const { data, error } = await sb
    .from("email_templates")
    .insert({
      name,
      folder_id: input.folder_id ?? null,
      subject: (input.subject ?? "").trim(),
      body_html: input.body_html ?? "",
      attachments,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Insert failed" };
  revalidatePath("/settings");
  return { ok: true, id: data.id as string };
}

export async function deleteEmailTemplate(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { error } = await sb.from("email_templates").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function duplicateEmailTemplate(
  id: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  const sb = await createClient();
  const { data: src, error: fetchErr } = await sb
    .from("email_templates")
    .select("name, folder_id, subject, body_html")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr || !src) return { ok: false, error: "Template not found" };
  const { data, error } = await sb
    .from("email_templates")
    .insert({
      name: `${src.name} (Copy)`,
      folder_id: src.folder_id ?? null,
      subject: src.subject ?? "",
      body_html: src.body_html ?? "",
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Insert failed" };
  revalidatePath("/settings");
  return { ok: true, id: data.id as string };
}

export async function createEmailTemplateFolder(
  name: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const clean = (name ?? "").trim();
  if (!clean) return { ok: false, error: "Folder name is required" };
  const sb = await createClient();
  const { data, error } = await sb
    .from("email_template_folders")
    .insert({ name: clean })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Insert failed" };
  revalidatePath("/settings");
  return { ok: true, id: data.id as string };
}

export async function renameEmailTemplateFolder(
  id: string,
  name: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const clean = (name ?? "").trim();
  if (!clean) return { ok: false, error: "Folder name is required" };
  const sb = await createClient();
  const { error } = await sb
    .from("email_template_folders")
    .update({ name: clean, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteEmailTemplateFolder(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { error } = await sb.from("email_template_folders").delete().eq("id", id);
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

// Look up how many leads currently use a given lost reason. Used by the
// settings UI to decide whether to show a reassign-to picker before
// archive/delete commits.
export async function countLeadsUsingLostReason(
  reasonId: string
): Promise<{ ok: true; count: number; label: string } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { data: reason } = await sb
    .from("lost_reasons")
    .select("label")
    .eq("id", reasonId)
    .maybeSingle();
  if (!reason) return { ok: false, error: "Reason not found" };
  const { count, error } = await sb
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("lost_reason", reason.label as string);
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    count: count ?? 0,
    label: (reason.label as string | null) ?? "",
  };
}

// Reassign all leads currently using `fromReasonId`'s label to the
// label belonging to `toReasonId` (or null = unset), then archive the
// "from" reason. Used by the Lost Reasons settings UI when the user
// tries to archive a reason that's still in use on existing leads.
//
// The replacement label must come from another lost_reason row in the
// same org (or the literal null sentinel for "clear the lost_reason
// field"). RLS scopes everything to the caller's org.
export async function reassignAndArchiveLostReason(
  fromId: string,
  toId: string | null
): Promise<{ ok: true; reassigned: number } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();

  const { data: fromRow } = await sb
    .from("lost_reasons")
    .select("label")
    .eq("id", fromId)
    .maybeSingle();
  if (!fromRow) return { ok: false, error: "Reason not found" };
  const fromLabel = (fromRow.label as string | null) ?? "";

  let toLabel: string | null = null;
  if (toId) {
    const { data: toRow } = await sb
      .from("lost_reasons")
      .select("label, archived")
      .eq("id", toId)
      .maybeSingle();
    if (!toRow) return { ok: false, error: "Replacement reason not found" };
    if (toRow.archived) {
      return {
        ok: false,
        error: "Pick a non-archived reason as the replacement.",
      };
    }
    toLabel = (toRow.label as string | null) ?? null;
  }

  // Reassign affected leads first. If this fails we don't archive, so
  // the operator sees the error and can retry. If reassign succeeds and
  // archive fails (unlikely), the reason ends up unarchived but with no
  // leads referencing it — also safe.
  const { count: reassignCount, error: reassignErr } = await sb
    .from("leads")
    .update({ lost_reason: toLabel }, { count: "exact" })
    .eq("lost_reason", fromLabel);
  if (reassignErr) return { ok: false, error: reassignErr.message };

  const { error: archErr } = await sb
    .from("lost_reasons")
    .update({ archived: true })
    .eq("id", fromId);
  if (archErr) return { ok: false, error: archErr.message };

  revalidatePath("/settings");
  revalidatePath("/leads");
  return { ok: true, reassigned: reassignCount ?? 0 };
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
  children?: ResearchStepInput[];
};

type PlaybookApplyModeInput = "manual" | "all" | "match";

function cleanResearchSteps(steps: ResearchStepInput[]): ResearchStepInput[] {
  return steps
    .map((s) => {
      const cleaned: ResearchStepInput = {
        name: (s.name ?? "").trim(),
        url: s.url && s.url.trim() ? s.url.trim() : null,
        instructions:
          s.instructions && s.instructions.trim() ? s.instructions.trim() : null,
      };
      if (Array.isArray(s.children) && s.children.length > 0) {
        cleaned.children = cleanResearchSteps(s.children);
      }
      return cleaned;
    })
    .filter((s) => s.name.length > 0);
}

function normalizeApplyStatesInput(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v !== "string") continue;
    const up = v.trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(up) && !out.includes(up)) out.push(up);
  }
  return out;
}

export async function upsertResearchTemplate(input: {
  id?: string | null;
  name: string;
  description: string | null;
  state: string | null;
  sale_type: "TAX" | "MTG" | null;
  apply_mode: PlaybookApplyModeInput;
  apply_states: string[];
  steps: ResearchStepInput[];
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (!input.name.trim()) return { ok: false, error: "Name is required" };

  const saleType: "TAX" | "MTG" | null =
    input.sale_type === "TAX" || input.sale_type === "MTG" ? input.sale_type : null;

  const applyMode: PlaybookApplyModeInput =
    input.apply_mode === "manual" || input.apply_mode === "all" || input.apply_mode === "match"
      ? input.apply_mode
      : "match";
  const applyStates = normalizeApplyStatesInput(input.apply_states);
  if (applyMode === "match" && applyStates.length === 0) {
    return {
      ok: false,
      error: "Pick at least one state, or change When To Apply to All Imported Leads",
    };
  }

  const steps = cleanResearchSteps(input.steps);
  const sb = await createClient();
  const description = input.description?.trim() || null;

  // Mirror apply_states[0] onto the legacy `state` column when only one
  // state is selected. Keeps existing single-state queries (playbook
  // board state filter, lead_research_templates snapshot matching)
  // pointing at the same data while the rest of the app migrates to
  // reading apply_states.
  const legacyState =
    applyMode === "match" && applyStates.length === 1 ? applyStates[0] : null;

  const writeRow = {
    name: input.name.trim(),
    description,
    state: legacyState,
    sale_type: saleType,
    apply_mode: applyMode,
    apply_states: applyStates,
    steps,
  };

  if (input.id) {
    const { error } = await sb
      .from("research_templates")
      .update(writeRow)
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/settings");
    return { ok: true, id: input.id };
  }
  const { data, error } = await sb
    .from("research_templates")
    .insert(writeRow)
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true, id: data.id as string };
}

// Org-wide custom role labels surfaced in Settings > Leads > Contact
// Roles. Stored in org_custom_roles (separate from lead_parties to
// allow adding labels without first creating a contact). Fetcher
// (lib/leads/lead-parties.ts) unions this table with distinct labels
// already in lead_parties so historic custom labels keep showing.
export async function addOrgCustomRole(
  label: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const clean = label.trim();
  if (!clean) return { ok: false, error: "Role label is required" };
  if (clean.length > 60)
    return { ok: false, error: "Role label is too long (max 60 chars)" };
  const sb = await createClient();
  const { error } = await sb
    .from("org_custom_roles")
    .upsert({ label: clean }, { onConflict: "org_id,label" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteOrgCustomRole(
  label: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const clean = label.trim();
  if (!clean) return { ok: false, error: "Role label is required" };
  const sb = await createClient();
  const { count, error: countErr } = await sb
    .from("lead_parties")
    .select("id", { count: "exact", head: true })
    .eq("custom_role_label", clean);
  if (countErr) return { ok: false, error: countErr.message };
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: `This role is used by ${count} contact${count === 1 ? "" : "s"}. Reassign those contacts before deleting.`,
    };
  }
  const { error } = await sb
    .from("org_custom_roles")
    .delete()
    .eq("label", clean);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

// Count contacts currently using a custom-role label. Mirror of the
// Lost Reasons "count in use" helper.
export async function countContactsUsingCustomRole(
  label: string
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const clean = label.trim();
  if (!clean) return { ok: false, error: "Role label is required" };
  const sb = await createClient();
  const { count, error } = await sb
    .from("lead_parties")
    .select("id", { count: "exact", head: true })
    .eq("custom_role_label", clean);
  if (error) return { ok: false, error: error.message };
  return { ok: true, count: count ?? 0 };
}

// Reassign contacts on lead_parties using `fromLabel` to `toLabel`
// (or null = clear the custom label, role falls back to "other" with
// no specifier), then delete the org_custom_roles row for `fromLabel`.
export async function reassignAndDeleteOrgCustomRole(
  fromLabel: string,
  toLabel: string | null
): Promise<{ ok: true; reassigned: number } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const cleanFrom = fromLabel.trim();
  const cleanTo = toLabel?.trim() || null;
  if (!cleanFrom) return { ok: false, error: "Role label is required" };
  const sb = await createClient();

  const { count: reassignCount, error: reassignErr } = await sb
    .from("lead_parties")
    .update({ custom_role_label: cleanTo }, { count: "exact" })
    .eq("custom_role_label", cleanFrom);
  if (reassignErr) return { ok: false, error: reassignErr.message };

  const { error: delErr } = await sb
    .from("org_custom_roles")
    .delete()
    .eq("label", cleanFrom);
  if (delErr) return { ok: false, error: delErr.message };

  revalidatePath("/settings");
  return { ok: true, reassigned: reassignCount ?? 0 };
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

// Duplicate an existing playbook. Name gets " (Copy)" appended and apply_mode
// is forced back to "manual" so the copy doesn't silently start auto-attaching
// to the same leads as the original — the user almost always wants to tweak
// the duplicate (state set, copy variant, etc.) before turning auto-apply
// back on. Steps, description, and sale_type are copied verbatim.
export async function duplicateResearchTemplate(
  id: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { data: row, error: readErr } = await sb
    .from("research_templates")
    .select("name, description, sale_type, steps")
    .eq("id", id)
    .single();
  if (readErr || !row) {
    return { ok: false, error: readErr?.message ?? "Playbook not found" };
  }
  const { data, error } = await sb
    .from("research_templates")
    .insert({
      name: `${row.name as string} (Copy)`,
      description: (row.description as string | null) ?? null,
      state: null,
      sale_type: (row.sale_type as "TAX" | "MTG" | null) ?? null,
      apply_mode: "manual",
      apply_states: [],
      steps: row.steps ?? [],
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/playbooks");
  return { ok: true, id: data.id as string };
}

// ──────────────────────────────────────────────────────────────────────────
// Telnyx pricing + A2P + saved lists actions
// ──────────────────────────────────────────────────────────────────────────

type TelnyxPricingInput = {
  telnyx_phone_monthly_cents: number;
  telnyx_voice_outbound_per_min_cents: number;
  telnyx_sms_outbound_per_segment_cents: number;
  customer_phone_monthly_cents: number;
  customer_voice_outbound_per_min_cents: number;
  customer_sms_outbound_per_segment_cents: number;
};

export async function updateTelnyxPricing(
  input: TelnyxPricingInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin || !profile.orgId) {
    return { ok: false, error: "Admin only" };
  }
  const sb = await createClient();
  const { error } = await sb
    .from("telnyx_pricing_settings")
    .upsert({ org_id: profile.orgId, ...input });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function refreshTelnyxLiveCost(): Promise<
  | { ok: true; phoneCostCents: number | null }
  | { ok: false; error: string }
> {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin || !profile.orgId) {
    return { ok: false, error: "Admin only" };
  }
  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) return { ok: false, error: "TELNYX_API_KEY missing" };

  try {
    const res = await fetch(
      "https://api.telnyx.com/v2/available_phone_numbers?filter%5Bcountry_code%5D=US&filter%5Bnational_destination_code%5D=512&filter%5Blimit%5D=1",
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
    );
    if (!res.ok) return { ok: false, error: `Telnyx HTTP ${res.status}` };
    const json = (await res.json()) as { data?: Array<{ cost_information?: { monthly_cost?: string } }> };
    const monthly = json.data?.[0]?.cost_information?.monthly_cost;
    const cents = monthly ? Math.round(parseFloat(monthly) * 100) : null;

    const sb = await createClient();
    const { data: existing } = await sb
      .from("telnyx_pricing_settings")
      .select("telnyx_phone_monthly_cents")
      .eq("org_id", profile.orgId)
      .maybeSingle();
    const drift =
      existing?.telnyx_phone_monthly_cents && cents
        ? ((cents - existing.telnyx_phone_monthly_cents) / existing.telnyx_phone_monthly_cents) * 100
        : 0;
    await sb
      .from("telnyx_pricing_settings")
      .upsert({
        org_id: profile.orgId,
        ...(cents != null ? { telnyx_phone_monthly_cents: cents } : {}),
        last_telnyx_price_check_at: new Date().toISOString(),
        last_telnyx_price_drift_pct: drift,
      });
    revalidatePath("/settings");
    return { ok: true, phoneCostCents: cents };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

type A2pBrandInput = {
  company_legal_name?: string | null;
  ein?: string | null;
  vertical?: string | null;
  company_website?: string | null;
  privacy_policy_url?: string | null;
  terms_url?: string | null;
  authorized_rep_name?: string | null;
  authorized_rep_email?: string | null;
  authorized_rep_phone?: string | null;
  company_address_street?: string | null;
  company_address_city?: string | null;
  company_address_state?: string | null;
  company_address_postal_code?: string | null;
  company_address_country?: string | null;
  vetting_tier?: "standard" | "enhanced" | "sole_prop" | null;
};

export async function saveA2pBrandDraft(
  input: A2pBrandInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin || !profile.orgId) {
    return { ok: false, error: "Admin only" };
  }
  const sb = await createClient();
  const { data, error } = await sb
    .from("a2p_brand_registrations")
    .upsert({ org_id: profile.orgId, ...input })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/dialer/a2p");
  return { ok: true, id: data.id as string };
}

export async function submitA2pBrand(): Promise<
  { ok: true; brand_id: string; telnyx_brand_id?: string } | { ok: false; error: string }
> {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin || !profile.orgId) {
    return { ok: false, error: "Admin only" };
  }
  const sb = await createClient();

  // Load the draft we're submitting so we have the payload for Telnyx.
  const { data: brand, error: loadErr } = await sb
    .from("a2p_brand_registrations")
    .select("*")
    .eq("org_id", profile.orgId)
    .maybeSingle();
  if (loadErr) return { ok: false, error: loadErr.message };
  if (!brand) return { ok: false, error: "No brand draft to submit" };

  // Submit to Telnyx 10DLC. The exact endpoint and field names live in
  // Telnyx's docs at https://developers.telnyx.com/api/messaging/10dlc.
  // Endpoint and field names below match Telnyx published spec as of 2026.
  const apiKey = process.env.TELNYX_API_KEY;
  let telnyxBrandId: string | undefined;
  let telnyxError: string | undefined;
  if (apiKey) {
    try {
      const res = await fetch("https://api.telnyx.com/v2/10dlc/brand", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType: "PRIVATE_PROFIT",
          displayName: brand.company_legal_name,
          companyName: brand.company_legal_name,
          ein: brand.ein,
          vertical: brand.vertical,
          website: brand.company_website,
          email: brand.authorized_rep_email,
          phone: brand.authorized_rep_phone,
          street: brand.company_address_street,
          city: brand.company_address_city,
          state: brand.company_address_state,
          postalCode: brand.company_address_postal_code,
          country: brand.company_address_country ?? "US",
          ipAddress: "0.0.0.0",
          firstName: (brand.authorized_rep_name as string | null)?.split(" ")[0] ?? "",
          lastName: (brand.authorized_rep_name as string | null)?.split(" ").slice(1).join(" ") ?? "",
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { data?: { id?: string; brandId?: string } };
        telnyxBrandId = json.data?.id ?? json.data?.brandId;
      } else {
        telnyxError = `Telnyx HTTP ${res.status}: ${await res.text()}`;
      }
    } catch (e) {
      telnyxError = e instanceof Error ? e.message : "Network error";
    }
  }

  const { data, error } = await sb
    .from("a2p_brand_registrations")
    .update({
      status: telnyxError ? "draft" : "submitted",
      submitted_at: telnyxError ? null : new Date().toISOString(),
      telnyx_brand_id: telnyxBrandId ?? null,
      rejection_reason: telnyxError ?? null,
    })
    .eq("org_id", profile.orgId)
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  if (telnyxError) return { ok: false, error: telnyxError };

  revalidatePath("/settings");
  revalidatePath("/dialer/a2p");
  return { ok: true, brand_id: data.id as string, telnyx_brand_id: telnyxBrandId };
}

export async function saveSavedList(input: {
  id?: string;
  name: string;
  filter_json: Record<string, unknown>;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile?.orgId) return { ok: false, error: "Not signed in" };
  const sb = await createClient();
  const row = {
    name: input.name,
    filter_json: input.filter_json,
    created_by: profile.id,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = input.id
    ? await sb.from("saved_lists").update(row).eq("id", input.id).select("id").single()
    : await sb.from("saved_lists").insert(row).select("id").single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dialer/setup");
  return { ok: true, id: data.id as string };
}

export async function deleteSavedList(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile?.orgId) return { ok: false, error: "Not signed in" };
  const sb = await createClient();
  const { error } = await sb.from("saved_lists").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dialer/setup");
  return { ok: true };
}

