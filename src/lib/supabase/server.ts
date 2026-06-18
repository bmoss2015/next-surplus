import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const headerList = await headers();
  const host = (headerList.get("host") ?? "").toLowerCase().split(":")[0];
  const isProdDomain =
    host === "nextsurplus.com" ||
    host === "www.nextsurplus.com" ||
    host === "app.nextsurplus.com";

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const finalOptions = isProdDomain
                ? { ...options, domain: ".nextsurplus.com" }
                : options;
              cookieStore.set(name, value, finalOptions);
            });
          } catch {}
        },
      },
    }
  );
}
