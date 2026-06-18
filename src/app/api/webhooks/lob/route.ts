import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

// Lob webhook handler. Lob signs every webhook with an HMAC-SHA256 header
// `lob-signature` keyed by the webhook's secret. We use the same handler
// for both check events (check.in_transit, check.delivered, check.returned_
// to_sender) and bank-account events (bank_account.verified). Letter events
// are also handled in case we ever route letters through Lob.
//
// Docs: https://docs.lob.com/#tag/Webhooks

type LobEvent = {
  id?: string;
  event_type?: { id?: string; resource?: string };
  body?: {
    id?: string;
    tracking_number?: string;
    metadata?: { correlation_id?: string };
  };
};

// Maps every Lob letter / check event we care about to one of our
// MailStatus buckets. Lob's pipeline goes:
//   created -> rendered_pdf -> printing -> mailed -> in_transit ->
//   in_local_area -> processed_for_delivery -> delivered
// (with returned_to_sender or re-routed as alt branches).
//
// We map:
//   * created / rendered_pdf / printing -> stay at "queued" (no
//     status change, but webhook still updates tracking_number when
//     one is attached). The dashboard labels queued pieces "Processing"
//     until tracking_number lands.
//   * mailed -> "in_transit" (USPS now has the piece; this is the
//     point where Lob attaches a USPS tracking_number).
//   * in_transit / in_local_area / processed_for_delivery / re-routed
//     -> "in_transit" (in-flight states).
//   * delivered -> "delivered".
//   * returned_to_sender -> "returned".
//   * failed -> "failed" (print or render failure).
const QUEUED_EVENTS = new Set([
  "letter.created",
  "letter.rendered_pdf",
  "letter.printing",
  "check.created",
  "check.rendered_pdf",
  "check.printing",
]);

const STATUS_BY_EVENT: Record<string, "in_transit" | "delivered" | "returned" | "failed"> = {
  "letter.mailed": "in_transit",
  "letter.in_transit": "in_transit",
  "letter.in_local_area": "in_transit",
  "letter.processed_for_delivery": "in_transit",
  "letter.delivered": "delivered",
  "letter.re-routed": "in_transit",
  "letter.returned_to_sender": "returned",
  "letter.failed": "failed",
  "check.mailed": "in_transit",
  "check.in_transit": "in_transit",
  "check.in_local_area": "in_transit",
  "check.processed_for_delivery": "in_transit",
  "check.delivered": "delivered",
  "check.re-routed": "in_transit",
  "check.returned_to_sender": "returned",
  "check.failed": "failed",
};

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = process.env.LOB_WEBHOOK_SECRET;
  if (!secret) return false;
  const computed = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(computed, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("lob-signature");

  if (!process.env.LOB_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "webhook_secret_unset" }, { status: 401 });
  }
  if (!verifySignature(rawBody, sig)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  let event: LobEvent;
  try {
    event = JSON.parse(rawBody) as LobEvent;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const eventType = event.event_type?.id ?? "";
  const resource = event.event_type?.resource ?? "";

  // Bank account verification flips our mail_bank_accounts.status.
  if (resource === "bank_account" && eventType === "bank_account.verified") {
    const lobBnk = event.body?.id;
    if (!lobBnk) {
      return NextResponse.json({ ok: true, noop: true });
    }
    const sb = createServiceClient();
    await sb
      .from("mail_bank_accounts")
      .update({ status: "verified", verified_at: new Date().toISOString() })
      .eq("lob_bank_account_id", lobBnk);
    return NextResponse.json({ ok: true });
  }

  // Letter / check status changes update mail_jobs.
  const providerId = event.body?.id;
  const isQueuedEvent = QUEUED_EVENTS.has(eventType);
  const mappedStatus = STATUS_BY_EVENT[eventType] ?? null;
  if ((!mappedStatus && !isQueuedEvent) || !providerId) {
    return NextResponse.json({ ok: true, noop: true });
  }

  // (Time-based gate applied AFTER we look up the row — see below.)

  const sb = createServiceClient();
  const { data: job } = await sb
    .from("mail_jobs")
    .select(
      "id, lead_id, recipient_name, recipient_city, recipient_state, status, org_id, created_by, include_check, sent_at, created_at"
    )
    .eq("provider", "lob")
    .eq("provider_id", providerId)
    .maybeSingle();
  if (!job) {
    return NextResponse.json({ ok: true, noop: true });
  }

  // Time-based realism gate: Lob's test mode fires .mailed /
  // .in_transit events within seconds of letter create, which is
  // useful for testing terminal-state code paths but makes fresh
  // sends look already-mailed in the UI before the user has even
  // seen the Printing pill. Real-world Lob fires these events
  // 12-24 hours after create when USPS actually picks up the
  // mail. Anything in-flight arriving within 5 minutes of sent_at
  // is treated as a test-mode artifact and ignored. Terminal
  // events (delivered/returned/failed) always go through — those
  // are real signals regardless of timing.
  const inflightEventTypes = new Set([
    "letter.mailed",
    "check.mailed",
    "letter.in_transit",
    "check.in_transit",
    "letter.in_local_area",
    "check.in_local_area",
    "letter.processed_for_delivery",
    "check.processed_for_delivery",
    "letter.re-routed",
    "check.re-routed",
  ]);
  if (inflightEventTypes.has(eventType)) {
    const referenceTs =
      (job.sent_at as string | null) ?? (job.created_at as string | null);
    if (referenceTs) {
      const ageMs = Date.now() - new Date(referenceTs).getTime();
      if (ageMs < 5 * 60 * 1000) {
        return NextResponse.json({
          ok: true,
          noop: true,
          reason: "inflight_event_too_soon",
        });
      }
    }
  }

  const update: Record<string, unknown> = {};
  // Status transition rules: processing rows advance whenever an
  // in-flight or terminal event arrives; everything else just respects
  // the mapping. Don't bump in_transit back to processing.
  if (mappedStatus && mappedStatus !== job.status) {
    const canAdvance =
      job.status === "processing" ||
      job.status === "queued" ||
      (job.status === "in_transit" &&
        (mappedStatus === "delivered" ||
          mappedStatus === "returned" ||
          mappedStatus === "failed")) ||
      mappedStatus === "delivered" ||
      mappedStatus === "returned" ||
      mappedStatus === "failed";
    if (canAdvance) {
      update.status = mappedStatus;
      if (mappedStatus === "delivered") update.delivered_at = new Date().toISOString();
      if (mappedStatus === "returned") update.returned_at = new Date().toISOString();
    }
  }
  if (event.body?.tracking_number) {
    update.tracking_number = event.body.tracking_number;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true, noop: true });
  }
  await sb.from("mail_jobs").update(update).eq("id", job.id);

  if (
    job.lead_id &&
    (mappedStatus === "delivered" || mappedStatus === "returned")
  ) {
    await sb.from("activities").insert({
      lead_id: job.lead_id,
      activity_type:
        mappedStatus === "delivered" ? "mail_delivered" : "mail_returned",
      payload: {
        mail_job_id: job.id,
        recipient_name: job.recipient_name,
        tracking_number: event.body?.tracking_number ?? null,
      },
    });
  }

  // Bell notification on terminal states only — in_transit is noise.
  if (
    job.created_by &&
    (mappedStatus === "delivered" || mappedStatus === "returned")
  ) {
    const kindLabel = job.include_check ? "Check" : "Letter";
    const cityState = `${job.recipient_city}, ${job.recipient_state}`;
    const statusLabel =
      mappedStatus === "delivered" ? "delivered" : "returned to sender";
    await sb.from("notifications").insert({
      org_id: job.org_id,
      recipient_id: job.created_by,
      actor_id: null,
      type: `mail_${mappedStatus}`,
      lead_id: job.lead_id ?? null,
      body_preview: `${kindLabel} to ${job.recipient_name} in ${cityState} ${statusLabel}`,
    });
  }

  return NextResponse.json({ ok: true });
}
