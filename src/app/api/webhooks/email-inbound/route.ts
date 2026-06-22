import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { rateLimit, ipFromRequest } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(`resend-inbound:${ip}`, 200, 60 * 1000);
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

  const bodyText = (payload.data?.text ?? payload.data?.html ?? "").trim();
  if (!bodyText) {
    return NextResponse.json({ ok: true, skipped: "empty_body" });
  }

  const externalId = payload.data?.id ?? null;
  const admin = createServiceClient();

  const { data: ticket } = await admin
    .from("feedback")
    .select("id")
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
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ ok: true, dedup: true });
    }
    console.error("[email-inbound] insert failed:", insertError);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
