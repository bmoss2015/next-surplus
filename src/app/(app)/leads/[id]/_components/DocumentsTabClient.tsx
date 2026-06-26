"use client";

import { useState, useTransition, useRef } from "react";
import { IconUpload, IconFile, IconTrash, IconEye } from "@tabler/icons-react";
import { uploadDocument, deleteDocument } from "../_actions";
import type { DocumentRow } from "@/lib/leads/fetch-tab-data";
import { useRole } from "@/Components/RoleProvider";
import { DocumentViewerModal, type ViewerDoc } from "./DocumentViewerModal";

// User-facing labels mapped onto the existing document_category enum values.
const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "agreement", label: "Recovery Agreement" },
  { value: "id_copy", label: "ID Copy" },
  { value: "deed", label: "Deed" },
  { value: "court_filing", label: "Court Filing" },
  { value: "settlement_statement", label: "Settlement Statement" },
  { value: "other", label: "Other" },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label])
);

function categoryLabel(value: string): string {
  return CATEGORY_LABELS[value] ?? value;
}

function docTitle(doc: DocumentRow): string {
  if (doc.custom_name && doc.custom_name.trim()) return doc.custom_name.trim();
  return categoryLabel(doc.category);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DocumentsTabClient({
  leadId,
  initialDocs,
}: {
  leadId: string;
  initialDocs: DocumentRow[];
}) {
  const { isAdmin } = useRole();
  const [docs, setDocs] = useState(initialDocs);
  const [category, setCategory] = useState<string>("agreement");
  const [customName, setCustomName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [viewer, setViewer] = useState<ViewerDoc | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const requiresName = category === "other";
  const canUpload = !isUploading && (!requiresName || customName.trim().length > 0);

  function pickFile() {
    if (requiresName && customName.trim().length === 0) {
      setError("Enter a Document Name before choosing a file");
      return;
    }
    fileInputRef.current?.click();
  }

  async function handleFile(file: File) {
    setError(null);
    setIsUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("leadId", leadId);
    fd.set("category", category);
    if (requiresName) fd.set("customName", customName.trim());
    const result = await uploadDocument(fd);
    setIsUploading(false);
    if (result.ok) {
      const savedCustom = requiresName ? customName.trim() : null;
      setDocs((prev) => [
        {
          id: result.id,
          category,
          filename: file.name,
          custom_name: savedCustom,
          storage_path: "",
          uploaded_at: new Date().toISOString(),
          required: false,
          received: true,
          notes: null,
        },
        ...prev,
      ]);
      setCustomName("");
    } else {
      setError(result.error);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function openViewer(doc: DocumentRow) {
    if (!doc.storage_path) return;
    setViewer({
      title: docTitle(doc),
      filename: doc.filename,
      storagePath: doc.storage_path,
    });
  }

  function remove(doc: DocumentRow) {
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    startTransition(async () => {
      await deleteDocument(doc.id, leadId);
    });
  }

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="section-subheader">
            Documents
          </h3>
          <div className="mt-[2px] text-[11px] text-gray-500">
            Upload PDFs, Images, Or Other Files. Max 50 MB Each.
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              if (e.target.value !== "other") setCustomName("");
              setError(null);
            }}
            className="rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-xs text-ink outline-none focus:border-petrol-500"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {requiresName && (
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Document Name (Required)"
              className="rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-xs text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
            />
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={onFileChange}
          />
          <button
            type="button"
            onClick={pickFile}
            disabled={!canUpload}
            className="btn-primary inline-flex items-center gap-1 rounded-md px-3 py-[6px] text-xs font-medium text-white disabled:opacity-50"
          >
            <IconUpload size={13} stroke={2} />
            {isUploading ? "Uploading" : "Upload"}
          </button>
        </div>
      </div>

      {requiresName && (
        <div className="mb-3 text-[11px] text-gray-500">
          A Document Name Is Required When The Category Is Other.
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
          {error}
        </div>
      )}

      {docs.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
          <IconFile size={24} stroke={1.5} className="mx-auto text-gray-400" />
          <div className="mt-2 text-[13px] text-ink">No Documents Yet</div>
          <div className="mt-1 text-[11.5px] text-gray-500">
            Pick A Category And Upload A File To Attach It To This Lead.
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-150">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 py-[10px] first:pt-0 last:pb-0"
            >
              <button
                type="button"
                onClick={() => openViewer(doc)}
                disabled={!doc.storage_path}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-gray-100 text-gray-500 hover:bg-petrol-50 hover:text-petrol-500 disabled:cursor-default disabled:hover:bg-gray-100 disabled:hover:text-gray-500"
                aria-label="View Document"
              >
                <IconFile size={16} stroke={1.5} />
              </button>
              <button
                type="button"
                onClick={() => openViewer(doc)}
                disabled={!doc.storage_path}
                className="min-w-0 flex-1 text-left disabled:cursor-default"
              >
                <div className="truncate text-[13px] font-medium text-ink">
                  {docTitle(doc)}
                </div>
                <div className="mt-[2px] truncate text-[11px] text-gray-500">
                  {doc.filename} · {categoryLabel(doc.category)} ·{" "}
                  {formatDate(doc.uploaded_at)}
                </div>
              </button>
              {doc.storage_path && (
                <button
                  type="button"
                  onClick={() => openViewer(doc)}
                  className="text-gray-400 hover:text-petrol-500"
                  aria-label="View"
                  title="View"
                >
                  <IconEye size={14} stroke={1.75} />
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => remove(doc)}
                  className="text-gray-400 hover:text-danger"
                  aria-label="Remove"
                  title="Remove"
                >
                  <IconTrash size={14} stroke={1.75} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <DocumentViewerModal doc={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}
