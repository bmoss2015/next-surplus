import { NextResponse } from "next/server";
import { sendMentionEmail } from "@/lib/notifications/send-mention-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MentionPayload = {
  recipientEmail?: unknown;
  actorName?: unknown;
  actorFirstName?: unknown;
  leadOwnerName?: unknown;
  commentText?: unknown;
  link?: unknown;
};

export async function POST(req: Request) {
  const secret = process.env.INTERNAL_API_SECRET;
  const provided = req.headers.get("x-internal-secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: MentionPayload = {};
  try {
    payload = (await req.json()) as MentionPayload;
  } catch {
    payload = {};
  }

  const result = await sendMentionEmail({
    recipientEmail: String(payload.recipientEmail ?? ""),
    actorName: String(payload.actorName ?? ""),
    actorFirstName: String(payload.actorFirstName ?? ""),
    leadOwnerName: String(payload.leadOwnerName ?? ""),
    commentText: String(payload.commentText ?? ""),
    link: String(payload.link ?? ""),
  });

  if (result.ok) {
    return NextResponse.json({ ok: true, id: result.id });
  }
  if ("skipped" in result) {
    return NextResponse.json({ skipped: true }, { status: 200 });
  }
  if (result.error === "Missing recipientEmail") {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(
    { error: "Resend request failed", detail: result.error },
    { status: 502 }
  );
}
