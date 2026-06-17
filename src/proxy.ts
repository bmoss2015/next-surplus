import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Stripe-style host split:
//   nextsurplus.com (apex)       → marketing site (/, /pricing, /landing, ...)
//   app.nextsurplus.com (app)    → authenticated portal (/leads, /inbox, ...)
//
// Both hosts point at the same Vercel project. This middleware enforces the
// split: portal routes hit on the apex bounce to the app subdomain; marketing
// routes hit on the app subdomain bounce to the apex.

const MARKETING_HOSTS = new Set([
  "nextsurplus.com",
  "www.nextsurplus.com",
  "mossequitypartners.com",
]);
const APP_HOST = "app.nextsurplus.com";

// Routes that belong to the marketing site (nextsurplus.com).
const MARKETING_PATHS = [
  "/",
  "/landing",
  "/pricing",
  "/privacy",
  "/terms",
  "/login",
  "/signup",
  "/forgot",
  "/reset",
  "/accept-invite",
];

// Pages for signed-out users; a signed-in user hitting these is bounced home.
const PUBLIC_PATHS = ["/login", "/forgot", "/signup"];
// Auth-flow pages reachable with OR without a session.
const AUTH_FLOW_PATHS = ["/reset", "/accept-invite"];
// Always-open pages: anyone can view, no bounce in either direction.
const OPEN_PATHS = ["/landing", "/pricing", "/privacy", "/terms", "/signup-mockups", "/login-mockups"];

function isMarketingPath(pathname: string): boolean {
  return MARKETING_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function hostKind(
  host: string | null
): "marketing" | "app" | "preview" | "unknown" {
  if (!host) return "unknown";
  const h = host.toLowerCase().split(":")[0];
  if (MARKETING_HOSTS.has(h)) return "marketing";
  if (h === APP_HOST) return "app";
  return "preview";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next internals + static assets + the OAuth/recovery callback.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/callback") ||
    pathname.includes("/favicon")
  ) {
    return NextResponse.next();
  }

  const host = request.headers.get("host");
  const kind = hostKind(host);

  // Host split — only enforced on the real production hosts. Previews and
  // localhost serve every route on whatever URL.
  if (kind === "marketing" && !isMarketingPath(pathname)) {
    const url = request.nextUrl.clone();
    url.host = APP_HOST;
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }
  if (kind === "app" && isMarketingPath(pathname) && pathname !== "/") {
    // Marketing routes (except root) bounce from the app subdomain to apex.
    // Root `/` stays on the app subdomain because the signed-in dashboard
    // lives there.
    const url = request.nextUrl.clone();
    url.host = "nextsurplus.com";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  // On the apex, `/` shows the marketing landing instead of the gated
  // dashboard. Rewrite root → /landing/v1 (the chosen variant) so the URL
  // stays pretty. /landing keeps showing the variant index for ongoing
  // review.
  if (kind === "marketing" && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/landing/v1";
    return NextResponse.rewrite(url);
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAuthFlow = AUTH_FLOW_PATHS.some((p) => pathname.startsWith(p));
  const isOpen = OPEN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

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
    if (kind === "marketing") {
      const url = request.nextUrl.clone();
      url.host = APP_HOST;
      url.protocol = "https:";
      url.pathname = "/";
      url.search = "";
      const r = NextResponse.redirect(url);
      response.cookies.getAll().forEach((c) => r.cookies.set(c));
      return r;
    }
    return redirectTo("/");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ext|favicon.ico).*)"],
};
