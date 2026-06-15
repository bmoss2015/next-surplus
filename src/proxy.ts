import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Pages for signed-out users; a signed-in user hitting these is bounced home.
const PUBLIC_PATHS = ["/login", "/forgot", "/signup"];
// Auth-flow pages reachable with OR without a session — you land on them holding
// a recovery/invite session in order to set a password, so don't bounce.
const AUTH_FLOW_PATHS = ["/reset", "/accept-invite"];
// Always-open pages: anyone can view, no bounce in either direction. Required
// for Google OAuth verification, which requires publicly reachable URLs.
const OPEN_PATHS = ["/privacy", "/terms"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next internals + static assets + the OAuth/recovery callback (which
  // must run unauthenticated — it's what establishes the session in the first
  // place, off a token in the URL).
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/callback") ||
    pathname.includes("/favicon")
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAuthFlow = AUTH_FLOW_PATHS.some((p) => pathname.startsWith(p));
  const isOpen = OPEN_PATHS.some((p) => pathname.startsWith(p));

  if (isOpen) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Helper — build a redirect response that carries over any refresh cookies
  // Supabase set on `response` during getUser(). Without this copy step the
  // browser never sees the refreshed access/refresh tokens, then sends a
  // stale cookie on the next request, and the middleware flip-flops between
  // "authed" and "not authed" — classic loop.
  function redirectTo(pathname: string, redirectTo?: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    if (redirectTo) url.searchParams.set("redirectTo", redirectTo);
    else url.searchParams.delete("redirectTo");
    const r = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  }

  if (!user && !isPublic && !isAuthFlow) {
    return redirectTo("/login", pathname);
  }

  if (user && isPublic) {
    return redirectTo("/");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
