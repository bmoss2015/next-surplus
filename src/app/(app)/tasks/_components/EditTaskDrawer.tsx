"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconX } from "@tabler/icons-react";
import { Drawer } from "@/components/Drawer";
import { updateTask } from "../_actions";
import type { TaskRow } from "@/lib/tasks/fetch";
import type { LeadOption } from "@/lib/leads/lead-options";

export function EditTaskDrawer({
  task,
  onClose,
  onSaved,
}: {
  task: TaskRow | null;
  onClose: () => void;
  onSaved?: (updated: TaskRow) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [leadId, setLeadId] = useState<string>("");
  const [leadQuery, setLeadQuery] = useState("");
  const [leadSearchResults, setLeadSearchResults] = useState<LeadOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLeadLabel, setSelectedLeadLabel] = useState("");
  const [notes, setNotes] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!task) return;
    setTitle(task.title ?? "");
    setDescription(task.description ?? "");
    setDueDate(task.due_date ?? "");
    setDueTime(task.due_time ?? "");
    setLeadId(task.lead_id ?? "");
    const label = task.lead ? `${task.lead.lead_id} — ${task.lead.address}` : "";
    setLeadQuery(label);
    setSelectedLeadLabel(label);
    setNotes(task.notes ?? null);
    setError(null);
  }, [task]);

  useEffect(() => {
    if (!leadQuery.trim() || leadQuery === selectedLeadLabel) {
      setLeadSearchResults([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/leads/search?q=${encodeURIComponent(leadQuery.trim())}`
        );
        if (!res.ok) {
          setLeadSearchResults([]);
          return;
        }
        const data = (await res.json()) as LeadOption[];
        setLeadSearchResults(data);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(handle);
  }, [leadQuery, selectedLeadLabel]);

  function handleSave() {
    if (!task) return;
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    startTransition(async () => {
      const result = await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        due_time: dueTime || null,
        lead_id: leadId || null,
        notes: notes ?? null,
      });
      if (result.ok) {
        onSaved?.({
          ...task,
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          due_time: dueTime || null,
          lead_id: leadId || null,
          notes: notes ?? null,
        });
        onClose();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-surface px-3 py-2 text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";
  const pickerClass =
    "w-full cursor-pointer rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-[#0d4b3a]";
  const labelClass =
    "block text-[10px] tracking-[0.5px] font-medium text-gray-500 mb-1";

  return (
    <Drawer
      open={task !== null}
      onClose={onClose}
      title="Edit Task"
      description="Update this task's details."
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Title</label>
          <input
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Schedule Notary Appointment"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Add More Detail"
            className={`${inputClass} resize-y`}
          />
        </div>

        <div className="relative">
          <label className={labelClass}>Linked Lead</label>
          <div className="relative">
            <input
              type="text"
              value={leadQuery}
              onChange={(e) => {
                const value = e.target.value;
                setLeadQuery(value);
                if (value !== selectedLeadLabel) {
                  setLeadId("");
                  setSelectedLeadLabel("");
                }
              }}
              placeholder="Search Lead By ID Or Address"
              className={`${inputClass}${leadId ? " pr-8" : ""}`}
            />
            {leadId && (
              <button
                type="button"
                onClick={() => {
                  setLeadId("");
                  setLeadQuery("");
                  setSelectedLeadLabel("");
                  setLeadSearchResults([]);
                }}
                aria-label="Clear linked lead"
                title="Clear Linked Lead"
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-ink"
              >
                <IconX size={14} stroke={1.75} />
              </button>
            )}
          </div>
          {leadSearchResults.length > 0 && (
            <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-b-md border border-gray-200 bg-white shadow-lg">
              {leadSearchResults.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    const label = `${opt.lead_id} — ${opt.address}`;
                    setLeadId(opt.id);
                    setLeadQuery(label);
                    setSelectedLeadLabel(label);
                    setLeadSearchResults([]);
                  }}
                  className="w-full cursor-pointer border-b border-gray-100 px-3 py-2 text-left text-[12px] text-ink hover:bg-gray-50"
                >
                  <div className="font-medium">{opt.lead_id}</div>
                  <div className="truncate text-[11px] text-gray-500">{opt.address}</div>
                </button>
              ))}
            </div>
          )}
          {isSearching && (
            <div className="mt-1 text-[11px] text-gray-500">Searching Leads…</div>
          )}
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
          <div className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-2 text-xs text-ink hover:border-petrol-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="cursor-pointer rounded-md btn-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {pending ? "Saving" : "Save Changes"}
          </button>
        </div>
      </div>
    </Drawer>
  );
}
