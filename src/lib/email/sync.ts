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
import { fetchInboxSince, type ImapMessage } from "./imap";
import { findLeadForAddress } from "./auto-link";

const IMAP_BATCH_LIMIT = 100;

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

// Sync an IMAP account. Uses UID as the sync cursor; on first run the
// cursor is null and we pull the most recent IMAP_BATCH_LIMIT messages
// in INBOX. Subsequent runs pull anything newer than the saved cursor.
export async function syncImapAccount(accountId: string): Promise<SyncResult> {
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
  if (acct.provider !== "imap") return result;

  const sinceUid = acct.sync_cursor ? Number(acct.sync_cursor) : null;
  result.mode = sinceUid ? "incremental" : "backfill";

  let messages: ImapMessage[];
  let newestUid: number | null;
  try {
    const r = await fetchInboxSince({
      accountId,
      sinceUid,
      limit: IMAP_BATCH_LIMIT,
    });
    messages = r.messages;
    newestUid = r.newestUid;
  } catch (e) {
    result.errors.push(e instanceof Error ? e.message : String(e));
    return result;
  }

  for (const m of messages) {
    try {
      const ingested = await ingestImapMessage(accountId, acct, m);
      if (ingested) result.messagesIngested += 1;
    } catch (e) {
      result.errors.push(
        `uid ${m.uid}: ${e instanceof Error ? e.message : e}`
      );
    }
  }

  if (newestUid !== null) {
    await svc
      .from("channel_accounts")
      .update({ sync_cursor: String(newestUid) })
      .eq("id", accountId);
  }
  await svc
    .from("channel_accounts")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", accountId);

  return result;
}

async function ingestImapMessage(
  accountId: string,
  acct: AccountCtx,
  m: ImapMessage
): Promise<boolean> {
  const svc = createServiceClient();

  const providerMessageId = m.envelope.messageId
    ? m.envelope.messageId.replace(/[<>]/g, "")
    : `uid-${m.uid}`;

  const { data: existing } = await svc
    .from("messages")
    .select("id, conversations!inner(channel_account_id)")
    .eq("provider_message_id", providerMessageId)
    .eq("conversations.channel_account_id", accountId)
    .maybeSingle();
  if (existing) return false;

  const subject = m.envelope.subject ?? "";
  const fromEmail = (m.envelope.from?.[0]?.address ?? "").toLowerCase();
  const fromName = m.envelope.from?.[0]?.name ?? undefined;
  const toAddrs = (m.envelope.to ?? [])
    .map((a) => (a.address ?? "").toLowerCase())
    .filter(Boolean);
  const ccAddrs = (m.envelope.cc ?? [])
    .map((a) => (a.address ?? "").toLowerCase())
    .filter(Boolean);
  const bccAddrs = (m.envelope.bcc ?? [])
    .map((a) => (a.address ?? "").toLowerCase())
    .filter(Boolean);
  const direction: "inbound" | "outbound" =
    fromEmail === acct.address.toLowerCase() ? "outbound" : "inbound";
  const sentAtIso = (m.envelope.date ?? new Date()).toISOString();
  const snippet = (m.bodyText ?? m.bodyHtml ?? "").slice(0, 240);
  const inReplyTo = m.envelope.inReplyTo ?? null;

  const conv = await upsertImapConversation({
    accountId,
    orgId: acct.org_id,
    providerThreadKey: m.threadKey,
    subject,
    accountAddress: acct.address,
    direction,
    fromEmail,
    fromName,
    toAddrs,
    ccAddrs,
    snippet,
    sentAtIso,
  });

  const { error: msgErr } = await svc
    .from("messages")
    .insert({
      org_id: acct.org_id,
      conversation_id: conv.id,
      channel: "imap",
      direction,
      from_address: fromEmail,
      from_name: fromName ?? null,
      to_addresses: toAddrs,
      cc_addresses: ccAddrs,
      bcc_addresses: bccAddrs,
      subject,
      body_text: m.bodyText,
      body_html: m.bodyHtml,
      snippet,
      provider_message_id: providerMessageId,
      provider_thread_id: m.threadKey,
      in_reply_to: inReplyTo,
      references_chain: [],
      sent_at: sentAtIso,
      is_read: true,
      metadata: { uid: m.uid, message_id_header: m.envelope.messageId ?? null },
    });
  if (msgErr) throw new Error(`message insert failed: ${msgErr.message}`);

  await svc
    .from("conversations")
    .update({
      last_message_at: sentAtIso,
      last_message_preview: snippet,
      unread_count: direction === "inbound" ? (conv.unread_count ?? 0) + 1 : (conv.unread_count ?? 0),
    })
    .eq("id", conv.id);

  return true;
}

async function upsertImapConversation(opts: {
  accountId: string;
  orgId: string;
  providerThreadKey: string;
  subject: string;
  accountAddress: string;
  direction: "inbound" | "outbound";
  fromEmail: string;
  fromName?: string;
  toAddrs: string[];
  ccAddrs: string[];
  snippet: string;
  sentAtIso: string;
}): Promise<{ id: string; unread_count: number | null }> {
  const svc = createServiceClient();
  const { data: existing } = await svc
    .from("conversations")
    .select("id, unread_count")
    .eq("channel_account_id", opts.accountId)
    .eq("provider_thread_key", opts.providerThreadKey)
    .maybeSingle();
  if (existing) {
    return {
      id: existing.id as string,
      unread_count: existing.unread_count as number | null,
    };
  }

  const counterparty =
    opts.direction === "inbound"
      ? opts.fromEmail
      : opts.toAddrs.find(
          (a) => a.toLowerCase() !== opts.accountAddress.toLowerCase()
        ) ?? null;

  let leadId: string | null = null;
  if (counterparty) {
    leadId = await findLeadForAddress(svc, {
      orgId: opts.orgId,
      address: counterparty,
    });
  }

  const participants = [
    { address: opts.fromEmail, name: opts.fromName },
    ...opts.toAddrs.map((a) => ({ address: a })),
    ...opts.ccAddrs.map((a) => ({ address: a })),
  ].filter((p) => p.address);

  const { data: inserted, error } = await svc
    .from("conversations")
    .insert({
      org_id: opts.orgId,
      channel_account_id: opts.accountId,
      channel: "imap",
      provider_thread_key: opts.providerThreadKey,
      subject: opts.subject,
      lead_id: leadId,
      participants,
      last_message_at: opts.sentAtIso,
      last_message_preview: opts.snippet,
      unread_count: opts.direction === "inbound" ? 1 : 0,
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

// Convenience used by the cron route — syncs every active gmail and imap
// account. Outlook is handled by its own branch (PR #107) when merged.
export async function syncAllActiveAccounts(): Promise<SyncResult[]> {
  const svc = createServiceClient();
  const { data: accounts } = await svc
    .from("channel_accounts")
    .select("id, provider")
    .in("provider", ["gmail", "imap"])
    .eq("status", "active");
  const results: SyncResult[] = [];
  for (const a of accounts ?? []) {
    try {
      if (a.provider === "gmail") {
        results.push(await syncGmailAccount(a.id as string));
      } else if (a.provider === "imap") {
        results.push(await syncImapAccount(a.id as string));
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
