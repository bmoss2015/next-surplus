// Thin Gmail REST client. Handles token refresh + retry on 401.
// Endpoints documented at https://developers.google.com/gmail/api/reference/rest

import { refreshAccessToken } from "./google-oauth";
import { encryptToken, decryptToken } from "./crypto";
import { createServiceClient } from "../supabase/service";

type AccountRow = {
  id: string;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
};

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1";

async function loadAccount(accountId: string): Promise<AccountRow> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("channel_accounts")
    .select("id, access_token_encrypted, refresh_token_encrypted, token_expires_at")
    .eq("id", accountId)
    .maybeSingle();
  if (error || !data) {
    throw new Error(`channel_account ${accountId} not found`);
  }
  return data as AccountRow;
}

async function persistRefreshedToken(opts: {
  accountId: string;
  accessToken: string;
  expiresIn: number;
}) {
  const sb = createServiceClient();
  await sb
    .from("channel_accounts")
    .update({
      access_token_encrypted: encryptToken(opts.accessToken),
      token_expires_at: new Date(Date.now() + opts.expiresIn * 1000).toISOString(),
    })
    .eq("id", opts.accountId);
}

async function getValidAccessToken(accountId: string): Promise<string> {
  const account = await loadAccount(accountId);
  if (!account.access_token_encrypted || !account.refresh_token_encrypted) {
    throw new Error(`channel_account ${accountId} missing tokens`);
  }
  const expiresAt = account.token_expires_at
    ? new Date(account.token_expires_at).getTime()
    : 0;
  // Refresh if expiring in <2 min.
  if (expiresAt - Date.now() > 120_000) {
    return decryptToken(account.access_token_encrypted);
  }
  const refreshed = await refreshAccessToken({
    refreshToken: decryptToken(account.refresh_token_encrypted),
  });
  await persistRefreshedToken({
    accountId,
    accessToken: refreshed.access_token,
    expiresIn: refreshed.expires_in,
  });
  return refreshed.access_token;
}

async function gmailFetch<T>(
  accountId: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  let token = await getValidAccessToken(accountId);
  let res = await fetch(`${GMAIL_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) {
    // One forced refresh + retry.
    const account = await loadAccount(accountId);
    if (!account.refresh_token_encrypted) {
      throw new Error(`channel_account ${accountId} missing refresh token`);
    }
    const refreshed = await refreshAccessToken({
      refreshToken: decryptToken(account.refresh_token_encrypted),
    });
    await persistRefreshedToken({
      accountId,
      accessToken: refreshed.access_token,
      expiresIn: refreshed.expires_in,
    });
    token = refreshed.access_token;
    res = await fetch(`${GMAIL_BASE}${path}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }
  if (!res.ok) {
    throw new Error(
      `Gmail ${init.method ?? "GET"} ${path} failed: ${res.status} ${await res.text()}`
    );
  }
  return (await res.json()) as T;
}

export type GmailMessageMeta = {
  id: string;
  threadId: string;
};

export type GmailMessageFull = {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  historyId?: string;
  internalDate: string;
  payload: GmailPayload;
};

type GmailPayload = {
  mimeType: string;
  headers: { name: string; value: string }[];
  body?: { size: number; data?: string; attachmentId?: string };
  parts?: GmailPayload[];
  filename?: string;
};

export async function listMessages(opts: {
  accountId: string;
  query?: string;
  pageToken?: string;
  maxResults?: number;
}): Promise<{ messages: GmailMessageMeta[]; nextPageToken?: string }> {
  const params = new URLSearchParams({
    maxResults: String(opts.maxResults ?? 100),
  });
  if (opts.query) params.set("q", opts.query);
  if (opts.pageToken) params.set("pageToken", opts.pageToken);
  return gmailFetch(opts.accountId, `/users/me/messages?${params.toString()}`);
}

export async function getMessage(opts: {
  accountId: string;
  messageId: string;
}): Promise<GmailMessageFull> {
  return gmailFetch(
    opts.accountId,
    `/users/me/messages/${opts.messageId}?format=full`
  );
}

export async function getAttachment(opts: {
  accountId: string;
  messageId: string;
  attachmentId: string;
}): Promise<{ size: number; data: string }> {
  return gmailFetch(
    opts.accountId,
    `/users/me/messages/${opts.messageId}/attachments/${opts.attachmentId}`
  );
}

export async function getProfile(
  accountId: string
): Promise<{ emailAddress: string; messagesTotal: number; historyId: string }> {
  return gmailFetch(accountId, `/users/me/profile`);
}

export async function listHistory(opts: {
  accountId: string;
  startHistoryId: string;
  pageToken?: string;
}): Promise<{
  history?: { messagesAdded?: { message: GmailMessageMeta }[] }[];
  historyId: string;
  nextPageToken?: string;
}> {
  const params = new URLSearchParams({
    startHistoryId: opts.startHistoryId,
    historyTypes: "messageAdded",
  });
  if (opts.pageToken) params.set("pageToken", opts.pageToken);
  return gmailFetch(
    opts.accountId,
    `/users/me/history?${params.toString()}`
  );
}

export async function sendMessage(opts: {
  accountId: string;
  raw: string; // base64url-encoded RFC 2822 message
  threadId?: string;
}): Promise<{ id: string; threadId: string; labelIds?: string[] }> {
  return gmailFetch(opts.accountId, `/users/me/messages/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw: opts.raw, threadId: opts.threadId }),
  });
}

// users.messages.modify — used by the optional "sync read status to Gmail"
// toggle. Strip UNREAD when we mark a thread read locally.
export async function modifyMessage(opts: {
  accountId: string;
  messageId: string;
  removeLabelIds?: string[];
  addLabelIds?: string[];
}): Promise<void> {
  await gmailFetch(opts.accountId, `/users/me/messages/${opts.messageId}/modify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      removeLabelIds: opts.removeLabelIds ?? [],
      addLabelIds: opts.addLabelIds ?? [],
    }),
  });
}

// ---- header/body helpers ----

export function getHeader(
  payload: GmailPayload,
  name: string
): string | undefined {
  return payload.headers?.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  )?.value;
}

export function extractBodies(payload: GmailPayload): {
  text?: string;
  html?: string;
} {
  const out: { text?: string; html?: string } = {};
  const walk = (p: GmailPayload) => {
    if (p.body?.data) {
      const decoded = Buffer.from(p.body.data, "base64url").toString("utf8");
      if (p.mimeType === "text/plain" && out.text === undefined) {
        out.text = decoded;
      } else if (p.mimeType === "text/html" && out.html === undefined) {
        out.html = decoded;
      }
    }
    p.parts?.forEach(walk);
  };
  walk(payload);
  return out;
}

export function extractAttachments(payload: GmailPayload): {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
  isInline: boolean;
}[] {
  const out: ReturnType<typeof extractAttachments> = [];
  const walk = (p: GmailPayload) => {
    if (p.filename && p.body?.attachmentId) {
      const disposition = (
        getHeader(p, "Content-Disposition") ?? ""
      ).toLowerCase();
      out.push({
        filename: p.filename,
        mimeType: p.mimeType,
        size: p.body.size,
        attachmentId: p.body.attachmentId,
        isInline: disposition.includes("inline"),
      });
    }
    p.parts?.forEach(walk);
  };
  walk(payload);
  return out;
}

export function parseAddressList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => {
      const m = part.match(/<([^>]+)>/);
      return (m ? m[1] : part).trim().toLowerCase();
    })
    .filter(Boolean);
}

export function parseFromHeader(raw: string | undefined): {
  email: string;
  name?: string;
} {
  if (!raw) return { email: "" };
  const m = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim() || undefined, email: m[2].trim().toLowerCase() };
  return { email: raw.trim().toLowerCase() };
}

export type OutboundAttachment = {
  filename: string;
  mimeType: string;
  base64: string; // standard base64, the builder re-wraps for transport
};

// Build an RFC 2822 message and base64url-encode it for Gmail.users.messages.send.
// When attachments are present, the structure becomes multipart/mixed:
//   - first part: text body (or multipart/alternative when both plain + html)
//   - subsequent parts: each attachment with Content-Disposition: attachment
export function buildRawMessage(opts: {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  inReplyTo?: string;
  references?: string[];
  attachments?: OutboundAttachment[];
}): string {
  const lines: string[] = [];
  lines.push(`From: ${opts.from}`);
  lines.push(`To: ${opts.to.join(", ")}`);
  if (opts.cc?.length) lines.push(`Cc: ${opts.cc.join(", ")}`);
  if (opts.bcc?.length) lines.push(`Bcc: ${opts.bcc.join(", ")}`);
  lines.push(`Subject: ${opts.subject}`);
  if (opts.inReplyTo) lines.push(`In-Reply-To: ${opts.inReplyTo}`);
  if (opts.references?.length)
    lines.push(`References: ${opts.references.join(" ")}`);
  lines.push("MIME-Version: 1.0");

  const hasAttachments = (opts.attachments?.length ?? 0) > 0;

  function bodyPart(): string[] {
    const out: string[] = [];
    if (opts.bodyHtml && opts.bodyText) {
      const altBoundary = `alt_${Date.now()}`;
      out.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
      out.push("");
      out.push(`--${altBoundary}`);
      out.push(`Content-Type: text/plain; charset="UTF-8"`);
      out.push("");
      out.push(opts.bodyText);
      out.push(`--${altBoundary}`);
      out.push(`Content-Type: text/html; charset="UTF-8"`);
      out.push("");
      out.push(opts.bodyHtml);
      out.push(`--${altBoundary}--`);
    } else if (opts.bodyHtml) {
      out.push(`Content-Type: text/html; charset="UTF-8"`);
      out.push("");
      out.push(opts.bodyHtml);
    } else {
      out.push(`Content-Type: text/plain; charset="UTF-8"`);
      out.push("");
      out.push(opts.bodyText ?? "");
    }
    return out;
  }

  if (hasAttachments) {
    const mixedBoundary = `mixed_${Date.now()}`;
    lines.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`);
    lines.push("");
    lines.push(`--${mixedBoundary}`);
    lines.push(...bodyPart());
    for (const att of opts.attachments!) {
      const safeName = att.filename.replace(/"/g, "\\\"");
      const wrapped = att.base64.replace(/(.{76})/g, "$1\r\n");
      lines.push(`--${mixedBoundary}`);
      lines.push(`Content-Type: ${att.mimeType}; name="${safeName}"`);
      lines.push(`Content-Disposition: attachment; filename="${safeName}"`);
      lines.push("Content-Transfer-Encoding: base64");
      lines.push("");
      lines.push(wrapped);
    }
    lines.push(`--${mixedBoundary}--`);
  } else {
    lines.push(...bodyPart());
  }

  const raw = lines.join("\r\n");
  return Buffer.from(raw, "utf8").toString("base64url");
}
