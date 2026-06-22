import {
  renderEmailShell,
  renderEmailEyebrow,
  renderEmailHeadline,
  renderEmailIntro,
  renderEmailButton,
  escapeHtml,
} from "@/lib/email-template";

const FONT_STACK =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export type ThreadMessage = {
  senderName: string;
  body: string;
  createdAt: string;
  direction: "outbound" | "inbound" | "submission";
};

export type ReplyHintTone = "customer" | "admin";

export function formatThreadDateTime(iso: string): string {
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

function htmlMessageBody(body: string): string {
  return escapeHtml(body).replace(/\n/g, "<br/>");
}

function plainQuotedHistory(history: ThreadMessage[]): string {
  if (history.length === 0) return "";
  const blocks = history.map((m) => {
    const header = `On ${formatThreadDateTime(m.createdAt)}, ${m.senderName} wrote:`;
    const quoted = m.body
      .split("\n")
      .map((l) => `> ${l}`)
      .join("\n");
    return `${header}\n${quoted}`;
  });
  return blocks.join("\n\n");
}

function htmlQuotedHistory(history: ThreadMessage[]): string {
  if (history.length === 0) return "";
  const blocks = history.map((m) => {
    const header = `<p style="margin:24px 0 6px;font-family:${FONT_STACK};font-size:12px;line-height:1.5;color:#6b7280;">On ${escapeHtml(
      formatThreadDateTime(m.createdAt)
    )}, ${escapeHtml(m.senderName)} wrote:</p>`;
    const quoted = `<blockquote style="margin:0;padding:0 0 0 14px;border-left:3px solid #e5e7eb;font-family:${FONT_STACK};font-size:13.5px;line-height:1.65;color:#4b5563;">${htmlMessageBody(
      m.body
    )}</blockquote>`;
    return header + quoted;
  });
  return blocks.join("\n");
}

export type RenderThreadedFeedbackEmailInput = {
  eyebrow: string;
  ticketTitle: string;
  introText: string;
  greeting?: string;
  currentMessage: string;
  history: ThreadMessage[];
  replyHint: ReplyHintTone | null;
  cta?: { href: string; label: string };
};

const REPLY_HINT_HTML: Record<ReplyHintTone, string> = {
  customer:
    "Reply directly to this email and your message will be added to this conversation.",
  admin:
    "Open the ticket in your admin panel to respond. Your reply will be threaded inside the same conversation.",
};

export function renderThreadedFeedbackEmail({
  eyebrow,
  ticketTitle,
  introText,
  greeting,
  currentMessage,
  history,
  replyHint,
  cta,
}: RenderThreadedFeedbackEmailInput): { html: string; text: string } {
  const subject = `Re: ${ticketTitle}`;
  const preheader = currentMessage.slice(0, 120);

  const greetingHtml = greeting
    ? `<p style="margin:0 0 14px;font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:#1a1a1a;">${escapeHtml(
        greeting
      )}</p>`
    : "";

  const currentMessageHtml = `<div style="margin:0;font-family:${FONT_STACK};font-size:14px;line-height:1.65;color:#1a1a1a;white-space:normal;">${htmlMessageBody(
    currentMessage
  )}</div>`;

  const ctaHtml = cta ? renderEmailButton({ href: cta.href, label: cta.label }) : "";
  const replyHintHtml = replyHint
    ? `<p style="margin:24px 0 0;font-family:${FONT_STACK};font-size:12px;line-height:1.5;color:#9ca3af;">${escapeHtml(
        REPLY_HINT_HTML[replyHint]
      )}</p>`
    : "";

  const bodyHtml = `
    ${renderEmailEyebrow(eyebrow)}
    ${renderEmailHeadline(ticketTitle)}
    ${renderEmailIntro(escapeHtml(introText))}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0 0;">
      <tr><td style="padding:0;">
        ${greetingHtml}
        ${currentMessageHtml}
      </td></tr>
    </table>
    ${ctaHtml}
    ${htmlQuotedHistory(history)}
    ${replyHintHtml}
  `;

  const html = renderEmailShell({
    subject,
    bodyHtml,
    preheader,
    footerLine: "Next Surplus",
  });

  const textParts = [
    eyebrow.toUpperCase(),
    "",
    ticketTitle,
    "",
    introText,
    "",
  ];
  if (greeting) textParts.push(greeting, "");
  textParts.push(currentMessage);
  if (cta) textParts.push("", `${cta.label}: ${cta.href}`);
  if (history.length > 0) {
    textParts.push("", plainQuotedHistory(history));
  }
  if (replyHint) {
    textParts.push("", REPLY_HINT_HTML[replyHint]);
  }
  const text = textParts.join("\n").trim();

  return { html, text };
}

export function buildThreadHistory(input: {
  originalSubmission: {
    body: string;
    createdAt: string;
    submitterName: string;
  };
  messages: Array<{
    senderName: string;
    body: string;
    createdAt: string;
    direction: "outbound" | "inbound";
  }>;
  excludeMessageBody?: string;
}): ThreadMessage[] {
  const items: ThreadMessage[] = [];
  for (const m of input.messages) {
    if (
      input.excludeMessageBody !== undefined &&
      m.body.trim() === input.excludeMessageBody.trim()
    ) {
      continue;
    }
    items.push({
      senderName: m.senderName,
      body: m.body,
      createdAt: m.createdAt,
      direction: m.direction,
    });
  }
  items.push({
    senderName: input.originalSubmission.submitterName,
    body: input.originalSubmission.body,
    createdAt: input.originalSubmission.createdAt,
    direction: "submission",
  });
  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return items;
}
