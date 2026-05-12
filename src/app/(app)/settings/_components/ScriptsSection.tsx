"use client";

import { useState, useTransition } from "react";
import { IconPlus, IconTrash, IconEdit } from "@tabler/icons-react";
import { upsertScript, deleteScript } from "../_actions";
import { US_STATE_NAMES } from "@/lib/leads/types";
import type { ScriptRow, ScriptChannel } from "@/lib/settings/fetch";

// Fix 64 — saved call/SMS/email scripts. Data only; no lead-detail wiring yet.

const STATE_CODES = Object.keys(US_STATE_NAMES).sort();
const CHANNELS: ScriptChannel[] = ["Call", "SMS", "Email"];

export function ScriptsSection({ initial }: { initial: ScriptRow[] }) {
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<ScriptRow | "new" | null>(null);
  const [, startTransition] = useTransition();

  function save(form: {
    id: string | null;
    name: string;
    state: string;
    channel: ScriptChannel;
    body: string;
  }) {
    startTransition(async () => {
      const result = await upsertScript({
        id: form.id,
        name: form.name,
        state: form.state || null,
        channel: form.channel,
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
                    channel: form.channel,
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
              state: form.state || null,
              channel: form.channel,
              body: form.body,
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
      await deleteScript(id);
    });
  }

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0a3d4a]">Scripts</h2>
          <div className="mt-1 text-[12px] font-normal text-[#94a3b8]">
            Reusable call, SMS, and email scripts. Optionally scoped to a state.
          </div>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white"
          >
            <IconPlus size={13} stroke={2} />
            Add Script
          </button>
        )}
      </div>

      {editing && (
        <ScriptForm
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}

      {rows.length === 0 && !editing ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-[12px] text-gray-500">
          No scripts yet.
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
                  {row.channel}
                  {row.state ? ` · ${row.state}` : " · Any State"}
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

function ScriptForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: ScriptRow | null;
  onCancel: () => void;
  onSave: (form: {
    id: string | null;
    name: string;
    state: string;
    channel: ScriptChannel;
    body: string;
  }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [channel, setChannel] = useState<ScriptChannel>(
    initial?.channel ?? "Call"
  );
  const [body, setBody] = useState(initial?.body ?? "");

  const inputClass =
    "rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";

  return (
    <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="grid grid-cols-[1fr_120px_120px] gap-2">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Script name"
          className={inputClass}
        />
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className={`${inputClass} cursor-pointer`}
        >
          <option value="">Any State</option>
          {STATE_CODES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as ScriptChannel)}
          className={`${inputClass} cursor-pointer`}
        >
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        placeholder="Script body."
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
            onSave({ id: initial?.id ?? null, name, state, channel, body })
          }
          disabled={!name.trim()}
          className="cursor-pointer rounded-md btn-primary px-3 py-[5px] text-xs font-medium text-white disabled:opacity-50"
        >
          {initial ? "Save Changes" : "Add Script"}
        </button>
      </div>
    </div>
  );
}
