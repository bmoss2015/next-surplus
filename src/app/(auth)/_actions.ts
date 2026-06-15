"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export async function signIn(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signUp(
  fullName: string,
  email: string,
  password: string
): Promise<
  | { ok: true; session: boolean }
  | { ok: false; error: string }
> {
  const cleanName = fullName.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanName) return { ok: false, error: "Full name is required" };
  if (!cleanEmail) return { ok: false, error: "Email is required" };
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters" };
  }

  const admin = createServiceClient();

  const orgName = `${cleanName}'s Workspace`;
  const { data: orgRow, error: orgErr } = await admin
    .from("orgs")
    .insert({ name: orgName })
    .select("id")
    .single();
  if (orgErr || !orgRow) {
    return {
      ok: false,
      error: orgErr?.message ?? "Could not create organization",
    };
  }
  const orgId = orgRow.id as string;

  const sb = await createClient();
  const { data, error } = await sb.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        org_id: orgId,
        role: "admin",
        full_name: cleanName,
      },
      emailRedirectTo: `${SITE_URL}/auth/callback?next=/`,
    },
  });

  if (error) {
    await admin.from("orgs").delete().eq("id", orgId);
    return { ok: false, error: error.message };
  }

  return { ok: true, session: Boolean(data.session) };
}

export async function signOut() {
  const sb = await createClient();
  await sb.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    // The callback route does the PKCE exchange server-side (the code_verifier
    // cookie was set by the server client when this action fired — the browser
    // client can't read it, so the exchange must happen on the server too).
    // After exchange, the user lands on /reset with a real session in cookies.
    redirectTo: `${SITE_URL}/auth/callback?next=/reset`,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function startGoogleSignIn(): Promise<
  { ok: true; url: string } | { ok: false; error: string }
> {
  const sb = await createClient();
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${SITE_URL}/auth/callback?next=/`,
      queryParams: { access_type: "offline", prompt: "consent" },
      skipBrowserRedirect: true,
    },
  });
  if (error || !data?.url) {
    return {
      ok: false,
      error:
        error?.message ??
        "Google sign in is not enabled for this Supabase project.",
    };
  }
  return { ok: true, url: data.url };
}
