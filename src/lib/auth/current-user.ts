import "server-only";
import { createClient } from "@/lib/supabase/server";

export type CurrentProfile = {
  id: string;
  email: string | null;
  fullName: string;
  role: "admin" | "member";
  orgId: string;
  isAdmin: boolean;
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
    .select("id, email, full_name, role, org_id, avatar_url, time_zone")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data) return null;

  const role = data.role === "admin" ? "admin" : "member";
  return {
    id: data.id as string,
    email: (data.email as string | null) ?? user.email ?? null,
    fullName: (data.full_name as string | null) ?? user.email ?? "User",
    role,
    orgId: data.org_id as string,
    isAdmin: role === "admin",
    avatarUrl: (data.avatar_url as string | null) ?? null,
    timeZone: (data.time_zone as string | null) ?? null,
  };
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
