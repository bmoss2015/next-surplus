"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { escapeHtml } from "@/lib/email-template";

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
    .select("title, user_id")
    .eq("id", input.id)
    .maybeSingle();
  if (loadError || !row) {
    return { ok: false, error: loadError?.message ?? "Not found" };
  }

  let recipientEmail: string | null = null;
  let recipientName = "there";
  if (row.user_id) {
    const { data: user } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", row.user_id as string)
      .maybeSingle();
    recipientEmail = (user?.email as string | null) ?? null;
    recipientName = ((user?.full_name as string | null) ?? "").split(" ")[0] || "there";
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

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && recipientEmail) {
    const replyDomain =
      process.env.FEEDBACK_REPLY_DOMAIN ?? "replies.nextsurplus.com";
    const ticketReplyTo = `ticket-${input.id}@${replyDomain}`;
    const subject = `Re: ${row.title as string}`;
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.6;">
        <p>Hi ${escapeHtml(recipientName)},</p>
        <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
      </div>
    `;
    const text = `Hi ${recipientName},\n\n${message}\n\nNext Surplus`;
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
