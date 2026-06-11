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
} from "@tabler/icons-react";
import {
  upsertEmailTemplate,
  deleteEmailTemplate,
  duplicateEmailTemplate,
  createEmailTemplateFolder,
  renameEmailTemplateFolder,
  deleteEmailTemplateFolder,
} from "../_actions";
import type {
  EmailTemplateRow,
  EmailTemplateFolderRow,
} from "@/lib/settings/fetch";

const UNFILED_KEY = "__unfiled__";

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
  }) {
    setErrMsg(null);
    startTransition(async () => {
      const res = await upsertEmailTemplate({
        id: form.id,
        name: form.name,
        folder_id: form.folder_id,
        subject: form.subject,
        body_html: form.body_html,
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
    const name = newFolderName.trim();
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
    const name = renameValue.trim();
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
        <FolderTab
          label="Unfiled"
          active={filterFolder === UNFILED_KEY}
          count={templates.filter((t) => !t.folder_id).length}
          onClick={() => setFilterFolder(UNFILED_KEY)}
        />
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
              className="rounded-md border border-gray-200 px-2 py-1 text-[12px] outline-none focus:border-[#0d4b3a]"
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
              folderName={folders.find((f) => f.id === t.folder_id)?.name ?? "Unfiled"}
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
          className="rounded border border-gray-200 px-1.5 py-0.5 text-[12px] outline-none"
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
  folderName: string;
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
      <div className="text-[10.5px] uppercase tracking-[0.08em] text-gray-400">
        {folderName}
      </div>
      <h4 className="mt-1.5 line-clamp-2 min-h-[2.4rem] text-[13.5px] font-semibold leading-snug text-[#0f1729]">
        {t.name}
      </h4>
      <p className="mt-2 line-clamp-3 min-h-[3.5rem] text-[11.5px] leading-relaxed text-gray-500">
        {preview}
      </p>
      <div className="mt-auto pt-4">
        <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-3">
          <Stat label="Sends" value={String(t.used)} />
          <Stat label="Open Rate" value={t.open_rate == null ? "—" : `${t.open_rate}%`} />
          <Stat label="Reply Rate" value={t.reply_rate == null ? "—" : `${t.reply_rate}%`} />
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
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.08em] text-gray-400">{label}</div>
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
  { token: "lead.case_number", sample: "DC-25-04321", group: "Property" },
  { token: "sender.signer_name", sample: "Bree Moss", group: "Sender" },
  { token: "system.today_long", sample: "June 11, 2026", group: "Sender" },
] as const;

function EditForm({
  initial,
  folders,
  onCancel,
  onSave,
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
  }) => void;
  errMsg: string | null;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [folderId, setFolderId] = useState<string | null>(initial?.folder_id ?? null);
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [bodyHtml, setBodyHtml] = useState(initial?.body_html ?? "");
  const [mergeOpen, setMergeOpen] = useState<null | "subject" | "body">(null);
  const [folderOpen, setFolderOpen] = useState(false);
  const subjectRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const folderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!folderRef.current) return;
      if (!folderRef.current.contains(e.target as Node)) setFolderOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const canSave = name.trim().length > 0 && subject.trim().length > 0;

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
      const el = bodyRef.current;
      const start = el?.selectionStart ?? bodyHtml.length;
      const end = el?.selectionEnd ?? bodyHtml.length;
      setBodyHtml(bodyHtml.slice(0, start) + placeholder + bodyHtml.slice(end));
      setMergeOpen(null);
      setTimeout(() => el?.focus(), 0);
      return;
    }
  }

  const selectedFolder = folders.find((f) => f.id === folderId) ?? null;

  return (
    <div className="mx-auto max-w-[1080px] py-8" style={{ fontFamily: "Inter, sans-serif", color: "#0f1729" }}>
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
            <div className="mt-0.5 text-[18px] font-medium tracking-tight">
              {initial?.name || "Untitled Template"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md border border-gray-200 bg-white px-3.5 py-2 text-[12px] font-medium text-gray-600 hover:border-gray-300 hover:text-gray-800"
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
              })
            }
            className="btn-primary cursor-pointer rounded-md px-3.5 py-2 text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
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

      <div className="overflow-hidden rounded-[12px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04),0_8px_24px_-8px_rgba(15,23,41,0.08)]">
        <div className="divide-y divide-gray-100">
          <CompactRow label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Opening Outreach — Tax Sale"
              className="w-full border-0 bg-transparent text-[13px] outline-none placeholder:text-gray-400"
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
                  {selectedFolder?.name ?? "Unfiled"}
                  <IconChevronDown size={10} stroke={2} className="text-gray-400" />
                </button>
                {folderOpen && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-[200px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setFolderId(null);
                        setFolderOpen(false);
                      }}
                      className="block w-full cursor-pointer px-3 py-2 text-left text-[12.5px] text-gray-700 hover:bg-gray-50"
                    >
                      Unfiled
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
              placeholder="Following up on your tax sale surplus claim, Roberta"
              className="w-full border-0 bg-transparent text-[15px] font-semibold tracking-tight outline-none placeholder:font-normal placeholder:text-gray-400"
            />
          </CompactRow>
        </div>

        <div className="relative">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-2">
            <div className="text-[10.5px] uppercase tracking-[0.08em] text-gray-400">
              Body
            </div>
            <button
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
          <textarea
            ref={bodyRef}
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            rows={18}
            placeholder={`Hi {{contact.first_name}},

I'm following up on the surplus funds from your tax sale at {{lead.property_address}}. Based on our research, we estimate the surplus available to you at {{lead.estimated_surplus}}.

Here's what happens next if you'd like to move forward:

- We file the claim with {{lead.county}} County on your behalf.
- You receive a portion of the recovered funds after attorney costs.
- Most claims resolve within 90 to 180 days.

Reply to this email if you'd like to talk.

{{sender.signer_name}}`}
            className="w-full resize-none border-0 bg-transparent px-6 py-5 text-[13.5px] leading-[1.7] text-[#0f1729] outline-none placeholder:text-gray-400"
            style={{ fontFamily: "Inter, sans-serif" }}
          />
          {mergeOpen && (
            <div className="absolute right-4 top-[52px] z-20 w-[300px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
              {(["Recipient", "Property", "Sender"] as const).map((group) => (
                <div key={group}>
                  <div className="border-b border-gray-100 bg-gray-50/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.08em] text-gray-500">
                    {group}
                  </div>
                  {MERGE_TOKENS.filter((t) => t.group === group).map((t) => (
                    <button
                      key={t.token}
                      type="button"
                      onClick={() => insertMerge(t.token)}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-left text-[12px] hover:bg-gray-50"
                    >
                      <span className="text-[#0d4b3a]">{`{{${t.token}}}`}</span>
                      <span className="ml-2 truncate text-gray-500">{t.sample}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-gray-200 bg-gray-50/50 px-6 py-3 text-[11.5px] text-gray-500">
          Merge tokens like <span className="rounded-sm bg-[#0d4b3a]/10 px-1 text-[#0d4b3a]">{`{{contact.first_name}}`}</span> get rendered per recipient at send time. Same registry as Letter merge fields.
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
