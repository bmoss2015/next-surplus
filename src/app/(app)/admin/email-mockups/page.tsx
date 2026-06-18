import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";

const SAMPLE = {
  inviterName: "Bree Moss",
  inviteeFirstName: "Breezy",
  orgName: "Moss Equity",
  inviteUrl:
    "https://staging.nextsurplus.com/accept-invite?token_hash=4a0cfc47e3d487874779902250a6cd47&type=invite",
  logoLight: "/images/email-logo.png",
  logoDark: "/images/email-logo-dark.png",
};

const FONT_STACK =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const VARIANTS: Array<{
  id: string;
  title: string;
  anchor: string;
  notes: string;
  html: string;
}> = [
  {
    id: "v1",
    title: "V1 — Stripe Receipt",
    anchor: "Stripe Dashboard receipts. Editorial density, no decorative chrome.",
    notes:
      "White header (logo only, no dark bar). Typographic hierarchy carries the brand instead of color. Key facts as a data list. Sharp 4px button radius. No fallback URL.",
    html: stripeReceiptHtml(),
  },
  {
    id: "v1b",
    title: "V1b — Stripe Receipt + Brand Color",
    anchor: "V1 chrome, but with three calibrated splashes of the brand gradient.",
    notes:
      "Same editorial card as V1. Adds: (1) a 4px brand-gradient strip at the very top of the card, (2) a gradient pill CTA (replaces V1's flat dark button), (3) the 'Team Invite' eyebrow in brand teal. Everything else identical — same data block, same sharp typography.",
    html: stripeReceiptColorHtml(),
  },
  {
    id: "v2",
    title: "V2 — Linear Dark",
    anchor: "Linear notification emails (issue/PR pings). Dark canvas, mono-accent.",
    notes:
      "Fully dark email. White wordmark at top, small uppercase mono label. White-fill button on dark surface. Reads like a product notification, not marketing.",
    html: linearDarkHtml(),
  },
  {
    id: "v3",
    title: "V3 — Modern Green Gradient",
    anchor:
      "The Next Surplus portal itself — the sign-in panel and sidebar use the same forest-to-emerald gradient.",
    notes:
      "Tightened: 56px gradient hero, 8px card radius, 6px button radius, 32px body padding, 20px headline. White-on-dark logo asset (no CSS filter). Footer is just 'Next Surplus' — no tagline.",
    html: gradientHeroHtml(),
  },
  {
    id: "v4",
    title: "V4 — Notion Workspace Invite",
    anchor: "Notion / Loom workspace invites. Personal, soft, generous whitespace.",
    notes:
      "Avatar circle with the inviter's initials. Conversational greeting. 16px body text, 40px padding. Rounded 12px button. The friendliest of the five — feels like a person, not a system.",
    html: notionInviteHtml(),
  },
  {
    id: "v5",
    title: "V5 — Attio Minimal",
    anchor: "Attio / Folk transactional emails. No card, no decoration, type-only.",
    notes:
      "No card surface, no header bar, no image — just typography on white. Workspace wordmark as text. CTA as an underlined link, no button. Most restrained, would survive every email client without rendering issues.",
    html: attioMinimalHtml(),
  },
];

export default async function EmailMockupsIndex() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f5f5" }}>
      <div className="mx-auto max-w-[860px] px-6 py-10">
        <header className="mb-8">
          <h1 className="text-[24px] font-semibold tracking-tight text-ink">
            Email Mockups — Team Invite
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
            Five anchored directions for the transactional invite email. Each
            iframe below renders the actual HTML that would ship through
            Resend, so what you see is what an inbox sees. Sample data: invitee
            &quot;{SAMPLE.inviteeFirstName}&quot;, inviter &quot;
            {SAMPLE.inviterName}&quot;, workspace &quot;{SAMPLE.orgName}&quot;
            (which is the org row name in staging Supabase — rename the row and
            this string changes everywhere, no code edit needed).
          </p>
        </header>

        <div className="space-y-10">
          {VARIANTS.map((v) => (
            <section
              key={v.id}
              className="rounded-md border border-gray-200 bg-white shadow-sm"
            >
              <div className="border-b border-gray-200 px-5 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                  {v.id}
                </div>
                <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-ink">
                  {v.title}
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
                  <span className="font-medium text-ink">Anchor:</span>{" "}
                  {v.anchor}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-600">
                  {v.notes}
                </p>
              </div>
              <div className="bg-[#f5f5f5] p-4">
                <iframe
                  title={v.title}
                  srcDoc={v.html}
                  className="block w-full rounded border border-gray-200 bg-white"
                  style={{ height: 720 }}
                />
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function stripeReceiptHtml(): string {
  const { inviteeFirstName, inviterName, orgName, inviteUrl, logoLight } = SAMPLE;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>Join ${orgName} on Next Surplus</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:${FONT_STACK};color:#1a1a1a;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:6px;">
          <tr>
            <td style="padding:32px 40px 0;">
              <img src="${logoLight}" alt="Next Surplus" width="140" height="24" style="display:block;border:0;outline:none;width:140px;height:auto;">
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 8px;">
              <div style="font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#6b7280;">Team Invite</div>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:#1a1a1a;">You&rsquo;ve been invited to ${orgName}</h1>
              <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#4b5563;">${inviterName} added you to their workspace on Next Surplus. Accept the invite to set your password and sign in.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e5e7eb;">
                <tr><td style="padding:14px 0 6px;font-size:12px;color:#6b7280;width:120px;">Workspace</td><td style="padding:14px 0 6px;font-size:14px;color:#1a1a1a;">${orgName}</td></tr>
                <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">Invited by</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${inviterName}</td></tr>
                <tr><td style="padding:6px 0 14px;font-size:12px;color:#6b7280;">Your role</td><td style="padding:6px 0 14px;font-size:14px;color:#1a1a1a;">Member</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="#04261c" style="background-color:#04261c;border-radius:4px;">
                    <a href="${inviteUrl}" style="display:inline-block;padding:12px 22px;font-family:${FONT_STACK};font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:4px;">Accept invite</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 40px;background-color:#fafafa;border-top:1px solid #e5e7eb;border-radius:0 0 6px 6px;font-size:12px;line-height:1.5;color:#6b7280;">
              You received this because ${inviterName} invited you to ${orgName}. Questions? Reply to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function stripeReceiptColorHtml(): string {
  const { inviterName, orgName, inviteUrl, logoLight } = SAMPLE;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>Join ${orgName} on Next Surplus</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:${FONT_STACK};color:#1a1a1a;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
          <tr>
            <td height="4" style="height:4px;line-height:0;font-size:0;background-image:linear-gradient(90deg,#04261c 0%,#13644e 50%,#4a9c75 100%);background-color:#13644e;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:30px 40px 0;">
              <img src="${logoLight}" alt="Next Surplus" width="200" height="35" style="display:block;border:0;outline:none;width:200px;height:auto;">
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 8px;">
              <div style="font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#13644e;">Team Invite</div>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:#1a1a1a;">You&rsquo;ve Been Invited to ${orgName}</h1>
              <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#4b5563;">${inviterName} added you to their workspace on Next Surplus. Accept the invite to set your password and sign in.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e5e7eb;">
                <tr><td style="padding:14px 0 6px;font-size:12px;color:#6b7280;width:120px;">Workspace</td><td style="padding:14px 0 6px;font-size:14px;color:#1a1a1a;">${orgName}</td></tr>
                <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">Invited By</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${inviterName}</td></tr>
                <tr><td style="padding:6px 0 14px;font-size:12px;color:#6b7280;">Your Role</td><td style="padding:6px 0 14px;font-size:14px;color:#1a1a1a;">Member</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-image:linear-gradient(90deg,#04261c 0%,#13644e 100%);background-color:#13644e;border-radius:4px;">
                    <a href="${inviteUrl}" style="display:inline-block;padding:12px 22px;font-family:${FONT_STACK};font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:4px;">Accept Invite</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 40px;background-color:#fafafa;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.5;color:#6b7280;">
              You received this because ${inviterName} invited you to the ${orgName} team.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function linearDarkHtml(): string {
  const { inviterName, orgName, inviteUrl } = SAMPLE;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark only">
  <title>Join ${orgName} on Next Surplus</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0f0d;font-family:${FONT_STACK};color:#e6e9e7;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0a0f0d;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:#11201b;border:1px solid #1f3a31;border-radius:8px;">
          <tr>
            <td style="padding:28px 32px 0;">
              <div style="font-family:${FONT_STACK};font-size:14px;font-weight:600;letter-spacing:-0.01em;color:#ffffff;">Next Surplus</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 0;">
              <div style="font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#4a9c75;">Team Invite</div>
              <h1 style="margin:10px 0 0;font-size:24px;font-weight:600;letter-spacing:-0.02em;color:#ffffff;line-height:1.25;">${inviterName} invited you to ${orgName}</h1>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.7;color:#a8b3ae;">Accept the invite to join the workspace, set your password, and start working with the team.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:6px;">
                    <a href="${inviteUrl}" style="display:inline-block;padding:11px 22px;font-family:${FONT_STACK};font-size:14px;font-weight:600;color:#0a0f0d;text-decoration:none;border-radius:6px;">Accept invite</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 28px;border-top:1px solid #1f3a31;margin-top:24px;font-size:12px;line-height:1.5;color:#6c7c75;">
              You received this because ${inviterName} added you to ${orgName} on Next Surplus.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function gradientHeroHtml(): string {
  const { inviteeFirstName, inviterName, orgName, inviteUrl, logoDark } = SAMPLE;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>Join ${orgName} on Next Surplus</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:${FONT_STACK};color:#1a1a1a;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td align="center" style="background-image:linear-gradient(135deg,#04261c 0%,#13644e 60%,#4a9c75 100%);background-color:#04261c;padding:18px 24px;">
              <img src="${logoDark}" alt="Next Surplus" width="160" style="display:block;border:0;outline:none;width:160px;height:auto;">
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 4px;">
              <h1 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.01em;color:#1a1a1a;line-height:1.3;">Hi ${inviteeFirstName}, you&rsquo;re invited</h1>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#374151;">${inviterName} added you to <strong style="color:#04261c;">${orgName}</strong>. Accept the invite to set your password and sign in.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-image:linear-gradient(90deg,#04261c 0%,#13644e 100%);background-color:#13644e;border-radius:6px;">
                    <a href="${inviteUrl}" style="display:inline-block;padding:11px 22px;font-family:${FONT_STACK};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">Accept invite</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 22px;font-size:12px;line-height:1.5;color:#6b7280;border-top:1px solid #f0f0f0;margin-top:24px;">
              Next Surplus
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function notionInviteHtml(): string {
  const { inviteeFirstName, inviterName, orgName, inviteUrl } = SAMPLE;
  const initials = inviterName
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>${inviterName} invited you to ${orgName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:${FONT_STACK};color:#1a1a1a;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f5;padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="540" style="max-width:540px;width:100%;background-color:#ffffff;border-radius:16px;border:1px solid #ececec;">
          <tr>
            <td style="padding:40px 40px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="width:44px;height:44px;border-radius:50%;background-color:#04261c;color:#ffffff;font-size:15px;font-weight:600;line-height:44px;text-align:center;letter-spacing:0.02em;">${initials}</div>
                  </td>
                  <td style="vertical-align:middle;padding-left:12px;font-size:13px;color:#6b7280;line-height:1.4;">
                    <strong style="color:#1a1a1a;font-weight:600;">${inviterName}</strong><br>
                    invited you to a workspace
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px 0;">
              <h1 style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:#1a1a1a;line-height:1.3;">Hey ${inviteeFirstName}, come join ${orgName} on Next Surplus</h1>
              <p style="margin:14px 0 0;font-size:16px;line-height:1.65;color:#4b5563;">You&rsquo;ll be added as a member, can set your own password, and start working with the team right away.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="#13644e" style="background-color:#13644e;border-radius:12px;">
                    <a href="${inviteUrl}" style="display:inline-block;padding:14px 26px;font-family:${FONT_STACK};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">Accept invite</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px 40px;border-top:1px solid #f0f0f0;font-size:12px;line-height:1.5;color:#9ca3af;">
              Sent from Next Surplus. Not expecting this? You can safely ignore it.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function attioMinimalHtml(): string {
  const { inviteeFirstName, inviterName, orgName, inviteUrl } = SAMPLE;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>Join ${orgName} on Next Surplus</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:${FONT_STACK};color:#1a1a1a;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;padding:64px 16px 80px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="480" style="max-width:480px;width:100%;">
          <tr>
            <td style="padding:0 0 32px;border-bottom:1px solid #e5e7eb;">
              <div style="font-size:12px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#1a1a1a;">Next Surplus</div>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 0 0;">
              <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a;">Hi ${inviteeFirstName},</p>
              <p style="margin:18px 0 0;font-size:15px;line-height:1.7;color:#1a1a1a;">${inviterName} invited you to join <strong>${orgName}</strong> on Next Surplus. Accept the invite to set your password and sign in.</p>
              <p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#1a1a1a;">
                <a href="${inviteUrl}" style="color:#13644e;font-weight:600;text-decoration:underline;text-underline-offset:3px;">Accept invite &rarr;</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:56px 0 0;border-top:1px solid #e5e7eb;margin-top:48px;">
              <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#6b7280;">Next Surplus &middot; Surplus funds recovery platform</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
