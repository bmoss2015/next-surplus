"use client";

// Renders a sent check's printed PDF in a sandboxed iframe. Calls
// previewCheckJob on the server which proxies Lob's check URL so the
// customer never sees a Lob-branded URL or our API key.

import { useEffect, useState } from "react";
import { IconX } from "@tabler/icons-react";
import { previewCheckJob } from "@/lib/mail/actions";

export type CheckPreviewData = {
  jobId: string;
  recipientName: string;
};

type RenderedPreview =
  | { kind: "pdf"; blobUrl: string }
  | { kind: "error"; message: string }
  | { kind: "loading" };

export function CheckPreviewModal({
  data,
  onClose,
}: {
  data: CheckPreviewData | null;
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

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    let blobUrl: string | null = null;
    setRendered({ kind: "loading" });

    (async () => {
      const res = await previewCheckJob({ mail_job_id: data.jobId });
      if (cancelled) return;
      if (!res.ok) {
        setRendered({ kind: "error", message: res.error });
        return;
      }
      const bytes = Uint8Array.from(atob(res.base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      blobUrl = URL.createObjectURL(blob);
      setRendered({ kind: "pdf", blobUrl });
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
        <header className="flex w-[640px] max-w-[90vw] items-center justify-between rounded-lg border border-gray-200 bg-surface px-4 py-2.5 shadow-card">
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
              Check Sent To
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
          style={{ width: "640px", maxWidth: "90vw", aspectRatio: "11 / 8.5" }}
        >
          {rendered.kind === "loading" && (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center text-[12.5px] text-gray-500">
              Loading check preview...
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
          {rendered.kind === "pdf" && (
            <iframe
              title="Check preview"
              src={rendered.blobUrl}
              className="h-full w-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}
