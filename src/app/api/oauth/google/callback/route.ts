import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  exchangeCodeForTokens,
  getUserInfo,
} from "@/lib/email/google-oauth";
import { encryptToken } from "@/lib/email/crypto";
import { syncGmailAccount } from "@/lib/email/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

  // Trigger the initial backfill IN-LINE before redirecting back. Fire-and-
  // forget here gets aborted by the Next runtime as soon as we send the
  // redirect, which is why last_synced_at was staying null. Awaiting keeps
  // the OAuth flow open until the first sync completes — slower (the OAuth
  // response now takes 5-30s for a typical 90-day backfill), but reliable.
  // Look up the account we just upserted to get its id.
  const { data: justConnected } = await svc
    .from("channel_accounts")
    .select("id")
    .eq("user_id", user.id)
    .eq("provider", "gmail")
    .eq("address", userInfo.email)
    .maybeSingle();
  if (justConnected?.id) {
    try {
      await syncGmailAccount(justConnected.id as string);
    } catch (e) {
      console.error("initial sync failed", e);
      // Don't bail on the OAuth redirect — the account is connected, manual
      // refresh in the inbox will retry.
    }
  }

  const redirect = NextResponse.redirect(
    new URL("/settings?email_connect=success#email-accounts", req.url)
  );
  redirect.cookies.delete("google_oauth_state");
  return redirect;
}
