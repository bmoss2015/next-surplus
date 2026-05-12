"use client";

import { useState, useTransition } from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { addLostReason, deleteLostReason } from "../_actions";
import type { LostReasonAdminRow } from "@/lib/settings/fetch";

// Fix 98 — each non-default lost reason gets a trash icon. Deleting asks for
// confirmation and is blocked when leads still reference the reason (leads
// store the reason as plain text, so the server matches on the label).

export function LostReasonsSection({
  initial,
}: {
  initial: LostReasonAdminRow[];
}) {
  const [rows, setRows] = useState(initial.filter((r) => !r.archived));
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function add() {
    const label = draft.trim();
    if (!label) return;
    setError(null);
    startTransition(async () => {
      const res = await addLostReason(label);
      if (res.ok) {
        setRows((prev) =>
          [
            ...prev,
            { id: res.id, label, is_default: false, archived: false, created_at: new Date().toISOString() },
          ].sort((a, b) => a.label.localeCompare(b.label))
        );
        setDraft("");
        setAdding(false);
      } else {
        setError(res.error);
      }
    });
  }

  function remove(row: LostReasonAdminRow) {
    if (
      !window.confirm(`Delete the lost reason "${row.label}"? This cannot be undone.`)
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteLostReason(row.id);
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
      } else {
        setError(res.error);
      }
    });
  }

  const inputClass =
    "rounded-md border border-gray-200 bg-surface px-2.5 py-[6px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="section-subheader">Lost Reasons</h2>
          <div className="mt-1 text-[12px] font-normal text-[#94a3b8]">
            Options that appear in the Mark Lost dropdown.
          </div>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setError(null);
            }}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white"
          >
            <IconPlus size={13} stroke={2} />
            Add Reason
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-3 flex items-center gap-2">
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
              if (e.key === "Escape") {
                setAdding(false);
                setDraft("");
                setError(null);
              }
            }}
            placeholder="New reason"
            className={`${inputClass} flex-1`}
          />
          <button
            type="button"
            onClick={add}
            disabled={!draft.trim()}
            className="cursor-pointer rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setDraft("");
              setError(null);
            }}
            className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-xs text-ink hover:border-petrol-500"
          >
            Cancel
          </button>
        </div>
      )}
      {error && <div className="mb-2 text-[12px] text-danger">{error}</div>}

      <div className="divide-y divide-gray-150">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
          >
            <div className="flex-1">
              <div className="text-[13px] text-ink">{row.label}</div>
              <div className="text-[10.5px] text-gray-500">
                {row.is_default ? "Default" : "User Added"}
              </div>
            </div>
            {!row.is_default && (
              <button
                type="button"
                onClick={() => remove(row)}
                className="cursor-pointer text-gray-400 hover:text-danger"
                title="Delete"
                aria-label="Delete"
              >
                <IconTrash size={14} stroke={1.75} />
              </button>
            )}
          </div>
        ))}
        {rows.length === 0 && (
          <div className="py-4 text-center text-[12px] text-gray-500">
            No reasons yet.
          </div>
        )}
      </div>
    </div>
  );
}
