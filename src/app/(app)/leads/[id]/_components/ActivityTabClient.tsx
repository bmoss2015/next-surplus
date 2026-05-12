"use client";

import { useState } from "react";
import {
  IconArrowRight,
  IconNote,
  IconSparkles,
  IconClock,
  IconFile,
  IconCircleDot,
} from "@tabler/icons-react";
import type { ActivityFullRow, DocumentRow } from "@/lib/leads/fetch-tab-data";
import { formatActivity, relativeTime, activityActorName } from "@/lib/leads/activity-format";
import { DocumentViewerModal, type ViewerDoc } from "./DocumentViewerModal";

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

  // Match a document_uploaded activity to a real document row by filename so we
  // can open the viewer from the timeline.
  function docForActivity(row: ActivityFullRow): DocumentRow | null {
    if (row.activity_type !== "document_uploaded") return null;
    const filename = (row.payload?.filename as string | undefined) ?? null;
    if (!filename) return null;
    return (
      documents.find((d) => d.filename === filename && d.storage_path) ?? null
    );
  }

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-4">
        <h3 className="section-subheader">
          Activity
        </h3>
        <div className="mt-[2px] text-[11px] text-gray-500">
          Full Chronological History Of Every Change On This Lead.
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-[12px] text-gray-500">
          No Activity Yet
        </div>
      ) : (
        <div className="relative">
          <div
            aria-hidden
            className="absolute left-[12px] top-2 bottom-2 w-px bg-gray-200"
          />
          <div className="space-y-4">
            {rows.map((row) => {
              const { text, icon } = formatActivity(row, { leadSource });
              const Icon = ICONS[icon];
              const actor = activityActorName(row);
              const doc = docForActivity(row);
              return (
                <div key={row.id} className="relative flex items-start gap-3 pl-0">
                  <div className="relative z-10 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-gray-200 bg-surface">
                    <Icon size={13} stroke={1.75} className="text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="text-[13px] text-ink">
                      {doc ? (
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
                            className="font-medium text-petrol-500 underline hover:text-petrol-700"
                          >
                            {docLabel(doc)}
                          </button>
                        </>
                      ) : (
                        text
                      )}
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
            })}
          </div>
        </div>
      )}

      <DocumentViewerModal doc={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}
