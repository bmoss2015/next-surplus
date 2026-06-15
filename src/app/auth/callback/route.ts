import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

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

  let exchangeOk = false;
  if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    exchangeOk = !error;
  } else if (tokenHash && type) {
    const { error } = await sb.auth.verifyOtp({
      type: type as "recovery" | "invite" | "email" | "signup",
      token_hash: tokenHash,
    });
    exchangeOk = !error;
  }

  if (exchangeOk) {
    await ensureProfileForOAuthUser(sb);
    return NextResponse.redirect(`${origin}${safeNext}`);
  }

  const errTarget =
    safeNext === "/reset" || safeNext === "/accept-invite"
      ? safeNext
      : "/login";
  return NextResponse.redirect(`${origin}${errTarget}?error=invalid_link`);
}

// Google/OAuth-created users don't pass org_id in metadata, so the
// handle_new_user trigger doesn't auto-create their profile. Bootstrap
// here: if the just-signed-in user has no profile row, create a fresh
// org for them and link a profile in admin role. Idempotent.
async function ensureProfileForOAuthUser(
  sb: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return;

  const { data: existing } = await sb
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return;

  const admin = createServiceClient();
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName =
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    user.email ??
    "New User";

  const { data: orgRow, error: orgErr } = await admin
    .from("orgs")
    .insert({ name: `${fullName}'s Workspace` })
    .select("id")
    .single();
  if (orgErr || !orgRow) {
    console.error("oauth bootstrap: org insert failed", orgErr);
    return;
  }

  const { error: profileErr } = await admin.from("profiles").insert({
    id: user.id,
    org_id: orgRow.id,
    role: "admin",
    full_name: fullName,
    email: user.email,
  });
  if (profileErr) {
    console.error("oauth bootstrap: profile insert failed", profileErr);
    await admin.from("orgs").delete().eq("id", orgRow.id);
  }
}
