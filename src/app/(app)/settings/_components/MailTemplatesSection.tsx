"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconFolder,
  IconFolderPlus,
} from "@tabler/icons-react";
import {
  upsertMailTemplate,
  deleteMailTemplate,
  createMailTemplateFolder,
  renameMailTemplateFolder,
  deleteMailTemplateFolder,
  uploadMailTemplateDocx,
  getMailTemplateDocxUrl,
} from "../_actions";
import { MailTemplateEditor } from "./MailTemplateEditor";
import { SuperDocEditor, type SuperDocSource } from "./SuperDocEditor";
import { PdfPreview } from "./PdfPreview";
import { MERGE_FIELDS, MERGE_GROUP_LABELS } from "@/lib/mail/merge";
import { validateDocxPathFonts } from "@/lib/mail/actions";
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
    docx_path: string | null;
    attachment_paths: string[];
    default_mail_class: MailTemplateRow["default_mail_class"];
  }) {
    startTransition(async () => {
      const result = await upsertMailTemplate({
        id: form.id,
        name: form.name,
        folder_id: form.folder_id,
        body_html: form.body_html,
        docx_path: form.docx_path,
        attachment_paths: form.attachment_paths,
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
                    docx_path: form.docx_path,
                    attachment_paths: form.attachment_paths,
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
              docx_path: form.docx_path,
              attachment_paths: form.attachment_paths,
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

      {/* Hide the folder/template list while the form is open — the
          user is focused on editing a single template, not browsing
          siblings. Empty state still shows when nothing is loaded. */}
      {!editing && rows.length === 0 && folders.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-[12px] text-gray-500">
          No mail templates yet. Create a folder first to organize them.
        </div>
      ) : !editing ? (
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
      ) : null}
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
    docx_path: string | null;
    attachment_paths: string[];
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
  // Mode: 'html' uses the TipTap editor and stores body_html. 'file' uses
  // an uploaded .docx (edited in SuperDoc) or .pdf (preview only, prints
  // as-is). Stored in docx_path; the file_type is inferred from the
  // extension at runtime so we don't need a separate column.
  const [mode, setMode] = useState<"html" | "file">(
    initial?.docx_path ? "file" : "html"
  );
  const [docxPath, setDocxPath] = useState<string | null>(
    initial?.docx_path ?? null
  );
  const [fileType, setFileType] = useState<"docx" | "pdf" | null>(
    initial?.docx_path?.toLowerCase().endsWith(".pdf") ? "pdf" :
    initial?.docx_path ? "docx" : null
  );
  // Live source for SuperDoc / PDF preview: a freshly uploaded File
  // (before it's been saved to storage), or a signed URL fetched for an
  // already-stored path.
  const [docxSource, setDocxSource] = useState<SuperDocSource | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [docxBusy, startDocxBusy] = useTransition();
  const [docxErr, setDocxErr] = useState<string | null>(null);
  const exportRef = useRef<(() => Promise<Blob>) | null>(null);
  const insertTextRef = useRef<((text: string) => void) | null>(null);
  const mainFileRef = useRef<HTMLInputElement | null>(null);
  const [popoutOpen, setPopoutOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);

  // Font validation — runs whenever a .docx is loaded or freshly
  // uploaded. The PDF renderer (Gotenberg / LibreOffice headless) can
  // only render fonts that are installed in its container. Any font in
  // the template that ISN'T in our supported set gets substituted at
  // render time with a different-metric fallback, which causes tables
  // and paragraphs to overlap. Warning here surfaces the issue at upload
  // time instead of letting it slip through to the recipient's mailbox.
  const [unsupportedFonts, setUnsupportedFonts] = useState<string[]>([]);
  useEffect(() => {
    if (!docxPath || fileType !== "docx") {
      // Clear the unsupported-fonts warning when no .docx is loaded.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnsupportedFonts([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await validateDocxPathFonts({ docx_path: docxPath });
      if (cancelled) return;
      if (res.ok) setUnsupportedFonts(res.unsupported);
    })();
    return () => {
      cancelled = true;
    };
  }, [docxPath, fileType]);

  // Attachments (extra .docx/.pdf files that ride along with the main
  // letter in the same envelope). The paths array mirrors the storage
  // bucket paths; the parallel labels array is just display metadata
  // so we can show the original filename in the UI.
  const [attachmentPaths, setAttachmentPaths] = useState<string[]>(
    initial?.attachment_paths ?? []
  );
  const [attachmentLabels, setAttachmentLabels] = useState<string[]>(
    (initial?.attachment_paths ?? []).map((p) => p.split("/").pop() ?? p)
  );
  const [attachBusy, startAttachBusy] = useTransition();
  const [attachErr, setAttachErr] = useState<string | null>(null);
  const attachInputRef = useRef<HTMLInputElement | null>(null);
  // Unified preview modal — open / closed. When open, every document
  // in the envelope (main file + attachments) is loaded and rendered
  // stacked vertically inside a scrollable container. No carousel, no
  // arrows; just scroll through everything that's going in the envelope.
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([]);

  const previewItems = (() => {
    const items: { path: string; label: string; type: "docx" | "pdf" }[] = [];
    if (docxPath && fileType) {
      items.push({
        path: docxPath,
        label: `Main · ${docxPath.split("/").pop() ?? docxPath}`,
        type: fileType,
      });
    }
    attachmentPaths.forEach((p, i) => {
      items.push({
        path: p,
        label: attachmentLabels[i] ?? p,
        type: p.toLowerCase().endsWith(".pdf") ? "pdf" : "docx",
      });
    });
    return items;
  })();

  useEffect(() => {
    if (!previewOpen) {
      // Drop cached signed URLs when the preview panel closes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewUrls([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const urls = await Promise.all(
        previewItems.map(async (item) => {
          const res = await getMailTemplateDocxUrl(item.path);
          return res.ok ? res.url : null;
        })
      );
      if (!cancelled) setPreviewUrls(urls);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewOpen, docxPath, attachmentPaths.join(",")]);

  useEffect(() => {
    if (!previewOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewOpen]);

  // When we load an existing file template, fetch a signed URL so the
  // viewer/editor can stream the bytes without exposing the bucket.
  useEffect(() => {
    if (mode !== "file" || !docxPath) return;
    let cancelled = false;
    (async () => {
      const res = await getMailTemplateDocxUrl(docxPath);
      if (cancelled) return;
      if (!res.ok) {
        setDocxErr(res.error);
        return;
      }
      if (fileType === "pdf") setPdfUrl(res.url);
      else setDocxSource(res.url);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, docxPath, fileType]);

  function handleFileUpload(file: File) {
    setDocxErr(null);
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    const inferredType: "docx" | "pdf" = isPdf ? "pdf" : "docx";
    setFileType(inferredType);
    setMode("file");
    if (isPdf) {
      // Show the local file immediately via object URL while the upload
      // happens in the background — no editing means we can preview the
      // raw bytes directly.
      setPdfUrl(URL.createObjectURL(file));
      setDocxSource(null);
    } else {
      setDocxSource(file);
      setPdfUrl(null);
    }
    const fd = new FormData();
    fd.append("file", file);
    startDocxBusy(async () => {
      const res = await uploadMailTemplateDocx(fd);
      if (res.ok) {
        setDocxPath(res.path);
        setFileType(res.file_type);
      } else {
        setDocxErr(res.error);
      }
    });
  }

  async function handleSave() {
    let nextDocxPath: string | null = null;
    if (mode === "file") {
      // For DOCX: export SuperDoc state and upload as a fresh file so
      // edits persist. For PDF: nothing to export — the original upload
      // is what prints, so just keep the path that uploadMailTemplateDocx
      // returned.
      if (fileType === "docx" && exportRef.current) {
        try {
          const blob = await exportRef.current();
          const file = new File([blob], `${name || "template"}.docx`, {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
          const fd = new FormData();
          fd.append("file", file);
          const res = await uploadMailTemplateDocx(fd);
          if (res.ok) nextDocxPath = res.path;
          else {
            setDocxErr(res.error);
            return;
          }
        } catch (e) {
          setDocxErr(
            e instanceof Error ? e.message : "Could not export the edited document"
          );
          return;
        }
      } else {
        nextDocxPath = docxPath;
      }
    }
    onSave({
      id: initial?.id ?? null,
      name,
      folder_id: folderId || null,
      body_html: mode === "html" ? body : "",
      docx_path: mode === "file" ? nextDocxPath : null,
      attachment_paths: attachmentPaths,
      default_mail_class: mailClass,
    });
  }

  function handleAttachmentUpload(files: FileList) {
    setAttachErr(null);
    startAttachBusy(async () => {
      const newPaths: string[] = [];
      const newLabels: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await uploadMailTemplateDocx(fd);
        if (res.ok) {
          newPaths.push(res.path);
          newLabels.push(file.name);
        } else {
          setAttachErr(`${file.name}: ${res.error}`);
        }
      }
      if (newPaths.length > 0) {
        setAttachmentPaths((prev) => [...prev, ...newPaths]);
        setAttachmentLabels((prev) => [...prev, ...newLabels]);
      }
    });
  }

  function removeAttachment(idx: number) {
    setAttachmentPaths((prev) => prev.filter((_, i) => i !== idx));
    setAttachmentLabels((prev) => prev.filter((_, i) => i !== idx));
  }

  const inputClass =
    "rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";

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

      <input
        ref={mainFileRef}
        type="file"
        accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileUpload(f);
          e.target.value = "";
        }}
        disabled={docxBusy}
      />

      {/* Empty state: ask once, up front. Build-from-scratch and
          file-upload are the only two paths; everything else flows
          from this choice. */}
      {mode === "html" && !body.trim() && (
        <div className="flex items-center justify-center gap-3 rounded-md border border-dashed border-gray-200 bg-gray-50 p-6">
          <button
            type="button"
            onClick={() => setMode("html")}
            className="cursor-pointer rounded-md border border-petrol-200 bg-petrol-50 px-4 py-2 text-[12px] font-medium text-petrol-700 hover:bg-petrol-100"
          >
            Build From Scratch
          </button>
          <span className="text-[11px] text-gray-400">or</span>
          <button
            type="button"
            onClick={() => mainFileRef.current?.click()}
            disabled={docxBusy}
            className="cursor-pointer rounded-md border border-gray-200 bg-surface px-4 py-2 text-[12px] font-medium text-ink hover:border-petrol-500 disabled:opacity-50"
          >
            {docxBusy ? "Uploading..." : "Upload .docx or .pdf"}
          </button>
        </div>
      )}

      {/* Active TipTap editor — once the user has typed something, the
          empty state goes away and the editor takes over. Switching to
          file mode is a button in the editor's own toolbar. */}
      {mode === "html" && body.trim() && (
        <MailTemplateEditor value={body} onChange={setBody} />
      )}

      {/* Active file editor with the action bar pinned to its top.
          Replace / Merge / Full Screen all live next to the filename
          so the controls are in context — not in a separate row above. */}
      {mode === "file" && (docxSource || pdfUrl) && unsupportedFonts.length > 0 && (
        <div className="rounded-md border border-danger/40 bg-red-50 px-3 py-2 text-[11px] leading-snug text-ink">
          <div className="font-medium text-danger">
            Unsupported font{unsupportedFonts.length === 1 ? "" : "s"}:{" "}
            {unsupportedFonts.join(", ")}
          </div>
          <div className="mt-1 text-ink/80">
            Our PDF renderer doesn&apos;t have{" "}
            {unsupportedFonts.length === 1 ? "this font" : "these fonts"}{" "}
            installed and will substitute with a different one, which can
            shift the layout (tables and paragraphs may overlap). To fix:
            open the .docx in Word, change to one of these supported
            fonts, save and re-upload:{" "}
            <span className="font-mono">
              Arial, Calibri, Times New Roman, Roboto, Inter, Open Sans,
              Lato, Montserrat, Poppins, Merriweather, Lora, Source Serif
            </span>
            .
          </div>
        </div>
      )}
      {mode === "file" && (docxSource || pdfUrl) && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-surface px-3 py-[6px]">
            <span className="text-[11px] font-medium text-ink">
              {fileType === "pdf" ? "PDF" : "Word"} ·{" "}
              {docxPath ? docxPath.split("/").pop() : "Uploading..."}
            </span>
            <span className="flex-1" />
            {(docxSource || pdfUrl) && (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="cursor-pointer rounded border border-gray-200 bg-surface px-2 py-[3px] text-[11px] text-ink hover:border-petrol-500"
                title="Preview the whole envelope (main file + attachments)"
              >
                Preview
              </button>
            )}
            <button
              type="button"
              onClick={() => mainFileRef.current?.click()}
              disabled={docxBusy}
              className="cursor-pointer rounded border border-gray-200 bg-surface px-2 py-[3px] text-[11px] text-ink hover:border-petrol-500 disabled:opacity-50"
            >
              {docxBusy ? "Uploading..." : "Replace"}
            </button>
            {fileType === "docx" && (
              <>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMergeOpen((v) => !v)}
                    className="cursor-pointer rounded border border-petrol-200 bg-petrol-50 px-2 py-[3px] text-[11px] font-medium text-petrol-700 hover:bg-petrol-100"
                  >
                    Merge Field ▾
                  </button>
                  {mergeOpen && (
                    <div className="absolute right-0 top-full z-20 mt-1 max-h-[360px] w-[300px] overflow-auto rounded-md border border-gray-200 bg-white shadow-elevated">
                      {(["recipient", "lead", "sender", "system"] as const).map((group) => {
                        const fields = MERGE_FIELDS.filter((f) => f.group === group);
                        if (fields.length === 0) return null;
                        return (
                          <div key={group}>
                            <div className="border-b border-petrol-100 bg-petrol-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-petrol-700">
                              {MERGE_GROUP_LABELS[group]}
                            </div>
                            {fields.map((f) => (
                              <button
                                key={f.key}
                                type="button"
                                title={`e.g. ${f.example}`}
                                onClick={() => {
                                  insertTextRef.current?.(`{${f.key}}`);
                                  setMergeOpen(false);
                                }}
                                className="block w-full cursor-pointer px-2 py-1.5 text-left hover:bg-petrol-50"
                              >
                                <div className="text-[12px] leading-tight text-ink">{f.label}</div>
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
                <button
                  type="button"
                  onClick={() => setPopoutOpen(true)}
                  className="cursor-pointer rounded border border-gray-200 bg-surface px-2 py-[3px] text-[11px] text-ink hover:border-petrol-500"
                >
                  Full Screen
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                setMode("html");
                setDocxSource(null);
                setPdfUrl(null);
                setDocxPath(null);
                setFileType(null);
              }}
              className="cursor-pointer rounded text-[11px] text-gray-400 hover:text-danger"
              aria-label="Switch to build from scratch"
              title="Remove file and build from scratch instead"
            >
              ✕
            </button>
          </div>

          {fileType === "pdf" && pdfUrl ? (
            <iframe
              title="PDF preview"
              src={pdfUrl}
              className="rounded-md border border-gray-200 bg-white"
              style={{ width: "100%", height: "min(700px, 75vh)" }}
            />
          ) : (
            <SuperDocEditor
              source={docxSource}
              onReady={(ctrl) => {
                exportRef.current = ctrl.export;
                insertTextRef.current = ctrl.insertText;
              }}
            />
          )}
        </div>
      )}

      {docxErr && (
        <div className="text-[11px] text-danger">{docxErr}</div>
      )}

      {popoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
          onClick={() => setPopoutOpen(false)}
        >
          <div
            className="flex h-[95vh] w-[95vw] flex-col overflow-hidden rounded-lg bg-white shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
              <div className="text-[13px] font-semibold text-ink">
                {name || "Template"}, Full Screen Edit
              </div>
              <button
                type="button"
                onClick={() => setPopoutOpen(false)}
                className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[5px] text-[11px] text-ink hover:border-petrol-500"
              >
                Done
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SuperDocEditor
                source={docxSource}
                fullScreen
                onReady={(ctrl) => {
                  exportRef.current = ctrl.export;
                  insertTextRef.current = ctrl.insertText;
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md border border-gray-200 bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-[12px] font-medium text-ink">Attachments</div>
            <div className="text-[10px] text-gray-500">
              Extra .docx or .pdf files included in the same envelope, in order.
            </div>
          </div>
          <button
            type="button"
            onClick={() => attachInputRef.current?.click()}
            disabled={attachBusy}
            className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[4px] text-[11px] font-medium text-ink hover:border-petrol-500 disabled:opacity-50"
          >
            {attachBusy ? "Uploading..." : "Add Attachment"}
          </button>
          <input
            ref={attachInputRef}
            type="file"
            accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) handleAttachmentUpload(files);
              e.target.value = "";
            }}
            disabled={attachBusy}
          />
        </div>
        {attachmentPaths.length === 0 ? (
          <div className="rounded border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-center text-[11px] text-gray-500">
            No attachments. Use Add Attachment to include extra docs.
          </div>
        ) : (
          <ul className="space-y-1">
            {attachmentPaths.map((p, i) => (
              <li
                key={p}
                className="flex items-center justify-between gap-2 rounded border border-gray-150 bg-gray-50 px-2 py-1 text-[11px]"
              >
                <span className="truncate text-ink">
                  {i + 1}. {attachmentLabels[i] ?? p}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="cursor-pointer text-petrol-600 hover:text-petrol-800"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="cursor-pointer text-gray-400 hover:text-danger"
                    aria-label="Remove attachment"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {attachErr && (
          <div className="mt-1 text-[11px] text-danger">{attachErr}</div>
        )}
      </div>

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="flex w-full max-w-[960px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            style={{ maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex shrink-0 items-center justify-between border-b border-gray-150 px-5 py-3">
              <div>
                <div className="text-[14px] font-semibold text-ink">
                  Envelope Preview
                </div>
                <div className="text-[11px] text-gray-500">
                  {previewItems.length} document
                  {previewItems.length === 1 ? "" : "s"} · scroll to view all
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="cursor-pointer rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-ink"
                aria-label="Close preview"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-auto bg-gray-50">
              <div className="mx-auto flex max-w-[820px] flex-col gap-4 p-5">
                {previewItems.map((item, i) => {
                  const url = previewUrls[i];
                  return (
                    <section
                      key={item.path}
                      className="overflow-hidden rounded-md border border-gray-200 bg-white"
                    >
                      <header className="border-b border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-medium text-ink">
                        {i + 1}. {item.label}
                      </header>
                      <div className="bg-gray-100">
                        {url ? (
                          item.type === "pdf" ? (
                            <PdfPreview url={url} />
                          ) : (
                            <SuperDocEditor
                              key={url}
                              source={url}
                              documentMode="viewing"
                              autoHeight
                            />
                          )
                        ) : (
                          <div
                            className="flex items-center justify-center text-[12px] text-gray-500"
                            style={{ height: "300px" }}
                          >
                            Loading...
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

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
          onClick={handleSave}
          disabled={
            !name.trim() ||
            (mode === "html" ? !body.trim() : !docxPath && !docxSource)
          }
          className="cursor-pointer rounded-md btn-primary px-3 py-[5px] text-xs font-medium text-white disabled:opacity-50"
        >
          {initial ? "Save Changes" : "Save Template"}
        </button>
      </div>
    </div>
  );
}

