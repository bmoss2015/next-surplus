import { refreshAccessToken } from "./microsoft-oauth";
import { encryptToken, decryptToken } from "./crypto";
import { createServiceClient } from "../supabase/service";

type AccountRow = {
  id: string;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
};

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function loadAccount(accountId: string): Promise<AccountRow> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("channel_accounts")
    .select(
      "id, access_token_encrypted, refresh_token_encrypted, token_expires_at"
    )
    .eq("id", accountId)
    .maybeSingle();
  if (error || !data) {
    throw new Error(`channel_account ${accountId} not found`);
  }
  return data as AccountRow;
}

async function persistRefreshedTokens(opts: {
  accountId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
}) {
  const sb = createServiceClient();
  const patch: Record<string, string> = {
    access_token_encrypted: encryptToken(opts.accessToken),
    token_expires_at: new Date(
      Date.now() + opts.expiresIn * 1000
    ).toISOString(),
  };
  if (opts.refreshToken) {
    patch.refresh_token_encrypted = encryptToken(opts.refreshToken);
  }
  await sb.from("channel_accounts").update(patch).eq("id", opts.accountId);
}

async function getValidAccessToken(accountId: string): Promise<string> {
  const account = await loadAccount(accountId);
  if (!account.access_token_encrypted || !account.refresh_token_encrypted) {
    throw new Error(`channel_account ${accountId} missing tokens`);
  }
  const expiresAt = account.token_expires_at
    ? new Date(account.token_expires_at).getTime()
    : 0;
  if (expiresAt - Date.now() > 120_000) {
    return decryptToken(account.access_token_encrypted);
  }
  const refreshed = await refreshAccessToken({
    refreshToken: decryptToken(account.refresh_token_encrypted),
  });
  await persistRefreshedTokens({
    accountId,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? null,
    expiresIn: refreshed.expires_in,
  });
  return refreshed.access_token;
}

async function graphFetch<T>(
  accountId: string,
  pathOrUrl: string,
  init: RequestInit = {}
): Promise<T> {
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${GRAPH_BASE}${pathOrUrl}`;
  let token = await getValidAccessToken(accountId);
  let res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) {
    const account = await loadAccount(accountId);
    if (!account.refresh_token_encrypted) {
      throw new Error(`channel_account ${accountId} missing refresh token`);
    }
    const refreshed = await refreshAccessToken({
      refreshToken: decryptToken(account.refresh_token_encrypted),
    });
    await persistRefreshedTokens({
      accountId,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? null,
      expiresIn: refreshed.expires_in,
    });
    token = refreshed.access_token;
    res = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }
  if (!res.ok) {
    throw new Error(`Graph ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export type OutlookEmailAddress = {
  emailAddress: { name?: string; address: string };
};

export type OutlookAttachmentMeta = {
  id: string;
  name: string;
  contentType: string;
  size: number;
  isInline: boolean;
};

export type OutlookMessage = {
  id: string;
  conversationId: string;
  internetMessageId?: string;
  subject?: string;
  bodyPreview?: string;
  body?: { contentType: "html" | "text"; content: string };
  from?: OutlookEmailAddress;
  toRecipients?: OutlookEmailAddress[];
  ccRecipients?: OutlookEmailAddress[];
  bccRecipients?: OutlookEmailAddress[];
  receivedDateTime?: string;
  sentDateTime?: string;
  isRead?: boolean;
  hasAttachments?: boolean;
  internetMessageHeaders?: { name: string; value: string }[];
};

export type DeltaPage = {
  value: OutlookMessage[];
  "@odata.nextLink"?: string;
  "@odata.deltaLink"?: string;
};

const SELECT_FIELDS = [
  "id",
  "conversationId",
  "internetMessageId",
  "subject",
  "bodyPreview",
  "body",
  "from",
  "toRecipients",
  "ccRecipients",
  "bccRecipients",
  "receivedDateTime",
  "sentDateTime",
  "isRead",
  "hasAttachments",
  "internetMessageHeaders",
].join(",");

export async function listInboxDelta(opts: {
  accountId: string;
  deltaLinkOrInitial: string | null;
  pageUrl?: string;
}): Promise<DeltaPage> {
  if (opts.pageUrl) {
    return graphFetch<DeltaPage>(opts.accountId, opts.pageUrl);
  }
  if (opts.deltaLinkOrInitial) {
    return graphFetch<DeltaPage>(opts.accountId, opts.deltaLinkOrInitial);
  }
  return graphFetch<DeltaPage>(
    opts.accountId,
    `/me/mailFolders('inbox')/messages/delta?$select=${SELECT_FIELDS}&$top=50`
  );
}

export async function listAttachments(opts: {
  accountId: string;
  messageId: string;
}): Promise<{ value: OutlookAttachmentMeta[] }> {
  return graphFetch(
    opts.accountId,
    `/me/messages/${opts.messageId}/attachments?$select=id,name,contentType,size,isInline`
  );
}

export async function getAttachmentContent(opts: {
  accountId: string;
  messageId: string;
  attachmentId: string;
}): Promise<Buffer> {
  const token = await getValidAccessToken(opts.accountId);
  const res = await fetch(
    `${GRAPH_BASE}/me/messages/${opts.messageId}/attachments/${opts.attachmentId}/$value`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    throw new Error(`Attachment fetch ${res.status}: ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export function addressListOf(
  recips: OutlookEmailAddress[] | undefined
): string[] {
  return (recips ?? [])
    .map((r) => r.emailAddress?.address ?? "")
    .filter(Boolean)
    .map((a) => a.toLowerCase());
}

export function getHeader(
  msg: OutlookMessage,
  name: string
): string | null {
  const lower = name.toLowerCase();
  for (const h of msg.internetMessageHeaders ?? []) {
    if (h.name.toLowerCase() === lower) return h.value;
  }
  return null;
}

type GraphRecipient = { emailAddress: { address: string; name?: string } };

export type CreatedOutlookDraft = {
  id: string;
  conversationId: string;
  internetMessageId?: string;
  subject?: string;
  bodyPreview?: string;
  sentDateTime?: string;
  receivedDateTime?: string;
};

function asRecipients(addrs: string[] | undefined): GraphRecipient[] {
  return (addrs ?? [])
    .filter(Boolean)
    .map((a) => ({ emailAddress: { address: a } }));
}

export async function sendOutlookMessage(opts: {
  accountId: string;
  from: { address: string; name?: string };
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  inReplyTo?: string | null;
  references?: string[];
  attachments?: {
    filename: string;
    mimeType: string;
    base64: string;
  }[];
  replyToConversationId?: string | null;
}): Promise<CreatedOutlookDraft> {
  const headers: { name: string; value: string }[] = [];
  if (opts.inReplyTo) {
    headers.push({ name: "In-Reply-To", value: opts.inReplyTo });
  }
  if (opts.references && opts.references.length > 0) {
    headers.push({
      name: "References",
      value: opts.references.join(" "),
    });
  }

  const contentType: "html" | "text" = opts.bodyHtml ? "html" : "text";
  const content = opts.bodyHtml ?? opts.bodyText ?? "";

  const messagePayload: Record<string, unknown> = {
    subject: opts.subject,
    body: { contentType, content },
    toRecipients: asRecipients(opts.to),
    ccRecipients: asRecipients(opts.cc),
    bccRecipients: asRecipients(opts.bcc),
    from: {
      emailAddress: {
        address: opts.from.address,
        ...(opts.from.name ? { name: opts.from.name } : {}),
      },
    },
  };
  if (headers.length > 0) {
    messagePayload.internetMessageHeaders = headers;
  }

  const draft = await graphFetch<CreatedOutlookDraft>(
    opts.accountId,
    `/me/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messagePayload),
    }
  );

  for (const att of opts.attachments ?? []) {
    await graphFetch(
      opts.accountId,
      `/me/messages/${draft.id}/attachments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: att.filename,
          contentType: att.mimeType,
          contentBytes: att.base64,
        }),
      }
    );
  }

  const token = await getValidAccessToken(opts.accountId);
  const sendRes = await fetch(
    `${GRAPH_BASE}/me/messages/${draft.id}/send`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!sendRes.ok) {
    throw new Error(
      `Graph send ${sendRes.status}: ${await sendRes.text()}`
    );
  }

  return draft;
}
