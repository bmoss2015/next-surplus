"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

const AUTH_WINDOW_MS = 60 * 1000;
const AUTH_LIMIT = 10;

export async function signIn(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ip = await clientIp();
  const limit = rateLimit(`signin:${ip}`, AUTH_LIMIT, AUTH_WINDOW_MS);
  if (!limit.ok) {
    return {
      ok: false,
      error: `Too many sign-in attempts. Try again in ${limit.retryAfterSec} seconds.`,
    };
  }
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
  const ip = await clientIp();
  const limit = rateLimit(`reset:${ip}`, AUTH_LIMIT, AUTH_WINDOW_MS);
  if (!limit.ok) {
    return {
      ok: false,
      error: `Too many reset requests. Try again in ${limit.retryAfterSec} seconds.`,
    };
  }
  const sb = await createClient();
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/reset`,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
