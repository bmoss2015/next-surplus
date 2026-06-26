// Telnyx SMS webhook receiver.
//
// Verifies Ed25519 signature, then handles:
//  - message.received   → log inbound, scan body for STOP/HELP keywords,
//                         write contact_opt_outs row on STOP,
//                         auto-reply with HELP text on HELP
//  - message.sent       → mark sms_messages.status='sent', stamp sent_at
//  - message.delivered  → mark sms_messages.status='delivered', stamp delivered_at
//  - message.failed     → mark sms_messages.status='failed', store error_code

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STOP_KEYWORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);
const HELP_KEYWORDS = new Set(["HELP", "INFO"]);
const HELP_REPLY = "Contact your operator directly for help. Reply STOP to opt out.";

const MAX_AGE_SECONDS = 60 * 5;

function verifyTelnyxSignature(args: {
  publicKeyBase64: string;
  signatureBase64: string;
  timestamp: string;
  rawBody: string;
}): boolean {
  const ageSeconds = Math.floor(Date.now() / 1000) - parseInt(args.timestamp, 10);
  if (Number.isNaN(ageSeconds) || ageSeconds < 0 || ageSeconds > MAX_AGE_SECONDS) {
    return false;
  }
  try {
    const message = Buffer.from(`${args.timestamp}|${args.rawBody}`, "utf8");
    const signature = Buffer.from(args.signatureBase64, "base64");
    const rawKey = Buffer.from(args.publicKeyBase64, "base64");
    const publicKey = crypto.createPublicKey({
      key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), rawKey]),
      format: "der",
      type: "spki",
    });
    return crypto.verify(null, message, publicKey, signature);
  } catch (e) {
    console.error("[telnyx-sms-webhook] verify error", e);
    return false;
  }
}

type SmsWebhookPayload = {
  data?: {
    event_type?: string;
    payload?: {
      id?: string;
      from?: { phone_number?: string };
      to?: Array<{ phone_number?: string; status?: string }>;
      text?: string;
      errors?: Array<{ code?: string; title?: string }>;
      [key: string]: unknown;
    };
  };
};

export async function POST(req: NextRequest) {
  const signature = req.headers.get("telnyx-signature-ed25519-signature");
  const timestamp = req.headers.get("telnyx-signature-ed25519-timestamp");
  const rawBody = await req.text();

  const publicKey = process.env.TELNYX_PUBLIC_KEY;
  if (publicKey) {
    if (!signature || !timestamp) {
      return new NextResponse("Missing signature headers", { status: 400 });
    }
    const ok = verifyTelnyxSignature({
      publicKeyBase64: publicKey,
      signatureBase64: signature,
      timestamp,
      rawBody,
    });
    if (!ok) return new NextResponse("Invalid signature", { status: 401 });
  } else if (process.env.NODE_ENV === "production") {
    return new NextResponse("Public key not configured", { status: 500 });
  }

  let event: SmsWebhookPayload;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const eventType = event.data?.event_type ?? "";
  const payload = event.data?.payload ?? {};
  const messageId = payload.id;
  const fromE164 = payload.from?.phone_number;
  const toE164 = payload.to?.[0]?.phone_number;
  const body = (payload.text ?? "").trim();

  const sb = createServiceClient();

  if (eventType === "message.received" && fromE164 && toE164) {
    const { data: own } = await sb
      .from("phone_numbers")
      .select("org_id")
      .eq("e164", toE164)
      .maybeSingle();
    const orgId = own?.org_id as string | undefined;

    if (orgId) {
      await sb.from("sms_messages").insert({
        org_id: orgId,
        direction: "inbound",
        from_e164: fromE164,
        to_e164: toE164,
        body,
        telnyx_message_id: messageId ?? null,
        status: "received",
      });

      const firstWord = body.split(/\s+/)[0]?.toUpperCase() ?? "";
      if (STOP_KEYWORDS.has(firstWord)) {
        await sb
          .from("contact_opt_outs")
          .upsert(
            { org_id: orgId, e164: fromE164, reason: firstWord },
            { onConflict: "org_id,e164" }
          );
      } else if (HELP_KEYWORDS.has(firstWord)) {
        const apiKey = process.env.TELNYX_API_KEY;
        if (apiKey) {
          await fetch("https://api.telnyx.com/v2/messages", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from: toE164, to: fromE164, text: HELP_REPLY }),
          });
        }
      }
    }
  } else if (eventType === "message.sent" && messageId) {
    await sb
      .from("sms_messages")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("telnyx_message_id", messageId);
  } else if (eventType === "message.delivered" && messageId) {
    await sb
      .from("sms_messages")
      .update({ status: "delivered", delivered_at: new Date().toISOString() })
      .eq("telnyx_message_id", messageId);
  } else if (eventType === "message.failed" && messageId) {
    const errorCode = payload.errors?.[0]?.code ?? null;
    await sb
      .from("sms_messages")
      .update({ status: "failed", error_code: errorCode })
      .eq("telnyx_message_id", messageId);
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "telnyx-sms-webhook" });
}
