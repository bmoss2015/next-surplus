"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { markThreadRead as serverMarkRead } from "@/lib/email/inbox";

export async function markThreadRead(threadId: string) {
  await serverMarkRead(threadId);
  revalidatePath("/inbox");
}

export async function linkThreadToLead(
  threadId: string,
  leadId: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb
    .from("conversations")
    .update({ lead_id: leadId })
    .eq("id", threadId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/inbox");
  if (leadId) revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function archiveThread(threadId: string) {
  const sb = await createClient();
  await sb
    .from("conversations")
    .update({ is_archived: true })
    .eq("id", threadId);
  revalidatePath("/inbox");
}
