"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentProfile, requireAdmin } from "@/lib/auth/current-user";

// Settings redesign — image upload actions.
//
// avatars      bucket: per-user, public read. Folder convention = user_id.
// org-logos    bucket: per-org, public read. Folder convention = org_id.

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg"]);

function extFor(mime: string): string {
  return mime === "image/png" ? "png" : "jpg";
}

// -- Avatar (self) -----------------------------------------------------------

export async function uploadMyAvatar(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file received" };
  if (file.size === 0) return { ok: false, error: "Empty file" };
  if (file.size > MAX_BYTES) return { ok: false, error: "Image must be 5 MB or smaller" };
  if (!ALLOWED_TYPES.has(file.type)) return { ok: false, error: "Use a PNG or JPEG image" };

  const ext = extFor(file.type);
  const path = `${profile.id}/avatar-${Date.now()}.${ext}`;

  const sb = await createClient();
  const { error: upErr } = await sb.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (upErr) return { ok: false, error: upErr.message };

  // Resolve public URL (avatars bucket is public).
  const { data: pub } = sb.storage.from("avatars").getPublicUrl(path);
  const publicUrl = pub.publicUrl;

  // Update profile row.
  const { error: setErr } = await sb.from("profiles").update({ avatar_url: publicUrl }).eq("id", profile.id);
  if (setErr) return { ok: false, error: setErr.message };

  revalidatePath("/settings");
  return { ok: true, url: publicUrl };
}

export async function removeMyAvatar(): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };

  const sb = await createClient();
  // List files in the user's folder and delete them all (covers stale entries).
  const { data: listed } = await sb.storage.from("avatars").list(profile.id);
  if (listed && listed.length > 0) {
    const paths = listed.map((f) => `${profile.id}/${f.name}`);
    await sb.storage.from("avatars").remove(paths);
  }

  const { error } = await sb.from("profiles").update({ avatar_url: null }).eq("id", profile.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}

// -- Org logo (admin) --------------------------------------------------------

export async function uploadOrgLogo(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const profile = await requireAdmin();
  if (!profile) return { ok: false, error: "Admins only" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file received" };
  if (file.size === 0) return { ok: false, error: "Empty file" };
  if (file.size > MAX_BYTES) return { ok: false, error: "Image must be 5 MB or smaller" };
  if (!ALLOWED_TYPES.has(file.type)) return { ok: false, error: "Use a PNG or JPEG image" };

  const ext = extFor(file.type);
  const path = `${profile.orgId}/logo-${Date.now()}.${ext}`;

  // Use service client to bypass any per-user RLS quirks for the org folder.
  const admin = createServiceClient();
  const { error: upErr } = await admin.storage
    .from("org-logos")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (upErr) return { ok: false, error: upErr.message };

  const { data: pub } = admin.storage.from("org-logos").getPublicUrl(path);
  const publicUrl = pub.publicUrl;

  const { error: setErr } = await admin
    .from("organizations")
    .update({ logo_url: publicUrl })
    .eq("id", profile.orgId);
  if (setErr) return { ok: false, error: setErr.message };

  revalidatePath("/settings");
  return { ok: true, url: publicUrl };
}

export async function removeOrgLogo(): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await requireAdmin();
  if (!profile) return { ok: false, error: "Admins only" };

  const admin = createServiceClient();
  const { data: listed } = await admin.storage.from("org-logos").list(profile.orgId);
  if (listed && listed.length > 0) {
    const paths = listed.map((f) => `${profile.orgId}/${f.name}`);
    await admin.storage.from("org-logos").remove(paths);
  }

  const { error } = await admin.from("organizations").update({ logo_url: null }).eq("id", profile.orgId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}

// -- Time zone + EIN (small text setters) -----------------------------------

export async function setMyTimeZone(
  tz: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  const sb = await createClient();
  const { error } = await sb.from("profiles").update({ time_zone: tz || null }).eq("id", profile.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function setOrgTaxId(
  ein: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await requireAdmin();
  if (!profile) return { ok: false, error: "Admins only" };
  const cleaned = (ein ?? "").trim() || null;
  const admin = createServiceClient();
  const { error } = await admin
    .from("organizations")
    .update({ tax_id_ein: cleaned })
    .eq("id", profile.orgId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}
