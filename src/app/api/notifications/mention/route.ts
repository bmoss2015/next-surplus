import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  renderEmailShell,
  renderEmailEyebrow,
  renderEmailHeadline,
  renderEmailIntro,
  renderEmailButton,
  escapeHtml,
} from "@/lib/email-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_ENV === "production") {
    return "https://app.nextsurplus.com";
  }
  if (process.env.VERCEL_ENV) {
    return "https://staging.nextsurplus.com";
  }
  return "http://localhost:3000";
}

type MentionPayload = {
  recipientEmail?: unknown;
  recipientName?: unknown;
  actorName?: unknown;
  actorFirstName?: unknown;
  leadId?: unknown;
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

  const recipientEmail = String(payload.recipientEmail ?? "").trim();
  const actorName = String(payload.actorName ?? "A teammate").trim();
  const actorFirstNameRaw = String(payload.actorFirstName ?? "").trim();
  const actorFirstName =
    actorFirstNameRaw || actorName.split(/\s+/)[0] || actorName;
  const leadOwnerName = String(payload.leadOwnerName ?? "").trim();
  const commentText = String(payload.commentText ?? "").trim();
  const rawLink = String(payload.link ?? "").trim();

  if (!recipientEmail) {
    return NextResponse.json(
      { error: "Missing recipientEmail" },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ skipped: true }, { status: 200 });
  }

  const siteUrl = resolveSiteUrl();
  const fullLink = rawLink
    ? rawLink.startsWith("http")
      ? rawLink
      : `${siteUrl}${rawLink.startsWith("/") ? "" : "/"}${rawLink}`
    : "";

  const subject = leadOwnerName
    ? `${actorFirstName} Mentioned You in ${leadOwnerName}`
    : `${actorFirstName} Mentioned You on a Lead`;

  const safeOwner = escapeHtml(leadOwnerName);
  const safeActorName = escapeHtml(actorName);
  const safeComment = escapeHtml(commentText).replace(/\n/g, "<br/>");

  const preheader = leadOwnerName
    ? `${actorName} left a note for you on ${leadOwnerName}.`
    : `${actorName} left a note for you on a lead.`;

  const introCopy = leadOwnerName
    ? `${safeActorName} left a note on <strong>${safeOwner}</strong>:`
    : `${safeActorName} left a note for you:`;

  const bodyHtml = `
    ${renderEmailEyebrow("Mention")}
    ${renderEmailHeadline(subject)}
    ${renderEmailIntro(introCopy)}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0 0;background-color:#f5f5f5;border-radius:4px;">
      <tr>
        <td style="padding:16px 20px;font-family:Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;">
          ${safeComment}
        </td>
      </tr>
    </table>
    ${fullLink ? renderEmailButton({ href: fullLink, label: "Open the Discussion" }) : ""}
  `;

  const footerLine = `You received this because ${safeActorName} mentioned you on ${leadOwnerName ? `the ${safeOwner} lead` : "a lead"}.`;
  const html = renderEmailShell({ subject, bodyHtml, preheader, footerLine });

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from:
      process.env.RESEND_FROM ?? "Next Surplus <notifications@nextsurplus.com>",
    to: recipientEmail,
    subject,
    html,
  });
  if (error) {
    return NextResponse.json(
      { error: "Resend request failed", detail: error.message },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, id: data?.id ?? null });
}
