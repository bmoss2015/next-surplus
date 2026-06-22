"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { escapeHtml, renderEmailShell } from "@/lib/email-template";

const ALLOWED_STATUSES = [
  "new",
  "triaged",
  "planned",
  "shipped",
  "wont_do",
] as const;
type FeedbackStatus = (typeof ALLOWED_STATUSES)[number];

const FROM_ADDRESS =
  process.env.RESEND_FROM ?? "Next Surplus <notifications@nextsurplus.com>";

export async function updateFeedbackStatus(input: {
  id: string;
  status: FeedbackStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  if (!profile.canViewFeedback) return { ok: false, error: "Platform admin only" };
  if (!ALLOWED_STATUSES.includes(input.status)) {
    return { ok: false, error: "Invalid status" };
  }

  const admin = createServiceClient();
  const { data: prior } = await admin
    .from("feedback")
    .select("status, title, user_id")
    .eq("id", input.id)
    .maybeSingle();

  const { error } = await admin
    .from("feedback")
    .update({ status: input.status })
    .eq("id", input.id);
  if (error) return { ok: false, error: error.message };

  if (
    prior &&
    prior.status !== "shipped" &&
    input.status === "shipped" &&
    prior.user_id
  ) {
    await sendShippedEmail({
      userId: prior.user_id as string,
      title: prior.title as string,
    });
  }

  revalidatePath("/admin/feedback");
  return { ok: true };
}

export async function replyToFeedback(input: {
  id: string;
  message: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  if (!profile.canViewFeedback) return { ok: false, error: "Platform admin only" };
  const message = input.message.trim();
  if (!message) return { ok: false, error: "Reply is required" };
  if (message.length > 6000) return { ok: false, error: "Reply too long" };

  const admin = createServiceClient();
  const { data: row, error: loadError } = await admin
    .from("feedback")
    .select("title, body, user_id, created_at")
    .eq("id", input.id)
    .maybeSingle();
  if (loadError || !row) {
    return { ok: false, error: loadError?.message ?? "Not found" };
  }

  let recipientEmail: string | null = null;
  let recipientName = "there";
  let submitterFullName = "the customer";
  if (row.user_id) {
    const { data: user } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", row.user_id as string)
      .maybeSingle();
    recipientEmail = (user?.email as string | null) ?? null;
    submitterFullName = (user?.full_name as string | null) ?? "the customer";
    recipientName = submitterFullName.split(" ")[0] || "there";
  }

  const { data: lastInbound } = await admin
    .from("feedback_messages")
    .select("message_id")
    .eq("feedback_id", input.id)
    .eq("direction", "inbound")
    .not("message_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const inReplyTo = (lastInbound?.message_id as string | null) ?? null;

  const { data: priorMessage } = await admin
    .from("feedback_messages")
    .select("body, sender_name, direction, created_at")
    .eq("feedback_id", input.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const prior = priorMessage
    ? {
        body: (priorMessage.body as string) ?? "",
        senderName:
          ((priorMessage.sender_name as string | null) ?? null) ||
          (priorMessage.direction === "outbound" ? "You" : submitterFullName),
        createdAt: (priorMessage.created_at as string) ?? null,
      }
    : {
        body: (row.body as string) ?? "",
        senderName: submitterFullName,
        createdAt: (row.created_at as string) ?? null,
      };

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && recipientEmail) {
    const replyDomain =
      process.env.FEEDBACK_REPLY_DOMAIN ?? "replies.nextsurplus.com";
    const ticketReplyTo = `ticket-${input.id}@${replyDomain}`;
    const subject = `Re: ${row.title as string}`;
    const preheader = message.slice(0, 120);
    const quoteHeader = prior.createdAt
      ? `On ${formatReplyDate(prior.createdAt)}, ${prior.senderName} wrote:`
      : `${prior.senderName} wrote:`;
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");
    const safePriorBody = escapeHtml(prior.body).replace(/\n/g, "<br/>");
    const bodyHtml = `
      <p style="margin:0 0 16px;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;">Hi ${escapeHtml(recipientName)},</p>
      <div style="font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;">${safeMessage}</div>
      <p style="margin:24px 0 6px;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12.5px;line-height:1.5;color:#6b7280;">${escapeHtml(quoteHeader)}</p>
      <blockquote style="margin:0;padding:0 0 0 14px;border-left:3px solid #e5e7eb;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13.5px;line-height:1.6;color:#6b7280;">${safePriorBody}</blockquote>
    `;
    const html = renderEmailShell({
      subject,
      bodyHtml,
      preheader,
      footerLine: "Next Surplus",
    });
    const quotedText = prior.body
      .split("\n")
      .map((l) => `> ${l}`)
      .join("\n");
    const text = `Hi ${recipientName},\n\n${message}\n\n${quoteHeader}\n${quotedText}`;
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipientEmail,
      replyTo: ticketReplyTo,
      subject,
      html,
      text,
      headers: inReplyTo
        ? { "In-Reply-To": inReplyTo, References: inReplyTo }
        : undefined,
    });
  }

  const nowIso = new Date().toISOString();
  const { error: updateError } = await admin
    .from("feedback")
    .update({
      response_body: message,
      responded_at: nowIso,
      responded_by: profile.id,
      status: "triaged",
    })
    .eq("id", input.id);
  if (updateError) return { ok: false, error: updateError.message };

  await admin.from("feedback_messages").insert({
    feedback_id: input.id,
    direction: "outbound",
    sender_user_id: profile.id,
    sender_name: profile.fullName,
    sender_email: profile.email,
    body: message,
  });

  revalidatePath("/admin/feedback");
  return { ok: true };
}

export async function markInboundRead(input: {
  id: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  if (!profile.canViewFeedback) return { ok: false, error: "Platform admin only" };
  const admin = createServiceClient();
  const { error } = await admin
    .from("feedback")
    .update({ inbound_unread: false })
    .eq("id", input.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/feedback");
  return { ok: true };
}

function formatReplyDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

async function sendShippedEmail(input: { userId: string; title: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const admin = createServiceClient();
  const { data: user } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", input.userId)
    .maybeSingle();
  const recipient = (user?.email as string | null) ?? null;
  if (!recipient) return;
  const firstName =
    ((user?.full_name as string | null) ?? "").split(" ")[0] || "there";
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.6;">
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>We shipped what you asked for:</p>
      <p style="font-weight:600;">${escapeHtml(input.title)}</p>
      <p>Thanks for telling us. Reply to this email if anything still feels off.</p>
    </div>
  `;
  const text = `Hi ${firstName},\n\nWe shipped what you asked for: ${input.title}\n\nThanks for telling us. Reply to this email if anything still feels off.`;
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: recipient,
    replyTo: "support@nextsurplus.com",
    subject: `We Shipped: ${input.title}`,
    html,
    text,
  });
}
