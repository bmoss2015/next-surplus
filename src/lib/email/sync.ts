import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import {
  getProfile,
  listMessages,
  listHistory,
  getMessage,
  getAttachment,
  getHeader,
  extractBodies,
  extractAttachments,
  parseAddressList,
  parseFromHeader,
  type GmailMessageFull,
} from "./gmail";
import {
  listInboxDelta,
  listAttachments as listOutlookAttachments,
  getAttachmentContent as getOutlookAttachmentContent,
  addressListOf,
  getHeader as getOutlookHeader,
  type OutlookMessage,
} from "./outlook";
import { findLeadForAddress } from "./auto-link";

const BACKFILL_QUERY = "newer_than:90d";
// Soft cap on how many messages a single sync run will pull during backfill.
// Keeps the OAuth callback and manual-refresh action from hanging for minutes
// on busy mailboxes. Subsequent runs continue from the historyId cursor that
// gets saved after the first batch.
const BACKFILL_MESSAGE_CAP = 150;

type SyncResult = {
  accountId: string;
  mode: "backfill" | "incremental";
  messagesIngested: number;
  attachmentsStored: number;
  errors: string[];
};

// Syncs a single Gmail account. Backfill when sync_cursor is null,
// otherwise pulls the history since the cursor.
export async function syncGmailAccount(accountId: string): Promise<SyncResult> {
  const svc = createServiceClient();
  const result: SyncResult = {
    accountId,
    mode: "backfill",
    messagesIngested: 0,
    attachmentsStored: 0,
    errors: [],
  };

  const { data: acct, error: acctErr } = await svc
    .from("channel_accounts")
    .select("id, org_id, user_id, address, sync_cursor, provider")
    .eq("id", accountId)
    .maybeSingle();
  if (acctErr || !acct) throw new Error(`account ${accountId} not found`);
  if (acct.provider !== "gmail") return result;

  if (acct.sync_cursor) {
    result.mode = "incremental";
    try {
      await incrementalSync(accountId, acct, result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // If history is too old, fall back to a windowed re-backfill.
      if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
        result.mode = "backfill";
        await backfill(accountId, acct, result);
      } else {
        result.errors.push(msg);
      }
    }
  } else {
    await backfill(accountId, acct, result);
  }

  await svc
    .from("channel_accounts")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", accountId);

  return result;
}

type AccountCtx = {
  id: string;
  org_id: string;
  user_id: string;
  address: string;
  sync_cursor: string | null;
};

async function backfill(
  accountId: string,
  acct: AccountCtx,
  result: SyncResult
) {
  const svc = createServiceClient();
  let pageToken: string | undefined;
  let ingestedSoFar = 0;
  outer: do {
    const page = await listMessages({
      accountId,
      query: BACKFILL_QUERY,
      pageToken,
      maxResults: 50,
    });
    for (const m of page.messages ?? []) {
      try {
        const ingested = await ingestMessage(accountId, acct, m.id);
        if (ingested) result.messagesIngested += 1;
        result.attachmentsStored += ingested?.attachments ?? 0;
        ingestedSoFar += 1;
      } catch (e) {
        result.errors.push(`msg ${m.id}: ${e instanceof Error ? e.message : e}`);
      }
      if (ingestedSoFar >= BACKFILL_MESSAGE_CAP) break outer;
    }
    pageToken = page.nextPageToken;
  } while (pageToken);

  // Set cursor to the current historyId so subsequent syncs are incremental.
  // We always set this even if the cap was hit — the older messages we didn't
  // pull stay un-ingested but everything *new* from this point flows through
  // incrementalSync via the history API.
  try {
    const profile = await getProfile(accountId);
    await svc
      .from("channel_accounts")
      .update({ sync_cursor: profile.historyId })
      .eq("id", accountId);
  } catch (e) {
    result.errors.push(`profile cursor: ${e instanceof Error ? e.message : e}`);
  }
}

async function incrementalSync(
  accountId: string,
  acct: AccountCtx,
  result: SyncResult
) {
  const svc = createServiceClient();
  if (!acct.sync_cursor) return;

  let pageToken: string | undefined;
  let latestHistoryId = acct.sync_cursor;
  do {
    const page = await listHistory({
      accountId,
      startHistoryId: acct.sync_cursor,
      pageToken,
    });
    if (page.historyId) latestHistoryId = page.historyId;
    for (const h of page.history ?? []) {
      for (const added of h.messagesAdded ?? []) {
        try {
          const ingested = await ingestMessage(
            accountId,
            acct,
            added.message.id
          );
          if (ingested) result.messagesIngested += 1;
          result.attachmentsStored += ingested?.attachments ?? 0;
        } catch (e) {
          result.errors.push(
            `msg ${added.message.id}: ${e instanceof Error ? e.message : e}`
          );
        }
      }
    }
    pageToken = page.nextPageToken;
  } while (pageToken);

  await svc
    .from("channel_accounts")
    .update({ sync_cursor: latestHistoryId })
    .eq("id", accountId);
}

// Idempotent — uses unique (conversation_id, provider_message_id) and
// unique (channel_account_id, provider_thread_key) to dedupe.
async function ingestMessage(
  accountId: string,
  acct: AccountCtx,
  providerMessageId: string
): Promise<{ attachments: number } | null> {
  const svc = createServiceClient();

  // Skip if we've already stored this exact provider_message_id under any conv
  // owned by this account.
  const { data: existing } = await svc
    .from("messages")
    .select("id, conversations!inner(channel_account_id)")
    .eq("provider_message_id", providerMessageId)
    .eq("conversations.channel_account_id", accountId)
    .maybeSingle();
  if (existing) return null;

  const full = await getMessage({ accountId, messageId: providerMessageId });

  const headers = full.payload.headers ?? [];
  const subject = getHeader(full.payload, "Subject") ?? "";
  const fromHeader = getHeader(full.payload, "From");
  const toHeader = getHeader(full.payload, "To");
  const ccHeader = getHeader(full.payload, "Cc");
  const bccHeader = getHeader(full.payload, "Bcc");
  const inReplyTo = getHeader(full.payload, "In-Reply-To");
  const references = getHeader(full.payload, "References");
  const messageIdHeader = getHeader(full.payload, "Message-ID");
  const dateMs = Number(full.internalDate);

  const fromParsed = parseFromHeader(fromHeader);
  const toAddrs = parseAddressList(toHeader);
  const ccAddrs = parseAddressList(ccHeader);
  const bccAddrs = parseAddressList(bccHeader);

  const direction: "inbound" | "outbound" =
    fromParsed.email === acct.address.toLowerCase() ? "outbound" : "inbound";

  const bodies = extractBodies(full.payload);
  const attachments = extractAttachments(full.payload);

  const conv = await upsertConversation({
    accountId,
    orgId: acct.org_id,
    providerThreadId: full.threadId,
    subject,
    accountAddress: acct.address,
    direction,
    fromEmail: fromParsed.email,
    fromName: fromParsed.name,
    toAddrs,
    ccAddrs,
    snippet: full.snippet ?? "",
    sentAtIso: new Date(dateMs).toISOString(),
    isRead: !(full.labelIds ?? []).includes("UNREAD"),
  });

  const { data: inserted, error: msgErr } = await svc
    .from("messages")
    .insert({
      org_id: acct.org_id,
      conversation_id: conv.id,
      channel: "gmail",
      direction,
      from_address: fromParsed.email,
      from_name: fromParsed.name ?? null,
      to_addresses: toAddrs,
      cc_addresses: ccAddrs,
      bcc_addresses: bccAddrs,
      subject,
      body_text: bodies.text ?? null,
      body_html: bodies.html ?? null,
      snippet: full.snippet ?? null,
      provider_message_id: providerMessageId,
      provider_thread_id: full.threadId,
      in_reply_to: inReplyTo ?? null,
      references_chain: references
        ? references.split(/\s+/).filter(Boolean)
        : [],
      sent_at: new Date(dateMs).toISOString(),
      is_read: !(full.labelIds ?? []).includes("UNREAD"),
      metadata: { message_id_header: messageIdHeader ?? null },
    })
    .select("id")
    .maybeSingle();
  if (msgErr || !inserted) {
    throw new Error(`message insert failed: ${msgErr?.message ?? "no row"}`);
  }

  let attachmentsStored = 0;
  for (const a of attachments) {
    try {
      const blob = await getAttachment({
        accountId,
        messageId: providerMessageId,
        attachmentId: a.attachmentId,
      });
      const path = `${acct.org_id}/${accountId}/${inserted.id}/${a.filename}`;
      const bytes = Buffer.from(blob.data, "base64url");
      const { error: upErr } = await svc.storage
        .from("email-attachments")
        .upload(path, bytes, { contentType: a.mimeType, upsert: true });
      if (upErr) {
        // Tolerate already-exists; surface other errors as warnings.
        if (!upErr.message?.includes("already")) {
          throw upErr;
        }
      }
      await svc.from("message_attachments").insert({
        org_id: acct.org_id,
        message_id: inserted.id,
        filename: a.filename,
        mime_type: a.mimeType,
        size_bytes: a.size,
        storage_path: path,
        provider_attachment_id: a.attachmentId,
        is_inline: a.isInline,
      });
      attachmentsStored += 1;
    } catch (e) {
      // Don't fail the whole message because one attachment download failed.
      console.error("attachment store failed", e);
    }
  }

  // Bump conversation aggregate state (last_message_at / preview / unread).
  await svc
    .from("conversations")
    .update({
      last_message_at: new Date(dateMs).toISOString(),
      last_message_preview: (full.snippet ?? "").slice(0, 240),
      unread_count: direction === "inbound" && !(full.labelIds ?? []).includes("UNREAD")
        ? 0 // already-read inbound
        : direction === "inbound"
          ? // increment unread on inbound
            (conv.unread_count ?? 0) + 1
          : conv.unread_count ?? 0,
    })
    .eq("id", conv.id);

  return { attachments: attachmentsStored };
}

async function upsertConversation(opts: {
  accountId: string;
  orgId: string;
  providerThreadId: string;
  subject: string;
  accountAddress: string;
  direction: "inbound" | "outbound";
  fromEmail: string;
  fromName?: string;
  toAddrs: string[];
  ccAddrs: string[];
  snippet: string;
  sentAtIso: string;
  isRead: boolean;
}): Promise<{ id: string; unread_count: number | null }> {
  const svc = createServiceClient();
  const { data: existing } = await svc
    .from("conversations")
    .select("id, participants, lead_id, unread_count")
    .eq("channel_account_id", opts.accountId)
    .eq("provider_thread_key", opts.providerThreadId)
    .maybeSingle();

  // The "other party" for auto-link is the inbound sender (or, for outbound,
  // the first recipient that isn't the account's own address).
  const counterparty =
    opts.direction === "inbound"
      ? opts.fromEmail
      : opts.toAddrs.find(
          (a) => a.toLowerCase() !== opts.accountAddress.toLowerCase()
        ) ?? null;

  if (existing) {
    // Merge participants.
    const known = new Set(
      ((existing.participants as { address: string }[]) ?? []).map(
        (p) => p.address
      )
    );
    const merged = [...(existing.participants as unknown[] ?? [])] as {
      address: string;
      name?: string;
    }[];
    const candidates: { address: string; name?: string }[] = [
      { address: opts.fromEmail, name: opts.fromName },
      ...opts.toAddrs.map((a) => ({ address: a })),
      ...opts.ccAddrs.map((a) => ({ address: a })),
    ];
    for (const c of candidates) {
      if (c.address && !known.has(c.address)) {
        merged.push(c);
        known.add(c.address);
      }
    }
    await svc
      .from("conversations")
      .update({ participants: merged })
      .eq("id", existing.id);
    return { id: existing.id as string, unread_count: existing.unread_count };
  }

  // New conversation — attempt auto-link.
  let leadId: string | null = null;
  if (counterparty) {
    leadId = await findLeadForAddress(svc, {
      orgId: opts.orgId,
      address: counterparty,
    });
  }

  const initialParticipants: { address: string; name?: string }[] = [
    { address: opts.fromEmail, name: opts.fromName },
    ...opts.toAddrs.map((a) => ({ address: a })),
    ...opts.ccAddrs.map((a) => ({ address: a })),
  ].filter((p) => p.address);

  const { data: inserted, error } = await svc
    .from("conversations")
    .insert({
      org_id: opts.orgId,
      channel_account_id: opts.accountId,
      channel: "gmail",
      provider_thread_key: opts.providerThreadId,
      subject: opts.subject,
      lead_id: leadId,
      participants: initialParticipants,
      last_message_at: opts.sentAtIso,
      last_message_preview: opts.snippet.slice(0, 240),
      unread_count: opts.direction === "inbound" && !opts.isRead ? 1 : 0,
    })
    .select("id, unread_count")
    .maybeSingle();
  if (error || !inserted) {
    throw new Error(`conversation insert failed: ${error?.message ?? "no row"}`);
  }
  return {
    id: inserted.id as string,
    unread_count: inserted.unread_count as number | null,
  };
}

export async function syncOutlookAccount(
  accountId: string
): Promise<SyncResult> {
  const svc = createServiceClient();
  const result: SyncResult = {
    accountId,
    mode: "backfill",
    messagesIngested: 0,
    attachmentsStored: 0,
    errors: [],
  };

  const { data: acct, error: acctErr } = await svc
    .from("channel_accounts")
    .select("id, org_id, user_id, address, sync_cursor, provider")
    .eq("id", accountId)
    .maybeSingle();
  if (acctErr || !acct) throw new Error(`account ${accountId} not found`);
  if (acct.provider !== "outlook") return result;

  result.mode = acct.sync_cursor ? "incremental" : "backfill";

  let pageUrl: string | undefined;
  let deltaLink: string | null = null;
  let pages = 0;
  const MAX_PAGES = 25;

  try {
    while (pages < MAX_PAGES) {
      const page = await listInboxDelta({
        accountId,
        deltaLinkOrInitial: pageUrl ? null : acct.sync_cursor,
        pageUrl,
      });
      for (const msg of page.value ?? []) {
        try {
          const ingested = await ingestOutlookMessage(accountId, acct, msg);
          if (ingested) result.messagesIngested += 1;
          result.attachmentsStored += ingested?.attachments ?? 0;
        } catch (e) {
          result.errors.push(
            `msg ${msg.id}: ${e instanceof Error ? e.message : e}`
          );
        }
      }
      pages += 1;
      if (page["@odata.nextLink"]) {
        pageUrl = page["@odata.nextLink"];
        continue;
      }
      if (page["@odata.deltaLink"]) {
        deltaLink = page["@odata.deltaLink"];
      }
      break;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Graph returns 410 Gone when the delta token is too old; retry with a
    // fresh delta query.
    if (msg.includes("410") && acct.sync_cursor) {
      await svc
        .from("channel_accounts")
        .update({ sync_cursor: null })
        .eq("id", accountId);
      result.errors.push("delta token expired, will full-resync next run");
    } else {
      result.errors.push(msg);
    }
  }

  if (deltaLink) {
    await svc
      .from("channel_accounts")
      .update({ sync_cursor: deltaLink })
      .eq("id", accountId);
  }

  await svc
    .from("channel_accounts")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", accountId);

  return result;
}

async function ingestOutlookMessage(
  accountId: string,
  acct: AccountCtx,
  msg: OutlookMessage
): Promise<{ attachments: number } | null> {
  const svc = createServiceClient();

  const { data: existing } = await svc
    .from("messages")
    .select("id, conversations!inner(channel_account_id)")
    .eq("provider_message_id", msg.id)
    .eq("conversations.channel_account_id", accountId)
    .maybeSingle();
  if (existing) return null;

  const subject = msg.subject ?? "";
  const fromEmail = msg.from?.emailAddress?.address?.toLowerCase() ?? "";
  const fromName = msg.from?.emailAddress?.name ?? undefined;
  const toAddrs = addressListOf(msg.toRecipients);
  const ccAddrs = addressListOf(msg.ccRecipients);
  const bccAddrs = addressListOf(msg.bccRecipients);
  const direction: "inbound" | "outbound" =
    fromEmail === acct.address.toLowerCase() ? "outbound" : "inbound";
  const sentAtIso =
    msg.receivedDateTime ??
    msg.sentDateTime ??
    new Date().toISOString();
  const snippet = (msg.bodyPreview ?? "").slice(0, 240);
  const bodyHtml =
    msg.body?.contentType === "html" ? msg.body.content : null;
  const bodyText =
    msg.body?.contentType === "text" ? msg.body.content : null;
  const inReplyTo = getOutlookHeader(msg, "In-Reply-To");
  const references = getOutlookHeader(msg, "References");
  const messageIdHeader =
    msg.internetMessageId ?? getOutlookHeader(msg, "Message-ID");

  const conv = await upsertConversationGeneric({
    accountId,
    orgId: acct.org_id,
    providerThreadId: msg.conversationId,
    subject,
    accountAddress: acct.address,
    direction,
    fromEmail,
    fromName,
    toAddrs,
    ccAddrs,
    snippet,
    sentAtIso,
    isRead: msg.isRead ?? false,
    channel: "outlook",
  });

  const { data: inserted, error: msgErr } = await svc
    .from("messages")
    .insert({
      org_id: acct.org_id,
      conversation_id: conv.id,
      channel: "outlook",
      direction,
      from_address: fromEmail,
      from_name: fromName ?? null,
      to_addresses: toAddrs,
      cc_addresses: ccAddrs,
      bcc_addresses: bccAddrs,
      subject,
      body_text: bodyText,
      body_html: bodyHtml,
      snippet,
      provider_message_id: msg.id,
      provider_thread_id: msg.conversationId,
      in_reply_to: inReplyTo ?? null,
      references_chain: references
        ? references.split(/\s+/).filter(Boolean)
        : [],
      sent_at: sentAtIso,
      is_read: msg.isRead ?? false,
      metadata: { message_id_header: messageIdHeader ?? null },
    })
    .select("id")
    .maybeSingle();
  if (msgErr || !inserted) {
    throw new Error(`message insert failed: ${msgErr?.message ?? "no row"}`);
  }

  let attachmentsStored = 0;
  if (msg.hasAttachments) {
    try {
      const list = await listOutlookAttachments({
        accountId,
        messageId: msg.id,
      });
      for (const a of list.value ?? []) {
        try {
          const bytes = await getOutlookAttachmentContent({
            accountId,
            messageId: msg.id,
            attachmentId: a.id,
          });
          const path = `${acct.org_id}/${accountId}/${inserted.id}/${a.name}`;
          const { error: upErr } = await svc.storage
            .from("email-attachments")
            .upload(path, bytes, {
              contentType: a.contentType,
              upsert: true,
            });
          if (upErr && !upErr.message?.includes("already")) {
            throw upErr;
          }
          await svc.from("message_attachments").insert({
            org_id: acct.org_id,
            message_id: inserted.id,
            filename: a.name,
            mime_type: a.contentType,
            size_bytes: a.size,
            storage_path: path,
            provider_attachment_id: a.id,
            is_inline: a.isInline,
          });
          attachmentsStored += 1;
        } catch (e) {
          console.error("outlook attachment store failed", e);
        }
      }
    } catch (e) {
      console.error("outlook attachment list failed", e);
    }
  }

  await svc
    .from("conversations")
    .update({
      last_message_at: sentAtIso,
      last_message_preview: snippet,
      unread_count:
        direction === "inbound" && !(msg.isRead ?? false)
          ? (conv.unread_count ?? 0) + 1
          : conv.unread_count ?? 0,
    })
    .eq("id", conv.id);

  return { attachments: attachmentsStored };
}

async function upsertConversationGeneric(opts: {
  accountId: string;
  orgId: string;
  providerThreadId: string;
  subject: string;
  accountAddress: string;
  direction: "inbound" | "outbound";
  fromEmail: string;
  fromName?: string;
  toAddrs: string[];
  ccAddrs: string[];
  snippet: string;
  sentAtIso: string;
  isRead: boolean;
  channel: "gmail" | "outlook";
}): Promise<{ id: string; unread_count: number | null }> {
  const svc = createServiceClient();
  const { data: existing } = await svc
    .from("conversations")
    .select("id, participants, lead_id, unread_count")
    .eq("channel_account_id", opts.accountId)
    .eq("provider_thread_key", opts.providerThreadId)
    .maybeSingle();

  const counterparty =
    opts.direction === "inbound"
      ? opts.fromEmail
      : opts.toAddrs.find(
          (a) => a.toLowerCase() !== opts.accountAddress.toLowerCase()
        ) ?? null;

  if (existing) {
    const known = new Set(
      ((existing.participants as { address: string }[]) ?? []).map(
        (p) => p.address
      )
    );
    const merged = [
      ...((existing.participants as unknown[]) ?? []),
    ] as { address: string; name?: string }[];
    const candidates: { address: string; name?: string }[] = [
      { address: opts.fromEmail, name: opts.fromName },
      ...opts.toAddrs.map((a) => ({ address: a })),
      ...opts.ccAddrs.map((a) => ({ address: a })),
    ];
    for (const c of candidates) {
      if (c.address && !known.has(c.address)) {
        merged.push(c);
        known.add(c.address);
      }
    }
    await svc
      .from("conversations")
      .update({ participants: merged })
      .eq("id", existing.id);
    return {
      id: existing.id as string,
      unread_count: existing.unread_count as number | null,
    };
  }

  let leadId: string | null = null;
  if (counterparty) {
    leadId = await findLeadForAddress(svc, {
      orgId: opts.orgId,
      address: counterparty,
    });
  }

  const initialParticipants: { address: string; name?: string }[] = [
    { address: opts.fromEmail, name: opts.fromName },
    ...opts.toAddrs.map((a) => ({ address: a })),
    ...opts.ccAddrs.map((a) => ({ address: a })),
  ].filter((p) => p.address);

  const { data: inserted, error } = await svc
    .from("conversations")
    .insert({
      org_id: opts.orgId,
      channel_account_id: opts.accountId,
      channel: opts.channel,
      provider_thread_key: opts.providerThreadId,
      subject: opts.subject,
      lead_id: leadId,
      participants: initialParticipants,
      last_message_at: opts.sentAtIso,
      last_message_preview: opts.snippet.slice(0, 240),
      unread_count:
        opts.direction === "inbound" && !opts.isRead ? 1 : 0,
    })
    .select("id, unread_count")
    .maybeSingle();
  if (error || !inserted) {
    throw new Error(
      `conversation insert failed: ${error?.message ?? "no row"}`
    );
  }
  return {
    id: inserted.id as string,
    unread_count: inserted.unread_count as number | null,
  };
}

// Convenience used by the cron route — syncs every active gmail and outlook
// account.
export async function syncAllActiveAccounts(): Promise<SyncResult[]> {
  const svc = createServiceClient();
  const { data: accounts } = await svc
    .from("channel_accounts")
    .select("id, provider")
    .in("provider", ["gmail", "outlook"])
    .eq("status", "active");
  const results: SyncResult[] = [];
  for (const a of accounts ?? []) {
    try {
      if (a.provider === "gmail") {
        results.push(await syncGmailAccount(a.id as string));
      } else if (a.provider === "outlook") {
        results.push(await syncOutlookAccount(a.id as string));
      }
    } catch (e) {
      results.push({
        accountId: a.id as string,
        mode: "incremental",
        messagesIngested: 0,
        attachmentsStored: 0,
        errors: [e instanceof Error ? e.message : String(e)],
      });
    }
  }
  return results;
}
