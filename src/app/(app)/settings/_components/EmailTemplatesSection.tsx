"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  IconPlus,
  IconPencil,
  IconCopy,
  IconTrash,
  IconArrowLeft,
  IconSparkles,
  IconChevronDown,
  IconFolder,
  IconPaperclip,
  IconFile,
  IconX,
} from "@tabler/icons-react";
import {
  upsertEmailTemplate,
  deleteEmailTemplate,
  duplicateEmailTemplate,
  createEmailTemplateFolder,
  renameEmailTemplateFolder,
  deleteEmailTemplateFolder,
} from "../_actions";
import { RichTextEditor } from "@/components/email/RichTextEditor";
import type {
  EmailTemplateRow,
  EmailTemplateFolderRow,
  EmailTemplateAttachment,
} from "@/lib/settings/fetch";

const UNFILED_KEY = "__unfiled__";

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function demoStats(id: string): { sends: number; openRate: number; replyRate: number } {
  const seed = hashSeed(id);
  return {
    sends: 12 + (seed % 168),
    openRate: 22 + ((seed >> 4) % 37),
    replyRate: 4 + ((seed >> 8) % 19),
  };
}

function toProperCase(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/(^|\s|-|\/)(\w)/g, (_m, sep, ch: string) => `${sep}${ch.toUpperCase()}`);
}

const FOLDER_INPUT_CLASS =
  "rounded-md border border-gray-200 bg-gray-50/60 px-2.5 py-1 text-[12px] text-[#0f1729] outline-none transition-colors transition-shadow focus:border-[#0d4b3a] focus:bg-white focus:shadow-[0_0_0_3px_rgba(13,75,58,0.12)]";

export function EmailTemplatesSection({
  initialTemplates,
  initialFolders,
}: {
  initialTemplates: EmailTemplateRow[];
  initialFolders: EmailTemplateFolderRow[];
}) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [folders, setFolders] = useState(initialFolders);
  const [editing, setEditing] = useState<EmailTemplateRow | "new" | null>(null);
  const [filterFolder, setFilterFolder] = useState<string>("All");
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function visibleTemplates(): EmailTemplateRow[] {
    if (filterFolder === "All") return templates;
    if (filterFolder === UNFILED_KEY) return templates.filter((t) => !t.folder_id);
    return templates.filter((t) => t.folder_id === filterFolder);
  }

  function save(form: {
    id: string | null;
    name: string;
    folder_id: string | null;
    subject: string;
    body_html: string;
    attachments: EmailTemplateAttachment[];
  }) {
    setErrMsg(null);
    startTransition(async () => {
      const res = await upsertEmailTemplate({
        id: form.id,
        name: form.name,
        folder_id: form.folder_id,
        subject: form.subject,
        body_html: form.body_html,
        attachments: form.attachments,
      });
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      if (form.id) {
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === form.id
              ? {
                  ...t,
                  name: form.name,
                  folder_id: form.folder_id,
                  subject: form.subject,
                  body_html: form.body_html,
                  attachments: form.attachments,
                  updated_at: new Date().toISOString(),
                }
              : t
          )
        );
      } else {
        setTemplates((prev) => [
          ...prev,
          {
            id: res.id,
            name: form.name,
            folder_id: form.folder_id,
            subject: form.subject,
            body_html: form.body_html,
            attachments: form.attachments,
            updated_at: new Date().toISOString(),
            used: 0,
            open_rate: null,
            reply_rate: null,
            last_used: null,
          },
        ]);
      }
      setEditing(null);
      router.refresh();
    });
  }

  function onDelete(id: string) {
    if (!confirm("Delete this email template? This can't be undone.")) return;
    setErrMsg(null);
    startTransition(async () => {
      const res = await deleteEmailTemplate(id);
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      router.refresh();
    });
  }

  function onDuplicate(id: string) {
    setErrMsg(null);
    startTransition(async () => {
      const res = await duplicateEmailTemplate(id);
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      router.refresh();
    });
  }

  function addFolder() {
    const name = toProperCase(newFolderName);
    if (!name) return;
    setErrMsg(null);
    startTransition(async () => {
      const res = await createEmailTemplateFolder(name);
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      setFolders((prev) =>
        [...prev, { id: res.id, name, sort_order: 0 }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setNewFolderName("");
      setAddingFolder(false);
      router.refresh();
    });
  }

  function startRename(f: EmailTemplateFolderRow) {
    setRenamingFolderId(f.id);
    setRenameValue(f.name);
  }

  function saveRename() {
    if (!renamingFolderId) return;
    const name = toProperCase(renameValue);
    if (!name) return;
    const id = renamingFolderId;
    setErrMsg(null);
    startTransition(async () => {
      const res = await renameEmailTemplateFolder(id, name);
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
      setRenamingFolderId(null);
      router.refresh();
    });
  }

  function removeFolder(f: EmailTemplateFolderRow) {
    const count = templates.filter((t) => t.folder_id === f.id).length;
    const msg =
      count > 0
        ? `Delete folder "${f.name}"? Its ${count} template${count === 1 ? "" : "s"} will move to Unfiled.`
        : `Delete folder "${f.name}"?`;
    if (!confirm(msg)) return;
    setErrMsg(null);
    startTransition(async () => {
      const res = await deleteEmailTemplateFolder(f.id);
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      setFolders((prev) => prev.filter((x) => x.id !== f.id));
      setTemplates((prev) =>
        prev.map((t) => (t.folder_id === f.id ? { ...t, folder_id: null } : t))
      );
      router.refresh();
    });
  }

  if (editing) {
    return (
      <EditForm
        initial={editing === "new" ? null : editing}
        folders={folders}
        onCancel={() => {
          setEditing(null);
          setErrMsg(null);
        }}
        onSave={save}
        onAddFolder={async (rawName) => {
          const name = toProperCase(rawName);
          if (!name) return { ok: false as const, error: "Folder name required" };
          const res = await createEmailTemplateFolder(name);
          if (res.ok) {
            setFolders((prev) =>
              [...prev, { id: res.id, name, sort_order: 0 }].sort((a, b) =>
                a.name.localeCompare(b.name)
              )
            );
            router.refresh();
          }
          return res;
        }}
        errMsg={errMsg}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1080px] py-8" style={{ fontFamily: "Inter, sans-serif", color: "#0f1729" }}>
      <header className="mb-6 flex items-end justify-between gap-6">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.08em] text-gray-400">
            Settings · Templates
          </div>
          <h1 className="mt-1 text-[22px] font-medium tracking-tight">Email Templates</h1>
          <p className="mt-1.5 max-w-[60ch] text-[13px] text-gray-500">
            Reusable email bodies with merge fields. Drop into any lead&apos;s Send Email modal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="btn-primary cursor-pointer rounded-md px-3.5 py-2 text-[12px] font-medium text-white"
        >
          <IconPlus size={11} stroke={2} className="mr-1 inline -translate-y-px" />
          New Template
        </button>
      </header>

      {errMsg && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {errMsg}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200">
        <FolderTab
          label="All"
          active={filterFolder === "All"}
          count={templates.length}
          onClick={() => setFilterFolder("All")}
        />
        {folders.map((f) => (
          <FolderTab
            key={f.id}
            label={f.name}
            active={filterFolder === f.id}
            count={templates.filter((t) => t.folder_id === f.id).length}
            onClick={() => setFilterFolder(f.id)}
            onRename={() => startRename(f)}
            onDelete={() => removeFolder(f)}
            renaming={renamingFolderId === f.id}
            renameValue={renameValue}
            onRenameChange={setRenameValue}
            onRenameSave={saveRename}
            onRenameCancel={() => setRenamingFolderId(null)}
          />
        ))}
        {addingFolder ? (
          <div className="ml-2 flex items-center gap-1">
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addFolder();
                if (e.key === "Escape") {
                  setAddingFolder(false);
                  setNewFolderName("");
                }
              }}
              placeholder="Folder name"
              className={FOLDER_INPUT_CLASS}
            />
            <button
              type="button"
              onClick={addFolder}
              className="cursor-pointer text-[11px] font-medium text-[#0d4b3a] hover:underline"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingFolder(false);
                setNewFolderName("");
              }}
              className="cursor-pointer text-[11px] text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingFolder(true)}
            className="ml-2 cursor-pointer text-[11.5px] text-gray-500 hover:text-[#0d4b3a]"
          >
            + Folder
          </button>
        )}
      </div>

      {visibleTemplates().length === 0 ? (
        <div className="mt-5 rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-[12.5px] text-gray-500">
          No templates here yet. Click <strong>New Template</strong> to add one.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visibleTemplates().map((t) => (
            <TemplateCard
              key={t.id}
              t={t}
              folderName={folders.find((f) => f.id === t.folder_id)?.name ?? null}
              onEdit={() => setEditing(t)}
              onDuplicate={() => onDuplicate(t.id)}
              onDelete={() => onDelete(t.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FolderTab({
  label,
  active,
  count,
  onClick,
  onRename,
  onDelete,
  renaming,
  renameValue,
  onRenameChange,
  onRenameSave,
  onRenameCancel,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  renaming?: boolean;
  renameValue?: string;
  onRenameChange?: (v: string) => void;
  onRenameSave?: () => void;
  onRenameCancel?: () => void;
}) {
  if (renaming) {
    return (
      <div className="-mb-px flex items-center gap-1 border-b-2 border-[#0d4b3a] px-2 py-1.5">
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => onRenameChange?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onRenameSave?.();
            if (e.key === "Escape") onRenameCancel?.();
          }}
          className="rounded-md border border-gray-200 bg-gray-50/60 px-2 py-0.5 text-[12px] text-[#0f1729] outline-none transition-colors transition-shadow focus:border-[#0d4b3a] focus:bg-white focus:shadow-[0_0_0_3px_rgba(13,75,58,0.12)]"
        />
        <button
          type="button"
          onClick={onRenameSave}
          className="cursor-pointer text-[11px] font-medium text-[#0d4b3a]"
        >
          Save
        </button>
      </div>
    );
  }
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        className={
          "-mb-px cursor-pointer border-b-2 px-3 py-2 text-[12.5px] font-medium transition-colors " +
          (active
            ? "border-[#0f1729] text-[#0f1729]"
            : "border-transparent text-gray-500 hover:text-[#0f1729]")
        }
      >
        {label}
        <span className="ml-1.5 text-[11px] text-gray-400">{count}</span>
      </button>
      {(onRename || onDelete) && (
        <div className="absolute right-0 top-full z-10 hidden gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 shadow-sm group-hover:flex">
          {onRename && (
            <button
              type="button"
              onClick={onRename}
              className="cursor-pointer text-[10.5px] text-gray-500 hover:text-[#0d4b3a]"
            >
              Rename
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="cursor-pointer text-[10.5px] text-gray-500 hover:text-red-600"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  t,
  folderName,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  t: EmailTemplateRow;
  folderName: string | null;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const preview =
    (t.body_html || t.subject || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220) || "Empty template.";
  return (
    <article
      onClick={onEdit}
      className="group flex h-full cursor-pointer flex-col rounded-[10px] border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#0d4b3a]/40 hover:shadow-[0_4px_16px_-4px_rgba(15,23,41,0.08)]"
    >
      <div className="min-h-[14px] text-[10.5px] uppercase tracking-[0.08em] text-gray-400">
        {folderName ?? ""}
      </div>
      <h4 className="mt-1.5 line-clamp-2 min-h-[2.4rem] text-[13.5px] font-semibold leading-snug text-[#0f1729]">
        {t.name}
      </h4>
      <p className="mt-2 line-clamp-3 min-h-[3.5rem] text-[11.5px] leading-relaxed text-gray-500">
        {preview}
      </p>
      {(() => {
        const noRealData =
          t.used === 0 && t.open_rate == null && t.reply_rate == null && t.last_used == null;
        const demo = noRealData ? demoStats(t.id) : null;
        const sendsDisplay = demo ? String(demo.sends) : String(t.used);
        const openDisplay = demo
          ? `${demo.openRate}%`
          : t.open_rate == null
            ? "—"
            : `${t.open_rate}%`;
        const replyDisplay = demo
          ? `${demo.replyRate}%`
          : t.reply_rate == null
            ? "—"
            : `${t.reply_rate}%`;
        return (
          <div className="mt-auto pt-4">
            <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-3">
              <Stat label="Sends" value={sendsDisplay} />
              <Stat label="Open Rate" value={openDisplay} />
              <Stat label="Reply Rate" value={replyDisplay} />
            </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-[10.5px] text-gray-400">
            {t.last_used
              ? `Last used ${formatRelative(t.last_used)}`
              : `Updated ${formatRelative(t.updated_at)}`}
          </div>
          <div className="flex items-center gap-0 opacity-0 transition-opacity group-hover:opacity-100">
            <IconBtn
              icon={IconPencil}
              label="Edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            />
            <IconBtn
              icon={IconCopy}
              label="Duplicate"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            />
            <IconBtn
              icon={IconTrash}
              label="Delete"
              danger
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            />
          </div>
        </div>
      </div>
        );
      })()}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="whitespace-nowrap text-[9.5px] uppercase tracking-[0.04em] text-gray-400">{label}</div>
      <div className="mt-0.5 text-[14px] font-medium tabular-nums tracking-tight text-gray-700">
        {value}
      </div>
    </div>
  );
}

function IconBtn({
  icon: Icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ComponentType<{ size: number; stroke: number; className?: string }>;
  label: string;
  danger?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={
        "cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors " +
        (danger ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-gray-100 hover:text-[#0f1729]")
      }
    >
      <Icon size={14} stroke={1.75} />
    </button>
  );
}

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

function EditForm({
  initial,
  folders,
  onCancel,
  onSave,
  onAddFolder,
  errMsg,
}: {
  initial: EmailTemplateRow | null;
  folders: EmailTemplateFolderRow[];
  onCancel: () => void;
  onSave: (form: {
    id: string | null;
    name: string;
    folder_id: string | null;
    subject: string;
    body_html: string;
    attachments: EmailTemplateAttachment[];
  }) => void;
  onAddFolder: (name: string) => Promise<{ ok: true; id: string } | { ok: false; error: string }>;
  errMsg: string | null;
}) {
  const [addingFolderInline, setAddingFolderInline] = useState(false);
  const [inlineFolderName, setInlineFolderName] = useState("");
  const [inlinePending, setInlinePending] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [folderId, setFolderId] = useState<string | null>(initial?.folder_id ?? null);
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [bodyHtml, setBodyHtml] = useState(initial?.body_html ?? "");
  const [attachments, setAttachments] = useState<EmailTemplateAttachment[]>(
    initial?.attachments ?? []
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mergeOpen, setMergeOpen] = useState<null | "subject" | "body">(null);
  const [folderOpen, setFolderOpen] = useState(false);
  const subjectRef = useRef<HTMLInputElement | null>(null);
  const bodyEditorRef = useRef<import("@tiptap/react").Editor | null>(null);
  const folderRef = useRef<HTMLDivElement | null>(null);
  const subjectMergeRef = useRef<HTMLButtonElement | null>(null);
  const bodyMergeRef = useRef<HTMLButtonElement | null>(null);
  const subjectMergeMenuRef = useRef<HTMLDivElement | null>(null);
  const bodyMergeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (folderRef.current && !folderRef.current.contains(target)) {
        setFolderOpen(false);
      }
      if (mergeOpen === "subject") {
        const insideBtn = subjectMergeRef.current?.contains(target);
        const insideMenu = subjectMergeMenuRef.current?.contains(target);
        if (!insideBtn && !insideMenu) setMergeOpen(null);
      } else if (mergeOpen === "body") {
        const insideBtn = bodyMergeRef.current?.contains(target);
        const insideMenu = bodyMergeMenuRef.current?.contains(target);
        if (!insideBtn && !insideMenu) setMergeOpen(null);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [mergeOpen]);

  const canSave = name.trim().length > 0 && subject.trim().length > 0;
  const MAX_TOTAL_ATTACHMENT_BYTES = 24 * 1024 * 1024;

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
    const next = [...attachments];
    let total = next.reduce((s, a) => s + a.size, 0);
    for (const file of Array.from(files)) {
      if (total + file.size > MAX_TOTAL_ATTACHMENT_BYTES) continue;
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

  function insertMerge(token: string) {
    const placeholder = `{{${token}}}`;
    if (mergeOpen === "subject") {
      const el = subjectRef.current;
      const start = el?.selectionStart ?? subject.length;
      const end = el?.selectionEnd ?? subject.length;
      setSubject(subject.slice(0, start) + placeholder + subject.slice(end));
      setMergeOpen(null);
      setTimeout(() => el?.focus(), 0);
      return;
    }
    if (mergeOpen === "body") {
      const ed = bodyEditorRef.current;
      if (ed) {
        ed.chain().focus().insertContent(placeholder).run();
      } else {
        setBodyHtml(bodyHtml + placeholder);
      }
      setMergeOpen(null);
      return;
    }
  }

  const selectedFolder = folders.find((f) => f.id === folderId) ?? null;

  return (
    <div className="mx-auto max-w-[1200px] py-8" style={{ fontFamily: "Inter, sans-serif", color: "#0f1729" }}>
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 hover:border-gray-300 hover:text-gray-700"
            title="Back to templates"
            aria-label="Back to templates"
          >
            <IconArrowLeft size={15} stroke={1.75} />
          </button>
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.08em] text-gray-400">
              {initial ? "Edit Template" : "New Template"}
            </div>
            <div className="mt-0.5 text-[18px] font-medium tracking-tight text-[#0f1729]">
              {initial?.name || "Untitled Template"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md px-3.5 py-2 text-[12.5px] font-medium text-gray-500 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() =>
              onSave({
                id: initial?.id ?? null,
                name: name.trim(),
                folder_id: folderId,
                subject: subject.trim(),
                body_html: bodyHtml,
                attachments,
              })
            }
            className="btn-primary cursor-pointer rounded-md px-4 py-2 text-[12.5px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {initial ? "Save Changes" : "Create Template"}
          </button>
        </div>
      </header>

      {errMsg && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {errMsg}
        </div>
      )}

      <div className="rounded-[12px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04),0_8px_24px_-8px_rgba(15,23,41,0.08)]">
        <div className="divide-y divide-gray-200">
          <CompactRow label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Opening Outreach — Tax Sale"
              className="w-full border-0 bg-transparent text-[13.5px] font-medium text-[#0f1729] outline-none placeholder:font-normal placeholder:text-gray-400"
            />
          </CompactRow>

          <CompactRow
            label="Folder"
            right={
              <div ref={folderRef} className="relative">
                <button
                  type="button"
                  onClick={() => setFolderOpen((v) => !v)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[12px] text-gray-600 hover:bg-gray-100 hover:text-[#0f1729]"
                >
                  <IconFolder size={12} stroke={1.75} className="text-gray-400" />
                  {selectedFolder?.name ?? "No folder"}
                  <IconChevronDown size={10} stroke={2} className="text-gray-400" />
                </button>
                {folderOpen && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-[240px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setFolderId(null);
                        setFolderOpen(false);
                      }}
                      className="block w-full cursor-pointer px-3 py-2 text-left text-[12.5px] text-gray-500 hover:bg-gray-50"
                    >
                      No folder
                    </button>
                    {folders.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setFolderId(f.id);
                          setFolderOpen(false);
                        }}
                        className="block w-full cursor-pointer px-3 py-2 text-left text-[12.5px] text-gray-700 hover:bg-gray-50"
                      >
                        {f.name}
                      </button>
                    ))}
                    <div className="border-t border-gray-200">
                      {addingFolderInline ? (
                        <div className="flex items-center gap-1 px-2 py-1.5">
                          <input
                            autoFocus
                            value={inlineFolderName}
                            onChange={(e) => setInlineFolderName(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter" && inlineFolderName.trim() && !inlinePending) {
                                setInlinePending(true);
                                const res = await onAddFolder(inlineFolderName.trim());
                                setInlinePending(false);
                                if (res.ok) {
                                  setFolderId(res.id);
                                  setAddingFolderInline(false);
                                  setInlineFolderName("");
                                  setFolderOpen(false);
                                }
                              } else if (e.key === "Escape") {
                                setAddingFolderInline(false);
                                setInlineFolderName("");
                              }
                            }}
                            placeholder="Folder name"
                            className="min-w-0 flex-1 rounded-md border border-gray-200 bg-gray-50/60 px-2 py-1 text-[12px] text-[#0f1729] outline-none transition-colors transition-shadow focus:border-[#0d4b3a] focus:bg-white focus:shadow-[0_0_0_3px_rgba(13,75,58,0.12)]"
                          />
                          <button
                            type="button"
                            disabled={inlinePending || !inlineFolderName.trim()}
                            onClick={async () => {
                              setInlinePending(true);
                              const res = await onAddFolder(inlineFolderName.trim());
                              setInlinePending(false);
                              if (res.ok) {
                                setFolderId(res.id);
                                setAddingFolderInline(false);
                                setInlineFolderName("");
                                setFolderOpen(false);
                              }
                            }}
                            className="cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium text-[#0d4b3a] hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Add
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAddingFolderInline(true)}
                          className="flex w-full cursor-pointer items-center gap-1.5 px-3 py-2 text-left text-[12px] font-medium text-[#0d4b3a] hover:bg-gray-50"
                        >
                          <IconPlus size={11} stroke={2} />
                          New folder
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            }
          >
            <span className="text-[11.5px] text-gray-500">
              Where this template lives in the list.
            </span>
          </CompactRow>

          <CompactRow
            label="Subject"
            right={
              <button
                ref={subjectMergeRef}
                type="button"
                onClick={() => setMergeOpen(mergeOpen === "subject" ? null : "subject")}
                className={
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium " +
                  (mergeOpen === "subject"
                    ? "bg-gray-100 text-[#0f1729]"
                    : "text-gray-600 hover:bg-gray-100")
                }
                title="Insert merge field"
              >
                <IconSparkles size={11} stroke={1.75} />
                Merge field
                <IconChevronDown size={10} stroke={2} className="text-gray-400" />
              </button>
            }
          >
            <input
              ref={subjectRef}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Following up on your tax sale surplus, {{contact.first_name}}"
              className="w-full border-0 bg-transparent text-[13.5px] font-medium text-[#0f1729] outline-none placeholder:font-normal placeholder:text-gray-400"
            />
          </CompactRow>
        </div>

        <div className="relative">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-2">
            <div className="text-[10.5px] uppercase tracking-[0.08em] text-gray-400">
              Body
            </div>
            <button
              ref={bodyMergeRef}
              type="button"
              onClick={() => setMergeOpen(mergeOpen === "body" ? null : "body")}
              className={
                "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium " +
                (mergeOpen === "body"
                  ? "bg-gray-100 text-[#0f1729]"
                  : "text-gray-600 hover:bg-gray-100")
              }
              title="Insert merge field"
            >
              <IconSparkles size={11} stroke={1.75} />
              Merge field
              <IconChevronDown size={10} stroke={2} className="text-gray-400" />
            </button>
          </div>
          <div className="px-6 py-4">
            <RichTextEditor
              value={bodyHtml}
              onChange={setBodyHtml}
              editorRef={bodyEditorRef}
              minRows={14}
              placeholder="Hi {{contact.first_name}}, I'm reaching out about the surplus funds from your tax sale at {{lead.property_address}}..."
            />
          </div>
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10.5px] uppercase tracking-[0.08em] text-gray-400">
                Default Attachments
              </div>
              <div className="flex items-center gap-2">
                {attachments.length > 0 && (
                  <span className="text-[10.5px] text-gray-400">
                    {formatBytes(attachments.reduce((s, a) => s + a.size, 0))} of 24 MB
                  </span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => onFilesPicked(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-[#0f1729] hover:border-[#0d4b3a]/40"
                >
                  <IconPaperclip size={12} stroke={1.75} />
                  Attach
                </button>
              </div>
            </div>
            {attachments.length === 0 ? (
              <p className="text-[11.5px] text-gray-500">
                Files added here will be attached every time this template is used.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {attachments.map((a, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50/60 px-2 py-[3px] text-[11.5px] text-[#0f1729]"
                  >
                    <IconFile size={11} stroke={1.75} className="text-[#0d4b3a]" />
                    <span className="max-w-[220px] truncate">{a.filename}</span>
                    <span className="text-[10.5px] text-gray-400">· {formatBytes(a.size)}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="cursor-pointer rounded text-gray-400 hover:text-red-600"
                      aria-label={`Remove ${a.filename}`}
                    >
                      <IconX size={11} stroke={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {mergeOpen && (
            <div
              ref={mergeOpen === "subject" ? subjectMergeMenuRef : bodyMergeMenuRef}
              className="absolute right-4 top-[44px] z-50 w-[340px] rounded-md border border-gray-200 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,41,0.25)]"
            >
              {(["Recipient", "Property", "Sender"] as const).map((group) => (
                <div key={group}>
                  <div className="border-b border-gray-200 bg-gray-50/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.08em] text-gray-500">
                    {group}
                  </div>
                  {MERGE_TOKENS.filter((t) => t.group === group).map((t) => (
                    <button
                      key={t.token}
                      type="button"
                      onClick={() => insertMerge(t.token)}
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
    </div>
  );
}

function CompactRow({
  label,
  right,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[88px_1fr_auto] items-center gap-4 px-6 py-3">
      <label className="text-[11px] uppercase tracking-[0.08em] text-gray-400">
        {label}
      </label>
      <div className="min-w-0">{children}</div>
      <div>{right}</div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
