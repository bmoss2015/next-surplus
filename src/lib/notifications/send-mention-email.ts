import { Resend } from "resend";
import {
  renderEmailShell,
  renderEmailEyebrow,
  renderEmailHeadline,
  renderEmailIntro,
  renderEmailButton,
  escapeHtml,
} from "@/lib/email-template";

export type SendMentionEmailInput = {
  recipientEmail: string;
  actorName: string;
  actorFirstName?: string;
  leadOwnerName?: string;
  commentText: string;
  link?: string;
};

export type SendMentionEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; skipped: true }
  | { ok: false; error: string };

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

export async function sendMentionEmail(
  input: SendMentionEmailInput
): Promise<SendMentionEmailResult> {
  const recipientEmail = input.recipientEmail.trim();
  if (!recipientEmail) {
    return { ok: false, error: "Missing recipientEmail" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, skipped: true };
  }

  const actorName = (input.actorName ?? "A teammate").trim();
  const actorFirstName =
    (input.actorFirstName ?? "").trim() ||
    actorName.split(/\s+/)[0] ||
    actorName;
  const leadOwnerName = (input.leadOwnerName ?? "").trim();
  const commentText = (input.commentText ?? "").trim();
  const rawLink = (input.link ?? "").trim();

  const siteUrl = resolveSiteUrl();
  const fullLink = rawLink
    ? rawLink.startsWith("http")
      ? rawLink
      : `${siteUrl}${rawLink.startsWith("/") ? "" : "/"}${rawLink}`
    : "";

  const subject = leadOwnerName
    ? `${actorFirstName} Mentioned You on the ${leadOwnerName} Lead`
    : `${actorFirstName} Mentioned You on a Lead`;

  const safeComment = escapeHtml(commentText).replace(/\n/g, "<br/>");

  const preheader = leadOwnerName
    ? `${actorName} left a note for you on ${leadOwnerName}.`
    : `${actorName} left a note for you on a lead.`;

  const bodyHtml = `
    ${renderEmailEyebrow("Mention")}
    ${renderEmailHeadline(subject)}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 0;background-color:#f5f5f5;border-radius:4px;">
      <tr>
        <td style="padding:16px 20px;font-family:Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;">
          ${safeComment}
        </td>
      </tr>
    </table>
    ${fullLink ? renderEmailButton({ href: fullLink, label: "Open the Discussion" }) : ""}
  `;

  const html = renderEmailShell({
    subject,
    bodyHtml,
    preheader,
    footerLine: "",
  });

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from:
      process.env.RESEND_FROM ?? "Next Surplus <notifications@nextsurplus.com>",
    to: recipientEmail,
    subject,
    html,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, id: data?.id ?? null };
}
