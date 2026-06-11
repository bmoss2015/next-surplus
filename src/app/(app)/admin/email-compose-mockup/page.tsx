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
  IconCircleCheck,
  IconFolder,
  IconEye,
  IconSignature,
  IconDots,
} from "@tabler/icons-react";

export default async function EmailComposeMockupPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  return (
    <div className="min-h-screen bg-[#f7f8fa] py-12 text-[#0f1729]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="mx-auto max-w-[1080px] space-y-14 px-8">
        <header>
          <h1 className="text-[22px] font-medium tracking-tight">Email Compose · Mockup</h1>
          <p className="mt-1.5 text-[13px] text-gray-500">
            Designed to feel like the rest of the portal. Five real surfaces top to bottom. Yellow notes are mockup explanation, not UI.
          </p>
        </header>

        <Section
          number="1"
          title="Compose Email"
          context="On the lead page, opens from Send Email."
        >
          <ComposeModal />
        </Section>

        <Section
          number="2"
          title="Send Email button on the lead"
          context="Sits next to Send Mail on the lead header."
        >
          <LeadHeaderBar />
        </Section>

        <Section
          number="3"
          title="Settings — Email Account"
          context="Sender connection + signature live here. Set once."
        >
          <EmailAccountSettings />
        </Section>

        <Section
          number="4"
          title="Settings — Email Templates"
          context="Folders, create, edit. Same shape as Mail Templates."
        >
          <EmailTemplatesPanel />
        </Section>

        <Section
          number="5"
          title="Activity on the lead"
          context="Sent, opened, opened again. Replies stay in your Gmail inbox."
        >
          <ActivityFeed />
        </Section>

        <BuildNotes />
      </div>
    </div>
  );
}

function Section({
  number,
  title,
  context,
  children,
}: {
  number: string;
  title: string;
  context: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-baseline gap-3">
        <span className="text-[11px] font-mono text-gray-400">{number.padStart(2, "0")}</span>
        <h2 className="text-[15px] font-medium tracking-tight">{title}</h2>
        <span className="text-[12px] text-gray-500">— {context}</span>
      </div>
      {children}
    </section>
  );
}

function ComposeModal() {
  return (
    <div className="overflow-hidden rounded-[12px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04),0_8px_24px_-8px_rgba(15,23,41,0.10)]">
      <header className="flex items-center justify-between border-b border-gray-150 px-6 py-3.5">
        <div className="min-w-0">
          <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-gray-400">
            L-2026-0042 · Roberta Mendes
          </div>
          <div className="mt-0.5 text-[14px] font-medium">Compose Email</div>
        </div>
        <button className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
          <IconX size={16} stroke={1.75} />
        </button>
      </header>

      <div className="divide-y divide-gray-100">
        <Row label="From">
          <div className="flex items-center gap-2 text-[13px]">
            <IconBrandGmail size={13} stroke={1.75} className="text-gray-500" />
            <span className="font-medium">Bree Moss</span>
            <span className="text-gray-500">bree@mossequitypartners.com</span>
          </div>
        </Row>

        <Row label="To" right={<ToBccLinks />}>
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip name="Roberta Mendes" role="Owner" />
            <Chip name="Carlos Mendes" role="Spouse" />
            <input
              className="flex-1 min-w-[140px] border-0 bg-transparent text-[13px] outline-none"
              placeholder="Add another contact..."
            />
          </div>
        </Row>

        <Row label="Cc">
          <input
            defaultValue="attorney@kerr-law.com"
            className="w-full border-0 bg-transparent text-[13px] outline-none placeholder:text-gray-400"
          />
        </Row>

        <Row label="Bcc">
          <input
            defaultValue="archive@mossequitypartners.com"
            className="w-full border-0 bg-transparent text-[13px] outline-none placeholder:text-gray-400"
          />
        </Row>

        <Row label="Template">
          <div className="flex items-center justify-between">
            <button className="flex flex-1 cursor-pointer items-center justify-between text-[13px] text-[#0f1729]">
              <span>Opening Outreach — Tax Sale</span>
              <IconChevronDown size={12} stroke={2} className="text-gray-400" />
            </button>
            <button className="ml-3 cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Template actions">
              <IconDots size={14} stroke={1.75} />
            </button>
          </div>
        </Row>

        <Row label="Subject">
          <input
            defaultValue="Following up on your tax sale surplus claim, Roberta"
            className="w-full border-0 bg-transparent text-[13.5px] font-medium outline-none"
          />
        </Row>
      </div>

      <div className="relative">
        <div className="flex items-center gap-1 border-b border-gray-100 px-4 py-2">
          <Tool icon={IconBold} active />
          <Tool icon={IconItalic} />
          <Tool icon={IconUnderline} />
          <Sep />
          <Tool icon={IconList} />
          <Tool icon={IconListNumbers} />
          <Sep />
          <Tool icon={IconLink} />
          <Sep />
          <Tool icon={IconAlignLeft} />
          <Tool icon={IconAlignCenter} />
          <Tool icon={IconAlignRight} />
          <div className="ml-auto">
            <button className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100">
              <IconSparkles size={11} stroke={1.75} />
              Merge field
              <IconChevronDown size={10} stroke={2} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="space-y-3 px-6 py-5 text-[13.5px] leading-[1.7] text-[#0f1729]">
          <p>
            Hi <MergeInline>contact.first_name</MergeInline>,
          </p>
          <p>
            I&apos;m following up on the surplus funds from your <strong>tax sale at <MergeInline>lead.property_address</MergeInline></strong>. Based on our research, we estimate the surplus available to you at <strong><MergeInline>lead.estimated_surplus</MergeInline></strong>.
          </p>
          <p>Here&apos;s what happens next if you&apos;d like to move forward:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>We file the claim with <MergeInline>lead.county</MergeInline> County on your behalf.</li>
            <li>You receive a portion of the recovered funds after attorney costs.</li>
            <li>Most claims resolve within 90 to 180 days.</li>
          </ul>
          <p>
            You can review the case details at{" "}
            <a className="text-[#0d4b3a] underline underline-offset-2">portal.mossequitypartners.com</a>.
          </p>
        </div>

        <div className="border-t border-dashed border-gray-200 bg-gray-50/60 px-6 py-4">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400">
            <IconSignature size={10} stroke={1.75} />
            Signature
            <span className="ml-1 text-gray-400/80 normal-case tracking-normal">— auto appended, edit in Settings</span>
          </div>
          <div className="text-[12.5px] leading-[1.55] text-[#0f1729]">
            Bree Moss
            <br />
            <span className="text-gray-500">Managing Partner · Moss Equity Partners</span>
            <br />
            <span className="text-gray-500">713-555-0184 · mossequitypartners.com</span>
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-between border-t border-gray-150 px-6 py-3">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <IconMailForward size={11} stroke={1.75} />
          Sends via your Gmail. Opens tracked on the lead.
        </div>
        <div className="flex items-center gap-2">
          <button className="cursor-pointer text-[12px] font-medium text-gray-500 hover:text-gray-700">
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

function ToBccLinks() {
  return (
    <div className="flex items-center gap-3 text-[11px] text-gray-400">
      <button className="cursor-pointer text-gray-500 hover:text-[#0d4b3a]">Cc</button>
      <button className="cursor-pointer text-gray-500 hover:text-[#0d4b3a]">Bcc</button>
    </div>
  );
}

function Row({
  label,
  right,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[80px_1fr_auto] items-center gap-4 px-6 py-2.5">
      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
        {label}
      </label>
      <div className="min-w-0">{children}</div>
      <div>{right}</div>
    </div>
  );
}

function Chip({ name, role }: { name: string; role: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-0.5 pl-2 pr-1 text-[12px]">
      <span className="font-medium text-[#0f1729]">{name}</span>
      <span className="text-gray-400">·</span>
      <span className="text-[11px] text-gray-500">{role}</span>
      <button className="cursor-pointer rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700">
        <IconX size={10} stroke={2} />
      </button>
    </span>
  );
}

function Tool({
  icon: Icon,
  active,
}: {
  icon: React.ComponentType<{ size: number; stroke: number }>;
  active?: boolean;
}) {
  return (
    <button
      className={
        "cursor-pointer rounded-md p-1.5 transition-colors " +
        (active
          ? "bg-gray-100 text-[#0f1729]"
          : "text-gray-500 hover:bg-gray-100 hover:text-[#0f1729]")
      }
    >
      <Icon size={13} stroke={1.75} />
    </button>
  );
}

function Sep() {
  return <span className="mx-0.5 h-4 w-px bg-gray-200" />;
}

function MergeInline({ children }: { children: string }) {
  return (
    <span className="rounded-sm bg-amber-50 px-1 text-[#92400e]">{`{{${children}}}`}</span>
  );
}

function LeadHeaderBar() {
  return (
    <div className="rounded-[12px] border border-gray-200 bg-white px-6 py-5 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-gray-400">
            L-2026-0042
          </div>
          <div className="mt-1 text-[18px] font-medium tracking-tight">Roberta Mendes</div>
          <div className="mt-0.5 text-[12.5px] text-gray-500">
            456 Oak Ave, Dallas, TX 75201 · Estimated surplus $42,500
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-3.5 py-2 text-[12px] font-medium text-[#0f1729] hover:border-gray-300">
            Send Mail
          </button>
          <button className="btn-primary cursor-pointer rounded-md px-3.5 py-2 text-[12px] font-medium text-white">
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
}

function EmailAccountSettings() {
  return (
    <div className="overflow-hidden rounded-[12px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
      <div className="border-b border-gray-150 px-6 py-4">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
          Email Account
        </div>
        <h3 className="mt-0.5 text-[15px] font-medium">Sending account &amp; signature</h3>
        <p className="mt-1 text-[12px] text-gray-500">
          Your emails to leads send from this account. Signature appends to every outbound email automatically.
        </p>
      </div>

      <div className="grid grid-cols-2 divide-x divide-gray-100">
        <div className="space-y-4 px-6 py-5">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
              Connected Account
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-[13px]">
              <IconBrandGmail size={14} stroke={1.75} className="text-gray-500" />
              <span className="font-medium">bree@mossequitypartners.com</span>
              <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-green-700">
                <IconCircleCheck size={11} stroke={2} />
                Connected
              </span>
            </div>
            <button className="mt-2 cursor-pointer text-[11.5px] text-gray-500 hover:text-gray-700">
              Disconnect Gmail
            </button>
          </div>

          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
              Open Tracking
            </div>
            <div className="mt-2 flex items-center gap-3 text-[12.5px]">
              <span className="inline-flex h-4 w-7 items-center rounded-full bg-[#0d4b3a] p-0.5">
                <span className="ml-auto h-3 w-3 rounded-full bg-white" />
              </span>
              <span>On for every send</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 px-6 py-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
            Signature
          </div>
          <div className="rounded-md border border-gray-200 bg-white">
            <div className="flex items-center gap-1 border-b border-gray-100 px-2 py-1.5">
              <Tool icon={IconBold} active />
              <Tool icon={IconItalic} />
              <Tool icon={IconLink} />
            </div>
            <div className="px-3 py-3 text-[12.5px] leading-[1.55] text-[#0f1729]">
              <strong>Bree Moss</strong>
              <br />
              <span className="text-gray-500">Managing Partner · Moss Equity Partners</span>
              <br />
              <span className="text-gray-500">713-555-0184 · mossequitypartners.com</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-500">
            Auto-appended to every outbound email. Can be edited inline per-email if needed.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmailTemplatesPanel() {
  return (
    <div className="overflow-hidden rounded-[12px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
      <div className="flex items-end justify-between border-b border-gray-150 px-6 py-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
            Email Templates
          </div>
          <h3 className="mt-0.5 text-[15px] font-medium">5 templates · 2 folders</h3>
        </div>
        <button className="btn-primary cursor-pointer rounded-md px-3 py-1.5 text-[11.5px] font-medium text-white">
          <IconPlus size={11} stroke={2} className="mr-1 inline -translate-y-px" />
          New Template
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        <FolderHeading name="Outreach" count={3} />
        <TemplateRow name="Opening Outreach — Tax Sale" updated="2 days ago" used={14} />
        <TemplateRow name="Opening Outreach — Mortgage Foreclosure" updated="1 week ago" used={6} />
        <TemplateRow name="Soft Follow-up (Day 3)" updated="2 weeks ago" used={22} />

        <FolderHeading name="Closing" count={2} />
        <TemplateRow name="Send Contract For Signature" updated="3 days ago" used={9} />
        <TemplateRow name="Welcome — Onboarding" updated="last month" used={4} />
      </div>
    </div>
  );
}

function FolderHeading({ name, count }: { name: string; count: number }) {
  return (
    <div className="flex items-center gap-2 bg-gray-50/60 px-6 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
      <IconFolder size={11} stroke={2} />
      {name}
      <span className="text-gray-400">· {count}</span>
    </div>
  );
}

function TemplateRow({
  name,
  updated,
  used,
}: {
  name: string;
  updated: string;
  used: number;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-3 hover:bg-gray-50/40">
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium">{name}</div>
        <div className="mt-0.5 text-[11px] text-gray-500">
          Updated {updated} · Used {used} times
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button title="Edit" aria-label="Edit" className="cursor-pointer rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#0d4b3a]">
          <IconPencil size={13} stroke={1.75} />
        </button>
        <button title="Duplicate" aria-label="Duplicate" className="cursor-pointer rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#0d4b3a]">
          <IconCopy size={13} stroke={1.75} />
        </button>
        <button title="Delete" aria-label="Delete" className="cursor-pointer rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600">
          <IconTrash size={13} stroke={1.75} />
        </button>
      </div>
    </div>
  );
}

function ActivityFeed() {
  return (
    <div className="overflow-hidden rounded-[12px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
      <div className="border-b border-gray-150 px-6 py-3">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
          Activity
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        <ActivityRow
          icon={IconMailForward}
          title="Email Sent"
          body={
            <>
              Bree sent &ldquo;Following up on your tax sale surplus claim&rdquo; to Roberta and Carlos Mendes.
            </>
          }
          meta="Just now · via Gmail"
          link="View email"
        />
        <ActivityRow
          icon={IconEye}
          title="Email Opened"
          body={<>Roberta Mendes opened the email.</>}
          meta="18 min ago · Houston, TX · iPhone"
          unconfirmed
        />
        <ActivityRow
          icon={IconEye}
          title="Email Opened"
          body={<>Roberta Mendes opened it again.</>}
          meta="2 hours ago · Houston, TX · MacBook"
          unconfirmed
        />
        <ActivityRow
          icon={IconEye}
          title="Email Opened"
          body={<>Carlos Mendes opened the email.</>}
          meta="3 hours ago · Houston, TX · Windows"
        />
      </div>
      <NoteRow>
        <strong>Grey dot = pre-fetched.</strong> Apple Mail (since iOS 15.2) loads tracking pixels server-side before the recipient sees the message. We mark those with a small grey dot — the open is real but the timing isn&apos;t reliable. Every CRM has this caveat; most just hide it. We show it subtly so you trust the data.
      </NoteRow>
    </div>
  );
}

function ActivityRow({
  icon: Icon,
  title,
  body,
  meta,
  link,
  unconfirmed,
}: {
  icon: React.ComponentType<{ size: number; stroke: number; className?: string }>;
  title: string;
  body: React.ReactNode;
  meta: string;
  link?: string;
  unconfirmed?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 px-6 py-3.5">
      <div className="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white">
        <Icon size={13} stroke={1.75} className="text-gray-600" />
        {unconfirmed && (
          <span
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-white bg-gray-300"
            title="Apple Mail pre-fetch — open is real but the timing is not reliable."
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px]">
          <span className="font-medium">{title}</span>
          <span className="mx-2 text-gray-300">·</span>
          <span className="text-[#0f1729]">{body}</span>
        </div>
        <div className="mt-0.5 text-[11px] text-gray-500">
          {meta}
          {link && (
            <>
              {" · "}
              <button className="cursor-pointer text-[#0d4b3a] hover:underline">{link}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NoteRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 border-t border-dashed border-amber-200 bg-amber-50/40 px-6 py-3 text-[11.5px] leading-relaxed text-amber-900">
      <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
        MOCKUP NOTE
      </span>
      <span>{children}</span>
    </div>
  );
}

function BuildNotes() {
  return (
    <div className="rounded-[12px] border border-dashed border-gray-300 bg-white px-6 py-5">
      <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
        Build Notes
      </h3>
      <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
        <NoteItem term="Cc and Bcc">
          Collapsed by default. To row shows tiny Cc / Bcc links on the right. Click expands the field, only used fields render. Same as Gmail, Outlook, HubSpot.
        </NoteItem>
        <NoteItem term="Merge fields in body">
          Rendered inline as subtle amber tags ({`{{contact.first_name}}`}). Sit on the same line height as text — no row-busting chips. Same registry as Mail merge (lead.property_address, lead.estimated_surplus, etc.) so what works in mail works in email.
        </NoteItem>
        <NoteItem term="Signature">
          Set once in Settings → Email Account. Auto-appended to every outbound. Sits in a faint dashed-bordered area in compose so you see it before sending. Editable per-email if needed. Same pattern as HubSpot, Salesforce, Pipedrive.
        </NoteItem>
        <NoteItem term="Save as Template">
          Demoted from a primary button to the overflow menu (⋯) on the template field. Same weight as Gmail&apos;s &ldquo;Save as new template&rdquo; under the three-dot menu.
        </NoteItem>
        <NoteItem term="Open tracking">
          1x1 pixel embedded in HTML pings /api/email/open/[token]. Free, runs on our infra. Apple Mail pre-fetches images (iOS 15.2+) — those rows show a small grey dot. The open is real, the timing isn&apos;t. Confirmed opens (non-Apple clients) have no dot.
        </NoteItem>
        <NoteItem term="Replies">
          Stay in your normal Gmail inbox. Not surfaced on the lead in v0. If you want them on the lead later, that&apos;s a separate hourly poll add.
        </NoteItem>
        <NoteItem term="Persistence">
          No new email_jobs table. activities rows: email_sent, email_opened. Templates live in their own email_templates table (mirror of mail_templates with folders).
        </NoteItem>
        <NoteItem term="Button color">
          Solid .btn-primary (#0d4b3a) — same as Send Mail and every primary action in the portal. Fixed from the v1 gradient.
        </NoteItem>
      </dl>
    </div>
  );
}

function NoteItem({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12.5px] font-medium text-[#0f1729]">{term}</dt>
      <dd className="mt-1 text-[12.5px] leading-relaxed text-gray-600">{children}</dd>
    </div>
  );
}
