"use client";

import { useState, useTransition } from "react";
import { IconPlus, IconTrash, IconEdit } from "@tabler/icons-react";
import { upsertTemplate, deleteTemplate } from "../_actions";
import { US_STATE_NAMES } from "@/lib/leads/types";
import type { TemplateRow } from "@/lib/settings/fetch";

// Fix 63 — SMS Templates removed (no SMS integration). Only Email Templates
// remain; the underlying `templates` table/CRUD is unchanged (channel always
// "email" here).

const STATE_CODES = Object.keys(US_STATE_NAMES).sort();

export function TemplatesSection({ initial }: { initial: TemplateRow[] }) {
  const [rows, setRows] = useState(
    initial.filter((r) => r.channel === "email")
  );
  const [editing, setEditing] = useState<TemplateRow | "new" | null>(null);
  const [, startTransition] = useTransition();

  function save(form: {
    id: string | null;
    name: string;
    state: string;
    subject: string;
    body: string;
  }) {
    startTransition(async () => {
      const result = await upsertTemplate({
        id: form.id,
        name: form.name,
        channel: "email",
        state: form.state || null,
        subject: form.subject || null,
        body: form.body,
      });
      if (result.ok) {
        if (form.id) {
          setRows((prev) =>
            prev.map((r) =>
              r.id === form.id
                ? {
                    ...r,
                    name: form.name,
                    state: form.state || null,
                    subject: form.subject || null,
                    body: form.body,
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
              channel: "email",
              state: form.state || null,
              subject: form.subject || null,
              body: form.body,
              variables: [],
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
      await deleteTemplate(id);
    });
  }

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="section-subheader">
            Email Templates
          </h2>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white"
          >
            <IconPlus size={13} stroke={2} />
            Add Template
          </button>
        )}
      </div>

      {editing && (
        <TemplateForm
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}

      {rows.length === 0 && !editing ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-[12px] text-gray-500">
          No templates yet.
        </div>
      ) : (
        <div className="divide-y divide-gray-150">
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <div className="text-[13px] font-medium text-ink">
                  {row.name}
                </div>
                <div className="text-[11px] text-gray-500">
                  Email
                  {row.state ? ` · ${row.state}` : ""}
                  {row.subject ? ` · ${row.subject}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditing(row)}
                className="cursor-pointer text-gray-400 hover:text-petrol-500"
                aria-label="Edit"
              >
                <IconEdit size={14} stroke={1.75} />
              </button>
              <button
                type="button"
                onClick={() => remove(row.id)}
                className="cursor-pointer text-gray-400 hover:text-danger"
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

function TemplateForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: TemplateRow | null;
  onCancel: () => void;
  onSave: (form: {
    id: string | null;
    name: string;
    state: string;
    subject: string;
    body: string;
  }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [body, setBody] = useState(initial?.body ?? "");

  const inputClass =
    "rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";

  return (
    <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="grid grid-cols-[1fr_140px] gap-2">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name"
          className={inputClass}
        />
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className={`${inputClass} cursor-pointer`}
        >
          <option value="">All States</option>
          {STATE_CODES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject line"
        className={`${inputClass} mt-2 w-full`}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        placeholder="Body. Use {{owner_first_name}} and similar for variables."
        className={`${inputClass} mt-2 w-full resize-y`}
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[5px] text-xs text-ink hover:border-petrol-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            onSave({
              id: initial?.id ?? null,
              name,
              state,
              subject,
              body,
            })
          }
          disabled={!name.trim() || !body.trim()}
          className="cursor-pointer rounded-md btn-primary px-3 py-[5px] text-xs font-medium text-white disabled:opacity-50"
        >
          {initial ? "Save Changes" : "Add Template"}
        </button>
      </div>
    </div>
  );
}
