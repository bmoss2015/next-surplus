import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

// Click2Mail webhook handler. Updates mail_jobs.status and writes a
// matching `mail_delivered` / `mail_returned` activity row when the job
// is attached to a lead. Click2Mail's webhook contract is documented at
// https://developers.click2mail.com/reference; the payload shape used
// below assumes `{ jobId, status, trackingNumber }` — adjust once we
// confirm the actual format on the test account.
//
// Auth: a shared secret in CLICK2MAIL_WEBHOOK_SECRET, checked as the
// `x-c2m-secret` header. (Click2Mail also supports HMAC; we'll move to
// that once they document the signing algorithm.)

type Payload = {
  jobId?: string | number;
  status?: string;
  trackingNumber?: string | null;
};

const STATUS_MAP: Record<string, "in_transit" | "delivered" | "returned" | "failed"> = {
  printed: "in_transit",
  mailed: "in_transit",
  in_transit: "in_transit",
  in_local_area: "in_transit",
  out_for_delivery: "in_transit",
  delivered: "delivered",
  returned_to_sender: "returned",
  undeliverable: "returned",
  failed: "failed",
};

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-c2m-secret");
  if (!secret || secret !== process.env.CLICK2MAIL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const providerId = body.jobId == null ? null : String(body.jobId);
  if (!providerId) {
    return NextResponse.json({ error: "missing jobId" }, { status: 400 });
  }
  const rawStatus = (body.status ?? "").toLowerCase();
  const mappedStatus = STATUS_MAP[rawStatus] ?? null;

  const sb = createServiceClient();
  const { data: job, error: findErr } = await sb
    .from("mail_jobs")
    .select("id, lead_id, recipient_name, status")
    .eq("provider", "click2mail")
    .eq("provider_id", providerId)
    .maybeSingle();
  if (findErr || !job) {
    return NextResponse.json({ error: "job not found" }, { status: 404 });
  }

  const update: Record<string, unknown> = {};
  if (mappedStatus && mappedStatus !== job.status) {
    update.status = mappedStatus;
    if (mappedStatus === "delivered") update.delivered_at = new Date().toISOString();
    if (mappedStatus === "returned") update.returned_at = new Date().toISOString();
  }
  if (body.trackingNumber) update.tracking_number = body.trackingNumber;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true, noop: true });
  }

  await sb.from("mail_jobs").update(update).eq("id", job.id);

  // Activity entry on the related lead (if any) — only emit for the two
  // terminal states. Mid-flight status changes are noise on the timeline.
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
        tracking_number: body.trackingNumber ?? null,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
