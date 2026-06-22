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

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && recipientEmail) {
    const subject = `Re: ${row.title as string}`;
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.6;">
        <p>Hi ${escapeHtml(recipientName)},</p>
        <p>Thanks for the feedback. Quick reply:</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
        <pre style="white-space:pre-wrap;font-family:Inter,Arial,sans-serif;font-size:14px;margin:0;">${escapeHtml(message)}</pre>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
        <p style="color:#6b7280;font-size:12.5px;margin:0;">Reply directly to this email and it lands in our support inbox.</p>
      </div>
    `;
    const text = `Hi ${recipientName},\n\nThanks for the feedback. Quick reply:\n\n${message}\n\nNext Surplus`;
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipientEmail,
      replyTo: "support@nextsurplus.com",
      subject,
      html,
      text,
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

export async function logCustomerReply(input: {
  id: string;
  message: string;
  senderName?: string;
  senderEmail?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  if (!profile.canViewFeedback) return { ok: false, error: "Platform admin only" };
  const message = input.message.trim();
  if (!message) return { ok: false, error: "Message is required" };
  if (message.length > 12000) return { ok: false, error: "Message too long" };

  const admin = createServiceClient();
  const { data: row, error: loadError } = await admin
    .from("feedback")
    .select("id, user_id")
    .eq("id", input.id)
    .maybeSingle();
  if (loadError || !row) {
    return { ok: false, error: loadError?.message ?? "Not found" };
  }

  let senderName = input.senderName?.trim() || null;
  let senderEmail = input.senderEmail?.trim() || null;
  if ((!senderName || !senderEmail) && row.user_id) {
    const { data: user } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", row.user_id as string)
      .maybeSingle();
    senderName = senderName ?? ((user?.full_name as string | null) ?? null);
    senderEmail = senderEmail ?? ((user?.email as string | null) ?? null);
  }

  const { error: insertError } = await admin.from("feedback_messages").insert({
    feedback_id: input.id,
    direction: "inbound",
    sender_user_id: row.user_id ?? null,
    sender_name: senderName,
    sender_email: senderEmail,
    body: message,
  });
  if (insertError) return { ok: false, error: insertError.message };

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
