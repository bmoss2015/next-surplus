import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Server-side OAuth/recovery/invite callback. Lives here because the @supabase/ssr
// PKCE flow stores the code_verifier in cookies set by the SERVER client — the
// browser client can't decrypt them, so the exchange has to happen server-side.
//
// Supported inputs (Supabase chooses one depending on the email template):
//   - ?code=<pkce_code>            (default templates, PKCE flow)
//   - ?token_hash=<hash>&type=<t>  (templates using {{ .TokenHash }})
// On success → redirect to ?next path (defaults to /). On failure → /reset (or
// /login) with an error flag so the page can show "invalid".
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") ? next : "/";

  const sb = await createClient();

  if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  } else if (tokenHash && type) {
    const { error } = await sb.auth.verifyOtp({
      type: type as "recovery" | "invite" | "email" | "signup",
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }

  const errTarget =
    safeNext === "/reset" || safeNext === "/accept-invite" ? safeNext : "/login";
  return NextResponse.redirect(`${origin}${errTarget}?error=invalid_link`);
}
