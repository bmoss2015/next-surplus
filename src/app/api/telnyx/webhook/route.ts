// Telnyx Call Control webhook receiver.
//
// Phase 1 stub. Receives webhook events for outbound call lifecycle
// (call.initiated, call.answered, call.hangup, call.bridged,
// call.machine.detection.ended, call.recording.saved, etc) and logs them.
//
// Signature verification is gated by TELNYX_PUBLIC_KEY env var. If the var
// is unset (local/dev), verification is skipped and a warning is logged. In
// production both TELNYX_PUBLIC_KEY and the Telnyx-Signature-Ed25519-Signature
// + Telnyx-Signature-Ed25519-Timestamp headers must be present.
//
// Next steps (Phase 2):
//   * On call.initiated -> upsert session_calls row with the
//     telnyx_call_control_id and dialed_at.
//   * On call.answered -> update session_calls.duration_seconds tracking.
//   * On call.hangup -> finalize duration, surface state to client via
//     Supabase realtime channel scoped to the active session.
//   * On call.machine.detection.ended -> if result is "machine",
//     auto-trigger voicemail drop via the play_audio command.
//   * On call.recording.saved -> store recording_url on session_calls row.

import { NextRequest, NextResponse } from "next/server";

// Telnyx events look like:
// { data: { event_type: "call.initiated", id: "...", occurred_at: "...",
//           payload: { call_control_id, call_leg_id, from, to, ... } } }
type TelnyxWebhookPayload = {
  data?: {
    event_type?: string;
    id?: string;
    occurred_at?: string;
    payload?: Record<string, unknown>;
  };
};

export async function POST(req: NextRequest) {
  const signature = req.headers.get("telnyx-signature-ed25519-signature");
  const timestamp = req.headers.get("telnyx-signature-ed25519-timestamp");
  const rawBody = await req.text();

  const publicKey = process.env.TELNYX_PUBLIC_KEY;

  if (publicKey) {
    // Phase 2 will plug in real Ed25519 verification using a library like
    // `tweetnacl` or `@noble/ed25519`. Keep the stub here so the wiring point
    // is obvious when the public key arrives.
    if (!signature || !timestamp) {
      console.warn("[telnyx-webhook] missing signature headers, rejecting");
      return new NextResponse("Missing signature", { status: 400 });
    }
    // const verified = verifyTelnyxSignature(publicKey, signature, timestamp, rawBody);
    // if (!verified) return new NextResponse("Invalid signature", { status: 401 });
  } else {
    console.warn(
      "[telnyx-webhook] TELNYX_PUBLIC_KEY unset, skipping signature verification (dev only)",
    );
  }

  let event: TelnyxWebhookPayload;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error("[telnyx-webhook] invalid JSON body", err);
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const eventType = event.data?.event_type ?? "unknown";
  const eventId = event.data?.id ?? "no-id";
  console.log(`[telnyx-webhook] received ${eventType} (id=${eventId})`);

  // Dispatch by event type. Empty no-op handlers until Phase 2.
  switch (eventType) {
    case "call.initiated":
      // TODO: upsert session_calls row, mark dialed_at.
      break;
    case "call.answered":
      // TODO: mark connected, start duration tracking.
      break;
    case "call.hangup":
      // TODO: finalize call, write duration.
      break;
    case "call.machine.detection.ended":
      // TODO: if machine detected, trigger voicemail drop via play_audio.
      break;
    case "call.recording.saved":
      // TODO: store recording_url on session_calls row.
      break;
    case "call.bridged":
    case "call.gather.ended":
    case "call.dtmf.received":
      // Not used in Phase 2.
      break;
    default:
      console.log(`[telnyx-webhook] no handler for ${eventType}`);
  }

  return NextResponse.json({ received: true });
}

// Telnyx pings the URL with a GET for liveness checks.
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "telnyx-webhook" });
}
