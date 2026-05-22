"use client";

import { useEffect } from "react";
import { IconX, IconExternalLink } from "@tabler/icons-react";

// Renders the exact body_html that was sent to the printer in an
// iframe sandbox so any inline styles inside the letter can't escape
// and restyle the host page. The iframe srcDoc shows what the recipient
// would receive — same letterhead and merge tokens already resolved.

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex h-full max-h-[88vh] w-full max-w-3xl flex-col rounded-lg border border-gray-200 bg-surface shadow-xl">
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="min-w-0">
            <div className="text-[10.5px] font-medium uppercase tracking-wide text-gray-500">
              Letter Sent To
            </div>
            <div className="truncate text-[14px] font-medium text-ink">
              {data.recipientName}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data.trackingUrl && (
              <a
                href={data.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-gray-50"
              >
                Open Provider Preview
                <IconExternalLink size={12} stroke={2} />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
              aria-label="Close"
            >
              <IconX size={16} stroke={1.75} />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-hidden bg-gray-100 p-4">
          {data.bodyHtml ? (
            <iframe
              title="Letter preview"
              sandbox=""
              srcDoc={data.bodyHtml}
              className="h-full w-full rounded-md border border-gray-200 bg-white shadow-card"
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-md border border-dashed border-gray-300 bg-white text-[12px] text-gray-500">
              No body content stored for this piece. Open the provider
              preview to see the rendered letter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
