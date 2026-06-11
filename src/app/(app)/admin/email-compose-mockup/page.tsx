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
  IconPlus,
  IconPencil,
  IconCopy,
  IconTrash,
  IconFile,
  IconCircleCheck,
  IconArrowBackUp,
  IconFolder,
} from "@tabler/icons-react";

export default async function EmailComposeMockupPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  return (
    <div className="min-h-screen bg-gray-50 p-8" style={{ fontFamily: "Inter, sans-serif", color: "#0f1729" }}>
      <div className="mx-auto max-w-[1100px] space-y-10">
        <header>
          <h1 className="text-[20px] font-medium tracking-tight">Compose Email Mockup</h1>
          <p className="mt-1 text-[13px] text-gray-500">
            Three views laid out top to bottom: how you compose from a lead, where templates live, and what gets logged after. Anything labeled <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">MOCKUP NOTE</span> is explanation, not real UI.
          </p>
        </header>

        <Section
          tag="On A Lead"
          title="1. Compose Email Modal"
          desc='Opens from a new "Email" button on the lead page, next to "Send Mail".'
        >
          <ComposeModal />
        </Section>

        <Section
          tag="On A Lead"
          title="2. New Email button on the lead page"
          desc='Sits next to the existing "Send Mail" button. Clicking it opens the modal above.'
        >
          <LeadHeaderBar />
        </Section>

        <Section
          tag="Settings + On A Lead"
          title="3. Email Templates — create, edit, reuse"
          desc="Templates live in Settings → Email Templates. You can also create one inline from the modal (Save As Template) so you don't have to leave the lead."
        >
          <EmailTemplatesPanel />
        </Section>

        <Section
          tag="On A Lead"
          title="4. After send — Activity log entry"
          desc="Drops into the lead's Activity tab. Same place as 'Mail Sent', 'Stage Changed' etc."
        >
          <ActivityEntry />
        </Section>

        <Section
          tag="On A Lead"
          title="5. After a reply lands"
          desc="We poll your Gmail every hour for replies to emails we sent. Free, runs in the background. Reply also shows in your normal Gmail inbox — this is just so it's visible on the lead too."
        >
          <ReplyEntry />
        </Section>

        <BuildNotes />
      </div>
    </div>
  );
}

function Section({
  tag,
  title,
  desc,
  children,
}: {
  tag: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <span className="inline-block rounded-full bg-[#0d6c7d]/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#0d6c7d]">
          {tag}
        </span>
        <h2 className="mt-2 text-[16px] font-medium">{title}</h2>
        <p className="mt-0.5 text-[12.5px] text-gray-500">{desc}</p>
      </div>
      {children}
    </section>
  );
}

function ComposeModal() {
  return (
    <div className="rounded-[10px] border border-gray-200 bg-white shadow-card">
      <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
        <div>
          <div className="text-[10.5px] font-medium uppercase tracking-wide text-gray-500">
            Lead L-2026-0042 · Roberta Mendes
          </div>
          <div className="text-[14px] font-medium">Compose Email</div>
        </div>
        <button className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100">
          <IconX size={16} stroke={1.75} />
        </button>
      </header>

      <div className="space-y-3 px-5 py-4">
        <FieldRow label="Template">
          <div className="flex gap-2">
            <button className="flex flex-1 cursor-pointer items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-[13px] hover:border-[#0d6c7d]">
              <span className="flex items-center gap-2">
                <IconFile size={13} stroke={1.75} className="text-gray-500" />
                <span>Opening Outreach — Tax Sale</span>
              </span>
              <IconChevronDown size={12} stroke={2} className="text-gray-400" />
            </button>
            <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-2 text-[12px] text-gray-700 hover:border-[#0d6c7d]">
              Save As Template
            </button>
          </div>
        </FieldRow>

        <FieldRow label="From">
          <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[13px]">
            <IconBrandGmail size={14} stroke={1.75} className="text-[#0d4b3a]" />
            <span className="font-medium">Bree Moss</span>
            <span className="text-gray-500">&lt;bree@mossequitypartners.com&gt;</span>
            <button className="ml-auto inline-flex cursor-pointer items-center gap-1 text-[11px] text-[#0d4b3a] hover:underline">
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
            <div className="ml-1 flex items-center gap-2 text-[11px]">
              <button className="cursor-pointer rounded px-1.5 py-0.5 font-medium text-[#0d4b3a] hover:bg-gray-100">
                Cc
              </button>
              <button className="cursor-pointer rounded px-1.5 py-0.5 font-medium text-[#0d4b3a] hover:bg-gray-100">
                Bcc
              </button>
            </div>
          </div>
        </FieldRow>

        <FieldRow label="Cc">
          <input
            defaultValue="attorney@kerr-law.com"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-[#0d4b3a]"
          />
        </FieldRow>

        <FieldRow label="Bcc">
          <input
            defaultValue="archive@mossequitypartners.com"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-[#0d4b3a]"
          />
        </FieldRow>

        <FieldRow label="Subject">
          <input
            defaultValue="Following up on your tax sale surplus claim, Roberta"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-[#0d4b3a]"
          />
        </FieldRow>

        <div className="relative rounded-md border border-gray-200">
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
              <button className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#0d4b3a] bg-white px-2 py-1 text-[11px] font-medium text-[#0d4b3a]">
                <IconSparkles size={11} stroke={2} />
                Insert Merge Field
                <IconChevronDown size={10} stroke={2} />
              </button>
            </div>
          </div>

          <div className="space-y-3 px-4 py-4 text-[13.5px] leading-[1.65] text-[#0f1729]">
            <p>Hi <span className="rounded bg-[#0d4b3a]/10 px-1 text-[#0d4b3a]">{`{{contact.first_name}}`}</span>,</p>
            <p>
              I&apos;m following up on the surplus funds from your{" "}
              <strong>tax sale at <span className="rounded bg-[#0d4b3a]/10 px-1 text-[#0d4b3a]">{`{{lead.property_address}}`}</span></strong>. Based on our research, we estimate the surplus available to you at{" "}
              <strong><span className="rounded bg-[#0d4b3a]/10 px-1 text-[#0d4b3a]">{`{{lead.estimated_surplus}}`}</span></strong>.
            </p>
            <p>Here&apos;s what happens next if you&apos;d like to move forward:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>We file the claim with <span className="rounded bg-[#0d4b3a]/10 px-1 text-[#0d4b3a]">{`{{lead.county}}`}</span> County on your behalf.</li>
              <li>You receive a portion of the recovered funds (after attorney costs).</li>
              <li>Most claims resolve within 90 to 180 days.</li>
            </ul>
            <p>
              You can review the case details at{" "}
              <a className="text-[#0d4b3a] underline">portal.mossequitypartners.com</a>.
            </p>
            <p className="pt-1">
              Bree Moss<br />
              <span className="text-gray-500">Managing Partner, Moss Equity Partners</span>
            </p>
          </div>

          <div className="absolute right-2 top-9 z-10 w-[260px] rounded-md border border-gray-200 bg-white p-1 shadow-lg">
            <div className="border-b border-gray-150 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
              Recipient
            </div>
            <MergePick token="contact.first_name" sample="Roberta" />
            <MergePick token="contact.full_name" sample="Roberta Mendes" />
            <MergePick token="contact.last_name" sample="Mendes" />
            <div className="mt-1 border-b border-gray-150 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
              Property
            </div>
            <MergePick token="lead.property_address" sample="456 Oak Ave, Dallas, TX 75201" />
            <MergePick token="lead.estimated_surplus" sample="$42,500" />
            <MergePick token="lead.county" sample="Dallas" />
            <div className="mt-1 border-b border-gray-150 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
              Sender
            </div>
            <MergePick token="sender.signer_name" sample="Bree Moss" />
            <MergePick token="system.today_long" sample="June 10, 2026" />
          </div>
        </div>

        <NoteRow>
          <strong>Formatting stays.</strong> Bold, italic, lists, and links all survive the send — Gmail receives multipart HTML and renders the same thing the recipient&apos;s mail client shows. Plain text fallback is auto-generated.
        </NoteRow>
        <NoteRow>
          <strong>Merge fields render at send.</strong> The chips you see above swap to real values before the email leaves your Gmail. Same registry as Mail merge.
        </NoteRow>
      </div>

      <footer className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
        <div className="text-[11px] text-gray-500">
          <IconMailForward size={11} stroke={1.75} className="mr-1 inline" />
          Sends via your Gmail. Replies arrive in your normal inbox and on this lead.
        </div>
        <div className="flex items-center gap-2">
          <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:border-gray-300">
            Cancel
          </button>
          <button className="btn-primary cursor-pointer rounded-md px-4 py-1.5 text-[12px] font-medium text-white">
            Send Email
          </button>
        </div>
      </footer>
    </div>
  );
}

function LeadHeaderBar() {
  return (
    <div className="rounded-[10px] border border-gray-200 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10.5px] font-medium uppercase tracking-wide text-gray-500">
            Lead L-2026-0042
          </div>
          <div className="mt-0.5 text-[16px] font-medium">Roberta Mendes</div>
          <div className="text-[12px] text-gray-500">
            456 Oak Ave, Dallas, TX 75201 · Estimated surplus $42,500
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-gray-700 hover:border-[#0d4b3a]">
            Send Mail
          </button>
          <button className="btn-primary cursor-pointer rounded-md px-3 py-2 text-[12px] font-medium text-white">
            <IconMailForward size={13} stroke={1.75} className="mr-1 inline -translate-y-px" />
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
}

function EmailTemplatesPanel() {
  return (
    <div className="grid grid-cols-[1fr_320px] gap-4">
      <div className="rounded-[10px] border border-gray-200 bg-white p-4 shadow-card">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h3 className="text-[13px] font-medium">Settings → Email Templates</h3>
            <p className="mt-0.5 text-[11.5px] text-gray-500">
              Mirrors Mail Templates. Folders, create, edit, duplicate, delete.
            </p>
          </div>
          <button className="btn-primary cursor-pointer rounded-md px-3 py-1.5 text-[11.5px] font-medium text-white">
            <IconPlus size={11} stroke={2} className="mr-0.5 inline -translate-y-px" />
            New Template
          </button>
        </div>

        <div className="space-y-1.5">
          <FolderHeading name="Outreach" count={3} />
          <TemplateRow name="Opening Outreach — Tax Sale" updated="2 days ago" usedCount={14} />
          <TemplateRow name="Opening Outreach — Mortgage Foreclosure" updated="1 week ago" usedCount={6} />
          <TemplateRow name="Soft Follow-up (Day 3)" updated="2 weeks ago" usedCount={22} />

          <FolderHeading name="Closing" count={2} />
          <TemplateRow name="Send Contract For Signature" updated="3 days ago" usedCount={9} />
          <TemplateRow name="Welcome — Onboarding" updated="last month" usedCount={4} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-[10px] border border-dashed border-amber-300 bg-amber-50/40 p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-amber-700">
            <span className="rounded bg-amber-100 px-1.5 py-0.5">MOCKUP NOTE</span>
            What &ldquo;Save As Template&rdquo; does
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-[#0f1729]">
            From the compose modal you can click <strong>Save As Template</strong> at the top. A small dialog asks for a name and folder, then the current subject + body gets saved with the merge-field tokens intact. Next time you open compose, that template shows up in the Template dropdown.
          </p>
        </div>
        <div className="rounded-[10px] border border-dashed border-amber-300 bg-amber-50/40 p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-amber-700">
            <span className="rounded bg-amber-100 px-1.5 py-0.5">MOCKUP NOTE</span>
            Editing
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-[#0f1729]">
            Pencil opens the same TipTap editor the Mail Templates already use. Bold, lists, headings, link, alignment, plus a Merge Fields picker.
          </p>
        </div>
      </div>
    </div>
  );
}

function FolderHeading({ name, count }: { name: string; count: number }) {
  return (
    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
      <IconFolder size={11} stroke={2} />
      {name}
      <span className="text-gray-400">· {count}</span>
    </div>
  );
}

function TemplateRow({
  name,
  updated,
  usedCount,
}: {
  name: string;
  updated: string;
  usedCount: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-gray-150 bg-white px-3 py-2 hover:border-gray-300">
      <div className="min-w-0">
        <div className="truncate text-[12.5px] font-medium">{name}</div>
        <div className="mt-0.5 text-[10.5px] text-gray-500">
          Updated {updated} · Used {usedCount}x
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button title="Edit" aria-label="Edit" className="cursor-pointer rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-[#0d4b3a]">
          <IconPencil size={13} stroke={1.75} />
        </button>
        <button title="Duplicate" aria-label="Duplicate" className="cursor-pointer rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-[#0d4b3a]">
          <IconCopy size={13} stroke={1.75} />
        </button>
        <button title="Delete" aria-label="Delete" className="cursor-pointer rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600">
          <IconTrash size={13} stroke={1.75} />
        </button>
      </div>
    </div>
  );
}

function ActivityEntry() {
  return (
    <div className="rounded-[10px] border border-gray-200 bg-white p-4 shadow-card">
      <div className="mb-3 text-[11px] font-medium uppercase tracking-wide text-gray-500">
        Activity Tab Excerpt
      </div>
      <div className="space-y-3">
        <ActivityRow
          icon={IconMailForward}
          title="Email Sent"
          body={
            <>
              Bree sent &ldquo;Following up on your tax sale surplus claim&rdquo; to Roberta Mendes, Carlos Mendes. Cc&apos;d Kerr Law.
            </>
          }
          meta="2 min ago · via Gmail · "
          extra={<button className="cursor-pointer text-[11.5px] font-medium text-[#0d4b3a] underline hover:no-underline">View Email</button>}
        />
        <ActivityRow
          icon={IconCircleCheck}
          title="Stage Changed"
          body="Bree moved Roberta Mendes from Qualifying → Outreach."
          meta="3 min ago"
        />
      </div>
    </div>
  );
}

function ReplyEntry() {
  return (
    <div className="rounded-[10px] border border-gray-200 bg-white p-4 shadow-card">
      <div className="mb-3 text-[11px] font-medium uppercase tracking-wide text-gray-500">
        Activity Tab Excerpt — 6 hours later
      </div>
      <ActivityRow
        icon={IconArrowBackUp}
        title="Email Reply Received"
        body={
          <>
            Roberta Mendes replied: <em>&ldquo;Thanks Bree, this is interesting. Can we do a call Thursday at 2pm CT?&rdquo;</em>
          </>
        }
        meta="6 hours ago · "
        extra={
          <button className="cursor-pointer text-[11.5px] font-medium text-[#0d4b3a] underline hover:no-underline">
            View Full Reply
          </button>
        }
      />
    </div>
  );
}

function ActivityRow({
  icon: Icon,
  title,
  body,
  meta,
  extra,
}: {
  icon: React.ComponentType<{ size: number; stroke: number; className?: string }>;
  title: string;
  body: React.ReactNode;
  meta: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white">
        <Icon size={13} stroke={1.75} className="text-gray-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px]">
          <span className="font-medium">{title}</span>
          <span className="mx-1.5 text-gray-300">·</span>
          <span className="text-[#0f1729]">{body}</span>
        </div>
        <div className="mt-0.5 text-[11px] text-gray-500">
          {meta}
          {extra}
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
          ? "bg-[#0d4b3a] text-white"
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

function MergePick({ token, sample }: { token: string; sample: string }) {
  return (
    <button className="flex w-full cursor-pointer items-center justify-between rounded px-2 py-1 text-left text-[11.5px] hover:bg-gray-50">
      <span className="font-mono text-[#0d4b3a]">{`{{${token}}}`}</span>
      <span className="text-gray-500">{sample}</span>
    </button>
  );
}

function NoteRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-900">
      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
        MOCKUP NOTE
      </span>
      <span>{children}</span>
    </div>
  );
}

function BuildNotes() {
  return (
    <div className="rounded-[10px] border border-dashed border-gray-300 bg-white p-5">
      <h3 className="text-[12px] font-medium uppercase tracking-wide text-gray-500">
        Build Notes
      </h3>
      <ul className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-[#0f1729]">
        <li>
          <strong>Cost.</strong> Email is free. Removed the &ldquo;send credit&rdquo; line entirely. No usage cap, no per-piece charge.
        </li>
        <li>
          <strong>Provider.</strong> Operator&apos;s connected Gmail or Outlook via OAuth (Settings → Email Account). Replies land in their normal inbox naturally. No Resend involvement here.
        </li>
        <li>
          <strong>Reply tracking.</strong> Free. A cron polls Gmail / Outlook every hour for threads referencing emails we sent (matching <code className="rounded bg-gray-100 px-1 py-0.5">In-Reply-To</code> header). Any new reply gets surfaced as an Activity row. Standard approach.
        </li>
        <li>
          <strong>CC and BCC.</strong> Added. Every major CRM has them — HubSpot, Salesforce, Pipedrive, Apollo, Close, Outreach, Salesloft. Standard expectation. Collapsed by default; Cc / Bcc text links expand.
        </li>
        <li>
          <strong>Templates.</strong> Full Settings → Email Templates section. Folders, create / edit / duplicate / delete. Plus inline &ldquo;Save As Template&rdquo; from the compose modal so you don&apos;t have to leave the lead. Editor is the same TipTap powering Mail Templates.
        </li>
        <li>
          <strong>Merge fields.</strong> Same registry as mail (<code className="rounded bg-gray-100 px-1 py-0.5">{`{{contact.first_name}}`}</code>, <code className="rounded bg-gray-100 px-1 py-0.5">{`{{lead.property_address}}`}</code>, etc.). The compose preview shows them as chips so you can spot bad merges before sending.
        </li>
        <li>
          <strong>Formatting.</strong> Bold, italic, lists, links — all survive the send. Sent as HTML with plain-text auto-fallback (multipart). Recipient gets formatted email regardless of their mail client.
        </li>
        <li>
          <strong>Persistence.</strong> No new <code className="rounded bg-gray-100 px-1 py-0.5">email_jobs</code> table for the actual sends. One row in <code className="rounded bg-gray-100 px-1 py-0.5">activities</code> per send (type <code className="rounded bg-gray-100 px-1 py-0.5">email_sent</code>), one row per reply (type <code className="rounded bg-gray-100 px-1 py-0.5">email_reply</code>). Templates live in their own <code className="rounded bg-gray-100 px-1 py-0.5">email_templates</code> table (mirror of <code className="rounded bg-gray-100 px-1 py-0.5">mail_templates</code>).
        </li>
        <li>
          <strong>Button color.</strong> Uses <code className="rounded bg-gray-100 px-1 py-0.5">.btn-primary</code> (solid <code className="rounded bg-gray-100 px-1 py-0.5">#0d4b3a</code>) — the same dark green as Send Mail and every other primary action in the portal. Fixed from the prior gradient mistake.
        </li>
      </ul>
    </div>
  );
}
