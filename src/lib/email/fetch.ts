import "server-only";
import { createClient } from "@/lib/supabase/server";

export type EmailAccountRow = {
  id: string;
  provider: "gmail" | "outlook" | "quo_sms";
  address: string;
  display_name: string | null;
  status: "active" | "reauth_required" | "disabled";
  last_synced_at: string | null;
  created_at: string;
};

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
