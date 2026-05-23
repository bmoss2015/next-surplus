"use client";

// Renders a preview of a sent mail piece in a sandboxed iframe sized
// like an 8.5×11 sheet. HTML-body sends render their stored body
// directly. Word-template sends call previewMailJob on open to
// dynamically re-render (server runs docxtemplater + Gotenberg or
// mammoth fallback) so customers can see the same docx content the
// printer mailed.

import { useEffect, useState } from "react";
import { IconX } from "@tabler/icons-react";
import { previewMailJob } from "@/lib/mail/actions";

export type LetterPreviewData = {
  jobId: string;
  recipientName: string;
  bodyHtml: string | null;
  trackingUrl: string | null;
};

type RenderedPreview =
  | { kind: "html"; html: string }
  | { kind: "pdf"; blobUrl: string }
  | { kind: "error"; message: string }
  | { kind: "loading" };

export function LetterPreviewModal({
  data,
  onClose,
}: {
  data: LetterPreviewData | null;
  onClose: () => void;
}) {
  const [rendered, setRendered] = useState<RenderedPreview>({ kind: "loading" });

  useEffect(() => {
    if (!data) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, onClose]);

  // Resolve the preview the moment the modal opens. HTML body sends
  // short-circuit immediately; Word-template sends hit the server.
  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    let blobUrl: string | null = null;
    setRendered({ kind: "loading" });

    if (data.bodyHtml && data.bodyHtml.trim().length > 0) {
      setRendered({ kind: "html", html: data.bodyHtml });
      return;
    }

    (async () => {
      const res = await previewMailJob({ mail_job_id: data.jobId });
      if (cancelled) return;
      if (!res.ok) {
        setRendered({ kind: "error", message: res.error });
        return;
      }
      if (res.kind === "pdf") {
        const bytes = Uint8Array.from(atob(res.base64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "application/pdf" });
        blobUrl = URL.createObjectURL(blob);
        setRendered({ kind: "pdf", blobUrl });
      } else {
        setRendered({ kind: "html", html: res.html });
      }
    })();

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [data]);

  if (!data) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="absolute inset-0" aria-hidden onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] flex-col items-center gap-3">
        <header className="flex w-[560px] max-w-[90vw] items-center justify-between rounded-lg border border-gray-200 bg-surface px-4 py-2.5 shadow-card">
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
              Letter Sent To
            </div>
            <div className="truncate text-[13px] font-medium text-ink">
              {data.recipientName}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <IconX size={15} stroke={1.75} />
          </button>
        </header>
        <div
          className="overflow-hidden rounded-sm border border-gray-300 bg-white shadow-xl"
          style={{ width: "560px", maxWidth: "90vw", aspectRatio: "8.5 / 11" }}
        >
          {rendered.kind === "loading" && (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center text-[12.5px] text-gray-500">
              Rendering letter...
            </div>
          )}
          {rendered.kind === "error" && (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center text-[12.5px] text-gray-500">
              <div className="mb-2 text-[11px] uppercase tracking-wide text-danger">
                Preview Unavailable
              </div>
              <div>{rendered.message}</div>
            </div>
          )}
          {rendered.kind === "html" && (
            <iframe
              title="Letter preview"
              sandbox=""
              srcDoc={rendered.html}
              className="h-full w-full"
            />
          )}
          {rendered.kind === "pdf" && (
            <iframe
              title="Letter preview"
              src={rendered.blobUrl}
              className="h-full w-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}
