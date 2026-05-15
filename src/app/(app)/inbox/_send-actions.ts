"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  buildRawMessage,
  sendMessage as gmailSend,
  getMessage as gmailGet,
  getHeader,
  extractBodies,
} from "@/lib/email/gmail";

export type SendInput = {
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  threadId?: string;
  inReplyTo?: string | null;
  referencesChain?: string[];
  leadId?: string | null;
  attachments?: { filename: string; mimeType: string; base64: string }[];
};

export async function sendEmail(
  input: SendInput
): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  // Fetch the account row to confirm ownership and grab the from-address.
  const { data: acct, error: acctErr } = await sb
    .from("channel_accounts")
    .select("id, address, display_name, org_id, user_id")
    .eq("id", input.accountId)
    .maybeSingle();
  if (acctErr || !acct) return { ok: false, error: "Account not found" };
  if (acct.user_id !== user.id) return { ok: false, error: "Forbidden" };

  const fromHeader = acct.display_name
    ? `"${acct.display_name}" <${acct.address}>`
    : acct.address;

  const raw = buildRawMessage({
    from: fromHeader,
    to: input.to,
    cc: input.cc,
    bcc: input.bcc,
    subject: input.subject,
    bodyText: input.body,
    inReplyTo: input.inReplyTo ?? undefined,
    references: input.referencesChain,
    attachments: input.attachments,
  });

  let sent;
  try {
    sent = await gmailSend({
      accountId: input.accountId,
      raw,
      threadId: input.threadId,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  // Re-fetch the sent message from Gmail so we get the canonical Message-ID
  // and all headers, then upsert into our local tables. Using the service
  // client here so we don't fight RLS over user/org context.
  const svc = createServiceClient();
  let full;
  try {
    full = await gmailGet({ accountId: input.accountId, messageId: sent.id });
  } catch (e) {
    return {
      ok: false,
      error: `Sent OK but local persist failed: ${e instanceof Error ? e.message : e}`,
    };
  }

  const subject = getHeader(full.payload, "Subject") ?? "";
  const messageIdHeader = getHeader(full.payload, "Message-ID");
  const inReplyToHdr = getHeader(full.payload, "In-Reply-To");
  const referencesHdr = getHeader(full.payload, "References");
  const bodies = extractBodies(full.payload);
  const dateMs = Number(full.internalDate);

  // Upsert conversation: use full.threadId.
  const { data: existingConv } = await svc
    .from("conversations")
    .select("id, participants, lead_id")
    .eq("channel_account_id", input.accountId)
    .eq("provider_thread_key", full.threadId)
    .maybeSingle();

  let convId: string;
  if (existingConv) {
    convId = existingConv.id as string;
    await svc
      .from("conversations")
      .update({
        last_message_at: new Date(dateMs).toISOString(),
        last_message_preview: (full.snippet ?? "").slice(0, 240),
        lead_id: input.leadId ?? (existingConv.lead_id as string | null),
        // The user sending an outbound reply demonstrably means they've seen
        // any prior inbound on this thread — clear the unread badge.
        unread_count: 0,
      })
      .eq("id", convId);
    // Also mark any inbound messages on this thread as read so the lead's
    // Conversation-tab unread badge clears even when we only had a stale
    // unread_count without per-message reset.
    await svc
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", convId)
      .eq("is_read", false);
  } else {
    const { data: inserted, error: convErr } = await svc
      .from("conversations")
      .insert({
        org_id: acct.org_id,
        channel_account_id: input.accountId,
        channel: "gmail",
        provider_thread_key: full.threadId,
        subject,
        lead_id: input.leadId ?? null,
        participants: [
          { address: acct.address, name: acct.display_name ?? undefined },
          ...input.to.map((a) => ({ address: a })),
          ...(input.cc ?? []).map((a) => ({ address: a })),
        ],
        last_message_at: new Date(dateMs).toISOString(),
        last_message_preview: (full.snippet ?? "").slice(0, 240),
        unread_count: 0,
      })
      .select("id")
      .maybeSingle();
    if (convErr || !inserted) {
      return {
        ok: false,
        error: `Sent OK but conv insert failed: ${convErr?.message ?? "no row"}`,
      };
    }
    convId = inserted.id as string;
  }

  const { data: msgRow, error: msgErr } = await svc
    .from("messages")
    .insert({
      org_id: acct.org_id,
      conversation_id: convId,
      channel: "gmail",
      direction: "outbound",
      from_address: acct.address,
      from_name: acct.display_name ?? null,
      to_addresses: input.to,
      cc_addresses: input.cc ?? [],
      bcc_addresses: input.bcc ?? [],
      subject,
      body_text: bodies.text ?? input.body,
      body_html: bodies.html ?? null,
      snippet: full.snippet ?? null,
      provider_message_id: sent.id,
      provider_thread_id: full.threadId,
      in_reply_to: inReplyToHdr ?? null,
      references_chain: referencesHdr
        ? referencesHdr.split(/\s+/).filter(Boolean)
        : [],
      sent_at: new Date(dateMs).toISOString(),
      is_read: true,
      sent_by_user_id: user.id,
      metadata: { message_id_header: messageIdHeader ?? null },
    })
    .select("id")
    .maybeSingle();
  if (msgErr || !msgRow) {
    return {
      ok: false,
      error: `Sent OK but message insert failed: ${msgErr?.message ?? "no row"}`,
    };
  }

  // Persist outbound attachments locally so they appear on the thread reader.
  // The user already sent the base64 payload — upload it to Storage and
  // insert a message_attachments row pointing at it.
  for (let i = 0; i < (input.attachments ?? []).length; i++) {
    const att = input.attachments![i];
    try {
      const path = `${acct.org_id}/${input.accountId}/${msgRow.id}/${att.filename}`;
      const bytes = Buffer.from(att.base64, "base64");
      const { error: upErr } = await svc.storage
        .from("email-attachments")
        .upload(path, bytes, { contentType: att.mimeType, upsert: true });
      if (upErr && !upErr.message?.includes("already")) {
        console.error("outbound attachment upload failed", upErr);
        continue;
      }
      await svc.from("message_attachments").insert({
        org_id: acct.org_id,
        message_id: msgRow.id,
        filename: att.filename,
        mime_type: att.mimeType,
        size_bytes: bytes.byteLength,
        storage_path: path,
        is_inline: false,
      });
    } catch (e) {
      console.error("outbound attachment persist failed", e);
    }
  }

  revalidatePath("/inbox");
  if (input.leadId) revalidatePath(`/leads/${input.leadId}`);
  return { ok: true, messageId: msgRow.id as string };
}
