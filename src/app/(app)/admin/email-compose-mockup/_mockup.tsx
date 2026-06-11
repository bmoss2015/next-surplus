"use client";

import { useState } from "react";
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
  IconChevronRight,
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
  IconPhoto,
  IconLetterT,
  IconPalette,
} from "@tabler/icons-react";

type MergeToken = {
  token: string;
  sample: string;
  group: "Recipient" | "Property" | "Sender";
};

const MERGE_TOKENS: MergeToken[] = [
  { token: "contact.first_name", sample: "Roberta", group: "Recipient" },
  { token: "contact.full_name", sample: "Roberta Mendes", group: "Recipient" },
  { token: "contact.last_name", sample: "Mendes", group: "Recipient" },
  { token: "lead.property_address", sample: "456 Oak Ave, Dallas, TX 75201", group: "Property" },
  { token: "lead.estimated_surplus", sample: "$42,500", group: "Property" },
  { token: "lead.county", sample: "Dallas", group: "Property" },
  { token: "sender.signer_name", sample: "Bree Moss", group: "Sender" },
  { token: "system.today_long", sample: "June 10, 2026" as string, group: "Sender" },
];

export function EmailMockup() {
  return (
    <div className="min-h-screen bg-[#f7f8fa] py-12 text-[#0f1729]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="mx-auto max-w-[1080px] space-y-14 px-8">
        <header>
          <h1 className="text-[22px] font-medium tracking-tight">Email Compose · Mockup</h1>
          <p className="mt-1.5 text-[13px] text-gray-500">
            Five surfaces, top to bottom. Try clicking — the modal is interactive. Yellow boxes are mockup explanation, not UI.
          </p>
        </header>

        <Section number="1" title="Compose Email" context="Click Cc, Bcc, the merge button, the template menu — they work.">
          <ComposeModal />
        </Section>

        <Section number="2" title="Send Email on the lead" context="Sits next to Send Mail.">
          <LeadHeaderBar />
        </Section>

        <Section number="3" title="Settings — Email Account" context="Sender connection + signature live here.">
          <EmailAccountSettings />
        </Section>

        <Section number="4" title="Settings — Email Templates" context="Folders, create, edit. Same shape as Mail Templates.">
          <EmailTemplatesPanel />
        </Section>

        <Section number="5" title="Activity on the lead" context="Sent + opens land here. Replies go to your Gmail inbox.">
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
        <span className="font-mono text-[11px] text-gray-400">{number.padStart(2, "0")}</span>
        <h2 className="text-[15px] font-medium tracking-tight">{title}</h2>
        <span className="text-[12px] text-gray-500">— {context}</span>
      </div>
      {children}
    </section>
  );
}

function ComposeModal() {
  const [ccOpen, setCcOpen] = useState(false);
  const [bccOpen, setBccOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [templateMenu, setTemplateMenu] = useState(false);
  const [body, setBody] = useState<React.ReactNode>(defaultBody());

  function insertMerge(token: string) {
    setBody(
      <>
        {defaultBody()}{" "}
        <MergeInline>{token}</MergeInline>
      </>
    );
    setMergeOpen(false);
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04),0_8px_24px_-8px_rgba(15,23,41,0.10)]">
      <header className="flex items-center justify-between border-b border-gray-150 px-6 py-3.5">
        <div className="min-w-0">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-gray-400">
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

        <Row
          label="To"
          right={
            <div className="flex items-center gap-3 text-[11px]">
              {!ccOpen && (
                <button onClick={() => setCcOpen(true)} className="cursor-pointer text-gray-500 hover:text-[#0d4b3a]">
                  Cc
                </button>
              )}
              {!bccOpen && (
                <button onClick={() => setBccOpen(true)} className="cursor-pointer text-gray-500 hover:text-[#0d4b3a]">
                  Bcc
                </button>
              )}
            </div>
          }
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip name="Roberta Mendes" role="Owner" />
            <Chip name="Carlos Mendes" role="Spouse" />
            <input
              className="flex-1 min-w-[160px] border-0 bg-transparent text-[13px] outline-none"
              placeholder="Add another contact from this lead..."
            />
          </div>
        </Row>

        {ccOpen && (
          <Row label="Cc" right={<RemoveBtn onClick={() => setCcOpen(false)} />}>
            <input
              defaultValue="attorney@kerr-law.com"
              autoFocus
              className="w-full border-0 bg-transparent text-[13px] outline-none placeholder:text-gray-400"
            />
          </Row>
        )}

        {bccOpen && (
          <Row label="Bcc" right={<RemoveBtn onClick={() => setBccOpen(false)} />}>
            <input
              defaultValue="archive@mossequitypartners.com"
              autoFocus
              className="w-full border-0 bg-transparent text-[13px] outline-none placeholder:text-gray-400"
            />
          </Row>
        )}

        <Row
          label="Template"
          right={
            <div className="relative">
              <button
                onClick={() => setTemplateMenu((v) => !v)}
                className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                title="Template actions"
              >
                <IconDots size={14} stroke={1.75} />
              </button>
              {templateMenu && (
                <div
                  onMouseLeave={() => setTemplateMenu(false)}
                  className="absolute right-0 top-full z-20 mt-1 w-[200px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
                >
                  <MenuItem label="Save current as new template" />
                  <MenuItem label="Update this template" />
                  <MenuItem label="Browse all templates" />
                  <MenuItem label="Clear template" danger />
                </div>
              )}
            </div>
          }
        >
          <button className="flex flex-1 cursor-pointer items-center justify-between text-[13px] text-[#0f1729]">
            <span>Opening Outreach — Tax Sale</span>
            <IconChevronDown size={12} stroke={2} className="text-gray-400" />
          </button>
        </Row>

        <Row label="Subject">
          <input
            defaultValue="Following up on your tax sale surplus claim, Roberta"
            className="w-full border-0 bg-transparent text-[15px] font-semibold tracking-tight outline-none"
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
            <button
              onClick={() => setMergeOpen((v) => !v)}
              className={
                "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium " +
                (mergeOpen ? "bg-gray-100 text-[#0f1729]" : "text-gray-600 hover:bg-gray-100")
              }
            >
              <IconSparkles size={11} stroke={1.75} />
              Merge field
              <IconChevronDown size={10} stroke={2} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="space-y-3 px-6 py-5 text-[13.5px] leading-[1.7] text-[#0f1729]">
          {body}
        </div>

        {mergeOpen && (
          <div
            onMouseLeave={() => setMergeOpen(false)}
            className="absolute right-4 top-12 z-10 w-[280px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
          >
            {(["Recipient", "Property", "Sender"] as const).map((group) => (
              <div key={group}>
                <div className="border-b border-gray-100 bg-gray-50/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-gray-500">
                  {group}
                </div>
                {MERGE_TOKENS.filter((t) => t.group === group).map((t) => (
                  <button
                    key={t.token}
                    onClick={() => insertMerge(t.token)}
                    className="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-[12px] hover:bg-gray-50"
                  >
                    <span className="font-mono text-[#0d4b3a]">{`{{${t.token}}}`}</span>
                    <span className="ml-2 truncate text-gray-500">{t.sample}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-dashed border-gray-200 bg-gray-50/50 px-6 py-4">
          <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-gray-400">
            <IconSignature size={10} stroke={1.75} />
            Signature
            <span className="ml-1 normal-case tracking-normal text-gray-400/80">
              — auto appended, edit in Settings
            </span>
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

function defaultBody() {
  return (
    <>
      <p>
        Hi <MergeInline>contact.first_name</MergeInline>,
      </p>
      <p>
        I&apos;m following up on the surplus funds from your{" "}
        <strong>
          tax sale at <MergeInline>lead.property_address</MergeInline>
        </strong>
        . Based on our research, we estimate the surplus available to you at{" "}
        <strong>
          <MergeInline>lead.estimated_surplus</MergeInline>
        </strong>
        .
      </p>
      <p>Here&apos;s what happens next if you&apos;d like to move forward:</p>
      <ul className="ml-5 list-disc space-y-1">
        <li>
          We file the claim with <MergeInline>lead.county</MergeInline> County on your behalf.
        </li>
        <li>You receive a portion of the recovered funds after attorney costs.</li>
        <li>Most claims resolve within 90 to 180 days.</li>
      </ul>
      <p>
        You can review the case details at{" "}
        <a className="text-[#0d4b3a] underline underline-offset-2">portal.mossequitypartners.com</a>.
      </p>
    </>
  );
}

function MergeInline({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-sm bg-[#0d4b3a]/10 px-1 text-[#0d4b3a]">{`{{${children}}}`}</span>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="cursor-pointer text-[11px] text-gray-400 hover:text-red-600">
      Remove
    </button>
  );
}

function MenuItem({ label, danger }: { label: string; danger?: boolean }) {
  return (
    <button
      className={
        "block w-full cursor-pointer px-3 py-2 text-left text-[12px] " +
        (danger ? "text-red-600 hover:bg-red-50" : "text-[#0f1729] hover:bg-gray-50")
      }
    >
      {label}
    </button>
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
      <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-gray-400">
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
        (active ? "bg-gray-100 text-[#0f1729]" : "text-gray-500 hover:bg-gray-100 hover:text-[#0f1729]")
      }
    >
      <Icon size={13} stroke={1.75} />
    </button>
  );
}

function Sep() {
  return <span className="mx-0.5 h-4 w-px bg-gray-200" />;
}

function LeadHeaderBar() {
  return (
    <div className="rounded-[12px] border border-gray-200 bg-white px-6 py-5 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-gray-400">
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
        <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-gray-400">
          Email Account
        </div>
        <h3 className="mt-0.5 text-[15px] font-medium">Sending account &amp; signature</h3>
        <p className="mt-1 text-[12px] text-gray-500">
          Your emails to leads send from this account. Signature appends to every outbound email automatically.
        </p>
      </div>

      <div className="grid grid-cols-2 divide-x divide-gray-100">
        <div className="space-y-5 px-6 py-5">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-gray-400">
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
            <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-gray-400">
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
          <div className="flex items-center justify-between">
            <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-gray-400">
              Signature
            </div>
            <button className="cursor-pointer text-[11px] text-gray-500 hover:text-[#0d4b3a]">
              Source view
            </button>
          </div>
          <div className="rounded-md border border-gray-200 bg-white">
            <div className="flex items-center gap-0.5 border-b border-gray-100 px-2 py-1.5">
              <Tool icon={IconBold} active />
              <Tool icon={IconItalic} />
              <Tool icon={IconUnderline} />
              <Sep />
              <Tool icon={IconLetterT} />
              <Tool icon={IconPalette} />
              <Sep />
              <Tool icon={IconLink} />
              <Tool icon={IconPhoto} />
              <Sep />
              <Tool icon={IconList} />
              <Tool icon={IconAlignLeft} />
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
            Auto-appended to every outbound email. Same toolbar as Gmail / HubSpot signature editors.
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
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-gray-400">
            Email Templates
          </div>
          <h3 className="mt-0.5 text-[15px] font-medium">5 templates · 2 folders</h3>
        </div>
        <button className="btn-primary cursor-pointer rounded-md px-3 py-1.5 text-[11.5px] font-medium text-white">
          <IconPlus size={11} stroke={2} className="mr-1 inline -translate-y-px" />
          New Template
        </button>
      </div>

      <FolderGroup name="Outreach" count={3}>
        <TemplateRow name="Opening Outreach — Tax Sale" updated="2 days ago" used={14} />
        <TemplateRow name="Opening Outreach — Mortgage Foreclosure" updated="1 week ago" used={6} />
        <TemplateRow name="Soft Follow-up (Day 3)" updated="2 weeks ago" used={22} />
      </FolderGroup>

      <FolderGroup name="Closing" count={2}>
        <TemplateRow name="Send Contract For Signature" updated="3 days ago" used={9} />
        <TemplateRow name="Welcome — Onboarding" updated="last month" used={4} />
      </FolderGroup>
    </div>
  );
}

function FolderGroup({
  name,
  count,
  children,
}: {
  name: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 border-b border-gray-150 bg-gray-100/70 px-6 py-2.5">
        <IconChevronDown size={11} stroke={2.5} className="text-gray-500" />
        <IconFolder size={13} stroke={1.75} className="text-gray-500" />
        <span className="text-[12.5px] font-semibold text-[#0f1729]">{name}</span>
        <span className="text-[11px] text-gray-500">· {count}</span>
      </div>
      <div className="divide-y divide-gray-100 pl-3">{children}</div>
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
        <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-gray-400">
          Activity
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        <ActivityRow
          icon={IconMailForward}
          title="Email Sent"
          body={<>Bree sent &ldquo;Following up on your tax sale surplus claim&rdquo; to Roberta and Carlos Mendes.</>}
          meta="Just now · via Gmail"
          link="View email"
        />
        <ActivityRow
          icon={IconEye}
          title="Email Opened"
          body={<>Roberta Mendes opened the email.</>}
          meta="18 min ago · Houston, TX"
        />
        <ActivityRow
          icon={IconEye}
          title="Email Opened"
          body={<>Roberta Mendes opened it again.</>}
          meta="2 hours ago · Houston, TX"
        />
        <ActivityRow
          icon={IconEye}
          title="Email Opened"
          body={<>Carlos Mendes opened the email.</>}
          meta="3 hours ago · Houston, TX"
        />
      </div>
    </div>
  );
}

function ActivityRow({
  icon: Icon,
  title,
  body,
  meta,
  link,
}: {
  icon: React.ComponentType<{ size: number; stroke: number; className?: string }>;
  title: string;
  body: React.ReactNode;
  meta: string;
  link?: string;
}) {
  return (
    <div className="flex items-start gap-3 px-6 py-3.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white">
        <Icon size={13} stroke={1.75} className="text-gray-600" />
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

function BuildNotes() {
  return (
    <div className="rounded-[12px] border border-dashed border-gray-300 bg-white px-6 py-5">
      <h3 className="font-mono text-[11px] uppercase tracking-[0.08em] text-gray-400">
        Build Notes — Why It Looks This Way
      </h3>
      <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
        <NoteItem term="Cc and Bcc">
          Collapsed by default. Tiny Cc / Bcc text links sit on the right of the To row. Click expands the field with autofocus, click Remove to collapse. Same pattern as Gmail, Outlook, HubSpot, Apollo.
        </NoteItem>
        <NoteItem term="Merge field color">
          Inline tags use #0d4b3a at 10% opacity — same brand color as every other accent in the portal. (Earlier amber was a one-off mistake.)
        </NoteItem>
        <NoteItem term="Merge field picker">
          Opens above the body. Grouped (Recipient / Property / Sender). Click a row, the token inserts at the end of the body. Same registry as Mail Merge — what works in Mail works here.
        </NoteItem>
        <NoteItem term="To field — adding contacts">
          Pre-populated from the lead&apos;s email contacts on open (contacts table where channel=email). The autocomplete searches the lead&apos;s contacts first, then any contact across the org. You can&apos;t send to someone who&apos;s not on the lead unless you add them as a contact first.
        </NoteItem>
        <NoteItem term="Signature toolbar">
          Richer than the compose body toolbar: bold / italic / underline / font size / color / link / image / list / align. Anchor: Gmail, HubSpot, Salesforce, Outlook, Pipedrive, Apollo all give signatures a richer editor than the compose body — because signatures often have logos, multiple links, structured layout.
        </NoteItem>
        <NoteItem term="HTML signatures">
          WYSIWYG primary. A &ldquo;Source view&rdquo; link on the Settings signature card lets a power user paste raw HTML. Industry pattern (HubSpot, Salesforce, Gmail all do this) — most users never touch source mode.
        </NoteItem>
        <NoteItem term="Save as Template">
          Demoted to the ⋯ overflow menu on the Template row. Same weight as Gmail&apos;s &ldquo;Save as new template&rdquo; under the three-dot menu.
        </NoteItem>
        <NoteItem term="Open tracking — no Apple flag">
          Every &ldquo;Email Opened&rdquo; row means our pixel fired. For real recipients that&apos;s an open. For Apple Mail pre-fetch (iOS 15.2+) it means Apple&apos;s server scanned the message. Industry default (HubSpot, Salesforce, Apollo, Outreach default view) is to not distinguish — adding a caveat dot makes the data look weaker than it is. Removed.
        </NoteItem>
        <NoteItem term="Subject prominence">
          Bumped to 15px font-semibold. Anchor: HubSpot uses a slightly bigger / bolder subject than body; Gmail keeps both same size. We&apos;re on the slightly-bigger side because the subject row sits inside the field stack and needs to read as &ldquo;the email starts here.&rdquo;
        </NoteItem>
        <NoteItem term="Folders in Templates">
          Folder bar is darker (gray-100) with a folder icon and chevron, separated by a real border line. Templates underneath are indented. Visual hierarchy now matches how Mail Templates renders in your existing Settings.
        </NoteItem>
        <NoteItem term="Replies">
          Stay in your normal Gmail inbox. Not surfaced on the lead in v0. If you want them surfaced later, that&apos;s a separate hourly poll add.
        </NoteItem>
        <NoteItem term="Persistence">
          No new email_jobs table. activities rows: email_sent, email_opened. Templates live in email_templates (mirror of mail_templates with folders).
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
