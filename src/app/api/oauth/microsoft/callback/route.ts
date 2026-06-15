import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  exchangeCodeForTokens,
  getUserInfo,
} from "@/lib/email/microsoft-oauth";
import { encryptToken } from "@/lib/email/crypto";
import { syncOutlookAccount } from "@/lib/email/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const stateFromQuery = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const stateCookie = req.cookies.get("microsoft_oauth_state")?.value;

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?email_connect=error&reason=${error}`, req.url)
    );
  }
  if (
    !code ||
    !stateFromQuery ||
    !stateCookie ||
    stateFromQuery !== stateCookie
  ) {
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
    console.error("MS OAuth exchange failed", e);
    return NextResponse.redirect(
      new URL(
        "/settings?email_connect=error&reason=exchange_failed",
        req.url
      )
    );
  }

  const svc = createServiceClient();
  const expiresAt = new Date(
    Date.now() + tokens.expires_in * 1000
  ).toISOString();

  const { error: upsertErr } = await svc.from("channel_accounts").upsert(
    {
      org_id: profile.org_id,
      user_id: user.id,
      provider: "outlook",
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

  const { data: justConnected } = await svc
    .from("channel_accounts")
    .select("id")
    .eq("user_id", user.id)
    .eq("provider", "outlook")
    .eq("address", userInfo.email)
    .maybeSingle();
  if (justConnected?.id) {
    try {
      await syncOutlookAccount(justConnected.id as string);
    } catch (e) {
      console.error("initial outlook sync failed", e);
    }
  }

  const redirect = NextResponse.redirect(
    new URL("/settings?email_connect=success#email-accounts", req.url)
  );
  redirect.cookies.delete("microsoft_oauth_state");
  return redirect;
}
