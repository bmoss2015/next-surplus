"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { Resend } from "resend";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentProfile, requireAdmin } from "@/lib/auth/current-user";
import { validateAllUntestedForOrg } from "@/lib/phone-validate";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

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
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters" };
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

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: emailError } = await resend.emails.send({
    from: "bree@mossequitypartners.com",
    to: cleanEmail,
    subject: "You have been invited to Moss Equity Partners",
    html: `<div style="font-family:Inter,Arial,sans-serif;color:#0f1729;max-width:480px;margin:0 auto;padding:24px;">
  <h1 style="margin:0;font-size:20px;font-weight:600;color:#04261c;">You Have Been Invited</h1>
  <p style="margin:20px 0 0;font-size:14px;line-height:1.6;">Hello ${cleanName},</p>
  <p style="margin:16px 0 0;font-size:14px;line-height:1.6;">An account has been created for you on the Moss Equity Partners portal using <strong>${cleanEmail}</strong>. Click the button below to set your password and finish signing in.</p>
  <p style="margin:24px 0 0;">
    <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(90deg,#04261c,#0d4b3a);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:6px;">Accept Invite</a>
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
// and resolved to a short-lived signed URL at mail-send time so the printer
// (Click2Mail / Lob) can fetch it during rendering. Files are namespaced by
// org_id so a future tightening of storage RLS doesn't need any code changes.
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

import { lobCreateBankAccount, lobVerifyBankAccount } from "@/lib/mail";

export async function createMailBankAccount(input: {
  routing_number: string;
  account_number: string;
  account_holder_name: string;
  account_type: "company" | "individual";
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const routing = input.routing_number.replace(/\D/g, "");
  const account = input.account_number.replace(/\D/g, "");
  const holder = input.account_holder_name.trim();
  if (!routing || routing.length !== 9) {
    return { ok: false, error: "Routing number must be 9 digits" };
  }
  if (!account || account.length < 4) {
    return { ok: false, error: "Enter a valid account number" };
  }
  if (!holder) {
    return { ok: false, error: "Account holder name is required" };
  }

  const lobRes = await lobCreateBankAccount({
    routing_number: routing,
    account_number: account,
    account_holder_name: holder,
    account_type: input.account_type === "individual" ? "individual" : "company",
  });
  if (!lobRes.ok) return { ok: false, error: lobRes.error };

  const sb = await createClient();
  const { data, error } = await sb
    .from("mail_bank_accounts")
    .insert({
      lob_bank_account_id: lobRes.lob_bank_account_id,
      bank_name: lobRes.bank_name,
      account_holder_name: holder,
      routing_last_four: lobRes.routing_last_four,
      account_last_four: lobRes.account_last_four,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true, id: data.id as string };
}

export async function verifyMailBankAccount(input: {
  id: string;
  amount_1_cents: number;
  amount_2_cents: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { data: row } = await sb
    .from("mail_bank_accounts")
    .select("lob_bank_account_id")
    .eq("id", input.id)
    .single();
  const bnk = (row?.lob_bank_account_id as string | null) ?? null;
  if (!bnk) return { ok: false, error: "Bank account not found" };
  const lobRes = await lobVerifyBankAccount(bnk, [
    input.amount_1_cents,
    input.amount_2_cents,
  ]);
  if (!lobRes.ok) return { ok: false, error: lobRes.error };
  await sb
    .from("mail_bank_accounts")
    .update({ status: "verified", verified_at: new Date().toISOString() })
    .eq("id", input.id);
  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteMailBankAccount(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const sb = await createClient();
  const { error } = await sb.from("mail_bank_accounts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
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
        uploadBlob = new Blob([newBuf], { type: contentType });
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
  saleprice: "lead.estimated_surplus",
  closingbid: "lead.estimated_surplus",
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

// -- Phone validation backfill (Billing section) ----------------------------

// Admin-only one-shot: validates every phone in the org with status='untested'
// on leads that aren't marked lost. Runs in after() so the UI returns
// immediately; progress shows up in the Billing meter as validations complete.
// Whatever VERIPHONE_API_KEY is set in the runtime env at trigger time is what
// gets charged — swap it in Vercel before clicking if you want a different
// account to absorb the cost.
export async function runPhoneValidationBackfill(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const profile = await getCurrentProfile();
  if (!profile?.orgId) return { ok: false, error: "No org" };
  const orgId = profile.orgId;
  after(async () => {
    try {
      const result = await validateAllUntestedForOrg(orgId, { excludeLostLeads: true });
      console.log(
        `[phone-validate] backfill complete for org=${orgId}: ` +
          `processed=${result.processed}, pending=${result.pending}`
      );
    } catch (e) {
      console.error("[phone-validate] backfill failed:", e);
    }
  });
  return { ok: true };
}

