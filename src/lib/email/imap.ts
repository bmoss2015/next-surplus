import "server-only";
import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { simpleParser } from "mailparser";
import { encryptToken, decryptToken } from "./crypto";
import { createServiceClient } from "../supabase/service";

export type ImapSmtpCredentials = {
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  imap_username: string;
  imap_password: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_username: string;
  smtp_password: string;
};

export async function testImapSmtpConnection(
  creds: ImapSmtpCredentials
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const imap = new ImapFlow({
      host: creds.imap_host,
      port: creds.imap_port,
      secure: creds.imap_secure,
      auth: { user: creds.imap_username, pass: creds.imap_password },
      logger: false,
    });
    await imap.connect();
    await imap.logout();
  } catch (e) {
    return {
      ok: false,
      error: `IMAP login failed: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
  try {
    const transport = nodemailer.createTransport({
      host: creds.smtp_host,
      port: creds.smtp_port,
      secure: creds.smtp_secure,
      auth: { user: creds.smtp_username, pass: creds.smtp_password },
    });
    await transport.verify();
  } catch (e) {
    return {
      ok: false,
      error: `SMTP login failed: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
  return { ok: true };
}

type ImapAccountRow = {
  id: string;
  org_id: string;
  user_id: string;
  address: string;
  imap_host: string | null;
  imap_port: number | null;
  imap_secure: boolean | null;
  imap_username: string | null;
  imap_password_encrypted: string | null;
  sync_cursor: string | null;
};

async function loadImapAccount(accountId: string): Promise<ImapAccountRow> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("channel_accounts")
    .select(
      "id, org_id, user_id, address, imap_host, imap_port, imap_secure, imap_username, imap_password_encrypted, sync_cursor"
    )
    .eq("id", accountId)
    .maybeSingle();
  if (error || !data) {
    throw new Error(`channel_account ${accountId} not found`);
  }
  return data as ImapAccountRow;
}

async function openImap(acct: ImapAccountRow): Promise<ImapFlow> {
  if (
    !acct.imap_host ||
    !acct.imap_port ||
    !acct.imap_username ||
    !acct.imap_password_encrypted
  ) {
    throw new Error(`channel_account ${acct.id} missing IMAP credentials`);
  }
  const imap = new ImapFlow({
    host: acct.imap_host,
    port: acct.imap_port,
    secure: acct.imap_secure ?? true,
    auth: {
      user: acct.imap_username,
      pass: decryptToken(acct.imap_password_encrypted),
    },
    logger: false,
  });
  await imap.connect();
  return imap;
}

export type ImapMessage = {
  uid: number;
  envelope: {
    subject?: string;
    from?: { address?: string; name?: string }[];
    to?: { address?: string; name?: string }[];
    cc?: { address?: string; name?: string }[];
    bcc?: { address?: string; name?: string }[];
    date?: Date;
    messageId?: string;
    inReplyTo?: string;
  };
  bodyText: string | null;
  bodyHtml: string | null;
  threadKey: string;
};

export async function fetchInboxSince(opts: {
  accountId: string;
  sinceUid: number | null;
  limit: number;
}): Promise<{ messages: ImapMessage[]; newestUid: number | null }> {
  const acct = await loadImapAccount(opts.accountId);
  const imap = await openImap(acct);
  const messages: ImapMessage[] = [];
  let newestUid: number | null = null;
  try {
    const lock = await imap.getMailboxLock("INBOX");
    try {
      const fromUid = opts.sinceUid ? opts.sinceUid + 1 : "1";
      const range = `${fromUid}:*`;
      const collected: number[] = [];
      for await (const m of imap.fetch(range, { uid: true })) {
        collected.push(m.uid);
      }
      const slice = collected.slice(-opts.limit);
      for (const uid of slice) {
        const msg = await imap.fetchOne(
          uid.toString(),
          { uid: true, envelope: true, source: true },
          { uid: true }
        );
        if (!msg || !msg.source) continue;
        const parsed = await simpleParser(msg.source);
        const env = msg.envelope ?? {};
        const subject = parsed.subject ?? env.subject ?? "";
        const inReplyTo = parsed.inReplyTo ?? env.inReplyTo ?? undefined;
        const messageIdHeader = parsed.messageId ?? env.messageId ?? undefined;
        const threadKey = inReplyTo
          ? inReplyTo.replace(/[<>]/g, "")
          : (messageIdHeader ?? `uid-${uid}`).replace(/[<>]/g, "");
        const addrList = (
          arr: { address?: string; name?: string }[] | undefined
        ): { address?: string; name?: string }[] =>
          (arr ?? []).map((a) => ({
            address: a.address,
            name: a.name,
          }));
        messages.push({
          uid,
          envelope: {
            subject,
            from: addrList(env.from),
            to: addrList(env.to),
            cc: addrList(env.cc),
            bcc: addrList(env.bcc),
            date: env.date,
            messageId: messageIdHeader,
            inReplyTo,
          },
          bodyText: parsed.text ?? null,
          bodyHtml: typeof parsed.html === "string" ? parsed.html : null,
          threadKey,
        });
        if (newestUid === null || uid > newestUid) newestUid = uid;
      }
    } finally {
      lock.release();
    }
  } finally {
    await imap.logout();
  }
  return { messages, newestUid };
}

export async function sendImapSmtpMessage(opts: {
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
}): Promise<{ messageId: string }> {
  const sb = createServiceClient();
  const { data: acct, error: acctErr } = await sb
    .from("channel_accounts")
    .select(
      "smtp_host, smtp_port, smtp_secure, smtp_username, smtp_password_encrypted"
    )
    .eq("id", opts.accountId)
    .maybeSingle();
  if (acctErr || !acct) throw new Error(`account ${opts.accountId} not found`);
  if (
    !acct.smtp_host ||
    !acct.smtp_port ||
    !acct.smtp_username ||
    !acct.smtp_password_encrypted
  ) {
    throw new Error(`channel_account ${opts.accountId} missing SMTP credentials`);
  }
  const transport = nodemailer.createTransport({
    host: acct.smtp_host as string,
    port: acct.smtp_port as number,
    secure: (acct.smtp_secure as boolean) ?? true,
    auth: {
      user: acct.smtp_username as string,
      pass: decryptToken(acct.smtp_password_encrypted as string),
    },
  });
  const headers: Record<string, string> = {};
  if (opts.inReplyTo) headers["In-Reply-To"] = opts.inReplyTo;
  if (opts.references && opts.references.length > 0) {
    headers.References = opts.references.join(" ");
  }
  const info = await transport.sendMail({
    from: opts.from.name
      ? `"${opts.from.name}" <${opts.from.address}>`
      : opts.from.address,
    to: opts.to.join(", "),
    cc: opts.cc?.join(", "),
    bcc: opts.bcc?.join(", "),
    subject: opts.subject,
    text: opts.bodyText,
    html: opts.bodyHtml,
    headers,
    attachments: (opts.attachments ?? []).map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.base64, "base64"),
      contentType: a.mimeType,
    })),
  });
  return { messageId: info.messageId ?? `<${Date.now()}@local>` };
}

export { encryptToken };
