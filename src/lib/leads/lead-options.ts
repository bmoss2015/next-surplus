import "server-only";
import { createClient } from "@/lib/supabase/server";

export type LeadOption = {
  id: string;
  lead_id: string;
  address: string;
};

export async function fetchLeadOptions(): Promise<LeadOption[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("leads")
    .select("id, lead_id, address")
    .neq("stage", "lost")
    .order("imported_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as LeadOption[];
}
