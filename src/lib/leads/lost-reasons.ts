import "server-only";
import { createClient } from "@/lib/supabase/server";

export type LostReasonOption = {
  label: string;
  isDefault: boolean;
};

export async function fetchLostReasons(): Promise<LostReasonOption[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("lost_reasons")
    .select("label, is_default")
    .eq("archived", false)
    .order("label", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    label: r.label as string,
    isDefault: r.is_default as boolean,
  }));
}
