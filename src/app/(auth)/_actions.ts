"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
