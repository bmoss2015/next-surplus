"use client";

import { useEffect } from "react";
import { IconX, IconExternalLink } from "@tabler/icons-react";

// Renders the body_html in a sandboxed iframe sized like a real
// 8.5×11 sheet so the preview reads as a piece of paper, not a wide
// modal. Sandboxing prevents any inline styles inside the letter from
// leaking into the host page.

export type LetterPreviewData = {
  jobId: string;
  recipientName: string;
  bodyHtml: string | null;
  trackingUrl: string | null;
};

export function LetterPreviewModal({
  data,
  onClose,
}: {
  data: LetterPreviewData | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!data) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, onClose]);

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
          <div className="flex items-center gap-2">
            {data.trackingUrl && (
              <a
                href={data.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-ink hover:bg-gray-50"
              >
                Provider Preview
                <IconExternalLink size={11} stroke={2} />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100"
              aria-label="Close"
            >
              <IconX size={15} stroke={1.75} />
            </button>
          </div>
        </header>
        <div
          className="overflow-hidden rounded-sm border border-gray-300 bg-white shadow-xl"
          style={{ width: "560px", maxWidth: "90vw", aspectRatio: "8.5 / 11" }}
        >
          {data.bodyHtml ? (
            <iframe
              title="Letter preview"
              sandbox=""
              srcDoc={data.bodyHtml}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center text-[12.5px] text-gray-500">
              <div className="mb-2 text-[11px] uppercase tracking-wide text-gray-400">
                Letter Content Not Stored
              </div>
              <div>
                This piece doesn&apos;t have a stored body — it was sent
                using a Word document template that the provider rendered
                directly. Open the provider preview above to see the
                rendered letter.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
