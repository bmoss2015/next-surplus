import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  exchangeCodeForTokens,
  getUserInfo,
} from "@/lib/email/google-oauth";
import { encryptToken } from "@/lib/email/crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const stateFromQuery = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const stateCookie = req.cookies.get("google_oauth_state")?.value;

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?email_connect=error&reason=${error}`, req.url)
    );
  }
  if (!code || !stateFromQuery || !stateCookie || stateFromQuery !== stateCookie) {
    return NextResponse.redirect(
      new URL("/settings?email_connect=error&reason=state_mismatch", req.url)
    );
  }

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Look up the caller's org from profiles.
  const { data: profile } = await sb
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.org_id) {
    return NextResponse.redirect(
      new URL("/settings?email_connect=error&reason=no_org", req.url)
    );
  }

  let tokens, userInfo;
  try {
    tokens = await exchangeCodeForTokens({ code, origin: url.origin });
    userInfo = await getUserInfo(tokens.access_token);
  } catch (e) {
    console.error("OAuth exchange failed", e);
    return NextResponse.redirect(
      new URL("/settings?email_connect=error&reason=exchange_failed", req.url)
    );
  }

  // Use the service client to bypass RLS and write the row. The RLS policy
  // expects user_id = auth.uid() AND org_id = auth_org_id(), which is correct
  // for the user-context client; using service-role with explicit values is
  // equivalent and avoids cookie-context edge cases.
  const svc = createServiceClient();
  const expiresAt = new Date(
    Date.now() + tokens.expires_in * 1000
  ).toISOString();

  const { error: upsertErr } = await svc.from("channel_accounts").upsert(
    {
      org_id: profile.org_id,
      user_id: user.id,
      provider: "gmail",
      address: userInfo.email,
      display_name: userInfo.name ?? null,
      access_token_encrypted: encryptToken(tokens.access_token),
      refresh_token_encrypted: tokens.refresh_token
        ? encryptToken(tokens.refresh_token)
        : null,
      token_expires_at: expiresAt,
      status: "active",
    },
    { onConflict: "user_id,provider,address" }
  );

  if (upsertErr) {
    console.error("channel_accounts upsert failed", upsertErr);
    return NextResponse.redirect(
      new URL("/settings?email_connect=error&reason=db_write", req.url)
    );
  }

  // Kick off backfill in the background. Fire-and-forget — the sync route is
  // idempotent and can be re-triggered manually.
  fetch(`${url.origin}/api/email/sync?accountAddress=${encodeURIComponent(userInfo.email)}`, {
    method: "POST",
    headers: {
      "x-internal-trigger": process.env.INTERNAL_TRIGGER_SECRET ?? "",
    },
  }).catch(() => {});

  const redirect = NextResponse.redirect(
    new URL("/settings?email_connect=success", req.url)
  );
  redirect.cookies.delete("google_oauth_state");
  return redirect;
}
