import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { getCurrentProfile } from "@/lib/auth/current-user";
import {
  buildThreadHistory,
  renderThreadedFeedbackEmail,
} from "@/lib/feedback-thread-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FROM_ADDRESS =
  process.env.RESEND_FROM ?? "Next Surplus <notifications@nextsurplus.com>";
const SUPPORT_INBOX = "support@nextsurplus.com";
const CUSTOMER_TEST_INBOX = "info@mossyland.com";
const TICKET_TITLE = "Sample Ticket — Dashboard metrics card flickers";
const ORG_NAME = "Mossy Land LLC";
const SUBMITTER_FULL_NAME = "Brionne Moss";
const SUBMITTER_FIRST = "Brionne";
const ADMIN_NAME = "Next Surplus Support";

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

const ORIGINAL_SUBMISSION = {
  body:
    "Reporting a glitch from this morning. The KPI strip on the Dashboard occasionally flashes from the loaded numbers back to skeleton placeholders for about half a second. Happens roughly once every two or three page loads. Nothing in the console.",
  createdAt: isoMinutesAgo(180),
  submitterName: SUBMITTER_FULL_NAME,
};

const HISTORY_MESSAGES = [
  {
    senderName: ADMIN_NAME,
    body:
      "Thanks for the heads up — I can reproduce it on staging. Looks like the KPI fetch is racing the layout transition. Patching the hydration order now.",
    createdAt: isoMinutesAgo(150),
    direction: "outbound" as const,
  },
  {
    senderName: SUBMITTER_FULL_NAME,
    body:
      "Great, appreciate it. Let me know once it's deployed and I'll re-test the Dashboard route from a cold load.",
    createdAt: isoMinutesAgo(120),
    direction: "inbound" as const,
  },
  {
    senderName: ADMIN_NAME,
    body:
      "Just shipped. Two changes: dashboard layout now waits for the stats query before swapping out the skeleton, and the placeholders match the real text width so the swap is invisible.",
    createdAt: isoMinutesAgo(60),
    direction: "outbound" as const,
  },
  {
    senderName: SUBMITTER_FULL_NAME,
    body:
      "Awesome, confirmed fixed on my end. No more flicker on a cold load or a hard refresh. Closing this out — thank you so much for the fast turnaround!",
    createdAt: isoMinutesAgo(15),
    direction: "inbound" as const,
  },
];

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  if (!profile.canViewFeedback) {
    return NextResponse.json(
      { ok: false, error: "Platform admin only" },
      { status: 403 }
    );
  }

  let body: { tone?: unknown };
  try {
    body = (await req.json()) as { tone?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const tone =
    body.tone === "customer" || body.tone === "admin" ? body.tone : null;
  if (!tone) {
    return NextResponse.json(
      { ok: false, error: "tone must be 'customer' or 'admin'" },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "RESEND_API_KEY not configured" },
      { status: 500 }
    );
  }

  const fullHistory = buildThreadHistory({
    originalSubmission: ORIGINAL_SUBMISSION,
    messages: HISTORY_MESSAGES.map((m) => ({
      senderName: m.senderName,
      body: m.body,
      createdAt: m.createdAt,
      direction: m.direction,
    })),
  });

  let recipient: string;
  let currentMessage: string;
  let payload: { html: string; text: string };
  let subject: string;

  if (tone === "customer") {
    recipient = CUSTOMER_TEST_INBOX;
    currentMessage =
      "One more update — we're going to ship a small follow-up to the Dashboard skeleton tomorrow that pre-warms the cache so the first paint is instant. No action needed on your side. Sample test message generated from the Next Surplus feedback email test harness.";
    subject = `Re: ${TICKET_TITLE}`;
    payload = renderThreadedFeedbackEmail({
      eyebrow: "Feedback Thread",
      ticketTitle: TICKET_TITLE,
      introText: `${ADMIN_NAME} replied to your feedback.`,
      greeting: `Hi ${SUBMITTER_FIRST},`,
      currentMessage,
      history: fullHistory,
      replyHint: "customer",
    });
  } else {
    recipient = SUPPORT_INBOX;
    currentMessage =
      "Quick follow-up — Dashboard is rock solid now even on a force refresh. The skeleton swap is seamless. Thanks again. Sample test message generated from the Next Surplus feedback email test harness.";
    subject = `New Reply: ${TICKET_TITLE}`;
    payload = renderThreadedFeedbackEmail({
      eyebrow: "Customer Reply",
      ticketTitle: TICKET_TITLE,
      introText: `${SUBMITTER_FULL_NAME} at ${ORG_NAME} just replied to this feedback thread.`,
      currentMessage,
      history: fullHistory,
      replyHint: "admin",
      cta: {
        href: "https://app.nextsurplus.com/admin/feedback",
        label: "Open In Admin Panel",
      },
    });
  }

  const resend = new Resend(apiKey);
  const { error: sendError, data } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: recipient,
    subject,
    html: payload.html,
    text: payload.text,
  });

  if (sendError) {
    return NextResponse.json(
      { ok: false, error: sendError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    recipient,
    resendId: data?.id ?? null,
  });
}
