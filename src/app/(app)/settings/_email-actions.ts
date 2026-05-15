"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function disconnectEmailAccount(
  accountId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  // RLS restricts deletes to the connector — this is safe.
  const { error } = await sb
    .from("channel_accounts")
    .delete()
    .eq("id", accountId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}
