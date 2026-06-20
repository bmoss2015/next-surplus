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
import { sendImapSmtpMessage } from "@/lib/email/imap";
import { findLeadForAddress } from "@/lib/email/auto-link";

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
    .select("id, address, display_name, org_id, user_id, provider")
    .eq("id", input.accountId)
    .maybeSingle();
  if (acctErr || !acct) return { ok: false, error: "Account not found" };
  if (acct.user_id !== user.id) return { ok: false, error: "Forbidden" };

  const provider = (acct.provider as string) === "imap" ? "imap" : "gmail";
  const svc = createServiceClient();

  if (provider === "imap") {
    let sent;
    try {
      sent = await sendImapSmtpMessage({
        accountId: input.accountId,
        from: {
          address: acct.address as string,
          name: (acct.display_name as string | null) ?? undefined,
        },
        to: input.to,
        cc: input.cc,
        bcc: input.bcc,
        subject: input.subject,
        bodyText: input.body,
        inReplyTo: input.inReplyTo ?? null,
        references: input.referencesChain,
        attachments: input.attachments,
      });
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
    const threadKey = input.threadId ?? sent.messageId.replace(/[<>]/g, "");
    return await persistOutboundImap({
      acct,
      input,
      userId: user.id,
      providerMessageId: sent.messageId.replace(/[<>]/g, ""),
      threadKey,
      svc,
    });
  }

  const fromHeader = acct.display_name
    ? `"${acct.display_name}" <${acct.address}>`
    : acct.address;

  const looksLikeHtml = /<[a-z][^>]*>/i.test(input.body);
  const htmlBody = looksLikeHtml
    ? input.body
    : input.body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  const textBody = looksLikeHtml
    ? input.body.replace(/<[^>]+>/g, "")
    : input.body;

  const raw = buildRawMessage({
    from: fromHeader,
    to: input.to,
    cc: input.cc,
    bcc: input.bcc,
    subject: input.subject,
    bodyHtml: htmlBody,
    bodyText: textBody,
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

  // If no leadId was passed in AND the conversation isn't already linked,
  // run the auto-link ladder against the recipients. Catches the case where
  // a user replies to an unlinked thread whose recipient is a known lead
  // contact — the reply (and the whole thread going forward) gets linked.
  let resolvedLeadId: string | null =
    input.leadId ?? (existingConv?.lead_id as string | null | undefined) ?? null;
  if (!resolvedLeadId) {
    const candidates = [...input.to, ...(input.cc ?? [])];
    for (const addr of candidates) {
      const match = await findLeadForAddress(svc, {
        orgId: acct.org_id,
        address: addr,
      });
      if (match) {
        resolvedLeadId = match;
        break;
      }
    }
  }

  let convId: string;
  if (existingConv) {
    convId = existingConv.id as string;
    await svc
      .from("conversations")
      .update({
        last_message_at: new Date(dateMs).toISOString(),
        last_message_preview: (full.snippet ?? "").slice(0, 240),
        lead_id: resolvedLeadId,
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
        lead_id: resolvedLeadId,
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
      body_text: bodies.text ?? textBody,
      body_html: bodies.html ?? htmlBody,
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
  if (resolvedLeadId) revalidatePath(`/leads/${resolvedLeadId}`);
  return { ok: true, messageId: msgRow.id as string };
}

type AcctRow = {
  id: string;
  address: string;
  display_name: string | null;
  org_id: string;
  user_id: string;
  provider: string;
};

async function persistOutboundImap({
  acct,
  input,
  userId,
  providerMessageId,
  threadKey,
  svc,
}: {
  acct: AcctRow;
  input: SendInput;
  userId: string;
  providerMessageId: string;
  threadKey: string;
  svc: ReturnType<typeof createServiceClient>;
}): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const sentAtIso = new Date().toISOString();
  const snippet = (input.body ?? "").slice(0, 240);
  const looksLikeHtml = /<[a-z][^>]*>/i.test(input.body);

  const { data: existingConv } = await svc
    .from("conversations")
    .select("id, lead_id")
    .eq("channel_account_id", acct.id)
    .eq("provider_thread_key", threadKey)
    .maybeSingle();

  let resolvedLeadId: string | null =
    input.leadId ?? (existingConv?.lead_id as string | null | undefined) ?? null;
  if (!resolvedLeadId) {
    const candidates = [...input.to, ...(input.cc ?? [])];
    for (const addr of candidates) {
      const match = await findLeadForAddress(svc, {
        orgId: acct.org_id,
        address: addr,
      });
      if (match) {
        resolvedLeadId = match;
        break;
      }
    }
  }

  let convId: string;
  if (existingConv) {
    convId = existingConv.id as string;
    await svc
      .from("conversations")
      .update({
        last_message_at: sentAtIso,
        last_message_preview: snippet,
        lead_id: resolvedLeadId,
        unread_count: 0,
      })
      .eq("id", convId);
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
        channel_account_id: acct.id,
        channel: "imap",
        provider_thread_key: threadKey,
        subject: input.subject,
        lead_id: resolvedLeadId,
        participants: [
          { address: acct.address, name: acct.display_name ?? undefined },
          ...input.to.map((a) => ({ address: a })),
          ...(input.cc ?? []).map((a) => ({ address: a })),
        ],
        last_message_at: sentAtIso,
        last_message_preview: snippet,
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
      channel: "imap",
      direction: "outbound",
      from_address: acct.address,
      from_name: acct.display_name ?? null,
      to_addresses: input.to,
      cc_addresses: input.cc ?? [],
      bcc_addresses: input.bcc ?? [],
      subject: input.subject,
      body_text: looksLikeHtml ? input.body.replace(/<[^>]+>/g, "") : input.body,
      body_html: looksLikeHtml ? input.body : null,
      snippet,
      provider_message_id: providerMessageId,
      provider_thread_id: threadKey,
      in_reply_to: input.inReplyTo ?? null,
      references_chain: input.referencesChain ?? [],
      sent_at: sentAtIso,
      is_read: true,
      sent_by_user_id: userId,
      metadata: { message_id_header: providerMessageId },
    })
    .select("id")
    .maybeSingle();
  if (msgErr || !msgRow) {
    return {
      ok: false,
      error: `Sent OK but message insert failed: ${msgErr?.message ?? "no row"}`,
    };
  }

  for (const att of input.attachments ?? []) {
    try {
      const path = `${acct.org_id}/${acct.id}/${msgRow.id}/${att.filename}`;
      const bytes = Buffer.from(att.base64, "base64");
      const { error: upErr } = await svc.storage
        .from("email-attachments")
        .upload(path, bytes, { contentType: att.mimeType, upsert: true });
      if (upErr && !upErr.message?.includes("already")) continue;
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
      console.error("imap outbound attachment persist failed", e);
    }
  }

  revalidatePath("/inbox");
  if (resolvedLeadId) revalidatePath(`/leads/${resolvedLeadId}`);
  return { ok: true, messageId: msgRow.id as string };
}
