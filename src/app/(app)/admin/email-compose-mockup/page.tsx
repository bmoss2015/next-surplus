import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import {
  IconX,
  IconBold,
  IconItalic,
  IconUnderline,
  IconList,
  IconListNumbers,
  IconLink,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconSparkles,
  IconMailForward,
  IconChevronDown,
  IconBrandGmail,
} from "@tabler/icons-react";

export default async function EmailComposeMockupPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  return (
    <div className="min-h-screen bg-gray-50 p-8" style={{ fontFamily: "Inter, sans-serif", color: "#0f1729" }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-[20px] font-medium tracking-tight">Compose Email Mockup</h1>
          <p className="mt-1 text-[13px] text-gray-500">
            Single-lead send. Outbound via the operator&apos;s connected Gmail. Logs to the lead&apos;s Activity tab as a row, no separate table.
          </p>
        </div>

        <div className="grid grid-cols-[1fr_320px] gap-6">
          <div>
            <div className="rounded-[10px] border border-gray-200 bg-white shadow-card">
              <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
                <div>
                  <div className="text-[10.5px] font-medium uppercase tracking-wide text-gray-500">
                    Lead L-2026-0042
                  </div>
                  <div className="text-[14px] font-medium">Compose Email</div>
                </div>
                <button className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100">
                  <IconX size={16} stroke={1.75} />
                </button>
              </header>

              <div className="space-y-4 px-5 py-4">
                <FieldRow label="From">
                  <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[13px]">
                    <IconBrandGmail size={14} stroke={1.75} className="text-[#0d6c7d]" />
                    <span className="font-medium">Bree Moss</span>
                    <span className="text-gray-500">&lt;bree@mossequitypartners.com&gt;</span>
                    <button className="ml-auto inline-flex cursor-pointer items-center gap-1 text-[11px] text-[#0d6c7d] hover:underline">
                      Change
                      <IconChevronDown size={11} stroke={2} />
                    </button>
                  </div>
                </FieldRow>

                <FieldRow label="To">
                  <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-gray-200 px-2 py-1.5">
                    <RecipientChip name="Roberta Mendes" email="roberta.mendes@example.com" relation="Owner" />
                    <RecipientChip name="Carlos Mendes" email="carlos.mendes@example.com" relation="Spouse" />
                    <input
                      className="flex-1 min-w-[120px] border-0 bg-transparent text-[13px] outline-none"
                      placeholder="Add another email contact..."
                    />
                  </div>
                </FieldRow>

                <FieldRow label="Subject">
                  <input
                    defaultValue="Following up on your tax sale surplus claim, Roberta"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-[#0d6c7d]"
                  />
                </FieldRow>

                <div className="rounded-md border border-gray-200">
                  <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
                    <ToolbarBtn icon={IconBold} active />
                    <ToolbarBtn icon={IconItalic} />
                    <ToolbarBtn icon={IconUnderline} />
                    <Divider />
                    <ToolbarBtn icon={IconList} />
                    <ToolbarBtn icon={IconListNumbers} />
                    <Divider />
                    <ToolbarBtn icon={IconLink} />
                    <Divider />
                    <ToolbarBtn icon={IconAlignLeft} />
                    <ToolbarBtn icon={IconAlignCenter} />
                    <ToolbarBtn icon={IconAlignRight} />
                    <div className="ml-auto flex items-center gap-1">
                      <button className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-[#0d6c7d] hover:border-[#0d6c7d]">
                        <IconSparkles size={11} stroke={2} />
                        Insert Merge Field
                        <IconChevronDown size={10} stroke={2} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 px-4 py-4 text-[13.5px] leading-[1.65] text-[#0f1729]">
                    <p>Hi Roberta,</p>
                    <p>
                      I&apos;m following up on the surplus funds from your{" "}
                      <strong>tax sale at 456 Oak Avenue, Dallas TX 75201</strong>. Based on our research,
                      we estimate the surplus available to you at{" "}
                      <strong>$42,500</strong>.
                    </p>
                    <p>Here&apos;s what happens next if you&apos;d like to move forward:</p>
                    <ul className="ml-5 list-disc space-y-1">
                      <li>We file the claim with Dallas County on your behalf.</li>
                      <li>You receive a portion of the recovered funds (after attorney costs).</li>
                      <li>Most claims resolve within 90 to 180 days.</li>
                    </ul>
                    <p>
                      You can review the case details and sign electronically at{" "}
                      <a className="text-[#0d6c7d] underline">portal.mossequitypartners.com</a>.
                    </p>
                    <p>Happy to jump on a quick call if it&apos;s easier.</p>
                    <p className="pt-2">
                      Bree Moss
                      <br />
                      <span className="text-gray-500">Managing Partner, Moss Equity Partners</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <IconMailForward size={12} stroke={1.75} />
                    <span>
                      Sending via your Gmail. Replies arrive in your normal inbox.
                    </span>
                  </div>
                  <span>~1 send credit</span>
                </div>
              </div>

              <footer className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
                <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:border-gray-300">
                  Cancel
                </button>
                <button
                  className="cursor-pointer rounded-md px-4 py-1.5 text-[12px] font-medium text-white"
                  style={{ background: "linear-gradient(135deg, #0a3d4a 0%, #0d6c7d 100%)" }}
                >
                  Send Email
                </button>
              </footer>
            </div>

            <NotesCard />
          </div>

          <aside className="space-y-4">
            <SidebarCard title="After Send — Activity Log Entry">
              <div className="rounded-md border border-gray-150 bg-white p-3 text-[12.5px]">
                <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  <IconMailForward size={12} stroke={2} />
                  Email Sent
                </div>
                <div className="mt-1.5 text-ink">
                  Bree sent &ldquo;Following up on your tax sale surplus claim, Roberta&rdquo; to Roberta Mendes and Carlos Mendes.
                </div>
                <div className="mt-1 text-[11px] text-gray-500">
                  Just now · Sent via Gmail
                </div>
              </div>
              <p className="mt-3 text-[12px] text-gray-500">
                No new database table. The row lands in <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">activities</code> with type{" "}
                <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">email_sent</code> and a payload holding the Gmail message id.
              </p>
            </SidebarCard>

            <SidebarCard title="Connecting Gmail (One Time, Settings)">
              <div className="rounded-md border border-gray-150 bg-white p-3">
                <div className="text-[12.5px] font-medium">Email Account</div>
                <div className="mt-2 flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-[12.5px]">
                  <IconBrandGmail size={14} stroke={1.75} className="text-[#0d6c7d]" />
                  <span className="font-medium">bree@mossequitypartners.com</span>
                  <span className="ml-auto rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-green-700">
                    Connected
                  </span>
                </div>
                <button className="mt-2 w-full cursor-pointer rounded-md border border-gray-200 px-3 py-1.5 text-[11.5px] text-gray-600 hover:border-gray-300">
                  Disconnect
                </button>
              </div>
              <p className="mt-3 text-[12px] text-gray-500">
                OAuth flow. We never see your password. Token stored encrypted; refresh handled automatically.
              </p>
            </SidebarCard>

            <SidebarCard title="What This Mockup Skips">
              <ul className="space-y-1.5 text-[12px] text-gray-600">
                <li>• Templates (later — would mirror Mail Templates UI)</li>
                <li>• Bulk send (out of scope, single lead only)</li>
                <li>• Reply tracking on the lead (separate BCC-to-portal feature later)</li>
                <li>• Attachments (could add easily, not built yet)</li>
              </ul>
            </SidebarCard>
          </aside>
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[60px_1fr] items-start gap-3">
      <label className="pt-2 text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </label>
      <div>{children}</div>
    </div>
  );
}

function RecipientChip({
  name,
  email,
  relation,
}: {
  name: string;
  email: string;
  relation: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white py-1 pl-2 pr-1 text-[12px]">
      <span className="font-medium">{name}</span>
      <span className="text-gray-500">&lt;{email}&gt;</span>
      <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-600">
        {relation}
      </span>
      <button className="cursor-pointer rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
        <IconX size={11} stroke={2} />
      </button>
    </span>
  );
}

function ToolbarBtn({
  icon: Icon,
  active,
}: {
  icon: React.ComponentType<{ size: number; stroke: number }>;
  active?: boolean;
}) {
  return (
    <button
      className={
        "cursor-pointer rounded p-1 " +
        (active
          ? "bg-[#0d6c7d] text-white"
          : "text-gray-600 hover:bg-gray-200")
      }
    >
      <Icon size={13} stroke={1.75} />
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-4 w-px bg-gray-200" />;
}

function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-gray-200 bg-white p-4 shadow-card">
      <h3 className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function NotesCard() {
  return (
    <div className="mt-6 rounded-[10px] border border-dashed border-gray-300 bg-white p-5">
      <h3 className="text-[12px] font-medium uppercase tracking-wide text-gray-500">
        Build Notes
      </h3>
      <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-[#0f1729]">
        <li>
          <strong>Editor.</strong> Same TipTap component the Mail Templates section already uses. Bold, italic, underline, bullets, numbered list, link, alignment. Stored as HTML.
        </li>
        <li>
          <strong>Recipient picker.</strong> Reads the lead&apos;s <code className="rounded bg-gray-100 px-1 py-0.5">contacts</code> rows where <code className="rounded bg-gray-100 px-1 py-0.5">channel = &apos;email&apos;</code>. Multi-select. No bulk send across leads.
        </li>
        <li>
          <strong>Provider.</strong> Operator&apos;s connected Gmail or Outlook via OAuth (settings). Replies land in their inbox naturally. Resend stays as the system-email provider (password resets, alerts) — not user-to-lead.
        </li>
        <li>
          <strong>Persistence.</strong> No <code className="rounded bg-gray-100 px-1 py-0.5">email_jobs</code> table. One row in <code className="rounded bg-gray-100 px-1 py-0.5">activities</code> with type <code className="rounded bg-gray-100 px-1 py-0.5">email_sent</code>, payload holds Gmail message id, subject snippet, recipient names, sent timestamp.
        </li>
        <li>
          <strong>Merge fields.</strong> Reuses the existing <code className="rounded bg-gray-100 px-1 py-0.5">{`{{contact.first_name}}`}</code>, <code className="rounded bg-gray-100 px-1 py-0.5">{`{{lead.property_address}}`}</code>, etc. Same registry as mail.
        </li>
        <li>
          <strong>HTML vs plain text.</strong> Send multipart: HTML primary + auto-generated plain text fallback. Standard across modern email clients.
        </li>
      </ul>
    </div>
  );
}
