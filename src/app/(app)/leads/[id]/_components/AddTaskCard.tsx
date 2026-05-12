"use client";

import { useState, useTransition } from "react";
import { IconPlus } from "@tabler/icons-react";
import { createTask } from "@/app/(app)/tasks/_actions";

// Fix MM: this is now just the add-task control inside the right-rail Tasks card
// (LeadTasksCard owns the shell, "Tasks" header, empty state and the open-tasks
// list). Collapsed it's a single "Add Task" button; expanded it's a small form.
export function AddTaskCard({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function reset() {
    setTitle("");
    setDescription("");
    setDueDate("");
    setDueTime("");
    setError(null);
  }

  function close() {
    setOpen(false);
    reset();
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
        due_time: dueTime || null,
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

  const pickerClass =
    "w-full cursor-pointer rounded-md border border-[#e2e8f0] bg-white px-2 py-[6px] text-[12px] text-ink outline-none focus:border-[#0d6c7d]";
  const labelClass =
    "mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500";

  if (!open) {
    return (
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
    );
  }

  return (
    <div className="space-y-2">
      <div>
        <label className={labelClass}>Task Title</label>
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
        <label className={labelClass}>Task Description</label>
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
          <label className={labelClass}>Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={pickerClass}
          />
        </div>
        <div>
          <label className={labelClass}>Time</label>
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className={pickerClass}
          />
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
      <button
        type="button"
        onClick={close}
        disabled={pending}
        className="block w-full cursor-pointer text-center text-[11px] text-gray-500 hover:text-ink disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );
}
