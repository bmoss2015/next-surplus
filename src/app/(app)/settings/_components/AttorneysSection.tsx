"use client";

import { useState, useTransition } from "react";
import { IconPlus, IconTrash, IconEdit } from "@tabler/icons-react";
import { upsertAttorney, deleteAttorney } from "../_actions";
import type { AttorneyRow } from "@/lib/settings/fetch";

export function AttorneysSection({ initial }: { initial: AttorneyRow[] }) {
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<AttorneyRow | "new" | null>(null);
  const [, startTransition] = useTransition();

  function save(form: {
    id?: string | null;
    name: string;
    email: string;
    states: string;
    cost: string;
    notes: string;
  }) {
    startTransition(async () => {
      const result = await upsertAttorney({
        id: form.id ?? null,
        name: form.name,
        email: form.email.trim() || null,
        states_covered: form.states
          .split(",")
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean),
        default_cost: form.cost ? Number(form.cost) : null,
        notes: form.notes.trim() || null,
      });
      if (result.ok) {
        if (form.id) {
          setRows((prev) =>
            prev.map((r) =>
              r.id === form.id
                ? {
                    ...r,
                    name: form.name,
                    email: form.email.trim() || null,
                    states_covered: form.states
                      .split(",")
                      .map((s) => s.trim().toUpperCase())
                      .filter(Boolean),
                    default_cost: form.cost ? Number(form.cost) : null,
                    notes: form.notes.trim() || null,
                  }
                : r
            )
          );
        } else {
          setRows((prev) => [
            ...prev,
            {
              id: result.id,
              name: form.name,
              email: form.email.trim() || null,
              states_covered: form.states
                .split(",")
                .map((s) => s.trim().toUpperCase())
                .filter(Boolean),
              default_cost: form.cost ? Number(form.cost) : null,
              notes: form.notes.trim() || null,
            },
          ]);
        }
        setEditing(null);
      }
    });
  }

  function remove(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    startTransition(async () => {
      await deleteAttorney(id);
    });
  }

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0a3d4a]">
            Attorney Directory
          </h2>
          <div className="mt-1 text-[12px] font-normal text-[#94a3b8]">
            Attorneys you assign to leads filing claims.
          </div>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-1 rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white"
          >
            <IconPlus size={13} stroke={2} />
            Add Attorney
          </button>
        )}
      </div>

      {editing && (
        <AttorneyForm
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}

      {rows.length === 0 && !editing ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-[12px] text-gray-500">
          No attorneys yet. Click Add Attorney.
        </div>
      ) : (
        <div className="divide-y divide-gray-150">
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <div className="text-[13px] font-medium text-ink">
                  {row.name}
                </div>
                <div className="text-[11px] text-gray-500">
                  {row.email ?? "No email"} ·{" "}
                  {row.states_covered.length > 0
                    ? row.states_covered.join(", ")
                    : "No states"}
                  {row.default_cost != null
                    ? ` · $${row.default_cost.toLocaleString()} default`
                    : ""}
                </div>
              </div>
              <div></div>
              <button
                type="button"
                onClick={() => setEditing(row)}
                className="text-gray-400 hover:text-petrol-500"
                aria-label="Edit"
              >
                <IconEdit size={14} stroke={1.75} />
              </button>
              <button
                type="button"
                onClick={() => remove(row.id)}
                className="text-gray-400 hover:text-danger"
                aria-label="Remove"
              >
                <IconTrash size={14} stroke={1.75} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AttorneyForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: AttorneyRow | null;
  onCancel: () => void;
  onSave: (form: {
    id?: string | null;
    name: string;
    email: string;
    states: string;
    cost: string;
    notes: string;
  }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [states, setStates] = useState(initial?.states_covered.join(", ") ?? "");
  const [cost, setCost] = useState(
    initial?.default_cost != null ? String(initial.default_cost) : ""
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";

  return (
    <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="grid grid-cols-2 gap-2">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className={inputClass}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          className={inputClass}
        />
        <input
          type="text"
          value={states}
          onChange={(e) => setStates(e.target.value)}
          placeholder="States covered (comma-separated, e.g., SC, TN)"
          className={inputClass}
        />
        <input
          type="number"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="Default cost"
          className={inputClass}
        />
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Notes (optional)"
        className={`${inputClass} mt-2 resize-y`}
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-200 bg-surface px-3 py-[5px] text-xs text-ink hover:border-petrol-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            onSave({
              id: initial?.id ?? null,
              name,
              email,
              states,
              cost,
              notes,
            })
          }
          disabled={!name.trim()}
          className="rounded-md btn-primary px-3 py-[5px] text-xs font-medium text-white disabled:opacity-50"
        >
          {initial ? "Save Changes" : "Add Attorney"}
        </button>
      </div>
    </div>
  );
}
