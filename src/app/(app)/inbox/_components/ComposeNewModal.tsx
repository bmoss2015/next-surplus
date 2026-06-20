"use client";

import { useRef, useState, useTransition } from "react";
import {
  IconX,
  IconChevronDown,
  IconPaperclip,
  IconFile,
} from "@tabler/icons-react";
import type { Editor } from "@tiptap/react";
import { RichTextEditor } from "@/components/email/RichTextEditor";
import { sendEmail } from "../_send-actions";
import type { EmailAccountRow } from "@/lib/email/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TOTAL_ATTACHMENT_BYTES = 24 * 1024 * 1024;

type AttachmentDraft = {
  filename: string;
  mimeType: string;
  size: number;
  base64: string;
};

export function ComposeNewModal({
  open,
  onClose,
  accounts,
}: {
  open: boolean;
  onClose: () => void;
  accounts: EmailAccountRow[];
}) {
  const activeAccounts = accounts.filter((a) => a.status === "active");
  const defaultAccount = activeAccounts[0] ?? null;

  const [accountId, setAccountId] = useState<string | null>(
    defaultAccount?.id ?? null
  );
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [ccOpen, setCcOpen] = useState(false);
  const [bccOpen, setBccOpen] = useState(false);
  const [subject, setSubject] = useState("");

  const selectedAccount =
    activeAccounts.find((a) => a.id === accountId) ?? null;
  const signature = selectedAccount?.signature_html ?? "";
  const initialBody = signature ? `\n\n${signature}` : "";

  const [body, setBody] = useState(initialBody);
  const bodyEditorRef = useRef<Editor | null>(null);
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function resetAndClose() {
    setTo("");
    setCc("");
    setBcc("");
    setCcOpen(false);
    setBccOpen(false);
    setSubject("");
    setBody(initialBody);
    setAttachments([]);
    setErr(null);
    setAccountPickerOpen(false);
    onClose();
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const idx = result.indexOf(",");
        resolve(idx >= 0 ? result.slice(idx + 1) : result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function onFilesPicked(files: FileList | null) {
    if (!files || files.length === 0) return;
    setErr(null);
    const next = [...attachments];
    let total = next.reduce((s, a) => s + a.size, 0);
    for (const file of Array.from(files)) {
      if (total + file.size > MAX_TOTAL_ATTACHMENT_BYTES) {
        setErr(`Combined attachments would exceed 24 MB. Skipped: ${file.name}.`);
        continue;
      }
      const base64 = await fileToBase64(file);
      next.push({
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        base64,
      });
      total += file.size;
    }
    setAttachments(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function parseRecipients(raw: string): string[] {
    return raw
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function send() {
    setErr(null);
    if (!accountId) {
      setErr("Connect an email account in Settings first.");
      return;
    }
    const toList = parseRecipients(to);
    if (toList.length === 0) {
      setErr("Add at least one recipient.");
      return;
    }
    const ccList = parseRecipients(cc);
    const bccList = parseRecipients(bcc);
    const allRecipients = [...toList, ...ccList, ...bccList];
    const invalid = allRecipients.find((e) => !EMAIL_RE.test(e));
    if (invalid) {
      setErr(`Not a valid email: ${invalid}`);
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
      const res = await sendEmail({
        accountId,
        to: toList,
        cc: ccList.length > 0 ? ccList : undefined,
        bcc: bccList.length > 0 ? bccList : undefined,
        subject: subject.trim(),
        body,
        leadId: null,
        attachments:
          attachments.length > 0
            ? attachments.map((a) => ({
                filename: a.filename,
                mimeType: a.mimeType,
                base64: a.base64,
              }))
            : undefined,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      resetAndClose();
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div
        className="absolute inset-0"
        aria-hidden
        onClick={resetAndClose}
      />
      <div
        className="relative z-10 flex max-h-[92vh] w-[620px] max-w-[95vw] flex-col overflow-hidden rounded-[12px] border border-gray-200 bg-white shadow-[0_24px_64px_-16px_rgba(15,23,41,0.20)]"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-3.5">
          <div className="min-w-0">
            <div className="text-[10.5px] uppercase tracking-[0.08em] text-gray-400">
              New Email
            </div>
            <div className="mt-0.5 text-[14px] font-medium text-ink">
              {selectedAccount?.display_name ?? selectedAccount?.address ?? "Pick an Account"}
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <IconX size={16} stroke={1.75} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 divide-y divide-gray-200">
            {activeAccounts.length > 1 && (
              <div className="relative flex items-center gap-3 px-6 py-2.5 text-[12px]">
                <span className="w-[52px] shrink-0 text-gray-500">From</span>
                <button
                  type="button"
                  onClick={() => setAccountPickerOpen((v) => !v)}
                  className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink hover:text-petrol-500"
                >
                  {selectedAccount ? (
                    <>
                      <span className="font-medium">
                        {selectedAccount.display_name ?? selectedAccount.address}
                      </span>
                      <span className="text-gray-500">
                        {selectedAccount.address}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-400">Pick an account</span>
                  )}
                  <IconChevronDown
                    size={12}
                    stroke={2}
                    className="text-gray-400"
                  />
                </button>
                {accountPickerOpen && (
                  <div className="absolute left-[76px] top-full z-20 mt-1 w-[320px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,41,0.25)]">
                    {activeAccounts.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setAccountId(a.id);
                          setAccountPickerOpen(false);
                        }}
                        className="block w-full cursor-pointer px-3 py-2 text-left text-[12px] hover:bg-gray-50"
                      >
                        <div className="font-medium text-ink">
                          {a.display_name ?? a.address}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {a.address}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 px-6 py-2.5 text-[12px]">
              <span className="w-[52px] shrink-0 text-gray-500">To</span>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="name@example.com, second@example.com"
                className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-gray-400"
              />
              <div className="flex items-center gap-2 text-[11px]">
                {!ccOpen && (
                  <button
                    type="button"
                    onClick={() => setCcOpen(true)}
                    className="cursor-pointer text-gray-500 hover:text-petrol-500"
                  >
                    Cc
                  </button>
                )}
                {!bccOpen && (
                  <button
                    type="button"
                    onClick={() => setBccOpen(true)}
                    className="cursor-pointer text-gray-500 hover:text-petrol-500"
                  >
                    Bcc
                  </button>
                )}
              </div>
            </div>

            {ccOpen && (
              <div className="flex items-center gap-3 px-6 py-2.5 text-[12px]">
                <span className="w-[52px] shrink-0 text-gray-500">Cc</span>
                <input
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-gray-400"
                />
              </div>
            )}

            {bccOpen && (
              <div className="flex items-center gap-3 px-6 py-2.5 text-[12px]">
                <span className="w-[52px] shrink-0 text-gray-500">Bcc</span>
                <input
                  type="text"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-gray-400"
                />
              </div>
            )}

            <div className="flex items-center gap-3 px-6 py-2.5 text-[12px]">
              <span className="w-[52px] shrink-0 text-gray-500">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 bg-transparent text-[13px] font-medium text-ink outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <RichTextEditor
              value={body}
              onChange={setBody}
              editorRef={bodyEditorRef}
              minRows={10}
              placeholder="Write your email..."
            />
          </div>
        </div>

        {attachments.length > 0 && (
          <div className="shrink-0 border-t border-gray-200 bg-gray-50/50 px-6 py-2.5">
            <div className="flex flex-wrap gap-1.5">
              {attachments.map((a, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-[3px] text-[11px] text-ink"
                >
                  <IconFile
                    size={11}
                    stroke={1.75}
                    className="text-petrol-500"
                  />
                  <span className="max-w-[180px] truncate">{a.filename}</span>
                  <span className="text-gray-400">{formatBytes(a.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="ml-[2px] cursor-pointer text-gray-400 hover:text-red-600"
                    aria-label="Remove attachment"
                  >
                    <IconX size={11} stroke={2} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {err && (
          <div className="shrink-0 border-t border-gray-200 bg-red-50 px-6 py-2 text-[12px] text-red-700">
            {err}
          </div>
        )}

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 px-6 py-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => onFilesPicked(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-600 hover:border-petrol-500 hover:text-petrol-500"
            >
              <IconPaperclip size={12} stroke={1.75} />
              Attach
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetAndClose}
              disabled={pending}
              className="w-[104px] cursor-pointer rounded-md border border-gray-200 bg-white py-1.5 text-[12px] font-medium text-gray-700 hover:border-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={send}
              disabled={pending || !selectedAccount}
              className="btn-primary w-[104px] cursor-pointer rounded-md py-1.5 text-[12px] font-medium text-white disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send Email"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
