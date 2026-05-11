"use client";

import { useState, useTransition } from "react";
import { IconPlus, IconTrash, IconEdit } from "@tabler/icons-react";
import { upsertResearchTemplate, deleteResearchTemplate } from "../_actions";
import { US_STATE_NAMES, SALE_TYPE_LABELS } from "@/lib/leads/types";
import type {
  ResearchTemplateRow,
  ResearchStep,
} from "@/lib/settings/fetch";

// Fix 100 — Research Templates list in Settings. Each row shows the name, a
// state badge, a sale-type badge, the step count, plus Edit and Delete. The
// editor exposes State and Sale Type selectors and explains where the template
// loads automatically.

const STATE_CODES = Object.keys(US_STATE_NAMES).sort();
type SaleType = "TAX" | "MTG";
const SALE_TYPES: SaleType[] = ["TAX", "MTG"];

function autoLoadText(state: string, saleType: string): string {
  const hasState = state.trim().length > 0;
  const hasSaleType = saleType.trim().length > 0;
  if (hasState && hasSaleType) {
    return `This template loads automatically on leads where state = ${state} and sale type = ${SALE_TYPE_LABELS[saleType as SaleType]}.`;
  }
  if (hasState) {
    return `This template loads automatically on leads where state = ${state}.`;
  }
  if (hasSaleType) {
    return `This template loads automatically on leads where sale type = ${SALE_TYPE_LABELS[saleType as SaleType]}.`;
  }
  return "This template loads automatically on all leads.";
}

export function ResearchTemplatesSection({
  initial,
}: {
  initial: ResearchTemplateRow[];
}) {
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<ResearchTemplateRow | "new" | null>(
    null
  );
  const [, startTransition] = useTransition();

  function save(form: {
    id: string | null;
    name: string;
    state: string;
    saleType: string;
    steps: ResearchStep[];
  }) {
    startTransition(async () => {
      const result = await upsertResearchTemplate({
        id: form.id,
        name: form.name,
        state: form.state || null,
        sale_type:
          form.saleType === "TAX" || form.saleType === "MTG"
            ? form.saleType
            : null,
        steps: form.steps.map((s) => ({
          name: s.name,
          url: s.url ?? null,
          instructions: s.instructions ?? null,
        })),
      });
      if (result.ok) {
        const next: ResearchTemplateRow = {
          id: form.id ?? result.id,
          name: form.name,
          state: form.state || null,
          sale_type:
            form.saleType === "TAX" || form.saleType === "MTG"
              ? (form.saleType as SaleType)
              : null,
          steps: form.steps.filter((s) => s.name.trim().length > 0),
        };
        setRows((prev) =>
          form.id
            ? prev.map((r) => (r.id === form.id ? next : r))
            : [...prev, next]
        );
        setEditing(null);
      }
    });
  }

  function remove(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    startTransition(async () => {
      await deleteResearchTemplate(id);
    });
  }

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[14px] font-medium text-ink">
            Research Templates
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
        <ResearchTemplateForm
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}

      {rows.length === 0 && !editing ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-[12px] text-gray-500">
          No research templates yet.
        </div>
      ) : (
        <div className="divide-y divide-gray-150">
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-medium text-ink">
                  {row.name}
                </span>
                <span className="rounded bg-gray-150 px-2 py-[2px] font-mono text-[10.5px] font-medium text-ink">
                  {row.state ?? "All States"}
                </span>
                <span className="rounded bg-gray-150 px-2 py-[2px] text-[10.5px] font-medium text-ink">
                  {row.sale_type
                    ? SALE_TYPE_LABELS[row.sale_type]
                    : "All Sale Types"}
                </span>
                <span className="text-[11px] text-gray-500">
                  {row.steps.length}{" "}
                  {row.steps.length === 1 ? "Step" : "Steps"}
                </span>
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
                aria-label="Delete"
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

function ResearchTemplateForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: ResearchTemplateRow | null;
  onCancel: () => void;
  onSave: (form: {
    id: string | null;
    name: string;
    state: string;
    saleType: string;
    steps: ResearchStep[];
  }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [saleType, setSaleType] = useState<string>(initial?.sale_type ?? "");
  const [steps, setSteps] = useState<ResearchStep[]>(
    initial?.steps && initial.steps.length > 0
      ? initial.steps.map((s) => ({ ...s }))
      : [{ name: "", url: null, instructions: null }]
  );

  const inputClass =
    "rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";

  function updateStep(idx: number, patch: Partial<ResearchStep>) {
    setSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    );
  }
  function addStep() {
    setSteps((prev) => [...prev, { name: "", url: null, instructions: null }]);
  }
  function removeStep(idx: number) {
    setSteps((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)
    );
  }

  return (
    <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="grid grid-cols-[1fr_140px_160px] gap-2">
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
        <select
          value={saleType}
          onChange={(e) => setSaleType(e.target.value)}
          className={`${inputClass} cursor-pointer`}
        >
          <option value="">All Sale Types</option>
          {SALE_TYPES.map((t) => (
            <option key={t} value={t}>
              {SALE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2 text-[11px] text-gray-500">
        {autoLoadText(state, saleType)}
      </div>

      <div className="mt-3 space-y-2">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="rounded-md border border-gray-200 bg-surface p-2.5"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-medium text-gray-500">
                Step {idx + 1}
              </span>
              <input
                type="text"
                value={step.name}
                onChange={(e) => updateStep(idx, { name: e.target.value })}
                placeholder="Step name"
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => removeStep(idx)}
                disabled={steps.length === 1}
                className="cursor-pointer text-gray-400 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Remove Step"
              >
                <IconTrash size={14} stroke={1.75} />
              </button>
            </div>
            <input
              type="text"
              value={step.url ?? ""}
              onChange={(e) =>
                updateStep(idx, { url: e.target.value || null })
              }
              placeholder="Link (optional)"
              className={`${inputClass} mt-2 w-full`}
            />
            <textarea
              value={step.instructions ?? ""}
              onChange={(e) =>
                updateStep(idx, { instructions: e.target.value || null })
              }
              rows={2}
              placeholder="Instructions (optional)"
              className={`${inputClass} mt-2 w-full resize-y`}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addStep}
          className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-surface px-2.5 py-[5px] text-[11px] text-ink hover:border-petrol-500"
        >
          <IconPlus size={12} stroke={2} />
          Add Step
        </button>
      </div>

      <div className="mt-3 flex justify-end gap-2">
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
              saleType,
              steps,
            })
          }
          disabled={
            !name.trim() || steps.every((s) => !s.name.trim())
          }
          className="cursor-pointer rounded-md btn-primary px-3 py-[5px] text-xs font-medium text-white disabled:opacity-50"
        >
          {initial ? "Save Changes" : "Add Template"}
        </button>
      </div>
    </div>
  );
}
