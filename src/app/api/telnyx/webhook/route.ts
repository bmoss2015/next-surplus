// Telnyx Call Control webhook receiver.
//
// Verifies the Ed25519 signature Telnyx puts on every webhook, then
// dispatches by event type. Updates session_calls + dialer_sessions
// rows so the live dialer can react via Supabase realtime.
//
// Signature scheme (Telnyx docs):
//   message = timestamp + "|" + rawBody
//   signature is base64 ed25519 over message
//   public key is base64 from GET /v2/public_key

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelnyxWebhookPayload = {
  data?: {
    event_type?: string;
    id?: string;
    occurred_at?: string;
    payload?: {
      call_control_id?: string;
      call_leg_id?: string;
      from?: string;
      to?: string;
      hangup_cause?: string;
      hangup_source?: string;
      result?: string;
      recording_urls?: { mp3?: string; wav?: string };
      [key: string]: unknown;
    };
  };
};

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
      key: Buffer.concat([
        Buffer.from("302a300506032b6570032100", "hex"),
        rawKey,
      ]),
      format: "der",
      type: "spki",
    });
    return crypto.verify(null, message, publicKey, signature);
  } catch (e) {
    console.error("[telnyx-webhook] verify error", e);
    return false;
  }
}

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
  } else {
    console.warn("[telnyx-webhook] TELNYX_PUBLIC_KEY unset, dev-only bypass");
  }

  let event: TelnyxWebhookPayload;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const eventType = event.data?.event_type ?? "unknown";
  const payload = event.data?.payload ?? {};
  const callControlId = payload.call_control_id;

  const sb = createServiceClient();

  if (callControlId) {
    switch (eventType) {
      case "call.initiated":
      case "call.answered": {
        await sb
          .from("session_calls")
          .update({
            ...(eventType === "call.initiated" ? { dialed_at: new Date().toISOString() } : {}),
          })
          .eq("telnyx_call_control_id", callControlId);
        break;
      }
      case "call.hangup": {
        await sb
          .from("session_calls")
          .update({
            ...(typeof payload.hangup_cause === "string" ? { note: `Hangup: ${payload.hangup_cause}` } : {}),
          })
          .eq("telnyx_call_control_id", callControlId);
        break;
      }
      case "call.machine.detection.ended": {
        if (payload.result === "machine") {
          await sb
            .from("session_calls")
            .update({ disposition: "voicemail" })
            .eq("telnyx_call_control_id", callControlId);
        }
        break;
      }
      case "call.recording.saved": {
        const url = payload.recording_urls?.mp3 ?? payload.recording_urls?.wav ?? null;
        if (url) {
          await sb
            .from("session_calls")
            .update({ recording_url: url })
            .eq("telnyx_call_control_id", callControlId);

          // If the org has transcription enabled, kick off transcription
          // against the recording. Telnyx handles provider selection via
          // the org_dialer_defaults.transcription_provider value.
          const { data: callRow } = await sb
            .from("session_calls")
            .select("session_id")
            .eq("telnyx_call_control_id", callControlId)
            .maybeSingle();
          if (callRow?.session_id) {
            const { data: session } = await sb
              .from("dialer_sessions")
              .select("user_id")
              .eq("id", callRow.session_id)
              .maybeSingle();
            if (session?.user_id) {
              const { data: profile } = await sb
                .from("profiles")
                .select("org_id")
                .eq("id", session.user_id)
                .maybeSingle();
              if (profile?.org_id) {
                const { data: defaults } = await sb
                  .from("org_dialer_defaults")
                  .select("transcription_enabled, transcription_provider")
                  .eq("org_id", profile.org_id)
                  .maybeSingle();
                if (defaults?.transcription_enabled) {
                  const apiKey = process.env.TELNYX_API_KEY;
                  if (apiKey) {
                    await sb
                      .from("session_calls")
                      .update({ transcription_status: "pending" })
                      .eq("telnyx_call_control_id", callControlId);
                    fetch(
                      `https://api.telnyx.com/v2/calls/${callControlId}/actions/transcription_start`,
                      {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${apiKey}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          transcription_engine: defaults.transcription_provider ?? "deepgram_nova",
                          language: "en",
                        }),
                      }
                    ).catch(() => {});
                  }
                }
              }
            }
          }
        }
        break;
      }
      case "call.transcription": {
        const transcript = (payload as { transcription_data?: { transcript?: string } }).transcription_data?.transcript;
        const transcriptionUrl = (payload as { transcription_url?: string }).transcription_url ?? null;
        if (transcript || transcriptionUrl) {
          await sb
            .from("session_calls")
            .update({
              transcription_text: transcript ?? null,
              transcription_url: transcriptionUrl,
              transcription_status: "completed",
            })
            .eq("telnyx_call_control_id", callControlId);
        }
        break;
      }
    }
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "telnyx-webhook" });
}
