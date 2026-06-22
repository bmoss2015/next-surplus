import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { rateLimit, ipFromRequest } from "@/lib/security/rate-limit";
import {
  renderEmailShell,
  renderEmailEyebrow,
  renderEmailHeadline,
  renderEmailIntro,
  renderEmailDataBlock,
  renderEmailButton,
  escapeHtml,
} from "@/lib/email-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORT_INBOX = "support@nextsurplus.com";
const FROM_ADDRESS =
  process.env.RESEND_FROM ?? "Next Surplus <notifications@nextsurplus.com>";
const MAX_TITLE_LENGTH = 140;
const MAX_BODY_LENGTH = 4000;

type FeedbackType = "bug" | "idea" | "question";
const ALLOWED_TYPES: FeedbackType[] = ["bug", "idea", "question"];

function typeLabel(type: FeedbackType): string {
  if (type === "bug") return "Bug";
  if (type === "idea") return "Idea";
  return "Question";
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
  const limit = rateLimit(`feedback:${ip}`, 20, 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  let payload: {
    type?: unknown;
    title?: unknown;
    body?: unknown;
    pageUrl?: unknown;
  };
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const rawType = typeof payload.type === "string" ? payload.type : "";
  if (!ALLOWED_TYPES.includes(rawType as FeedbackType)) {
    return NextResponse.json({ ok: false, error: "Invalid type" }, { status: 400 });
  }
  const type = rawType as FeedbackType;

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  if (!title) {
    return NextResponse.json({ ok: false, error: "Title is required" }, { status: 400 });
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json(
      { ok: false, error: `Title exceeds ${MAX_TITLE_LENGTH} characters` },
      { status: 400 }
    );
  }

  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!body) {
    return NextResponse.json({ ok: false, error: "Description is required" }, { status: 400 });
  }
  if (body.length > MAX_BODY_LENGTH) {
    return NextResponse.json(
      { ok: false, error: `Description exceeds ${MAX_BODY_LENGTH} characters` },
      { status: 400 }
    );
  }

  const pageUrl =
    typeof payload.pageUrl === "string"
      ? payload.pageUrl.trim().slice(0, 500)
      : null;
  const surface = pageUrl ? inferSurface(pageUrl) : null;

  const admin = createServiceClient();
  const { data: org } = await admin
    .from("orgs")
    .select("name")
    .eq("id", profile.orgId)
    .maybeSingle();
  const orgName = (org?.name as string | null) ?? "Unknown org";

  const { data: inserted, error: insertError } = await admin
    .from("feedback")
    .insert({
      user_id: profile.id,
      org_id: profile.orgId,
      type,
      title,
      body,
      page_url: pageUrl,
      surface,
    })
    .select("id")
    .maybeSingle();
  if (insertError) {
    console.error("[feedback] db insert failed:", insertError);
    return NextResponse.json(
      { ok: false, error: "Could not save feedback. Please try again." },
      { status: 500 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[feedback] RESEND_API_KEY not set; feedback saved but notification not sent");
    return NextResponse.json({ ok: true, id: inserted?.id ?? null });
  }

  const ticketId = inserted?.id ?? null;
  const adminUrl = resolveAdminUrl();
  const ticketLink = ticketId ? `${adminUrl}?id=${ticketId}` : adminUrl;
  const subject = `[${typeLabel(type)}] ${title}`;
  const preheader = `${typeLabel(type)} from ${profile.fullName} at ${orgName}`;

  const dataRows = [
    { label: "From", value: `${profile.fullName} <${profile.email ?? "no email"}>` },
    { label: "Org", value: orgName },
    { label: "Type", value: typeLabel(type) },
    ...(surface ? [{ label: "Surface", value: surface }] : []),
    ...(pageUrl ? [{ label: "Page", value: pageUrl }] : []),
  ];

  const safeBody = escapeHtml(body).replace(/\n/g, "<br/>");

  const bodyHtml = `
    ${renderEmailEyebrow(`${typeLabel(type)} • New Feedback`)}
    ${renderEmailHeadline(title)}
    ${renderEmailIntro(`${escapeHtml(profile.fullName)} at ${escapeHtml(orgName)} sent new feedback.`)}
    ${renderEmailDataBlock(dataRows)}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 0;background-color:#f5f5f5;border-radius:4px;">
      <tr>
        <td style="padding:16px 20px;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;">
          ${safeBody}
        </td>
      </tr>
    </table>
    ${renderEmailButton({ href: ticketLink, label: "Open In Admin Panel" })}
  `;

  const html = renderEmailShell({
    subject,
    bodyHtml,
    preheader,
    footerLine: "Next Surplus",
  });

  const bodyText = `${typeLabel(type)} from ${profile.fullName} at ${orgName}

Title: ${title}

${body}

Open in admin: ${ticketLink}`;

  const resend = new Resend(apiKey);
  const { error: sendError } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: SUPPORT_INBOX,
    replyTo: profile.email ?? undefined,
    subject,
    html,
    text: bodyText,
  });
  if (sendError) {
    console.error("[feedback] resend send failed:", sendError);
  }

  return NextResponse.json({ ok: true, id: ticketId });
}

function inferSurface(pageUrl: string): string | null {
  try {
    const u = pageUrl.startsWith("/") ? pageUrl : new URL(pageUrl).pathname;
    if (u.startsWith("/leads")) return "Leads";
    if (u.startsWith("/inbox")) return "Inbox";
    if (u.startsWith("/mail")) return "Mail";
    if (u.startsWith("/tasks")) return "Tasks";
    if (u.startsWith("/claims")) return "Claims";
    if (u.startsWith("/imports")) return "Imports";
    if (u.startsWith("/reports")) return "Reports";
    if (u.startsWith("/settings")) return "Settings";
    if (u.startsWith("/admin")) return "Admin";
    if (u === "/") return "Dashboard";
    return null;
  } catch {
    return null;
  }
}
