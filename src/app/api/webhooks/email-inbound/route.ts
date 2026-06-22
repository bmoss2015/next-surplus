import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";
import { rateLimit, ipFromRequest } from "@/lib/security/rate-limit";
import {
  renderEmailShell,
  renderEmailEyebrow,
  renderEmailHeadline,
  renderEmailIntro,
  renderEmailButton,
  escapeHtml,
} from "@/lib/email-template";
import { stripQuotedReply } from "@/lib/email-quotes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPPORT_INBOX = "support@nextsurplus.com";
const FROM_ADDRESS =
  process.env.RESEND_FROM ?? "Next Surplus <notifications@nextsurplus.com>";

type ResendInboundPayload = {
  type?: string;
  data?: {
    id?: string;
    from?: string | { email?: string; name?: string };
    to?: string | string[];
    subject?: string;
    html?: string;
    text?: string;
    headers?: Record<string, string>;
  };
};

const TICKET_ADDRESS_REGEX = /ticket-([a-f0-9-]{36})@/i;

function extractTicketIdFromAddress(address: string): string | null {
  const match = address.match(TICKET_ADDRESS_REGEX);
  return match ? match[1].toLowerCase() : null;
}

function findTicketIdInRecipients(payload: ResendInboundPayload): string | null {
  const to = payload.data?.to;
  if (Array.isArray(to)) {
    for (const addr of to) {
      const id = extractTicketIdFromAddress(addr);
      if (id) return id;
    }
  } else if (typeof to === "string") {
    return extractTicketIdFromAddress(to);
  }
  return null;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function resolveAdminUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return `${explicit}/admin/feedback`;
  if (process.env.VERCEL_ENV === "production") {
    return "https://app.nextsurplus.com/admin/feedback";
  }
  const vercel = process.env.VERCEL_URL;
  if (vercel) {
    const base = vercel.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${base}/admin/feedback`;
  }
  return "https://staging.nextsurplus.com/admin/feedback";
}

export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(`email-inbound:${ip}`, 200, 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const secret = process.env.EMAIL_INBOUND_SECRET;
  if (!secret) {
    console.error("[email-inbound] EMAIL_INBOUND_SECRET not set");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!timingSafeEqual(auth, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: ResendInboundPayload;
  try {
    payload = (await req.json()) as ResendInboundPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (payload.type && payload.type !== "email.received") {
    return NextResponse.json({ ok: true, skipped: payload.type });
  }

  const ticketId = findTicketIdInRecipients(payload);
  if (!ticketId) {
    return NextResponse.json({ ok: true, skipped: "no_ticket_id" });
  }

  const fromRaw = payload.data?.from;
  const senderEmail =
    typeof fromRaw === "string" ? fromRaw : fromRaw?.email ?? null;
  const senderName =
    typeof fromRaw === "object" && fromRaw !== null
      ? fromRaw?.name ?? null
      : null;

  const rawBody = (payload.data?.text ?? payload.data?.html ?? "").trim();
  const bodyText = stripQuotedReply(rawBody);
  if (!bodyText) {
    return NextResponse.json({ ok: true, skipped: "empty_body" });
  }

  const externalId = payload.data?.id ?? null;
  const headers = payload.data?.headers ?? {};
  const messageId =
    (headers["Message-ID"] ?? headers["message-id"] ?? headers["Message-Id"]) ??
    null;
  const admin = createServiceClient();

  const { data: ticket } = await admin
    .from("feedback")
    .select("id, title, org_id, user_id")
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket) {
    return NextResponse.json({ ok: true, skipped: "ticket_not_found" });
  }

  const { error: insertError } = await admin.from("feedback_messages").insert({
    feedback_id: ticketId,
    direction: "inbound",
    sender_user_id: null,
    sender_name: senderName,
    sender_email: senderEmail,
    body: bodyText,
    external_message_id: externalId,
    message_id: messageId,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ ok: true, dedup: true });
    }
    console.error("[email-inbound] insert failed:", insertError);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  await admin
    .from("feedback")
    .update({ inbound_unread: true })
    .eq("id", ticketId);

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    let orgName = "Unknown Org";
    if (ticket.org_id) {
      const { data: org } = await admin
        .from("orgs")
        .select("name")
        .eq("id", ticket.org_id as string)
        .maybeSingle();
      orgName = (org?.name as string | null) ?? "Unknown Org";
    }
    const replierName = senderName ?? senderEmail ?? "A customer";
    const subject = `New Reply: ${ticket.title as string}`;
    const adminUrl = `${resolveAdminUrl()}?id=${ticketId}`;
    const preheader = `${replierName} replied on ${ticket.title as string}`;
    const safeBody = escapeHtml(bodyText).replace(/\n/g, "<br/>");
    const bodyHtml = `
      ${renderEmailEyebrow("Customer Reply")}
      ${renderEmailHeadline(ticket.title as string)}
      ${renderEmailIntro(`${escapeHtml(replierName)} at ${escapeHtml(orgName)} just replied.`)}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 0;background-color:#f5f5f5;border-radius:4px;">
        <tr>
          <td style="padding:16px 20px;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;">
            ${safeBody}
          </td>
        </tr>
      </table>
      ${renderEmailButton({ href: adminUrl, label: "Open In Admin Panel" })}
    `;
    const html = renderEmailShell({
      subject,
      bodyHtml,
      preheader,
      footerLine: "Next Surplus",
    });
    const text = `${replierName} replied on "${ticket.title as string}":\n\n${bodyText}\n\nOpen: ${adminUrl}`;
    const resend = new Resend(apiKey);
    const { error: sendError } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: SUPPORT_INBOX,
      subject,
      html,
      text,
    });
    if (sendError) {
      console.error("[email-inbound] notification email failed:", sendError);
    }
  }

  return NextResponse.json({ ok: true });
}
