"use client";

import { useEffect, useRef, useState } from "react";
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
  IconSearch,
} from "@tabler/icons-react";

type Contact = {
  id: string;
  name: string;
  email: string;
  relation?: string;
  source: "lead" | "org";
};

const LEAD_CONTACTS: Contact[] = [
  { id: "c1", name: "Roberta Mendes", email: "roberta.mendes@example.com", relation: "Owner", source: "lead" },
  { id: "c2", name: "Carlos Mendes", email: "carlos.mendes@example.com", relation: "Spouse", source: "lead" },
  { id: "c3", name: "Maria Reyes", email: "mreyes@example.com", relation: "Sister", source: "lead" },
];

const ORG_CONTACTS: Contact[] = [
  { id: "c4", name: "Daniel Kerr", email: "attorney@kerr-law.com", relation: "Attorney", source: "org" },
  { id: "c5", name: "Title Co. — Stewart", email: "ops@stewarttitle.com", relation: "Vendor", source: "org" },
];

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
  { token: "system.today_long", sample: "June 10, 2026", group: "Sender" },
];

export function EmailMockup() {
  return (
    <div className="min-h-screen bg-[#f7f8fa] py-12 text-[#0f1729]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="mx-auto max-w-[1080px] space-y-14 px-8">
        <header>
          <h1 className="text-[22px] font-medium tracking-tight">Email Compose · Mockup</h1>
          <p className="mt-1.5 text-[13px] text-gray-500">
            Five surfaces, top to bottom. The modal is interactive — try Cc, Bcc, merge field, the typeahead on To.
          </p>
        </header>

        <Section number="1" title="Compose Email" context="Click into To, Cc, or Bcc — typeahead shows contacts on the lead first, then the org.">
          <ComposeModal />
        </Section>

        <Section number="2" title="Send Email on the lead" context="Sits next to Send Mail.">
          <LeadHeaderBar />
        </Section>

        <Section number="3" title="Settings — Email Account" context="Sender connection + signature live here.">
          <EmailAccountSettings />
        </Section>

        <Section number="4" title="Settings — Email Templates" context="Folder-as-card pattern matching the existing Mail Templates section.">
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
        <span className="text-[11px] tabular-nums text-gray-400">{number.padStart(2, "0")}</span>
        <h2 className="text-[15px] font-medium tracking-tight">{title}</h2>
        <span className="text-[12px] text-gray-500">— {context}</span>
      </div>
      {children}
    </section>
  );
}

function ComposeModal() {
  const [toContacts, setToContacts] = useState<Contact[]>([LEAD_CONTACTS[0], LEAD_CONTACTS[1]]);
  const [ccContacts, setCcContacts] = useState<Contact[]>([]);
  const [bccContacts, setBccContacts] = useState<Contact[]>([]);
  const [ccOpen, setCcOpen] = useState(false);
  const [bccOpen, setBccOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [templateMenu, setTemplateMenu] = useState(false);
  const [insertedTokens, setInsertedTokens] = useState<string[]>([]);

  function addTo(c: Contact) {
    if (!toContacts.find((x) => x.id === c.id)) setToContacts([...toContacts, c]);
  }
  function removeTo(c: Contact) {
    setToContacts(toContacts.filter((x) => x.id !== c.id));
  }
  function addCc(c: Contact) {
    if (!ccContacts.find((x) => x.id === c.id)) setCcContacts([...ccContacts, c]);
  }
  function removeCc(c: Contact) {
    setCcContacts(ccContacts.filter((x) => x.id !== c.id));
  }
  function addBcc(c: Contact) {
    if (!bccContacts.find((x) => x.id === c.id)) setBccContacts([...bccContacts, c]);
  }
  function removeBcc(c: Contact) {
    setBccContacts(bccContacts.filter((x) => x.id !== c.id));
  }
  function insertMerge(token: string) {
    setInsertedTokens([...insertedTokens, token]);
    setMergeOpen(false);
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04),0_8px_24px_-8px_rgba(15,23,41,0.10)]">
      <header className="flex items-center justify-between border-b border-gray-150 px-6 py-3.5">
        <div className="min-w-0">
          <div className="text-[10.5px] uppercase tracking-[0.08em] text-gray-400">
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
            <Avatar initials="BM" />
            <span className="font-medium">Bree Moss</span>
            <span className="text-gray-500">bree@mossequitypartners.com</span>
          </div>
        </Row>

        <ContactPickerRow
          label="To"
          selected={toContacts}
          onAdd={addTo}
          onRemove={removeTo}
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
        />

        {ccOpen && (
          <ContactPickerRow
            label="Cc"
            selected={ccContacts}
            onAdd={addCc}
            onRemove={removeCc}
            right={<RemoveBtn onClick={() => setCcOpen(false)} />}
          />
        )}

        {bccOpen && (
          <ContactPickerRow
            label="Bcc"
            selected={bccContacts}
            onAdd={addBcc}
            onRemove={removeBcc}
            right={<RemoveBtn onClick={() => setBccOpen(false)} />}
          />
        )}

        <Row
          label="Template"
          right={
            <div className="relative">
              <button
                onClick={() => setTemplateMenu((v) => !v)}
                title="Template Actions"
                className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <IconDots size={14} stroke={1.75} />
              </button>
              {templateMenu && (
                <div
                  onMouseLeave={() => setTemplateMenu(false)}
                  className="absolute right-0 top-full z-20 mt-1 w-[220px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
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
          <button className="flex flex-1 cursor-pointer items-center justify-between text-[13px]">
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
          <Tool icon={IconBold} active label="Bold" />
          <Tool icon={IconItalic} label="Italic" />
          <Tool icon={IconUnderline} label="Underline" />
          <Sep />
          <Tool icon={IconList} label="Bulleted list" />
          <Tool icon={IconListNumbers} label="Numbered list" />
          <Sep />
          <Tool icon={IconLink} label="Insert link" />
          <Sep />
          <Tool icon={IconAlignLeft} label="Align left" />
          <Tool icon={IconAlignCenter} label="Align center" />
          <Tool icon={IconAlignRight} label="Align right" />
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
          {insertedTokens.length > 0 && (
            <p>
              {insertedTokens.map((t, i) => (
                <span key={`${t}-${i}`} className="mr-1">
                  <MergeInline>{t}</MergeInline>
                </span>
              ))}
            </p>
          )}
        </div>

        {mergeOpen && (
          <div
            onMouseLeave={() => setMergeOpen(false)}
            className="absolute right-4 top-12 z-10 w-[290px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
          >
            {(["Recipient", "Property", "Sender"] as const).map((group) => (
              <div key={group}>
                <div className="border-b border-gray-100 bg-gray-50/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.08em] text-gray-500">
                  {group}
                </div>
                {MERGE_TOKENS.filter((t) => t.group === group).map((t) => (
                  <button
                    key={t.token}
                    onClick={() => insertMerge(t.token)}
                    className="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-[12px] hover:bg-gray-50"
                  >
                    <span className="text-[#0d4b3a]">{`{{${t.token}}}`}</span>
                    <span className="ml-2 truncate text-gray-500">{t.sample}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="px-6 pb-5">
          <hr className="my-3 border-t border-gray-100" />
          <div className="text-[13.5px] leading-[1.55] text-[#0f1729]">
            <strong>Bree Moss</strong>
            <br />
            <span className="text-gray-500">Managing Partner · Moss Equity Partners</span>
            <br />
            <span className="text-gray-500">713-555-0184 · mossequitypartners.com</span>
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-end gap-2 border-t border-gray-150 px-6 py-3">
        <button className="cursor-pointer text-[12px] font-medium text-gray-500 hover:text-gray-700">
          Cancel
        </button>
        <button className="btn-primary cursor-pointer rounded-md px-4 py-1.5 text-[12px] font-medium text-white">
          Send Email
        </button>
      </footer>
    </div>
  );
}

function ContactPickerRow({
  label,
  selected,
  onAdd,
  onRemove,
  right,
}: {
  label: string;
  selected: Contact[];
  onAdd: (c: Contact) => void;
  onRemove: (c: Contact) => void;
  right?: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const q = query.trim().toLowerCase();
  const leadMatches = LEAD_CONTACTS.filter(
    (c) => !selected.find((s) => s.id === c.id) && (q === "" || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
  );
  const orgMatches = ORG_CONTACTS.filter(
    (c) => !selected.find((s) => s.id === c.id) && (q === "" || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
  );

  function looksLikeEmail(s: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
  }

  function commitRawEmail() {
    const raw = query.trim();
    if (!looksLikeEmail(raw)) return false;
    onAdd({ id: `raw-${raw}`, name: raw, email: raw, source: "lead" });
    setQuery("");
    return true;
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "Tab" || e.key === " " || e.key === ",") {
      if (commitRawEmail()) e.preventDefault();
    } else if (e.key === "Backspace" && query === "" && selected.length > 0) {
      onRemove(selected[selected.length - 1]);
    }
  }

  return (
    <Row label={label} right={right}>
      <div ref={wrapRef} className="relative">
        <div className="flex flex-wrap items-center gap-1.5">
          {selected.map((c) => (
            <Chip key={c.id} contact={c} onRemove={() => onRemove(c)} />
          ))}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => commitRawEmail()}
            onFocus={() => setOpen(true)}
            placeholder={selected.length === 0 ? "Search contacts or type an email..." : ""}
            className="flex-1 min-w-[180px] border-0 bg-transparent text-[13px] outline-none placeholder:text-gray-400"
          />
        </div>

        {open && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-[300px] overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
            {leadMatches.length > 0 && (
              <Group label="On this lead">
                {leadMatches.map((c) => (
                  <ContactOption
                    key={c.id}
                    contact={c}
                    onClick={() => {
                      onAdd(c);
                      setQuery("");
                    }}
                  />
                ))}
              </Group>
            )}
            {orgMatches.length > 0 && (
              <Group label="Across the org">
                {orgMatches.map((c) => (
                  <ContactOption
                    key={c.id}
                    contact={c}
                    onClick={() => {
                      onAdd(c);
                      setQuery("");
                    }}
                  />
                ))}
              </Group>
            )}
            {leadMatches.length === 0 && orgMatches.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-3 text-[12px] text-gray-500">
                <IconSearch size={12} stroke={1.75} />
                {looksLikeEmail(query)
                  ? "Press Enter, Tab, or comma to add."
                  : "Type to search contacts, or paste an email."}
              </div>
            )}
          </div>
        )}
      </div>
    </Row>
  );
}

function ContactOption({ contact, onClick }: { contact: Contact; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
    >
      <Avatar initials={initialsOf(contact.name)} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-medium">{contact.name}</div>
        <div className="truncate text-[11px] text-gray-500">{contact.email}</div>
      </div>
      {contact.relation && (
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-600">
          {contact.relation}
        </span>
      )}
    </button>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="border-b border-gray-100 bg-gray-50/60 px-3 py-1 text-[10px] uppercase tracking-[0.08em] text-gray-500">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
      style={{ background: "#0d4b3a" }}
    >
      {initials}
    </span>
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
    <div className="grid grid-cols-[72px_1fr_auto] items-center gap-4 px-6 py-2.5">
      <label className="text-[11px] uppercase tracking-[0.08em] text-gray-400">
        {label}
      </label>
      <div className="min-w-0">{children}</div>
      <div>{right}</div>
    </div>
  );
}

function Chip({ contact, onRemove }: { contact: Contact; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-0 pl-0 pr-2 text-[12px]">
      <Avatar initials={initialsOf(contact.name)} />
      <span className="font-medium text-[#0f1729]">{contact.name}</span>
      {contact.relation && (
        <>
          <span className="text-gray-400">·</span>
          <span className="text-[11px] text-gray-500">{contact.relation}</span>
        </>
      )}
      <button
        onClick={onRemove}
        className="cursor-pointer rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
      >
        <IconX size={10} stroke={2} />
      </button>
    </span>
  );
}

function Tool({
  icon: Icon,
  active,
  label,
}: {
  icon: React.ComponentType<{ size: number; stroke: number }>;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      title={label}
      aria-label={label}
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
          <div className="text-[10.5px] uppercase tracking-[0.08em] text-gray-400">
            L-2026-0042
          </div>
          <div className="mt-1 text-[18px] font-medium tracking-tight">Roberta Mendes</div>
          <div className="mt-0.5 text-[12.5px] text-gray-500">
            456 Oak Ave, Dallas, TX 75201 · Estimated surplus $42,500
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-3.5 py-2 text-[12px] font-medium text-[#0f1729] hover:border-gray-300">
            Send Letter
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
        <div className="text-[11px] uppercase tracking-[0.08em] text-gray-400">
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
            <div className="text-[11px] uppercase tracking-[0.08em] text-gray-400">
              Connected Account
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-[13px]">
              <Avatar initials="BM" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">Bree Moss</div>
                <div className="truncate text-[11px] text-gray-500">bree@mossequitypartners.com</div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700">
                <IconCircleCheck size={11} stroke={2} />
                Connected
              </span>
            </div>
            <button className="mt-2 cursor-pointer text-[11.5px] text-gray-500 hover:text-gray-700">
              Disconnect Gmail
            </button>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-gray-400">
              Open Tracking
            </div>
            <div className="mt-2 flex items-center gap-3 text-[12.5px]">
              <span className="inline-flex h-4 w-7 items-center rounded-full bg-[#0d4b3a] p-0.5">
                <span className="ml-auto h-3 w-3 rounded-full bg-white" />
              </span>
              <span>On for every send</span>
            </div>
            <p className="mt-1.5 text-[11px] text-gray-500">
              Apple Mail pre-fetches images server-side, so a pixel fire there doesn&apos;t mean a human looked. We show those as &ldquo;Email Delivered&rdquo; in muted gray. Real opens (Gmail, Outlook, etc.) show as &ldquo;Email Opened.&rdquo;
            </p>
          </div>
        </div>

        <div className="space-y-2 px-6 py-5">
          <div className="text-[11px] uppercase tracking-[0.08em] text-gray-400">
            Signature
          </div>
          <div className="rounded-md border border-gray-200 bg-white">
            <div className="flex items-center gap-0.5 border-b border-gray-100 px-2 py-1.5">
              <Tool icon={IconBold} active label="Bold" />
              <Tool icon={IconItalic} label="Italic" />
              <Tool icon={IconUnderline} label="Underline" />
              <Sep />
              <Tool icon={IconLetterT} label="Font size" />
              <Tool icon={IconPalette} label="Text color" />
              <Sep />
              <Tool icon={IconLink} label="Insert link" />
              <Tool icon={IconPhoto} label="Insert image" />
              <Sep />
              <Tool icon={IconList} label="Bulleted list" />
              <Tool icon={IconAlignLeft} label="Align left" />
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
            Auto-appended to every outbound email. Same toolbar shape as Gmail and HubSpot signature editors.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmailTemplatesPanel() {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-gray-400">
            Settings
          </div>
          <h3 className="mt-0.5 text-[15px] font-medium">Email Templates</h3>
          <p className="mt-1 text-[12px] text-gray-500">
            Reusable email bodies with merge fields. Organize by folder, use across leads.
          </p>
        </div>
        <button className="btn-primary cursor-pointer rounded-md px-3 py-1.5 text-[11.5px] font-medium text-white">
          <IconPlus size={11} stroke={2} className="mr-1 inline -translate-y-px" />
          New Template
        </button>
      </div>

      <FolderCard name="Outreach" count={3}>
        <TemplateRow
          name="Opening Outreach — Tax Sale"
          preview="Hi {{contact.first_name}}, I&apos;m following up on the surplus funds from your tax sale at..."
          updated="2 days ago"
          used={14}
          mostUsed
        />
        <TemplateRow
          name="Opening Outreach — Mortgage Foreclosure"
          preview="Hi {{contact.first_name}}, our research shows you may be entitled to surplus funds from the recent..."
          updated="1 week ago"
          used={6}
        />
        <TemplateRow
          name="Soft Follow-up (Day 3)"
          preview="Just checking in to see if you had a chance to review my note from earlier this week..."
          updated="2 weeks ago"
          used={22}
          mostUsed
        />
      </FolderCard>

      <FolderCard name="Closing" count={2}>
        <TemplateRow
          name="Send Contract For Signature"
          preview="Attached is the contract for your review. Once signed we&apos;ll file the claim with..."
          updated="3 days ago"
          used={9}
        />
        <TemplateRow
          name="Welcome — Onboarding"
          preview="Welcome aboard! Here&apos;s what to expect over the next 90 days as we work your claim..."
          updated="last month"
          used={4}
        />
      </FolderCard>
    </div>
  );
}

function FolderCard({
  name,
  count,
  children,
}: {
  name: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-md border border-gray-200 bg-gray-50/50"
      style={{ borderLeft: "3px solid #0d4b3a" }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-3.5 py-2.5">
        <div className="flex flex-1 items-center gap-2">
          <IconFolder size={14} stroke={1.75} style={{ color: "#0d4b3a" }} />
          <span className="text-[13px] font-medium">{name}</span>
          <span className="text-[11px] text-gray-400">{count}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <button className="cursor-pointer text-gray-500 hover:text-[#0d4b3a]">Rename</button>
          <button className="cursor-pointer text-gray-400 hover:text-red-600">Delete</button>
        </div>
      </div>
      <div className="divide-y divide-gray-150 bg-white">{children}</div>
    </div>
  );
}

function TemplateRow({
  name,
  preview,
  updated,
  used,
  mostUsed,
}: {
  name: string;
  preview: string;
  updated: string;
  used: number;
  mostUsed?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 px-3.5 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium">{name}</span>
          {mostUsed && (
            <span className="inline-flex items-center rounded-full bg-[#0d4b3a]/10 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-[#0d4b3a]">
              Most Used
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate text-[11.5px] text-gray-500">{preview}</div>
        <div className="mt-1 text-[10.5px] text-gray-400">Updated {updated}</div>
      </div>
      <span className="inline-flex items-center rounded-full bg-[#0d4b3a]/10 px-2 py-0.5 text-[11px] font-medium tabular-nums text-[#0d4b3a]">
        {used}× used
      </span>
      <button title="Edit" aria-label="Edit" className="cursor-pointer text-gray-400 hover:text-[#0d4b3a]">
        <IconPencil size={14} stroke={1.75} />
      </button>
      <button title="Duplicate" aria-label="Duplicate" className="cursor-pointer text-gray-400 hover:text-[#0d4b3a]">
        <IconCopy size={14} stroke={1.75} />
      </button>
      <button title="Delete" aria-label="Delete" className="cursor-pointer text-gray-400 hover:text-red-600">
        <IconTrash size={14} stroke={1.75} />
      </button>
    </div>
  );
}

function ActivityFeed() {
  return (
    <div className="overflow-hidden rounded-[12px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
      <div className="border-b border-gray-150 px-6 py-3">
        <div className="text-[11px] uppercase tracking-[0.08em] text-gray-400">
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
          body={<>Carlos Mendes opened the email.</>}
          meta="18 min ago · Houston, TX"
        />
        <ActivityRow
          icon={IconCircleCheck}
          title="Email Delivered"
          body={<>Roberta Mendes — delivered to her mail client.</>}
          meta="2 min ago · Apple Mail"
          appleDelivered
        />
        <ActivityRow
          icon={IconEye}
          title="Email Opened"
          body={<>Carlos Mendes opened it again.</>}
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
  appleDelivered,
}: {
  icon: React.ComponentType<{ size: number; stroke: number; className?: string }>;
  title: string;
  body: React.ReactNode;
  meta: string;
  link?: string;
  appleDelivered?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 px-6 py-3.5">
      <div className={
        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-white " +
        (appleDelivered ? "border-gray-200" : "border-gray-200")
      }>
        <Icon size={13} stroke={1.75} className={appleDelivered ? "text-gray-400" : "text-gray-600"} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px]">
          <span className={"font-medium " + (appleDelivered ? "text-gray-500" : "text-[#0f1729]")}>{title}</span>
          <span className="mx-2 text-gray-300">·</span>
          <span className={appleDelivered ? "text-gray-500" : "text-[#0f1729]"}>{body}</span>
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
      <h3 className="text-[11px] uppercase tracking-[0.08em] text-gray-400">
        Build Notes — Why It Looks This Way
      </h3>
      <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
        <NoteItem term="To / Cc / Bcc input">
          Typeahead dropdown opens on focus. Two groups: contacts on this lead first, then contacts across the org. Type to filter. Type a valid email and press Enter, Tab, comma, or space — it auto-chips. Backspace on empty input removes the last chip. Same shortcuts as Gmail and HubSpot.
        </NoteItem>
        <NoteItem term="Recipient chips">
          Every selected recipient renders as a chip with avatar + name + relation. Consistent across To, Cc, Bcc. No mixing of chip and plaintext.
        </NoteItem>
        <NoteItem term="From row">
          Small initials avatar instead of a Gmail brand mark. Doesn&apos;t shout about the provider — your name and email are the load-bearing info.
        </NoteItem>
        <NoteItem term="Field labels">
          Sans-serif Inter, uppercase, low-contrast gray. Removed the monospace that read as &ldquo;old timer.&rdquo;
        </NoteItem>
        <NoteItem term="Toolbar tooltips">
          Every toolbar icon now has a hover title (&ldquo;Bold&rdquo;, &ldquo;Italic&rdquo;, &ldquo;Bulleted list&rdquo;, etc). Accessibility + discoverability for new users.
        </NoteItem>
        <NoteItem term="Open tracking — Apple Mail handling">
          Real opens (Gmail, Outlook, Yahoo, mobile clients other than Apple Mail) show as &ldquo;Email Opened&rdquo; — pixel fired, human likely looked. Apple Mail (iOS 15.2+) pre-fetches all images server-side regardless of whether the user opened, so those show as &ldquo;Email Delivered&rdquo; in muted gray with the meta line noting Apple Mail. Honest about the uncertainty without hiding the signal. We detect Apple Mail by IP range and user agent. Anchor: HubSpot, Mailchimp, Salesforce Marketing Cloud, Apollo, Outreach all flag Apple opens — they didn&apos;t when MPP launched but added it over the next year because sales users complained about inflated open rates.
        </NoteItem>
        <NoteItem term="Signature toolbar">
          Richer than the compose body: bold / italic / underline / font size / color / link / image / list / align. Plus a Source view link for paste-raw-HTML power users. Anchor: Gmail, HubSpot, Salesforce, Outlook all give signatures a richer editor than the compose body — because signatures often have logos and structured layout.
        </NoteItem>
        <NoteItem term="Templates panel">
          Matches the existing Mail Templates section: each folder is its own card with a header bar (folder icon in petrol, name, count) and template rows inside on white. Rename / Delete actions on the folder header, edit / duplicate / delete actions on each template row.
        </NoteItem>
        <NoteItem term="Save as Template">
          Demoted to the ⋯ overflow menu on the Template field. Same weight as Gmail&apos;s &ldquo;Save as new template&rdquo; under the three-dot menu.
        </NoteItem>
        <NoteItem term="Merge field tags">
          Brand green (#0d4b3a at 10% opacity), inline, line-height-safe. Same color as every accent in the portal.
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
