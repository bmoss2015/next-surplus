import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EmailAccountRow } from "./types";

// Re-export so existing server-side imports keep working.
export type { EmailAccountRow } from "./types";

// Fetches the channel accounts owned by the current user. RLS already scopes
// to user_id = auth.uid(); this is just a convenience wrapper.
export async function fetchMyEmailAccounts(): Promise<EmailAccountRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("channel_accounts")
    .select(
      "id, provider, address, display_name, status, last_synced_at, created_at"
    )
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EmailAccountRow[];
}
