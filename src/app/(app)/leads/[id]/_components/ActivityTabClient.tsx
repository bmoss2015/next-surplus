"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconArrowRight,
  IconNote,
  IconSparkles,
  IconClock,
  IconFile,
  IconCircleDot,
  IconMail,
  IconExternalLink,
  IconChevronDown,
} from "@tabler/icons-react";
import type { ActivityFullRow, DocumentRow } from "@/lib/leads/fetch-tab-data";
import { formatActivity, relativeTime, activityActorName } from "@/lib/leads/activity-format";
import { DocumentViewerModal, type ViewerDoc } from "./DocumentViewerModal";
import { MailStatusPill } from "@/components/mail/MailStatusPill";
import {
  LetterPreviewModal,
  type LetterPreviewData,
} from "@/components/mail/LetterPreviewModal";
import { fetchMailJobAction } from "@/app/(app)/mail/_fetchers";
import type { MailStatus } from "@/lib/mail/fetch";

const ICONS = {
  create: IconSparkles,
  stage: IconArrowRight,
  note: IconNote,
  review: IconClock,
  doc: IconFile,
  default: IconCircleDot,
} as const;

function docLabel(doc: DocumentRow): string {
  if (doc.custom_name && doc.custom_name.trim()) return doc.custom_name.trim();
  return doc.filename;
}

const MAIL_ACTIVITY_TO_STATUS: Record<string, MailStatus> = {
  mail_sent: "in_transit",
  mail_delivered: "delivered",
  mail_returned: "returned",
};

type Mode = "list" | "centered" | "rail";

export function ActivityTabClient({
  rows,
  leadSource,
  documents,
}: {
  rows: ActivityFullRow[];
  leadSource: string | null;
  documents: DocumentRow[];
}) {
  const [viewer, setViewer] = useState<ViewerDoc | null>(null);
  const [letterPreview, setLetterPreview] = useState<LetterPreviewData | null>(
    null
  );

  // Adaptive timeline mode based on row count.
  // Why: visual density needs to match volume — a long list overwhelms; a short list with a headline looks empty.
  const mode: Mode =
    rows.length <= 8 ? "list" : rows.length <= 15 ? "centered" : "rail";

  function docForActivity(row: ActivityFullRow): DocumentRow | null {
    if (row.activity_type !== "document_uploaded") return null;
    const filename = (row.payload?.filename as string | undefined) ?? null;
    if (!filename) return null;
    return (
      documents.find((d) => d.filename === filename && d.storage_path) ?? null
    );
  }

  function isMailRow(row: ActivityFullRow): boolean {
    return Boolean(MAIL_ACTIVITY_TO_STATUS[row.activity_type]);
  }

  async function openLetter(mailJobId: string, recipientName: string, trackingUrl: string | null) {
    const detail = await fetchMailJobAction(mailJobId);
    setLetterPreview({
      jobId: mailJobId,
      recipientName,
      bodyHtml: detail?.body_html ?? null,
      trackingUrl: detail?.tracking_url ?? trackingUrl,
      color: detail?.color ?? false,
    });
  }

  function renderRowBody(row: ActivityFullRow) {
    const { text } = formatActivity(row, { leadSource });
    const doc = docForActivity(row);
    const mailStatus = MAIL_ACTIVITY_TO_STATUS[row.activity_type];
    const mailJobId = (row.payload?.mail_job_id as string | undefined) ?? null;
    const trackingUrl = (row.payload?.tracking_url as string | undefined) ?? null;
    const mailRecipient = (row.payload?.recipient_name as string | undefined) ?? "";

    if (doc) {
      return (
        <>
          Document Uploaded —{" "}
          <button
            type="button"
            onClick={() =>
              setViewer({
                title: docLabel(doc),
                filename: doc.filename,
                storagePath: doc.storage_path,
              })
            }
            className="cursor-pointer font-medium text-petrol-500 underline hover:text-petrol-700"
          >
            {docLabel(doc)}
          </button>
        </>
      );
    }
    if (mailStatus) {
      return (
        <>
          <span>{text}</span>
          <MailStatusPill status={mailStatus} />
          {mailJobId && (
            <button
              type="button"
              onClick={() =>
                void openLetter(mailJobId, mailRecipient, trackingUrl)
              }
              className="cursor-pointer text-[11.5px] font-medium text-petrol-500 underline hover:text-petrol-700"
            >
              View Letter
            </button>
          )}
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center gap-1 text-[11.5px] font-medium text-petrol-500 hover:text-petrol-700"
            >
              Track
              <IconExternalLink size={11} stroke={1.75} />
            </a>
          )}
        </>
      );
    }
    return <span>{text}</span>;
  }

  function rowIcon(row: ActivityFullRow) {
    if (isMailRow(row)) return IconMail;
    const { icon } = formatActivity(row, { leadSource });
    return ICONS[icon];
  }

  function FullRow({ row }: { row: ActivityFullRow }) {
    const Icon = rowIcon(row);
    const actor = activityActorName(row);
    return (
      <div className="relative flex items-start gap-3 pl-0">
        <div className="relative z-10 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-gray-200 bg-surface">
          <Icon size={13} stroke={1.75} className="text-gray-500" />
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink">
            {renderRowBody(row)}
          </div>
          <div className="mt-[2px] text-[11px] text-gray-500">
            {actor} · {relativeTime(row.created_at)} ·{" "}
            {new Date(row.created_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-timeline-mode={mode}
      className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card"
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h3 className="section-subheader">Activity</h3>
          <div className="mt-[2px] text-[11px] text-gray-500">
            Full Chronological History Of Every Change On This Lead.
          </div>
        </div>
        {rows.length > 0 && (
          <div className="text-[11px] text-gray-500">
            {rows.length} {rows.length === 1 ? "Event" : "Events"}
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-[12px] text-gray-500">
          No Activity Yet
        </div>
      ) : mode === "list" ? (
        <ListView rows={rows} renderRow={(r) => <FullRow row={r} />} />
      ) : mode === "centered" ? (
        <CenteredView rows={rows} renderRow={(r) => <FullRow row={r} />} />
      ) : (
        <RailView
          rows={rows}
          renderHeadline={(r) => <FullRow row={r} />}
          rowIcon={rowIcon}
          isMailRow={isMailRow}
          formatLine={(r) => formatActivity(r, { leadSource }).text}
        />
      )}

      <DocumentViewerModal doc={viewer} onClose={() => setViewer(null)} />
      <LetterPreviewModal
        data={letterPreview}
        onClose={() => setLetterPreview(null)}
      />
    </div>
  );
}

function ListView({
  rows,
  renderRow,
}: {
  rows: ActivityFullRow[];
  renderRow: (row: ActivityFullRow) => React.ReactNode;
}) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute left-[12px] top-2 bottom-2 w-px bg-gray-200"
      />
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.id}>{renderRow(row)}</div>
        ))}
      </div>
    </div>
  );
}

function CenteredView({
  rows,
  renderRow,
}: {
  rows: ActivityFullRow[];
  renderRow: (row: ActivityFullRow) => React.ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Auto-center: position the middle event in the viewport on mount.
    const target = (el.scrollHeight - el.clientHeight) / 2;
    el.scrollTop = Math.max(0, target);
  }, []);

  return (
    <div
      ref={scrollerRef}
      className="relative max-h-[460px] overflow-y-auto pr-1"
    >
      <div
        aria-hidden
        className="absolute left-[12px] top-2 bottom-2 w-px bg-gray-200"
      />
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.id}>{renderRow(row)}</div>
        ))}
      </div>
    </div>
  );
}

function RailView({
  rows,
  renderHeadline,
  rowIcon,
  isMailRow,
  formatLine,
}: {
  rows: ActivityFullRow[];
  renderHeadline: (row: ActivityFullRow) => React.ReactNode;
  rowIcon: (row: ActivityFullRow) => (props: { size: number; stroke: number; className?: string }) => React.ReactNode;
  isMailRow: (row: ActivityFullRow) => boolean;
  formatLine: (row: ActivityFullRow) => string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const headline = rows[0];
  const rest = rows.slice(1);
  const visible = showAll ? rest : rest.slice(0, 10);
  const remaining = rest.length - visible.length;

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[8px] border border-gray-200 bg-gray-50/60 p-4">
        <div className="mb-2 text-[10.5px] font-medium uppercase tracking-wide text-gray-500">
          Most Recent
        </div>
        {renderHeadline(headline)}
      </div>

      <div>
        <div className="mb-2 text-[10.5px] font-medium uppercase tracking-wide text-gray-500">
          Earlier
        </div>
        <div className="relative">
          <div
            aria-hidden
            className="absolute left-[8px] top-1 bottom-1 w-px bg-gray-200"
          />
          <ul className="space-y-[6px]">
            {visible.map((row) => {
              const isOpen = expanded.has(row.id);
              const Icon = rowIcon(row);
              const actor = activityActorName(row);
              const line = isMailRow(row) ? formatLine(row) : formatLine(row);
              return (
                <li key={row.id} className="relative">
                  <button
                    type="button"
                    onClick={() => toggle(row.id)}
                    className="group flex w-full cursor-pointer items-center gap-2 rounded-md py-[3px] pl-0 pr-2 text-left hover:bg-gray-50"
                  >
                    <span className="relative z-10 flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full border border-gray-200 bg-surface">
                      <Icon size={9} stroke={1.75} className="text-gray-500" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-ink">
                      {line}
                    </span>
                    <span className="shrink-0 text-[10.5px] text-gray-500">
                      {relativeTime(row.created_at)}
                    </span>
                    <IconChevronDown
                      size={12}
                      stroke={1.75}
                      className={`shrink-0 text-gray-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="mt-1 ml-[25px] rounded-md border border-gray-200 bg-gray-50/60 p-3 text-[12px] text-gray-600">
                      <div>{actor}</div>
                      <div className="mt-[2px] text-[11px] text-gray-500">
                        {new Date(row.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="mt-3 cursor-pointer text-[11.5px] font-medium text-petrol-500 underline hover:text-petrol-700"
          >
            Show {remaining} More
          </button>
        )}
      </div>
    </div>
  );
}
