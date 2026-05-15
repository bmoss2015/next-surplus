import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { buildAuthorizeUrl } from "@/lib/email/google-oauth";

export const dynamic = "force-dynamic";

// Kicks off the Google OAuth flow. Stores a CSRF nonce in a cookie and
// redirects the user to Google's consent screen.
export async function GET(req: NextRequest) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const state = randomBytes(24).toString("hex");
  const origin = req.nextUrl.origin;

  const res = NextResponse.redirect(buildAuthorizeUrl({ origin, state }));
  res.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
