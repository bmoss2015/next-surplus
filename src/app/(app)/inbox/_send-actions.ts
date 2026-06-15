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
import { sendOutlookMessage } from "@/lib/email/outlook";
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

  const svc = createServiceClient();

  const provider = (acct.provider as string) === "outlook" ? "outlook" : "gmail";

  let providerMessageId: string;
  let providerThreadKey: string;
  let messageIdHeader: string | null = null;
  let subject = input.subject;
  let bodyText: string | null = input.body;
  let bodyHtml: string | null = null;
  let snippet: string | null = null;
  let sentAtIso = new Date().toISOString();
  let inReplyToHdr: string | null = input.inReplyTo ?? null;
  let referencesHdr: string | null =
    input.referencesChain && input.referencesChain.length > 0
      ? input.referencesChain.join(" ")
      : null;

  if (provider === "gmail") {
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

    let full;
    try {
      full = await gmailGet({
        accountId: input.accountId,
        messageId: sent.id,
      });
    } catch (e) {
      return {
        ok: false,
        error: `Sent OK but local persist failed: ${e instanceof Error ? e.message : e}`,
      };
    }

    subject = getHeader(full.payload, "Subject") ?? input.subject;
    messageIdHeader = getHeader(full.payload, "Message-ID") ?? null;
    inReplyToHdr = getHeader(full.payload, "In-Reply-To") ?? null;
    referencesHdr = getHeader(full.payload, "References") ?? null;
    const bodies = extractBodies(full.payload);
    bodyText = bodies.text ?? input.body;
    bodyHtml = bodies.html ?? null;
    snippet = full.snippet ?? null;
    sentAtIso = new Date(Number(full.internalDate)).toISOString();
    providerMessageId = sent.id;
    providerThreadKey = full.threadId;
  } else {
    let draft;
    try {
      draft = await sendOutlookMessage({
        accountId: input.accountId,
        from: {
          address: acct.address,
          name: acct.display_name ?? undefined,
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
    providerMessageId = draft.id;
    providerThreadKey = draft.conversationId;
    messageIdHeader = draft.internetMessageId ?? null;
    subject = draft.subject ?? input.subject;
    snippet = draft.bodyPreview ?? null;
    sentAtIso = draft.sentDateTime ?? new Date().toISOString();
  }

  const { data: existingConv } = await svc
    .from("conversations")
    .select("id, participants, lead_id")
    .eq("channel_account_id", input.accountId)
    .eq("provider_thread_key", providerThreadKey)
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

  const previewSnippet = (snippet ?? "").slice(0, 240);

  let convId: string;
  if (existingConv) {
    convId = existingConv.id as string;
    await svc
      .from("conversations")
      .update({
        last_message_at: sentAtIso,
        last_message_preview: previewSnippet,
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
        channel_account_id: input.accountId,
        channel: provider,
        provider_thread_key: providerThreadKey,
        subject,
        lead_id: resolvedLeadId,
        participants: [
          { address: acct.address, name: acct.display_name ?? undefined },
          ...input.to.map((a) => ({ address: a })),
          ...(input.cc ?? []).map((a) => ({ address: a })),
        ],
        last_message_at: sentAtIso,
        last_message_preview: previewSnippet,
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
      channel: provider,
      direction: "outbound",
      from_address: acct.address,
      from_name: acct.display_name ?? null,
      to_addresses: input.to,
      cc_addresses: input.cc ?? [],
      bcc_addresses: input.bcc ?? [],
      subject,
      body_text: bodyText,
      body_html: bodyHtml,
      snippet,
      provider_message_id: providerMessageId,
      provider_thread_id: providerThreadKey,
      in_reply_to: inReplyToHdr ?? null,
      references_chain: referencesHdr
        ? referencesHdr.split(/\s+/).filter(Boolean)
        : [],
      sent_at: sentAtIso,
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
