import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PIXEL_BYTES = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

function pixelResponse() {
  return new NextResponse(new Uint8Array(PIXEL_BYTES), {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL_BYTES.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      Expires: "0",
    },
  });
}

function classifyOpener(userAgent: string | null, fwd: string | null): "apple_mail_proxy" | "human" | "unknown" {
  const ua = (userAgent ?? "").toLowerCase();
  if (ua.includes("apple-mail") || ua.includes("applewebkit") && ua.includes("mailprivacyprotection")) {
    return "apple_mail_proxy";
  }
  if (ua.includes("mozilla") || ua.includes("gecko") || ua.includes("webkit")) {
    return "human";
  }
  if (fwd && /17\.|\.icloud\.com/i.test(fwd)) {
    return "apple_mail_proxy";
  }
  return "unknown";
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;
  if (!token || token.length < 8) return pixelResponse();

  const admin = createServiceClient();
  const { data: row } = await admin
    .from("email_send_tokens")
    .select("token, org_id, lead_id, activity_id, recipient_name, open_count, first_opened_at, open_classifications")
    .eq("token", token)
    .maybeSingle();
  if (!row) return pixelResponse();

  const ua = req.headers.get("user-agent");
  const fwd = req.headers.get("x-forwarded-for");
  const classification = classifyOpener(ua, fwd);
  const openedAt = new Date().toISOString();

  const priorClassifications = Array.isArray(row.open_classifications)
    ? (row.open_classifications as string[])
    : [];
  const nextClassifications = [...priorClassifications, classification].slice(-20);
  const nextCount = (row.open_count ?? 0) + 1;

  await admin
    .from("email_send_tokens")
    .update({
      first_opened_at: row.first_opened_at ?? openedAt,
      last_opened_at: openedAt,
      open_count: nextCount,
      open_classifications: nextClassifications,
    })
    .eq("token", token);

  if (row.lead_id) {
    await admin.from("activities").insert({
      lead_id: row.lead_id,
      activity_type: "email_opened",
      payload: {
        send_token: token,
        recipient_name: row.recipient_name,
        classification,
        opened_at: openedAt,
        prior_open_count: row.open_count ?? 0,
      },
    });
  }

  return pixelResponse();
}
