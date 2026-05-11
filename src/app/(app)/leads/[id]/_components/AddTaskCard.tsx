"use client";

import { useState, useTransition } from "react";
import { IconPlus, IconX } from "@tabler/icons-react";
import { createTask } from "@/app/(app)/tasks/_actions";

const PRIORITIES: Array<{ value: "high" | "medium" | "low"; label: string }> = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function AddTaskCard({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function reset() {
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("medium");
    setError(null);
  }

  function submit() {
    const t = title.trim();
    if (!t) {
      setError("Title Is Required");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createTask({
        title: t,
        description: description.trim() || null,
        due_date: dueDate || null,
        due_time: null,
        priority,
        lead_id: leadId,
        notes: null,
      });
      if (result.ok) {
        reset();
        setOpen(false);
        setDone(true);
        setTimeout(() => setDone(false), 2500);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-4 shadow-card">
      <div className="mb-[11px] flex items-center justify-between">
        <div className="text-[10px] tracking-[0.5px] font-medium text-gray-500">
          Tasks
        </div>
        {open && (
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              reset();
            }}
            className="cursor-pointer text-gray-400 hover:text-ink"
            aria-label="Close"
          >
            <IconX size={14} stroke={1.75} />
          </button>
        )}
      </div>

      {!open ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-petrol-500 px-3 py-[7px] text-xs font-medium text-petrol-500 hover:bg-petrol-50"
          >
            <IconPlus size={13} stroke={2} />
            Add Task
          </button>
          {done && (
            <div className="mt-2 text-center text-[11px] text-petrol-500">
              Task Added To Tasks Page
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500">
              Task Title
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Call Owner Before Friday"
              className="w-full rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500">
              Task Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional Details"
              className="w-full resize-y rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12px] text-ink outline-none focus:border-petrol-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "high" | "medium" | "low")
                }
                className="w-full cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12px] text-ink outline-none focus:border-petrol-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && (
            <div className="rounded-md border border-danger-border bg-danger-bg px-2 py-[6px] text-[11px] text-danger">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={pending || !title.trim()}
            className="btn-primary w-full cursor-pointer rounded-md px-3 py-[7px] text-xs font-medium text-white disabled:opacity-50"
          >
            {pending ? "Saving" : "Save Task"}
          </button>
        </div>
      )}
    </div>
  );
}
