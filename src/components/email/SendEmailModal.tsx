"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  IconX,
  IconChevronDown,
  IconMailForward,
  IconSearch,
  IconPlus,
  IconBrandGmail,
} from "@tabler/icons-react";
import { sendEmail } from "@/app/(app)/inbox/_send-actions";
import { renderMerge, type MergeContext } from "@/lib/mail/merge";
import type { EmailRecipientCandidate } from "@/lib/email/lead-recipients";
import type { EmailTemplateRow } from "@/lib/settings/fetch";
import type { EmailAccountRow } from "@/lib/email/types";

export type SendEmailModalProps = {
  open: boolean;
  onClose: () => void;
  leadId: string;
  candidates: EmailRecipientCandidate[];
  templates: EmailTemplateRow[];
  accounts: EmailAccountRow[];
  signatureHtml?: string | null;
};

type Selected = {
  contactId: string | null;
  email: string;
  name: string;
  relation?: string;
  mergeContext?: MergeContext;
};

export function SendEmailModal({
  open,
  onClose,
  leadId,
  candidates,
  templates,
  accounts,
  signatureHtml,
}: SendEmailModalProps) {
  const activeAccounts = accounts.filter((a) => a.status === "active");
  const defaultAccount = activeAccounts[0] ?? null;

  const [accountId, setAccountId] = useState<string | null>(defaultAccount?.id ?? null);
  const [to, setTo] = useState<Selected[]>(
    candidates.length > 0
      ? [
          {
            contactId: candidates[0].contact_id,
            email: candidates[0].email,
            name: candidates[0].name,
            relation: candidates[0].relation,
            mergeContext: candidates[0].merge_context,
          },
        ]
      : []
  );
  const [cc, setCc] = useState<Selected[]>([]);
  const [bcc, setBcc] = useState<Selected[]>([]);
  const [ccOpen, setCcOpen] = useState(false);
  const [bccOpen, setBccOpen] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setErr(null);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open]);

  function pickTemplate(id: string | null) {
    setTemplateId(id);
    if (!id) {
      setSubject("");
      setBody("");
      return;
    }
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setSubject(t.subject);
    setBody(t.body_html);
  }

  function send() {
    setErr(null);
    if (!accountId) {
      setErr("Connect an email account in Settings first.");
      return;
    }
    if (to.length === 0) {
      setErr("Pick at least one recipient.");
      return;
    }
    if (!subject.trim()) {
      setErr("Subject is required.");
      return;
    }
    if (!body.trim()) {
      setErr("Email body is required.");
      return;
    }
    const primary = to[0];
    const ctx: MergeContext = primary.mergeContext ?? {
      "contact.first_name": primary.name.split(/\s+/)[0] ?? "",
      "contact.full_name": primary.name,
    };
    const renderedSubject = renderMerge(subject, ctx);
    const renderedBody = renderMerge(body, ctx);
    const bodyWithSignature = signatureHtml
      ? `${renderedBody}\n\n${signatureHtml}`
      : renderedBody;

    startTransition(async () => {
      const res = await sendEmail({
        accountId,
        to: to.map((r) => r.email),
        cc: cc.length > 0 ? cc.map((r) => r.email) : undefined,
        bcc: bcc.length > 0 ? bcc.map((r) => r.email) : undefined,
        subject: renderedSubject,
        body: bodyWithSignature,
        leadId,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      onClose();
    });
  }

  if (!open) return null;

  const selectedAccount = activeAccounts.find((a) => a.id === accountId) ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="absolute inset-0" aria-hidden onClick={onClose} />
      <div
        className="relative z-10 flex max-h-[92vh] w-[820px] max-w-[95vw] flex-col overflow-hidden rounded-[12px] border border-gray-200 bg-white shadow-[0_24px_64px_-16px_rgba(15,23,41,0.20)]"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <header className="flex items-center justify-between border-b border-gray-150 px-6 py-3.5">
          <div className="min-w-0">
            <div className="text-[10.5px] uppercase tracking-[0.08em] text-gray-400">
              Compose Email
            </div>
            <div className="mt-0.5 text-[14px] font-medium">
              {to[0]?.name ?? "New email"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <IconX size={16} stroke={1.75} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-gray-100">
            <Row label="From">
              {selectedAccount ? (
                <div className="relative flex items-center gap-2 text-[13px]">
                  <Avatar initials={initialsOf(selectedAccount.display_name ?? selectedAccount.address)} />
                  <span className="font-medium">
                    {selectedAccount.display_name ?? selectedAccount.address}
                  </span>
                  <span className="text-gray-500">{selectedAccount.address}</span>
                  {activeAccounts.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setAccountPickerOpen((v) => !v)}
                        className="ml-2 inline-flex cursor-pointer items-center gap-0.5 text-[11px] text-gray-500 hover:text-[#0d4b3a]"
                      >
                        Change
                        <IconChevronDown size={11} stroke={2} />
                      </button>
                      {accountPickerOpen && (
                        <div
                          onMouseLeave={() => setAccountPickerOpen(false)}
                          className="absolute left-0 top-full z-10 mt-1 w-[280px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
                        >
                          {activeAccounts.map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => {
                                setAccountId(a.id);
                                setAccountPickerOpen(false);
                              }}
                              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[12.5px] hover:bg-gray-50"
                            >
                              <IconBrandGmail size={13} stroke={1.75} className="text-gray-500" />
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-medium">
                                  {a.display_name ?? a.address}
                                </div>
                                <div className="truncate text-[11px] text-gray-500">
                                  {a.address}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-[12.5px] text-red-700">
                  No active email account. Connect Gmail in Settings → Email Accounts.
                </div>
              )}
            </Row>

            <RecipientRow
              label="To"
              selected={to}
              onChange={setTo}
              candidates={candidates}
              right={
                <div className="flex items-center gap-3 text-[11px]">
                  {!ccOpen && (
                    <button
                      type="button"
                      onClick={() => setCcOpen(true)}
                      className="cursor-pointer text-gray-500 hover:text-[#0d4b3a]"
                    >
                      Cc
                    </button>
                  )}
                  {!bccOpen && (
                    <button
                      type="button"
                      onClick={() => setBccOpen(true)}
                      className="cursor-pointer text-gray-500 hover:text-[#0d4b3a]"
                    >
                      Bcc
                    </button>
                  )}
                </div>
              }
            />

            {ccOpen && (
              <RecipientRow
                label="Cc"
                selected={cc}
                onChange={setCc}
                candidates={candidates}
                right={
                  <button
                    type="button"
                    onClick={() => {
                      setCcOpen(false);
                      setCc([]);
                    }}
                    className="cursor-pointer text-[11px] text-gray-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                }
              />
            )}

            {bccOpen && (
              <RecipientRow
                label="Bcc"
                selected={bcc}
                onChange={setBcc}
                candidates={candidates}
                right={
                  <button
                    type="button"
                    onClick={() => {
                      setBccOpen(false);
                      setBcc([]);
                    }}
                    className="cursor-pointer text-[11px] text-gray-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                }
              />
            )}

            <Row label="Template">
              <select
                value={templateId ?? ""}
                onChange={(e) => pickTemplate(e.target.value || null)}
                className="w-full border-0 bg-transparent text-[13px] outline-none"
              >
                <option value="">— No template —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Row>

            <Row label="Subject">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's this about?"
                className="w-full border-0 bg-transparent text-[15px] font-semibold tracking-tight outline-none placeholder:font-normal placeholder:text-gray-400"
              />
            </Row>
          </div>

          <div className="px-6 py-5">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              placeholder="Write your email. Use {{contact.first_name}}, {{lead.property_address}}, etc."
              className="w-full resize-none border-0 bg-transparent text-[13.5px] leading-[1.7] text-[#0f1729] outline-none placeholder:text-gray-400"
            />
            {signatureHtml && (
              <>
                <hr className="my-3 border-t border-gray-100" />
                <div
                  className="text-[12.5px] leading-[1.55] text-[#0f1729]"
                  dangerouslySetInnerHTML={{ __html: signatureHtml }}
                />
              </>
            )}
          </div>
        </div>

        {err && (
          <div className="border-t border-red-200 bg-red-50 px-6 py-2 text-[12px] text-red-700">
            {err}
          </div>
        )}

        <footer className="flex items-center justify-between border-t border-gray-150 px-6 py-3">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <IconMailForward size={11} stroke={1.75} />
            {selectedAccount
              ? `Sending via ${selectedAccount.address}`
              : "No account selected"}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="cursor-pointer text-[12px] font-medium text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={send}
              disabled={pending || !selectedAccount}
              className="btn-primary cursor-pointer rounded-md px-4 py-1.5 text-[12px] font-medium text-white disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send Email"}
            </button>
          </div>
        </footer>
      </div>
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
    <div className="grid grid-cols-[72px_1fr_auto] items-center gap-4 px-6 py-2.5">
      <label className="text-[11px] uppercase tracking-[0.08em] text-gray-400">
        {label}
      </label>
      <div className="min-w-0">{children}</div>
      <div>{right}</div>
    </div>
  );
}

function RecipientRow({
  label,
  selected,
  onChange,
  candidates,
  right,
}: {
  label: string;
  selected: Selected[];
  onChange: (next: Selected[]) => void;
  candidates: EmailRecipientCandidate[];
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
  const matches = candidates.filter(
    (c) =>
      !selected.find((s) => s.contactId === c.contact_id || s.email === c.email) &&
      (q === "" || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
  );

  function looksLikeEmail(s: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
  }

  function add(c: EmailRecipientCandidate) {
    if (selected.find((s) => s.email === c.email)) return;
    onChange([
      ...selected,
      {
        contactId: c.contact_id,
        email: c.email,
        name: c.name,
        relation: c.relation,
        mergeContext: c.merge_context,
      },
    ]);
    setQuery("");
  }

  function commitRawEmail(): boolean {
    const raw = query.trim();
    if (!looksLikeEmail(raw)) return false;
    if (selected.find((s) => s.email === raw)) return true;
    onChange([
      ...selected,
      { contactId: null, email: raw, name: raw },
    ]);
    setQuery("");
    return true;
  }

  function remove(s: Selected) {
    onChange(selected.filter((x) => x.email !== s.email));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "Tab" || e.key === " " || e.key === ",") {
      if (commitRawEmail()) e.preventDefault();
    } else if (e.key === "Backspace" && query === "" && selected.length > 0) {
      remove(selected[selected.length - 1]);
    }
  }

  return (
    <Row label={label} right={right}>
      <div ref={wrapRef} className="relative">
        <div className="flex flex-wrap items-center gap-1.5">
          {selected.map((s) => (
            <Chip key={s.email} sel={s} onRemove={() => remove(s)} />
          ))}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => commitRawEmail()}
            onKeyDown={onKeyDown}
            placeholder={selected.length === 0 ? "Search contacts or type an email..." : ""}
            className="flex-1 min-w-[180px] border-0 bg-transparent text-[13px] outline-none placeholder:text-gray-400"
          />
        </div>
        {open && (matches.length > 0 || looksLikeEmail(query)) && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-[300px] overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
            {matches.length > 0 && (
              <>
                <div className="border-b border-gray-100 bg-gray-50/60 px-3 py-1 text-[10px] uppercase tracking-[0.08em] text-gray-500">
                  On this lead
                </div>
                {matches.map((c) => (
                  <button
                    key={c.contact_id}
                    type="button"
                    onClick={() => add(c)}
                    className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
                  >
                    <Avatar initials={initialsOf(c.name)} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-medium">{c.name}</div>
                      <div className="truncate text-[11px] text-gray-500">{c.email}</div>
                    </div>
                    {c.relation && (
                      <span className="text-[10px] uppercase tracking-wide text-gray-500">
                        {c.relation}
                      </span>
                    )}
                  </button>
                ))}
              </>
            )}
            {matches.length === 0 && looksLikeEmail(query) && (
              <div className="flex items-center gap-2 px-3 py-2 text-[12px] text-gray-500">
                <IconPlus size={12} stroke={2} className="text-gray-400" />
                Press Enter, Tab, or comma to add <strong className="text-[#0f1729]">{query}</strong>
              </div>
            )}
            {matches.length === 0 && !looksLikeEmail(query) && (
              <div className="flex items-center gap-2 px-3 py-3 text-[12px] text-gray-500">
                <IconSearch size={12} stroke={1.75} />
                No matches. Paste a full email to add.
              </div>
            )}
          </div>
        )}
      </div>
    </Row>
  );
}

function Chip({ sel, onRemove }: { sel: Selected; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-0 pl-0 pr-2 text-[12px]">
      <Avatar initials={initialsOf(sel.name)} />
      <span className="font-medium text-[#0f1729]">{sel.name}</span>
      {sel.relation && (
        <>
          <span className="text-gray-400">·</span>
          <span className="text-[11px] text-gray-500">{sel.relation}</span>
        </>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="cursor-pointer rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
      >
        <IconX size={10} stroke={2} />
      </button>
    </span>
  );
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

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
