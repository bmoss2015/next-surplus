"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import {
  sendMail,
  previewMailMergeDocx,
  getMailTemplateAttachmentPageCount,
  type RecipientInput,
} from "@/lib/mail/actions";
import { renderMerge, MERGE_FIELDS, MERGE_GROUP_LABELS } from "@/lib/mail/merge";
import type { MailTemplateRow } from "@/lib/settings/fetch";
import type { SendMailFromAddress } from "./SendMailButton";

// SuperDoc is heavy — only load it on the client when a Word-doc preview
// actually needs to render. Mirrors the dynamic import in the settings
// template editor.
const SuperDocEditor = dynamic(
  () =>
    import("@/app/(app)/settings/_components/SuperDocEditor").then(
      (m) => m.SuperDocEditor
    ),
  { ssr: false }
);

export type SendMailModalRecipient = {
  // Stable id we use for the multi-select toggle in the picker UI
  key: string;
  // Optional: the underlying record references (so the mail_jobs row links)
  relative_id?: string | null;
  lead_party_id?: string | null;
  lead_id?: string | null;
  // Relationship shown as a chip in the picker (e.g. Owner, Relative,
  // Contact, or a lead-party role like "County Clerk"). Defaults to
  // "Recipient" when the source row has no clearer label.
  relation: string;
  // Whether a letter has already been sent to this recipient (and when).
  // Only meaningful for contacts-table rows; relatives and lead_parties
  // don't track this yet so they always report false.
  mailed: boolean;
  mailed_at: string | null;
  // The merge context for this recipient — first_name, last_name, address...
  contact: {
    first_name: string;
    last_name: string;
    full_name: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postal_code: string;
  };
  // Optional context for {{lead.*}} merge fields
  lead?: Record<string, string | number | null | undefined>;
};

export type SendMailModalProps = {
  open: boolean;
  onClose: () => void;
  templates: MailTemplateRow[];
  candidates: SendMailModalRecipient[];
  bankAccounts: { id: string; label: string; verified: boolean }[];
  defaultMailClass?: "standard" | "first_class" | "certified";
  // True when the org has a complete return address. When false, sending is
  // blocked at the UI level and a callout explains where to fix it.
  mailReady: boolean;
  fromAddress: SendMailFromAddress;
};

export function SendMailModal({
  open,
  onClose,
  templates,
  candidates,
  bankAccounts,
  defaultMailClass = "first_class",
  mailReady,
  fromAddress,
}: SendMailModalProps) {
  const hasVerifiedBank = bankAccounts.some((b) => b.verified);
  const router = useRouter();
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    new Set(candidates.slice(0, 1).map((c) => c.key))
  );
  const [templateId, setTemplateId] = useState<string | "blank">(
    templates[0]?.id ?? "blank"
  );
  const [body, setBody] = useState<string>(() => {
    const t = templates.find((t) => t.id === templateId);
    return t?.body_html ?? "";
  });
  const [mailClass, setMailClass] = useState<
    "standard" | "first_class" | "certified"
  >(defaultMailClass);
  const [includeCheck, setIncludeCheck] = useState(false);
  const [checkAmount, setCheckAmount] = useState<string>("");
  const [checkMemo, setCheckMemo] = useState<string>("");
  const [bankAccountId, setBankAccountId] = useState<string>(
    bankAccounts.find((b) => b.verified)?.id ?? ""
  );
  const [colorPrint, setColorPrint] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  // Track whether the user has previewed the CURRENT body+recipient combo.
  // Reset whenever body or selected recipients change so any edit forces a
  // fresh preview before we let them send physical mail.
  const [previewedSignature, setPreviewedSignature] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [bodyRef, setBodyRef] = useState<HTMLTextAreaElement | null>(null);

  // Templates show in alphabetical order. Folder-aware grouping in the
  // picker UI happens at render time below.
  const sortedTemplates = useMemo(
    () => [...templates].sort((a, b) => a.name.localeCompare(b.name)),
    [templates]
  );

  const selectedRecipients = useMemo(
    () => candidates.filter((c) => selectedKeys.has(c.key)),
    [candidates, selectedKeys]
  );

  // A signature string that changes whenever anything the recipient will see
  // changes. Compared against previewedSignature to require a fresh preview
  // before sending physical mail.
  const currentSignature = useMemo(
    () => `${body}|${selectedRecipients.map((r) => r.key).sort().join(",")}`,
    [body, selectedRecipients]
  );
  const hasPreviewed = previewedSignature === currentSignature;

  const checkAmountCents = useMemo(() => {
    const n = parseFloat(checkAmount);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n * 100);
  }, [checkAmount]);

  function pickTemplate(id: string) {
    setTemplateId(id);
    if (id === "blank") {
      setBody("");
      return;
    }
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    // File-based templates (.docx with optional PDF attachments) don't
    // need a body — merge happens against the Word doc itself at send
    // time. Reset body so the empty-body guard doesn't block sending.
    if (t.docx_path) {
      setBody("");
    } else if (t.body_html) {
      setBody(t.body_html);
    }
    if (t.default_mail_class) setMailClass(t.default_mail_class);
  }

  // Memoized lookup for the currently picked template so the rest of
  // the form can branch on file vs HTML without re-finding.
  const selectedTemplate = useMemo(
    () => templates.find((x) => x.id === templateId) ?? null,
    [templates, templateId]
  );
  const isFileTemplate = Boolean(selectedTemplate?.docx_path);

  // Real PDF page count across the selected template's attachments,
  // counted server-side via pdfjs-dist when a file template is picked.
  // Null while loading or when not applicable. Word cover page count
  // remains unknown (not renderable without LibreOffice).
  const [attachmentPdfPages, setAttachmentPdfPages] = useState<number | null>(
    null
  );
  useEffect(() => {
    if (!isFileTemplate || !selectedTemplate) {
      setAttachmentPdfPages(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await getMailTemplateAttachmentPageCount(selectedTemplate.id);
      if (cancelled) return;
      setAttachmentPdfPages(res.ok ? res.pdf_pages : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [isFileTemplate, selectedTemplate?.id]);

  function insertField(key: string) {
    const token = `{{${key}}}`;
    if (!bodyRef) {
      setBody((prev) => prev + token);
      return;
    }
    const start = bodyRef.selectionStart ?? body.length;
    const end = bodyRef.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      bodyRef.focus();
      const cursor = start + token.length;
      bodyRef.setSelectionRange(cursor, cursor);
    });
  }

  function toggleRecipient(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function buildMergeContext(r: SendMailModalRecipient) {
    return {
      "contact.first_name": r.contact.first_name,
      "contact.last_name": r.contact.last_name,
      "contact.full_name": r.contact.full_name,
      "contact.address": [
        r.contact.line1,
        r.contact.line2,
        `${r.contact.city}, ${r.contact.state} ${r.contact.postal_code}`,
      ]
        .filter(Boolean)
        .join("\n"),
      "contact.city": r.contact.city,
      "contact.state": r.contact.state,
      "contact.zip": r.contact.postal_code,
      ...(r.lead ?? {}),
    } as Record<string, string | number | null | undefined>;
  }

  function send() {
    setErr(null);
    if (selectedRecipients.length === 0) {
      setErr("Pick at least one recipient");
      return;
    }
    if (!isFileTemplate && !body.trim()) {
      setErr("Letter body is required");
      return;
    }
    if (includeCheck) {
      if (checkAmountCents <= 0) {
        setErr("Enter a check amount greater than zero");
        return;
      }
      if (!bankAccountId) {
        setErr("Pick a verified bank account for the check");
        return;
      }
    }
    const payload = {
      recipients: selectedRecipients.map<RecipientInput>((r) => ({
        relative_id: r.relative_id ?? null,
        lead_party_id: r.lead_party_id ?? null,
        lead_id: r.lead_id ?? null,
        name: r.contact.full_name,
        line1: r.contact.line1,
        line2: r.contact.line2 ?? null,
        city: r.contact.city,
        state: r.contact.state,
        postal_code: r.contact.postal_code,
        country: "US",
        merge_context: buildMergeContext(r),
      })),
      template_id: templateId === "blank" ? null : templateId,
      body_html: body,
      mail_class: mailClass,
      color: colorPrint,
      include_check: includeCheck,
      check_amount_cents: includeCheck ? checkAmountCents : null,
      check_memo: includeCheck ? checkMemo || null : null,
      bank_account_id: includeCheck ? bankAccountId || null : null,
    };
    startTransition(async () => {
      const res = await sendMail(payload);
      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        setErr(res.error);
      }
    });
  }

  const inputClass =
    "rounded-md border border-gray-200 bg-surface px-3 py-[8px] text-[13px] text-ink outline-none focus:border-petrol-500";
  const labelClass =
    "text-[11px] font-semibold uppercase tracking-wide text-gray-500";
  const sectionClass = "space-y-2";

  return (
    <Modal
      open={open}
      onClose={pending ? () => {} : onClose}
      title="Send Mail"
      description={
        selectedRecipients.length > 1
          ? `Batch of ${selectedRecipients.length}`
          : undefined
      }
      width={showPreview ? 920 : 680}
    >
      {showPreview ? (
        <PreviewPane
          recipients={selectedRecipients}
          body={body}
          buildContext={buildMergeContext}
          idx={previewIdx}
          setIdx={setPreviewIdx}
          color={colorPrint}
          fileTemplate={
            isFileTemplate && selectedTemplate
              ? {
                  name: selectedTemplate.name,
                  attachmentNames: selectedTemplate.attachment_paths.map(
                    (p) => p.split("/").pop() ?? p
                  ),
                }
              : null
          }
          templateId={
            isFileTemplate && selectedTemplate ? selectedTemplate.id : null
          }
          fromAddress={fromAddress}
          onBack={() => setShowPreview(false)}
        />
      ) : (
        <div className="space-y-5">
          {!mailReady && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-danger">
              Your return address isn&apos;t filled out yet. Add a Company
              Address in Settings before sending mail.
            </div>
          )}

          {/* Recipients */}
          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <div className={labelClass}>Recipients</div>
              <div className="text-[11px] text-gray-500">
                {selectedRecipients.length} of {candidates.length} selected
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-gray-50">
              {candidates.length === 0 ? (
                <div className="px-3 py-3 text-[12px] text-gray-500">
                  No candidates with mailing addresses found.
                </div>
              ) : (
                candidates.map((c) => {
                  const checked = selectedKeys.has(c.key);
                  return (
                    <label
                      key={c.key}
                      className="flex cursor-pointer items-start gap-3 border-b border-gray-150 px-3 py-[10px] last:border-b-0 hover:bg-white"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRecipient(c.key)}
                        className="mt-[4px] cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-medium text-ink">
                            {c.contact.full_name}
                          </span>
                          <span className="rounded-full border border-petrol-200 bg-petrol-50 px-2 py-[1px] text-[10px] font-medium text-petrol-700">
                            {c.relation}
                          </span>
                          {c.mailed ? (
                            <span className="rounded-full bg-gradient-to-br from-[#0a3d4a] to-[#0d6c7d] px-2 py-[1px] text-[10px] font-medium text-white">
                              Mailed
                              {c.mailed_at
                                ? ` ${new Date(c.mailed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                                : ""}
                            </span>
                          ) : (
                            <span className="rounded-full border border-gray-200 bg-white px-2 py-[1px] text-[10px] font-medium text-gray-500">
                              Not Mailed
                            </span>
                          )}
                        </div>
                        <div className="mt-[2px] text-[11.5px] text-gray-500">
                          {c.contact.line1}
                          {c.contact.line2 ? `, ${c.contact.line2}` : ""} —{" "}
                          {c.contact.city}, {c.contact.state}{" "}
                          {c.contact.postal_code}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Template */}
          <div className="space-y-1">
            <div className={labelClass}>Template</div>
            <select
              value={templateId}
              onChange={(e) => pickTemplate(e.target.value)}
              className={`${inputClass} w-full cursor-pointer`}
            >
              <option value="blank">Blank (write from scratch)</option>
              {sortedTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Body — hidden when a Word/PDF template is picked, since merge
              happens against the template's own document at send time. */}
          {isFileTemplate ? (
            <div className="rounded-md border border-petrol-200 bg-petrol-50 p-3">
              <div className="text-[12px] font-medium text-petrol-700">
                Document Template
              </div>
              <div className="mt-1 text-[11px] leading-relaxed text-ink">
                This template is a Word document
                {selectedTemplate &&
                selectedTemplate.attachment_paths.length > 0
                  ? ` plus ${selectedTemplate.attachment_paths.length} attachment${
                      selectedTemplate.attachment_paths.length === 1 ? "" : "s"
                    }`
                  : ""}
                . Merge fields fill in automatically per recipient at print
                time — no body text needed here.
              </div>
              {selectedTemplate &&
                selectedTemplate.attachment_paths.length > 0 && (
                  <ul className="mt-2 space-y-[2px] text-[11px] text-gray-600">
                    {selectedTemplate.attachment_paths.map((p, i) => (
                      <li key={p}>
                        {i + 1}. {p.split("/").pop()}
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className={labelClass}>Body</div>
                <FieldPicker onInsert={insertField} />
              </div>
              <textarea
                ref={setBodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                placeholder="Dear {{contact.first_name}},..."
                className={`${inputClass} w-full resize-y font-mono`}
              />
            </div>
          )}

          {/* Mail class */}
          <div className={sectionClass}>
            <div className={labelClass}>Mail Class</div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["standard", "Standard", "3-10 days"],
                  ["first_class", "First Class", "1-5 days"],
                  ["certified", "Certified", "Proof of receipt"],
                ] as const
              ).map(([value, label, sub]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer flex-col gap-[2px] rounded-md border px-3 py-2 text-[13px] ${
                    mailClass === value
                      ? "border-petrol-500 bg-petrol-500/5"
                      : "border-gray-200 bg-surface hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="mail_class"
                      value={value}
                      checked={mailClass === value}
                      onChange={() => setMailClass(value)}
                      className="cursor-pointer"
                    />
                    <span className="font-medium text-ink">{label}</span>
                  </div>
                  <span className="pl-[20px] text-[11px] text-gray-500">
                    {sub}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Color toggle */}
          <div className={sectionClass}>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-gray-200 bg-surface px-3 py-[10px] hover:border-gray-300">
              <div>
                <div className="text-[13px] font-medium text-ink">
                  Print in Color
                </div>
                <div className="text-[11px] text-gray-500">
                  Adds about $0.10&ndash;$0.20 per piece. Off = black and white.
                </div>
              </div>
              <input
                type="checkbox"
                checked={colorPrint}
                onChange={(e) => setColorPrint(e.target.checked)}
                className="cursor-pointer"
              />
            </label>
          </div>

          {/* Check */}
          <div className="space-y-2 rounded-md border border-gray-200 p-3">
            <label
              className={`flex items-center gap-2 ${hasVerifiedBank ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
              title={
                hasVerifiedBank
                  ? undefined
                  : "Add and verify a bank account in Settings before sending checks"
              }
            >
              <input
                type="checkbox"
                checked={includeCheck}
                disabled={!hasVerifiedBank}
                onChange={(e) => setIncludeCheck(e.target.checked)}
                className="cursor-pointer"
              />
              <span className="text-[13px] font-medium text-ink">
                Include a check with this letter
              </span>
              {!hasVerifiedBank && (
                <span className="ml-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-[1px] text-[10px] font-medium text-gray-500">
                  Needs verified bank account
                </span>
              )}
            </label>
            {includeCheck && (
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={checkAmount}
                  onChange={(e) => setCheckAmount(e.target.value)}
                  placeholder="Amount ($)"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={checkMemo}
                  onChange={(e) => setCheckMemo(e.target.value)}
                  placeholder="Memo"
                  className={inputClass}
                />
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className={`${inputClass} col-span-2 cursor-pointer`}
                >
                  <option value="">Pick a bank account</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id} disabled={!b.verified}>
                      {b.label}
                      {b.verified ? "" : " (unverified)"}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {err && <div className="text-[12px] text-danger">{err}</div>}

          {selectedRecipients.length > 0 && (
            <CostEstimate
              recipients={selectedRecipients.length}
              mailClass={mailClass}
              attachmentPdfPages={
                isFileTemplate && attachmentPdfPages != null
                  ? attachmentPdfPages
                  : null
              }
              attachmentFileCount={
                isFileTemplate && selectedTemplate
                  ? selectedTemplate.attachment_paths.length
                  : 0
              }
              isFileTemplate={isFileTemplate}
              includeCheck={includeCheck}
            />
          )}

          <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-xs text-ink hover:border-petrol-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewIdx(0);
                setShowPreview(true);
                setPreviewedSignature(currentSignature);
              }}
              disabled={
                pending ||
                selectedRecipients.length === 0 ||
                (!isFileTemplate && !body.trim())
              }
              className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-xs text-ink hover:border-petrol-500 disabled:opacity-50"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={send}
              disabled={
                pending ||
                !mailReady ||
                selectedRecipients.length === 0 ||
                (!isFileTemplate && !body.trim()) ||
                !hasPreviewed ||
                (includeCheck && !hasVerifiedBank)
              }
              title={
                !mailReady
                  ? "Add a Company Address in Settings before sending mail"
                  : !hasPreviewed && selectedRecipients.length > 0
                    ? "Preview the letter before sending — printed mail can't be unsent"
                    : undefined
              }
              className="cursor-pointer rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white disabled:opacity-50"
            >
              {pending
                ? "Sending..."
                : selectedRecipients.length <= 1
                  ? "Send Letter"
                  : `Send ${selectedRecipients.length} Letters`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// Cost estimate showing C2M's published starting-from prices from
// https://click2mail.com/letter-8-5-x-11 (verified Feb 2026) plus real
// PDF page counts (counted server-side via pdfjs-dist). The Word cover
// page count isn't knowable until C2M renders it, so we surface it as
// "1+". The exact charge comes back on each mail_jobs row after C2M
// accepts the job.
function CostEstimate({
  recipients,
  mailClass,
  attachmentPdfPages,
  attachmentFileCount,
  isFileTemplate,
  includeCheck,
}: {
  recipients: number;
  mailClass: "standard" | "first_class" | "certified";
  attachmentPdfPages: number | null;
  attachmentFileCount: number;
  isFileTemplate: boolean;
  includeCheck: boolean;
}) {
  // Source: click2mail.com/letter-8-5-x-11 "Starting from" list prices.
  const c2mFloorByClass: Record<typeof mailClass, number> = {
    standard: 0.59,
    first_class: 0.59,
    certified: 6.66,
  };
  const c2mFloor = c2mFloorByClass[mailClass];
  const fmt = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  // Page summary string — only as specific as we can verify.
  const pagesPerPiece = (() => {
    if (!isFileTemplate) return "1+"; // HTML body, unknown until rendered
    if (attachmentPdfPages == null) {
      return attachmentFileCount > 0 ? "Word cover + attachments" : "1+";
    }
    return `Word cover + ${attachmentPdfPages} PDF page${attachmentPdfPages === 1 ? "" : "s"}`;
  })();
  const c2mTotalFloor = c2mFloor * recipients;
  const checkTotal = includeCheck ? 1.16 * recipients : 0;
  const grandFloor = c2mTotalFloor + checkTotal;
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-ink">
      <div className="flex items-center justify-between">
        <span className="font-medium">Estimated minimum</span>
        <span className="font-mono text-ink">{fmt(grandFloor)}</span>
      </div>
      <div className="mt-[2px] text-[10px] text-gray-600">
        {recipients} {recipients === 1 ? "piece" : "pieces"} · {pagesPerPiece}{" "}
        per piece · letter from {fmt(c2mFloor)} each
        {includeCheck ? ` · Lob check ${fmt(1.16)} each` : ""}
      </div>
      <div className="mt-[2px] text-[10px] italic text-gray-400">
        Starting price per Click2Mail's letter listing — final charge
        depends on rendered page count + paper / class options, and
        comes back from C2M when the job is accepted.
      </div>
    </div>
  );
}

function FieldPicker({ onInsert }: { onInsert: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[11px] font-medium text-ink hover:border-petrol-500"
      >
        Insert Field {open ? "▴" : "▾"}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 max-h-[360px] w-[300px] overflow-y-auto rounded-md border border-gray-200 bg-surface shadow-card">
          {(["recipient", "lead", "sender", "system"] as const).map((group) => {
            const fields = MERGE_FIELDS.filter((f) => f.group === group);
            if (fields.length === 0) return null;
            return (
              <div key={group}>
                <div className="border-b border-petrol-100 bg-petrol-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-petrol-700">
                  {MERGE_GROUP_LABELS[group]}
                </div>
                {fields.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    title={`e.g. ${f.example}`}
                    onClick={() => {
                      onInsert(f.key);
                      setOpen(false);
                    }}
                    className="block w-full cursor-pointer px-3 py-[5px] text-left hover:bg-petrol-50"
                  >
                    <div className="text-[11px] leading-tight text-ink">{f.label}</div>
                    <div className="truncate text-[10px] italic leading-tight text-gray-400">
                      e.g. {f.example}
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PreviewPane({
  recipients,
  body,
  buildContext,
  idx,
  setIdx,
  color,
  fileTemplate,
  templateId,
  fromAddress,
  onBack,
}: {
  recipients: SendMailModalRecipient[];
  body: string;
  buildContext: (
    r: SendMailModalRecipient
  ) => Record<string, string | number | null | undefined>;
  idx: number;
  setIdx: (n: number) => void;
  color: boolean;
  fileTemplate: { name: string; attachmentNames: string[] } | null;
  templateId: string | null;
  fromAddress: SendMailFromAddress;
  onBack: () => void;
}) {
  const recipient = recipients[idx];
  const rendered =
    recipient && !fileTemplate
      ? renderMerge(body, buildContext(recipient))
      : "";

  // For file templates: fetch the merged .docx from the server (so the
  // user sees the actual document with their data filled in, not just a
  // table of merge values). Re-runs whenever the recipient or the
  // template changes.
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const [docxLoading, setDocxLoading] = useState(false);
  const [docxErr, setDocxErr] = useState<string | null>(null);
  useEffect(() => {
    if (!fileTemplate || !recipient || !templateId) {
      setDocxBlob(null);
      return;
    }
    let cancelled = false;
    setDocxLoading(true);
    setDocxErr(null);
    setDocxBlob(null);
    (async () => {
      const res = await previewMailMergeDocx({
        template_id: templateId,
        recipient_merge_context: buildContext(recipient),
      });
      if (cancelled) return;
      if (!res.ok) {
        setDocxErr(res.error);
        setDocxLoading(false);
        return;
      }
      const bytes = Uint8Array.from(atob(res.base64), (c) => c.charCodeAt(0));
      setDocxBlob(
        new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        })
      );
      setDocxLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileTemplate?.name, recipient?.key, templateId]);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[11px] font-medium text-ink hover:border-petrol-500"
        >
          ← Back to editor
        </button>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-md border px-2 py-[2px] text-[10px] font-medium uppercase tracking-wide ${
              color
                ? "border-petrol-200 bg-petrol-50 text-petrol-700"
                : "border-gray-200 bg-gray-50 text-gray-500"
            }`}
          >
            {color ? "Color Print" : "Black & White"}
          </span>
          {recipients.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setIdx(Math.max(0, idx - 1))}
                disabled={idx === 0}
                className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[11px] text-ink disabled:opacity-40"
              >
                ←
              </button>
              <div className="text-[11px] text-gray-500">
                {idx + 1} / {recipients.length}
              </div>
              <button
                type="button"
                onClick={() => setIdx(Math.min(recipients.length - 1, idx + 1))}
                disabled={idx >= recipients.length - 1}
                className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[11px] text-ink disabled:opacity-40"
              >
                →
              </button>
            </>
          )}
        </div>
      </div>
      {/* Envelope-shaped preview chrome — From in upper-left, To centered
          lower, stamp box upper-right. Makes it visually obvious what
          this is before reading the paper. */}
      <div
        className="relative mx-auto w-full max-w-[640px] rounded-md border border-gray-300 bg-white px-4 py-3 shadow-sm"
        style={{ aspectRatio: "2.3 / 1" }}
      >
        {/* Stamp box — top right corner */}
        <div className="absolute right-3 top-3 flex h-10 w-12 items-center justify-center rounded-sm border-2 border-dashed border-gray-300 text-[8px] uppercase tracking-wide text-gray-400">
          Postage
        </div>

        {/* Return address — top left */}
        <div className="text-[10px] leading-tight text-ink">
          <div className="font-medium">{fromAddress.name}</div>
          <div>{fromAddress.line1}</div>
          {fromAddress.line2 && <div>{fromAddress.line2}</div>}
          <div>
            {fromAddress.city}, {fromAddress.region} {fromAddress.postal_code}
          </div>
        </div>

        {/* Recipient — visually centered */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-[11px] leading-snug text-ink">
          <div className="font-medium">{recipient?.contact.full_name}</div>
          <div>{recipient?.contact.line1}</div>
          {recipient?.contact.line2 && (
            <div>{recipient.contact.line2}</div>
          )}
          <div>
            {recipient?.contact.city}, {recipient?.contact.state}{" "}
            {recipient?.contact.postal_code}
          </div>
        </div>
      </div>

      {fileTemplate && fileTemplate.attachmentNames.length > 0 && (
        <div className="mx-auto max-w-[640px] text-[10px] text-gray-500">
          Inside: 1. {fileTemplate.name}
          {fileTemplate.attachmentNames.map((n, i) => (
            <span key={n}>
              {" "}
              · {i + 2}. {n}
            </span>
          ))}
        </div>
      )}

      {/* Paper preview. SuperDoc renders the merged docx in viewing mode
          (editing it inline would diverge from the saved template — to
          change wording, edit the template in Settings). HTML bodies
          render on a scaled-down 8.5×11 page so margins and proportion
          read as a real letter, not a giant block of text. */}
      <div
        className="flex justify-center"
        style={color ? undefined : { filter: "grayscale(100%)" }}
      >
        {fileTemplate ? (
          <div className="w-full">
            {docxLoading ? (
              <div className="rounded-md border border-gray-200 bg-white p-6 text-center text-[11px] text-gray-500 shadow-card">
                Rendering merged document...
              </div>
            ) : docxErr ? (
              <div className="rounded-md border border-danger/40 bg-red-50 p-3 text-[11px] text-danger">
                Preview failed: {docxErr}
              </div>
            ) : docxBlob ? (
              <SuperDocEditor
                source={docxBlob}
                autoHeight
                documentMode="viewing"
              />
            ) : null}
          </div>
        ) : (
          <div
            className="bg-white shadow-card"
            style={{
              // Scaled 8.5x11 — 0.6 scale so a single page fits inside
              // the modal without horizontal scroll. Real margins (1in)
              // are preserved at the scaled rate (~58px) so the body
              // sits where it would on actual paper.
              width: "510px",
              minHeight: "660px",
              padding: "58px",
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "10pt",
              lineHeight: 1.5,
              color: "#0f1729",
            }}
          >
            <pre
              className="whitespace-pre-wrap"
              style={{
                fontFamily: "inherit",
                fontSize: "inherit",
                lineHeight: "inherit",
                margin: 0,
              }}
            >
              {rendered}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
