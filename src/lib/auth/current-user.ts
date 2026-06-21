import "server-only";
import { createClient } from "@/lib/supabase/server";

export type CurrentProfile = {
  id: string;
  email: string | null;
  fullName: string;
  role: "admin" | "member" | "owner";
  orgId: string;
  isAdmin: boolean;
  isOwner: boolean;
  canViewFeedback: boolean;
  avatarUrl: string | null;
  timeZone: string | null;
};

// Resolves the signed-in user's profile (org + role). Returns null if there is
// no session or the user has no profile row (e.g. signed up outside an invite).
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data, error } = await sb
    .from("profiles")
    .select("id, email, full_name, role, org_id, avatar_url, time_zone, can_view_feedback")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data) return null;

  // Owner inherits admin (every existing admin gate must pass for the owner).
  const raw = data.role as string;
  const role: CurrentProfile["role"] =
    raw === "owner" ? "owner" : raw === "admin" ? "admin" : "member";
  const isOwner = role === "owner";
  const isAdmin = role === "admin" || isOwner;
  return {
    id: data.id as string,
    email: (data.email as string | null) ?? user.email ?? null,
    fullName: (data.full_name as string | null) ?? user.email ?? "User",
    role,
    orgId: data.org_id as string,
    isAdmin,
    isOwner,
    canViewFeedback: Boolean(data.can_view_feedback),
    avatarUrl: (data.avatar_url as string | null) ?? null,
    timeZone: (data.time_zone as string | null) ?? null,
  };
}

export async function requirePlatformAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  if (!profile.canViewFeedback) {
    return { ok: false, error: "Platform admin only" };
  }
  return { ok: true };
}

// For use in Server Actions: bails with a friendly error unless the caller is
// an admin. RLS is the real enforcement; this just gives a nicer message.
export async function requireAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  if (!profile.isAdmin) {
    return { ok: false, error: "Only admins can do that" };
  }
  return { ok: true };
}

// Owner-only gate. Used by server actions that read or mutate cross-customer
// data (provider costs, margin, etc.) where even an org admin should not have
// access.
export async function requireOwner(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  if (!profile.isOwner) {
    return { ok: false, error: "Owner only" };
  }
  return { ok: true };
}
