"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconPencil } from "@tabler/icons-react";
import type { PlaybookListItem } from "@/lib/playbooks/types";

export function PlaybooksClient({
  playbooks,
  isAdmin,
}: {
  playbooks: PlaybookListItem[];
  isAdmin: boolean;
}) {
  const router = useRouter();

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
        {isAdmin && (
          <button
            type="button"
            onClick={() => router.push("/settings/playbooks/new")}
            className="btn-primary shrink-0 cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-medium text-white"
          >
            + Create Playbook
          </button>
        )}
      </div>

      {playbooks.length === 0 ? (
        <div className="max-w-4xl rounded-lg border border-gray-200 bg-surface p-8 text-center text-sm text-gray-500">
          {isAdmin
            ? "No playbooks yet. Click + Create Playbook to add one."
            : "No playbooks yet."}
        </div>
      ) : (
        <div className="max-w-4xl space-y-2">
          {playbooks.map((p) => (
            <div
              key={p.id}
              className="grid items-center gap-4 rounded-md border border-gray-200 bg-surface px-4 py-3 transition-colors hover:border-petrol-300"
              style={{
                gridTemplateColumns: `minmax(0, 1fr) 90px 130px${isAdmin ? " 28px" : ""} auto`,
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
              {isAdmin && (
                <button
                  type="button"
                  title="Edit playbook"
                  aria-label="Edit playbook"
                  onClick={() => router.push(`/settings/playbooks/${p.id}`)}
                  className="flex cursor-pointer items-center justify-center rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-petrol-700"
                >
                  <IconPencil size={14} stroke={1.75} />
                </button>
              )}
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

    </div>
  );
}
