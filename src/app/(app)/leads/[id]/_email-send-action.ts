"use server";

import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { sendEmail } from "@/app/(app)/inbox/_send-actions";

export type SendLeadEmailInput = {
  leadId: string;
  accountId: string;
  to: { name: string; email: string; contactId: string | null }[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml: string;
  templateId?: string | null;
};

function publicOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return raw.replace(/\/$/, "");
}

function embedPixel(html: string, token: string): string {
  const url = `${publicOrigin()}/api/email/open/${token}`;
  const img = `<img src="${url}" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px;" />`;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${img}</body>`);
  return `${html}\n\n${img}`;
}

export async function sendLeadEmail(
  input: SendLeadEmailInput
): Promise<
  | { ok: true; sentCount: number }
  | { ok: false; error: string }
> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  if (!input.to || input.to.length === 0) {
    return { ok: false, error: "Pick at least one recipient" };
  }
  const subject = (input.subject ?? "").trim();
  if (!subject) return { ok: false, error: "Subject is required" };
  const body = (input.bodyHtml ?? "").trim();
  if (!body) return { ok: false, error: "Body is required" };

  const admin = createServiceClient();
  const sb = await createClient();

  let sent = 0;
  for (const recipient of input.to) {
    const token = randomBytes(18).toString("hex");
    const bodyWithPixel = embedPixel(input.bodyHtml, token);

    const sendRes = await sendEmail({
      accountId: input.accountId,
      to: [recipient.email],
      cc: input.cc && input.cc.length > 0 ? input.cc : undefined,
      bcc: input.bcc && input.bcc.length > 0 ? input.bcc : undefined,
      subject,
      body: bodyWithPixel,
      leadId: input.leadId,
    });

    if (!sendRes.ok) {
      return { ok: false, error: sendRes.error };
    }

    const { data: activity } = await sb
      .from("activities")
      .insert({
        lead_id: input.leadId,
        user_id: profile.id,
        activity_type: "email_sent",
        payload: {
          send_token: token,
          recipient_name: recipient.name,
          recipient_email: recipient.email,
          subject,
          template_id: input.templateId ?? null,
          message_id: sendRes.messageId,
          cc: input.cc ?? [],
          bcc: input.bcc ?? [],
        },
      })
      .select("id")
      .single();

    await admin.from("email_send_tokens").insert({
      token,
      org_id: profile.orgId,
      lead_id: input.leadId,
      activity_id: (activity?.id as string | undefined) ?? null,
      account_id: input.accountId,
      sender_user_id: profile.id,
      recipient_name: recipient.name,
      recipient_email: recipient.email,
      subject,
      template_id: input.templateId ?? null,
    });

    sent += 1;
  }

  return { ok: true, sentCount: sent };
}
