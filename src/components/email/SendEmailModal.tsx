"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  IconX,
  IconChevronDown,
  IconSearch,
  IconPlus,
  IconBrandGmail,
  IconSparkles,
  IconDots,
} from "@tabler/icons-react";
import { sendLeadEmail } from "@/app/(app)/leads/[id]/_email-send-action";
import { upsertEmailTemplate } from "@/app/(app)/settings/_actions";
import { renderMerge, type MergeContext } from "@/lib/mail/merge";
import type { EmailRecipientCandidate } from "@/lib/email/lead-recipients";
import type { EmailTemplateRow } from "@/lib/settings/fetch";
import type { EmailAccountRow } from "@/lib/email/types";
import { RichTextEditor } from "@/components/email/RichTextEditor";
import type { Editor } from "@tiptap/react";

const MERGE_TOKENS = [
  { token: "contact.first_name", sample: "Roberta", group: "Recipient" },
  { token: "contact.full_name", sample: "Roberta Mendes", group: "Recipient" },
  { token: "contact.last_name", sample: "Mendes", group: "Recipient" },
  { token: "lead.property_address", sample: "456 Oak Ave, Dallas, TX 75201", group: "Property" },
  { token: "lead.property_street_address", sample: "456 Oak Ave", group: "Property" },
  { token: "lead.property_city_state_zip", sample: "Dallas, TX 75201", group: "Property" },
  { token: "lead.county", sample: "Dallas", group: "Property" },
  { token: "lead.estimated_surplus", sample: "$42,500", group: "Property" },
  { token: "lead.confirmed_surplus", sample: "$42,500", group: "Property" },
  { token: "lead.recovery_fee_pct", sample: "30%", group: "Property" },
  { token: "lead.recovery_fee_amount", sample: "$12,750", group: "Property" },
  { token: "lead.est_net_to_owner", sample: "$11,250", group: "Property" },
  { token: "lead.case_number", sample: "DC-25-04321", group: "Property" },
  { token: "sender.signer_name", sample: "Bree Moss", group: "Sender" },
  { token: "system.today_long", sample: "June 11, 2026", group: "Sender" },
] as const;

export type SendEmailReplyContext = {
  mode: "reply" | "replyAll" | "forward";
  threadId: string;
  inReplyTo: string | null;
  referencesChain: string[];
  accountId: string;
  defaultTo: { name: string; email: string }[];
  defaultCc: { name: string; email: string }[];
  baseSubject: string;
  quotedHtml: string;
  originalFrom: { name: string | null; address: string };
  originalSentAt: string;
};

export type SendEmailModalProps = {
  open: boolean;
  onClose: () => void;
  leadId: string;
  candidates: EmailRecipientCandidate[];
  templates: EmailTemplateRow[];
  accounts: EmailAccountRow[];
  signatureHtml?: string | null;
  replyContext?: SendEmailReplyContext | null;
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
  replyContext,
}: SendEmailModalProps) {
  const activeAccounts = accounts.filter((a) => a.status === "active");
  const defaultAccount =
    (replyContext &&
      activeAccounts.find((a) => a.id === replyContext.accountId)) ??
    activeAccounts[0] ??
    null;

  function buildReplySubject(base: string, mode: "reply" | "replyAll" | "forward"): string {
    const prefix = mode === "forward" ? "Fwd:" : "Re:";
    if (!base) return prefix;
    if (base.toLowerCase().startsWith(prefix.toLowerCase())) return base;
    return `${prefix} ${base}`;
  }

  function selectedFromAddrList(list: { name: string; email: string }[]): Selected[] {
    return list.map((r) => {
      const match = candidates.find(
        (c) => c.email.toLowerCase() === r.email.toLowerCase()
      );
      return match
        ? {
            contactId: match.contact_id,
            email: match.email,
            name: match.name,
            relation: match.relation,
            mergeContext: match.merge_context,
          }
        : { contactId: null, email: r.email, name: r.name || r.email };
    });
  }

  const accountSignature = (defaultAccount as EmailAccountRow | null)?.signature_html ?? signatureHtml ?? "";
  const initialSignatureBlock = accountSignature ? `\n\n${accountSignature}` : "";

  const [accountId, setAccountId] = useState<string | null>(defaultAccount?.id ?? null);
  const [to, setTo] = useState<Selected[]>(
    replyContext
      ? selectedFromAddrList(replyContext.defaultTo)
      : candidates.length > 0
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
  const [cc, setCc] = useState<Selected[]>(
    replyContext ? selectedFromAddrList(replyContext.defaultCc) : []
  );
  const [bcc, setBcc] = useState<Selected[]>([]);
  const [ccOpen, setCcOpen] = useState(replyContext ? replyContext.defaultCc.length > 0 : false);
  const [bccOpen, setBccOpen] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [subject, setSubject] = useState(
    replyContext ? buildReplySubject(replyContext.baseSubject, replyContext.mode) : ""
  );
  const [body, setBody] = useState(() => {
    if (replyContext && replyContext.mode === "forward") {
      return `${initialSignatureBlock}\n\n${replyContext.quotedHtml}`;
    }
    return initialSignatureBlock;
  });
  const [err, setErr] = useState<string | null>(null);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [saveTplOpen, setSaveTplOpen] = useState(false);
  const [saveTplPanel, setSaveTplPanel] = useState<null | "new" | "update">(null);
  const [saveTplName, setSaveTplName] = useState("");
  const [saveTplTargetId, setSaveTplTargetId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bodyEditorRef = useRef<Editor | null>(null);
  const mergeRef = useRef<HTMLDivElement | null>(null);
  const saveTplRef = useRef<HTMLDivElement | null>(null);
  const [updateSearch, setUpdateSearch] = useState("");

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (mergeRef.current && !mergeRef.current.contains(e.target as Node)) {
        setMergeOpen(false);
      }
      if (saveTplRef.current && !saveTplRef.current.contains(e.target as Node)) {
        setSaveTplOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

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
      setBody(initialSignatureBlock);
      return;
    }
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setSubject(t.subject);
    setBody(`${t.body_html}${initialSignatureBlock}`);
  }

  function insertMergeToken(token: string) {
    const placeholder = `{{${token}}}`;
    const ed = bodyEditorRef.current;
    if (ed) {
      ed.chain().focus().insertContent(placeholder).run();
    } else {
      setBody((b) => b + placeholder);
    }
    setMergeOpen(false);
  }

  function saveTemplate(opts: { id: string | null; name: string }) {
    setErr(null);
    if (!subject.trim() || !body.trim()) {
      setErr("Subject and body required to save as template");
      return;
    }
    const existing = templates.find((t) => t.id === opts.id);
    startTransition(async () => {
      const res = await upsertEmailTemplate({
        id: opts.id,
        name: opts.name,
        folder_id: existing?.folder_id ?? null,
        subject: subject.trim(),
        body_html: body,
      });
      if (!res.ok) setErr(res.error);
      else {
        setSaveTplOpen(false);
        setSaveTplPanel(null);
      }
    });
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
    startTransition(async () => {
      for (const r of to) {
        const ctx: MergeContext = r.mergeContext ?? {
          "contact.first_name": r.name.split(/\s+/)[0] ?? "",
          "contact.full_name": r.name,
        };
        const renderedSubject = renderMerge(subject, ctx);
        const renderedBody = renderMerge(body, ctx);
        const res = await sendLeadEmail({
          leadId,
          accountId,
          to: [{ name: r.name, email: r.email, contactId: r.contactId }],
          cc: cc.length > 0 ? cc.map((x) => x.email) : undefined,
          bcc: bcc.length > 0 ? bcc.map((x) => x.email) : undefined,
          subject: renderedSubject,
          bodyHtml: renderedBody,
          templateId,
          threadId: replyContext?.threadId,
          inReplyTo: replyContext?.inReplyTo ?? null,
          referencesChain: replyContext?.referencesChain,
        });
        if (!res.ok) {
          setErr(res.error);
          return;
        }
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
        <header className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-3.5">
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

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 divide-y divide-gray-200">
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
              <TemplatePicker
                templates={templates}
                value={templateId}
                onChange={(id) => pickTemplate(id)}
              />
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

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-end gap-1 border-b border-gray-200 px-4 py-2">
              <div ref={mergeRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMergeOpen((v) => !v)}
                  className={
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium " +
                    (mergeOpen
                      ? "bg-gray-100 text-[#0f1729]"
                      : "text-gray-600 hover:bg-gray-100")
                  }
                  title="Insert merge field"
                >
                  <IconSparkles size={11} stroke={1.75} />
                  Merge field
                  <IconChevronDown size={10} stroke={2} className="text-gray-400" />
                </button>
                {mergeOpen && (
                  <div className="absolute right-0 bottom-full z-50 mb-1 w-[340px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,41,0.25)]">
                    {(["Recipient", "Property", "Sender"] as const).map((group) => (
                      <div key={group}>
                        <div className="border-b border-gray-200 bg-gray-50/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.08em] text-gray-500">
                          {group}
                        </div>
                        {MERGE_TOKENS.filter((t) => t.group === group).map((t) => (
                          <button
                            key={t.token}
                            type="button"
                            onClick={() => insertMergeToken(t.token)}
                            className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-left text-[11.5px] hover:bg-gray-50"
                          >
                            <span className="text-[#0d4b3a]">{`{{${t.token}}}`}</span>
                            <span className="ml-2 truncate text-[10.5px] text-gray-500">{t.sample}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <RichTextEditor
                value={body}
                onChange={setBody}
                editorRef={bodyEditorRef}
                minRows={12}
                placeholder="Write your email..."
              />
            </div>
          </div>
        </div>

        {err && (
          <div className="border-t border-red-200 bg-red-50 px-6 py-2 text-[12px] text-red-700">
            {err}
          </div>
        )}

        <footer className="flex shrink-0 items-center justify-between border-t border-gray-200 px-6 py-3">
          <div ref={saveTplRef} className="relative">
            <button
              type="button"
              onClick={() => setSaveTplOpen((v) => !v)}
              className="cursor-pointer rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              title="More options"
              aria-label="More options"
            >
              <IconDots size={14} stroke={1.75} />
            </button>
            {saveTplOpen && (
              <div className="absolute bottom-full left-0 z-20 mb-1 w-[260px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                {templateId && (() => {
                  const t = templates.find((x) => x.id === templateId);
                  if (!t) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setSaveTplOpen(false);
                        saveTemplate({ id: t.id, name: t.name });
                      }}
                      className="block w-full cursor-pointer border-b border-gray-100 px-3 py-2 text-left text-[12px] hover:bg-gray-50"
                    >
                      <div className="font-medium text-[#0f1729]">Save Changes</div>
                      <div className="mt-0.5 truncate text-[10.5px] text-gray-500">
                        Overwrites &ldquo;{t.name}&rdquo;
                      </div>
                    </button>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => {
                    setSaveTplOpen(false);
                    setSaveTplPanel("new");
                    setSaveTplName(subject.trim().slice(0, 60));
                  }}
                  className="block w-full cursor-pointer px-3 py-2 text-left text-[12px] text-[#0f1729] hover:bg-gray-50"
                >
                  Save As New Template
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSaveTplOpen(false);
                    setSaveTplPanel("update");
                    setSaveTplTargetId(templateId);
                  }}
                  disabled={templates.length === 0}
                  className="block w-full cursor-pointer border-t border-gray-100 px-3 py-2 text-left text-[12px] text-[#0f1729] hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  Overwrite Existing Template
                </button>
              </div>
            )}
            {saveTplPanel && (
              <div className="absolute bottom-full left-0 z-30 mb-2 w-[420px] overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-[0_16px_40px_-8px_rgba(15,23,41,0.18)]">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <div>
                    <div className="text-[13px] font-medium text-[#0f1729]">
                      {saveTplPanel === "new" ? "Save As New Template" : "Overwrite Existing Template"}
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-500">
                      {saveTplPanel === "new"
                        ? "Reuse this email from any lead's Send Email modal."
                        : "Overwrite an existing template with this subject and body."}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSaveTplPanel(null);
                      setSaveTplTargetId(null);
                      setUpdateSearch("");
                    }}
                    className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Close"
                  >
                    <IconX size={14} stroke={1.75} />
                  </button>
                </div>
                <div className="px-4 py-3">
                  {saveTplPanel === "new" ? (
                    <div>
                      <label className="text-[10.5px] uppercase tracking-[0.08em] text-gray-500">
                        Template Name
                      </label>
                      <input
                        autoFocus
                        value={saveTplName}
                        onChange={(e) => setSaveTplName(e.target.value)}
                        placeholder="Opening Outreach — Tax Sale"
                        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-[#0d4b3a]"
                      />
                      <div className="mt-3 rounded-md border border-gray-200 bg-gray-50/60 px-3 py-2 text-[11.5px] text-gray-500">
                        Subject: <span className="text-[#0f1729]">{subject.trim() || "—"}</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <IconSearch size={12} stroke={1.75} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          autoFocus
                          value={updateSearch}
                          onChange={(e) => setUpdateSearch(e.target.value)}
                          placeholder="Search templates by name or subject..."
                          className="w-full rounded-md border border-gray-200 bg-white py-1.5 pl-7 pr-2.5 text-[12.5px] outline-none focus:border-[#0d4b3a]"
                        />
                      </div>
                      <div className="mt-2 max-h-[220px] overflow-auto rounded-md border border-gray-200">
                        {templates
                          .filter(
                            (t) =>
                              updateSearch.trim() === "" ||
                              t.name.toLowerCase().includes(updateSearch.toLowerCase()) ||
                              t.subject.toLowerCase().includes(updateSearch.toLowerCase())
                          )
                          .map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setSaveTplTargetId(t.id)}
                              className={
                                "flex w-full cursor-pointer items-start gap-2.5 border-b border-gray-100 px-3 py-2 text-left last:border-0 hover:bg-gray-50 " +
                                (saveTplTargetId === t.id ? "bg-[#0d4b3a]/[0.04]" : "")
                              }
                            >
                              <span
                                className={
                                  "mt-1 h-2.5 w-2.5 shrink-0 rounded-full border " +
                                  (saveTplTargetId === t.id
                                    ? "border-[#0d4b3a] bg-[#0d4b3a]"
                                    : "border-gray-300")
                                }
                              />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[12.5px] font-medium text-[#0f1729]">
                                  {t.name}
                                </div>
                                {t.subject && (
                                  <div className="truncate text-[11px] text-gray-500">{t.subject}</div>
                                )}
                                <div className="mt-0.5 text-[10.5px] text-gray-400">
                                  Updated {new Date(t.updated_at).toLocaleDateString()}
                                </div>
                              </div>
                            </button>
                          ))}
                        {templates.length === 0 && (
                          <div className="px-3 py-4 text-center text-[11.5px] text-gray-500">
                            No templates yet. Use Save as new instead.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50/40 px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSaveTplPanel(null);
                      setSaveTplTargetId(null);
                      setUpdateSearch("");
                    }}
                    className="cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      pending ||
                      (saveTplPanel === "new" && saveTplName.trim() === "") ||
                      (saveTplPanel === "update" && !saveTplTargetId)
                    }
                    onClick={() => {
                      if (saveTplPanel === "new") {
                        saveTemplate({ id: null, name: saveTplName.trim() });
                      } else if (saveTplTargetId) {
                        const t = templates.find((x) => x.id === saveTplTargetId);
                        if (t) saveTemplate({ id: t.id, name: t.name });
                      }
                    }}
                    className="btn-primary cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pending ? "Saving…" : saveTplPanel === "new" ? "Save Template" : "Update Template"}
                  </button>
                </div>
              </div>
            )}
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

function TemplatePicker({
  templates,
  value,
  onChange,
}: {
  templates: EmailTemplateRow[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const selected = templates.find((t) => t.id === value);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-left text-[13px] hover:border-gray-300"
      >
        <span className={selected ? "text-[#0f1729]" : "text-gray-400"}>
          {selected?.name ?? "No template"}
        </span>
        <IconChevronDown size={12} stroke={2} className="text-gray-400" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[260px] overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="block w-full cursor-pointer px-3 py-2 text-left text-[12.5px] text-gray-500 hover:bg-gray-50"
          >
            No template
          </button>
          {templates.length > 0 && <div className="border-t border-gray-100" />}
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onChange(t.id);
                setOpen(false);
              }}
              className={
                "block w-full cursor-pointer px-3 py-2 text-left text-[12.5px] hover:bg-gray-50 " +
                (t.id === value ? "bg-gray-50 text-[#0f1729]" : "text-[#0f1729]")
              }
            >
              <div className="truncate font-medium">{t.name}</div>
              {t.subject && (
                <div className="truncate text-[11px] text-gray-500">{t.subject}</div>
              )}
            </button>
          ))}
        </div>
      )}
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
  const inputRef = useRef<HTMLInputElement | null>(null);

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
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
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
        <div
          className="flex cursor-text flex-wrap items-center gap-1.5"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              inputRef.current?.focus();
            }
          }}
        >
          {selected.map((s) => (
            <Chip key={s.email} sel={s} onRemove={() => remove(s)} />
          ))}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onBlur={() => commitRawEmail()}
            onKeyDown={onKeyDown}
            placeholder={
              selected.length === 0
                ? "Search contacts or type an email…"
                : "Add another…"
            }
            className="flex-1 min-w-[140px] border-0 bg-transparent text-[13px] outline-none placeholder:text-gray-400"
          />
        </div>
        {open && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-[300px] overflow-auto rounded-md border border-gray-200 bg-white shadow-[0_16px_40px_-8px_rgba(15,23,41,0.18)]">
            {matches.length > 0 && (
              <>
                <div className="border-b border-gray-200 bg-gray-50/60 px-3 py-1 text-[10px] uppercase tracking-[0.08em] text-gray-500">
                  On this lead
                </div>
                {matches.map((c) => (
                  <button
                    key={c.contact_id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      add(c);
                    }}
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
              <div className="px-3 py-3 text-[12px] text-gray-500">
                {selected.length === 0 ? (
                  <div className="flex items-center gap-2">
                    <IconSearch size={12} stroke={1.75} />
                    No contacts on this lead. Type an email to add.
                  </div>
                ) : candidates.every((c) =>
                    selected.find((s) => s.contactId === c.contact_id || s.email === c.email)
                  ) ? (
                  <div className="flex items-center gap-2">
                    <IconSearch size={12} stroke={1.75} />
                    All lead contacts added. Type an email to add another.
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <IconSearch size={12} stroke={1.75} />
                    No matches. Keep typing or paste a full email.
                  </div>
                )}
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
