import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for server-only operations that need to bypass RLS:
// CSV imports, seed scripts, scheduled jobs, admin tools.
// NEVER import this from a client component. The service key is full-access.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
