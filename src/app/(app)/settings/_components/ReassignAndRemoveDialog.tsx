"use client";

// Reusable modal for the "this item is in use; pick a replacement
// before removing it" flow. Shared by Lost Reasons (archive) and
// Contact Roles (delete). Caller passes the count of dependents, the
// human label for the item being removed, the list of replacement
// options, and the commit callback that does the reassign + remove.

import { useEffect, useState } from "react";
import { IconX } from "@tabler/icons-react";

export type ReassignOption = {
  // The id passed to the commit callback. For Lost Reasons this is
  // another lost_reasons row id. For Contact Roles it's the label
  // string. Either way, opaque to this component.
  id: string | null;
  label: string;
};

export function ReassignAndRemoveDialog({
  open,
  onClose,
  itemLabel,
  itemKind,
  dependentNoun,
  dependentCount,
  options,
  onCommit,
}: {
  open: boolean;
  onClose: () => void;
  itemLabel: string;
  // "lost reason" or "contact role" — used in the dialog copy.
  itemKind: string;
  // "leads" or "contacts" — also used in dialog copy.
  dependentNoun: string;
  dependentCount: number;
  options: ReassignOption[];
  // Server commit. Returns ok/err so the dialog can show the error
  // inline without closing.
  onCommit: (
    replacementId: string | null
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [choice, setChoice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setChoice(null);
    setSubmitting(false);
    setErr(null);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  async function commit() {
    setSubmitting(true);
    setErr(null);
    const res = await onCommit(choice);
    setSubmitting(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-6">
      <div
        className="absolute inset-0"
        aria-hidden
        onClick={() => !submitting && onClose()}
      />
      <div
        className="relative z-10 w-[480px] max-w-[92vw] rounded-lg bg-white shadow-2xl"
        style={{ border: "1px solid #ebedf0" }}
      >
        <header
          className="flex items-start justify-between px-5 py-4"
          style={{ borderBottom: "1px solid #ebedf0" }}
        >
          <div>
            <div className="text-[14px] font-semibold text-ink">
              Reassign before removing
            </div>
            <div className="mt-[2px] text-[12px] text-gray-600">
              <span className="font-medium text-ink">{itemLabel}</span> is
              used by{" "}
              <span className="font-medium text-ink">{dependentCount}</span>{" "}
              {dependentNoun}. Pick a {itemKind} to move them to, or set
              none to clear the field.
            </div>
          </div>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <IconX size={15} stroke={1.75} />
          </button>
        </header>

        <div className="px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Move {dependentNoun} to
          </div>
          <div className="flex flex-col gap-1.5">
            {options.length === 0 ? (
              <div className="text-[12.5px] text-gray-500">
                No other {itemKind}s exist yet. The {dependentNoun} below
                will have their {itemKind} cleared.
              </div>
            ) : (
              options.map((opt) => (
                <label
                  key={opt.id ?? "__none__"}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[13px] text-ink hover:bg-gray-50"
                  style={{
                    border: "1px solid",
                    borderColor:
                      choice === opt.id ? "#0d4b3a" : "transparent",
                    background:
                      choice === opt.id
                        ? "rgba(13, 75, 58, 0.04)"
                        : undefined,
                  }}
                >
                  <input
                    type="radio"
                    name="reassign-choice"
                    checked={choice === opt.id}
                    onChange={() => setChoice(opt.id)}
                    className="cursor-pointer accent-petrol-500"
                  />
                  {opt.label}
                </label>
              ))
            )}
            <label
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50"
              style={{
                border: "1px solid",
                borderColor: choice === null ? "#0d4b3a" : "transparent",
                background:
                  choice === null && options.length > 0
                    ? "rgba(13, 75, 58, 0.04)"
                    : undefined,
              }}
            >
              <input
                type="radio"
                name="reassign-choice"
                checked={choice === null}
                onChange={() => setChoice(null)}
                className="cursor-pointer accent-petrol-500"
              />
              <span>
                Clear {itemKind} on those {dependentNoun}
              </span>
            </label>
          </div>
          {err && (
            <div
              className="mt-3 text-[12px]"
              style={{ color: "#b42318" }}
            >
              {err}
            </div>
          )}
        </div>

        <footer
          className="flex items-center justify-end gap-2 px-5 py-3.5"
          style={{ borderTop: "1px solid #ebedf0" }}
        >
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="cursor-pointer rounded-md px-3 py-2 text-[12.5px] font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={commit}
            disabled={submitting}
            className="cursor-pointer rounded-md px-4 py-2 text-[12.5px] font-medium text-white disabled:opacity-50"
            style={{ background: "#b42318" }}
          >
            {submitting ? "Working…" : "Reassign and remove"}
          </button>
        </footer>
      </div>
    </div>
  );
}
