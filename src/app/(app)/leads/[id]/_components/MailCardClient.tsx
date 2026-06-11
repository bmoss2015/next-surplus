"use client";

import { useState } from "react";
import { IconExternalLink } from "@tabler/icons-react";
import { MailStatusPill } from "@/components/mail/MailStatusPill";
import {
  LetterPreviewModal,
  type LetterPreviewData,
} from "@/components/mail/LetterPreviewModal";
import { fetchMailJobAction } from "@/app/(app)/mail/_fetchers";
import { displayRecipientName } from "@/components/mail/displayName";
import type { MailJobListRow } from "@/lib/mail/fetch";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function MailCardClient({ rows }: { rows: MailJobListRow[] }) {
  const [preview, setPreview] = useState<LetterPreviewData | null>(null);

  const openLetter = async (row: MailJobListRow) => {
    const detail = await fetchMailJobAction(row.id);
    setPreview({
      jobId: row.id,
      recipientName: displayRecipientName(row.recipient_name),
      bodyHtml: detail?.body_html ?? null,
      trackingUrl: row.tracking_url,
      color: row.color,
    });
  };

  return (
    <>
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 rounded-md border border-gray-150 bg-white px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <MailStatusPill status={r.status} />
                <div className="truncate text-[12.5px] font-medium text-ink">
                  {displayRecipientName(r.recipient_name)}
                </div>
              </div>
              <div className="truncate text-[11px] text-gray-500">
                {r.recipient_city}, {r.recipient_state} · Sent{" "}
                {fmtDate(r.sent_at)}
                {r.include_check && r.check_amount_cents != null
                  ? ` · check $${(r.check_amount_cents / 100).toFixed(2)}`
                  : ""}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => void openLetter(r)}
                className="cursor-pointer text-[11.5px] font-medium text-petrol-500 hover:text-petrol-700"
              >
                View
              </button>
              {r.tracking_url ? (
                <a
                  href={r.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer items-center gap-1 text-[11.5px] font-medium text-petrol-500 hover:text-petrol-700"
                  title="Track"
                >
                  <IconExternalLink size={11} stroke={1.75} />
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <LetterPreviewModal data={preview} onClose={() => setPreview(null)} />
    </>
  );
}
