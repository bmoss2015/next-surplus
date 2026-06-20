"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { markThreadRead as serverMarkRead } from "@/lib/email/inbox";
import { syncGmailAccount } from "@/lib/email/sync";
import {
  buildLeadEmailCandidates,
  type EmailRecipientCandidate,
} from "@/lib/email/lead-recipients";

export async function fetchInboxLeadCandidates(
  leadId: string
): Promise<EmailRecipientCandidate[]> {
  const { candidates } = await buildLeadEmailCandidates(leadId);
  return candidates;
}

export async function markThreadRead(threadId: string) {
  await serverMarkRead(threadId);
  revalidatePath("/inbox");
}

export async function markThreadUnread(threadId: string) {
  const sb = await createClient();
  await sb
    .from("messages")
    .update({ is_read: false })
    .eq("conversation_id", threadId);
  await sb
    .from("conversations")
    .update({ unread_count: 1 })
    .eq("id", threadId);
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

// Manual refresh button → re-runs Gmail sync for every account this user owns.
export async function triggerSync(): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { data: accounts } = await sb
    .from("channel_accounts")
    .select("id")
    .eq("user_id", user.id)
    .eq("provider", "gmail")
    .eq("status", "active");
  for (const a of accounts ?? []) {
    try {
      await syncGmailAccount(a.id as string);
    } catch (e) {
      console.error("manual sync failed for", a.id, e);
    }
  }
  revalidatePath("/inbox");
  return { ok: true };
}
