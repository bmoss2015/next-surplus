"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconFolder,
  IconFolderPlus,
  IconUpload,
} from "@tabler/icons-react";
import {
  upsertMailTemplate,
  deleteMailTemplate,
  createMailTemplateFolder,
  renameMailTemplateFolder,
  deleteMailTemplateFolder,
  convertDocxToHtml,
} from "../_actions";
import { MERGE_FIELDS } from "@/lib/mail/merge";
import type {
  MailTemplateRow,
  MailTemplateFolderRow,
} from "@/lib/settings/fetch";

const MAIL_CLASS_OPTIONS: {
  value: MailTemplateRow["default_mail_class"];
  label: string;
}[] = [
  { value: "standard", label: "Standard" },
  { value: "first_class", label: "First Class" },
  { value: "certified", label: "Certified" },
];

// Sentinel folder id for templates that don't live in a real folder.
// Distinct from null so React keys stay stable.
const UNFILED_KEY = "__unfiled__";

export function MailTemplatesSection({
  initialTemplates,
  initialFolders,
}: {
  initialTemplates: MailTemplateRow[];
  initialFolders: MailTemplateFolderRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialTemplates);
  const [folders, setFolders] = useState(initialFolders);
  const [editing, setEditing] = useState<MailTemplateRow | "new" | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [addingFolder, setAddingFolder] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [, startTransition] = useTransition();

  function save(form: {
    id: string | null;
    name: string;
    folder_id: string | null;
    body_html: string;
    default_mail_class: MailTemplateRow["default_mail_class"];
  }) {
    startTransition(async () => {
      const result = await upsertMailTemplate({
        id: form.id,
        name: form.name,
        folder_id: form.folder_id,
        body_html: form.body_html,
        default_mail_class: form.default_mail_class,
      });
      if (result.ok) {
        if (form.id) {
          setRows((prev) =>
            prev.map((r) =>
              r.id === form.id
                ? {
                    ...r,
                    name: form.name,
                    folder_id: form.folder_id,
                    body_html: form.body_html,
                    default_mail_class: form.default_mail_class,
                  }
                : r
            )
          );
        } else {
          setRows((prev) => [
            ...prev,
            {
              id: result.id,
              name: form.name,
              folder_id: form.folder_id,
              body_html: form.body_html,
              default_mail_class: form.default_mail_class,
              updated_at: new Date().toISOString(),
            },
          ]);
        }
        setEditing(null);
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this mail template?")) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
    startTransition(async () => {
      await deleteMailTemplate(id);
      router.refresh();
    });
  }

  function addFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    startTransition(async () => {
      const res = await createMailTemplateFolder(name);
      if (res.ok) {
        setFolders((prev) =>
          [...prev, { id: res.id, name, sort_order: 0 }].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
        setNewFolderName("");
        setAddingFolder(false);
        router.refresh();
      }
    });
  }

  function startRename(folder: MailTemplateFolderRow) {
    setRenamingFolderId(folder.id);
    setRenameValue(folder.name);
  }

  function saveRename() {
    if (!renamingFolderId) return;
    const name = renameValue.trim();
    if (!name) return;
    const folderId = renamingFolderId;
    startTransition(async () => {
      const res = await renameMailTemplateFolder(folderId, name);
      if (res.ok) {
        setFolders((prev) =>
          prev.map((f) => (f.id === folderId ? { ...f, name } : f))
        );
        setRenamingFolderId(null);
        router.refresh();
      }
    });
  }

  function removeFolder(folder: MailTemplateFolderRow) {
    const count = rows.filter((r) => r.folder_id === folder.id).length;
    const msg =
      count > 0
        ? `Delete folder "${folder.name}"? Its ${count} template${count === 1 ? "" : "s"} will move to Unfiled.`
        : `Delete folder "${folder.name}"?`;
    if (!confirm(msg)) return;
    startTransition(async () => {
      const res = await deleteMailTemplateFolder(folder.id);
      if (res.ok) {
        setFolders((prev) => prev.filter((f) => f.id !== folder.id));
        setRows((prev) =>
          prev.map((r) =>
            r.folder_id === folder.id ? { ...r, folder_id: null } : r
          )
        );
        router.refresh();
      }
    });
  }

  // Group templates by folder id (null/"" → UNFILED_KEY). Each group entry
  // carries its own template list so the render below is trivial.
  type Group = { key: string; label: string; folderId: string | null; items: MailTemplateRow[] };
  const groups: Group[] = [];
  for (const f of folders) {
    groups.push({
      key: f.id,
      label: f.name,
      folderId: f.id,
      items: rows.filter((r) => r.folder_id === f.id),
    });
  }
  const unfiled = rows.filter((r) => !r.folder_id);
  if (unfiled.length > 0 || folders.length === 0) {
    groups.push({
      key: UNFILED_KEY,
      label: "Unfiled",
      folderId: null,
      items: unfiled,
    });
  }

  return (
    <div className="col-span-2 rounded-lg border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="section-subheader">Mail Templates</h2>
          <div className="mt-1 text-[12px] font-normal text-[#94a3b8]">
            Physical mail letter templates organized by folder. Use{" "}
            {"{{merge_fields}}"} to personalize per recipient.
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!addingFolder && (
            <button
              type="button"
              onClick={() => setAddingFolder(true)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-xs font-medium text-ink hover:border-petrol-500"
            >
              <IconFolderPlus size={13} stroke={2} />
              New Folder
            </button>
          )}
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white"
            >
              <IconPlus size={13} stroke={2} />
              Add Template
            </button>
          )}
        </div>
      </div>

      {addingFolder && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          <input
            autoFocus
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addFolder();
              if (e.key === "Escape") {
                setAddingFolder(false);
                setNewFolderName("");
              }
            }}
            placeholder="Folder name (e.g. Owner Outreach)"
            className="flex-1 rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[13px] text-ink outline-none focus:border-petrol-500"
          />
          <button
            type="button"
            onClick={() => {
              setAddingFolder(false);
              setNewFolderName("");
            }}
            className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[5px] text-[11px] text-ink hover:border-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={addFolder}
            disabled={!newFolderName.trim()}
            className="btn-primary cursor-pointer rounded-md px-3 py-[5px] text-[11px] font-medium text-white disabled:opacity-50"
          >
            Create
          </button>
        </div>
      )}

      {editing && (
        <MailTemplateForm
          initial={editing === "new" ? null : editing}
          folders={folders}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}

      {rows.length === 0 && folders.length === 0 && !editing ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-[12px] text-gray-500">
          No mail templates yet. Create a folder first to organize them.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div
              key={g.key}
              className="rounded-md border border-gray-200 bg-gray-50/50"
            >
              <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
                <div className="flex flex-1 items-center gap-2">
                  <IconFolder size={14} stroke={1.75} className="text-petrol-600" />
                  {renamingFolderId === g.folderId && g.folderId ? (
                    <>
                      <input
                        autoFocus
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename();
                          if (e.key === "Escape") setRenamingFolderId(null);
                        }}
                        className="flex-1 rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[12px] text-ink outline-none focus:border-petrol-500"
                      />
                      <button
                        type="button"
                        onClick={saveRename}
                        className="cursor-pointer text-[11px] font-medium text-petrol-600 hover:underline"
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-[13px] font-medium text-ink">
                        {g.label}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {g.items.length}
                      </span>
                    </>
                  )}
                </div>
                {g.folderId && renamingFolderId !== g.folderId && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startRename(folders.find((f) => f.id === g.folderId)!)}
                      className="cursor-pointer text-[11px] text-gray-500 hover:text-petrol-600"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFolder(folders.find((f) => f.id === g.folderId)!)}
                      className="cursor-pointer text-[11px] text-gray-400 hover:text-danger"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              {g.items.length === 0 ? (
                <div className="px-3 py-3 text-[11.5px] text-gray-400">
                  No templates in this folder.
                </div>
              ) : (
                <div className="divide-y divide-gray-150">
                  {g.items.map((row) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2"
                    >
                      <div>
                        <div className="text-[13px] font-medium text-ink">
                          {row.name}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {MAIL_CLASS_OPTIONS.find(
                            (m) => m.value === row.default_mail_class
                          )?.label ?? row.default_mail_class}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditing(row)}
                        className="cursor-pointer text-gray-400 hover:text-petrol-500"
                        aria-label="Edit"
                      >
                        <IconEdit size={14} stroke={1.75} />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(row.id)}
                        className="cursor-pointer text-gray-400 hover:text-danger"
                        aria-label="Remove"
                      >
                        <IconTrash size={14} stroke={1.75} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MailTemplateForm({
  initial,
  folders,
  onCancel,
  onSave,
}: {
  initial: MailTemplateRow | null;
  folders: MailTemplateFolderRow[];
  onCancel: () => void;
  onSave: (form: {
    id: string | null;
    name: string;
    folder_id: string | null;
    body_html: string;
    default_mail_class: MailTemplateRow["default_mail_class"];
  }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [folderId, setFolderId] = useState<string | "">(
    initial?.folder_id ?? ""
  );
  const [body, setBody] = useState(initial?.body_html ?? "");
  const [mailClass, setMailClass] = useState<
    MailTemplateRow["default_mail_class"]
  >(initial?.default_mail_class ?? "first_class");
  const [bodyRef, setBodyRef] = useState<HTMLTextAreaElement | null>(null);
  const [docxPending, startDocxTransition] = useTransition();
  const [docxMsg, setDocxMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );

  function uploadDocx(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setDocxMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    startDocxTransition(async () => {
      const res = await convertDocxToHtml(fd);
      if (res.ok) {
        // Replace the body wholesale — user can then add merge fields.
        setBody(res.html);
        setDocxMsg({
          kind: "ok",
          text: "Imported. Add {{merge_fields}} where you want personalization.",
        });
      } else {
        setDocxMsg({ kind: "err", text: res.error });
      }
    });
  }

  const inputClass =
    "rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";

  function insertField(key: string) {
    if (!bodyRef) {
      setBody((prev) => prev + `{{${key}}}`);
      return;
    }
    const start = bodyRef.selectionStart ?? body.length;
    const end = bodyRef.selectionEnd ?? body.length;
    const token = `{{${key}}}`;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      bodyRef.focus();
      const cursor = start + token.length;
      bodyRef.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3 space-y-2">
      <div className="grid grid-cols-[1fr_180px_140px] gap-2">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name"
          className={inputClass}
        />
        <select
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          className={`${inputClass} cursor-pointer`}
        >
          <option value="">Unfiled</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <select
          value={mailClass}
          onChange={(e) =>
            setMailClass(
              e.target.value as MailTemplateRow["default_mail_class"]
            )
          }
          className={`${inputClass} cursor-pointer`}
        >
          {MAIL_CLASS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <MergeFieldPicker onInsert={insertField} />
        <label
          className={`inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-surface px-3 py-[5px] text-[11px] font-medium text-ink hover:border-petrol-500 ${docxPending ? "opacity-50" : ""}`}
        >
          <IconUpload size={12} stroke={2} />
          {docxPending ? "Importing..." : "Import .docx"}
          <input
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={uploadDocx}
            disabled={docxPending}
            className="hidden"
          />
        </label>
        {docxMsg && (
          <span
            className={`text-[11px] ${docxMsg.kind === "ok" ? "text-success" : "text-danger"}`}
          >
            {docxMsg.text}
          </span>
        )}
      </div>

      <textarea
        ref={setBodyRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={14}
        placeholder="Dear {{contact.first_name}},&#10;&#10;I am writing regarding..."
        className={`${inputClass} w-full resize-y font-mono`}
      />

      <div className="text-[11px] text-gray-500">
        Use {"{{contact.first_name}}"}, {"{{sender.company_name}}"}, etc. — see
        the picker above for the full list.
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[5px] text-xs text-ink hover:border-petrol-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            onSave({
              id: initial?.id ?? null,
              name,
              folder_id: folderId || null,
              body_html: body,
              default_mail_class: mailClass,
            })
          }
          disabled={!name.trim() || !body.trim()}
          className="cursor-pointer rounded-md btn-primary px-3 py-[5px] text-xs font-medium text-white disabled:opacity-50"
        >
          {initial ? "Save Changes" : "Add Template"}
        </button>
      </div>
    </div>
  );
}

function MergeFieldPicker({ onInsert }: { onInsert: (key: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[5px] text-[11px] font-medium text-ink hover:border-petrol-500"
      >
        Insert Field {open ? "▴" : "▾"}
      </button>
      {open && (
        <div className="absolute left-0 z-10 mt-1 max-h-72 w-72 overflow-y-auto rounded-md border border-gray-200 bg-surface shadow-card">
          {(["contact", "lead", "sender", "system"] as const).map((group) => {
            const fields = MERGE_FIELDS.filter((f) => f.group === group);
            if (fields.length === 0) return null;
            return (
              <div key={group}>
                <div className="bg-gray-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {group}
                </div>
                {fields.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      onInsert(f.key);
                      setOpen(false);
                    }}
                    className="block w-full cursor-pointer px-3 py-[5px] text-left text-[12px] text-ink hover:bg-gray-50"
                  >
                    <span className="font-medium">{f.label}</span>
                    <span className="ml-2 font-mono text-[10px] text-gray-400">
                      {`{{${f.key}}}`}
                    </span>
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
