"use client";

// Client wrapper for the /playbooks index page. Renders the list of playbooks
// and owns the create-drawer open state. Uses the same TemplateEditorDrawer
// component that Settings does so the create / edit experience is identical
// in both places (no separate forms to maintain).

import { useState } from "react";
import Link from "next/link";
import { TemplateEditorDrawer, type TemplateEditorState } from "@/app/(app)/settings/_components/TemplateEditorDrawer";
import type { PlaybookListItem } from "@/lib/playbooks/types";

export function PlaybooksClient({
  playbooks,
}: {
  playbooks: PlaybookListItem[];
}) {
  const [editor, setEditor] = useState<TemplateEditorState>({ kind: "closed" });

  function openCreate() {
    setEditor({ kind: "new", channel: "research" });
  }
  function closeEditor() {
    setEditor({ kind: "closed" });
  }

  return (
    <div className="px-7 py-6">
      <div className="mb-3 flex max-w-4xl items-start justify-between">
        <div>
          <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
            Playbooks
          </h1>
          <div className="mt-1 text-[13px] text-gray-500">
            Each playbook is a reusable checklist. Click into one to see leads
            grouped by which step they&apos;re currently on.
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary shrink-0 cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-medium text-white"
        >
          + Create Playbook
        </button>
      </div>

      {playbooks.length === 0 ? (
        <div className="max-w-4xl rounded-lg border border-gray-200 bg-surface p-8 text-center text-sm text-gray-500">
          No playbooks yet. Click + Create Playbook to add one.
        </div>
      ) : (
        <div className="max-w-4xl space-y-2">
          {/* Fixed grid template across every row so the Active / Completed
              columns line up vertically regardless of playbook name length. */}
          {playbooks.map((p) => (
            <div
              key={p.id}
              className="grid items-center gap-4 rounded-md border border-gray-200 bg-surface px-4 py-3 transition-colors hover:border-petrol-300"
              style={{
                gridTemplateColumns: "minmax(0, 1fr) 90px 130px auto",
              }}
            >
              <div className="min-w-0">
                <Link
                  href={`/playbooks/${p.id}`}
                  className="block truncate text-sm font-medium text-ink hover:text-petrol-700 hover:underline"
                >
                  {p.name}
                </Link>
                <div className="mt-0.5 truncate text-[11px] text-gray-500">
                  {p.stepCount} {p.stepCount === 1 ? "Step" : "Steps"}
                  {(p.state || p.saleType) && (
                    <>
                      {" · "}
                      {[p.state, p.saleType].filter(Boolean).join(" · ")}
                    </>
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[11px] text-gray-500">Active</div>
                <div className="text-sm font-medium text-ink">
                  {p.activeLeads}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[11px] text-gray-500">
                  Completed (30d)
                </div>
                <div className="text-sm font-medium text-ink">
                  {p.completedLast30Days}
                </div>
              </div>
              <Link
                href={`/playbooks/${p.id}`}
                className="text-xs font-medium text-petrol-700 hover:underline"
              >
                Open Board →
              </Link>
            </div>
          ))}
        </div>
      )}

      <TemplateEditorDrawer state={editor} onClose={closeEditor} />
    </div>
  );
}
