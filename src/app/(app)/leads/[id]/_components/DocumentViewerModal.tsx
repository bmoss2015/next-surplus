"use client";

import { useEffect, useState } from "react";
import { IconX, IconLoader2 } from "@tabler/icons-react";
import { getDocumentSignedUrl } from "../_actions";

export type ViewerDoc = {
  title: string;
  filename: string;
  storagePath: string;
};

function isImageName(name: string): boolean {
  return /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(name);
}

type LoadState = {
  path: string | null;
  url: string | null;
  error: string | null;
};

export function DocumentViewerModal({
  doc,
  onClose,
}: {
  doc: ViewerDoc | null;
  onClose: () => void;
}) {
  const [state, setState] = useState<LoadState>({
    path: null,
    url: null,
    error: null,
  });

  // Reset when the open document changes (adjusting state during render — see
  // React docs "you might not need an effect").
  const currentPath = doc?.storagePath ?? null;
  if (state.path !== currentPath) {
    setState({ path: currentPath, url: null, error: null });
  }

  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    (async () => {
      const result = await getDocumentSignedUrl(doc.storagePath);
      if (cancelled) return;
      if (result.ok) {
        setState({ path: doc.storagePath, url: result.url, error: null });
      } else {
        setState({ path: doc.storagePath, url: null, error: result.error });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc]);

  useEffect(() => {
    if (!doc) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [doc, onClose]);

  if (!doc) return null;

  const ready = state.path === doc.storagePath;
  const url = ready ? state.url : null;
  const error = ready ? state.error : null;
  const showImage = isImageName(doc.filename);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[10px] bg-surface shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-3">
          <div className="min-w-0">
            <div className="truncate text-[14px] font-medium text-ink">
              {doc.title}
            </div>
            {doc.title !== doc.filename && (
              <div className="truncate text-[11px] text-gray-500">
                {doc.filename}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-ink"
            aria-label="Close"
          >
            <IconX size={18} stroke={1.75} />
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-auto bg-gray-100">
          {error ? (
            <div className="px-6 py-10 text-center text-[13px] text-danger">
              {error}
            </div>
          ) : !url ? (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <IconLoader2 size={22} className="animate-spin" />
              <span className="text-[12px]">Loading Document</span>
            </div>
          ) : showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={doc.title}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <iframe
              src={url}
              title={doc.title}
              className="h-full w-full border-0 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}
