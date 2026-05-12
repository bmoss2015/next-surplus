"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconX } from "@tabler/icons-react";
import { Modal } from "@/components/Modal";
import { createTask } from "../_actions";
import type { LeadOption } from "@/lib/leads/lead-options";

// Fix P: Add Task is a centered modal (not a side drawer). Priority is gone;
// Linked Lead is a predictive search; Due Date / Time are native pickers.
export function AddTaskModal({
  open,
  onClose,
  defaultLeadId,
}: {
  open: boolean;
  onClose: () => void;
  defaultLeadId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [leadId, setLeadId] = useState<string>(defaultLeadId ?? "");
  const [leadQuery, setLeadQuery] = useState("");
  const [leadSearchResults, setLeadSearchResults] = useState<LeadOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [leadSearchError, setLeadSearchError] = useState<string | null>(null);
  const [selectedLeadLabel, setSelectedLeadLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setLeadId(defaultLeadId ?? "");
      setLeadQuery("");
      setSelectedLeadLabel("");
      setLeadSearchResults([]);
      setSearchedQuery("");
      setLeadSearchError(null);
    }
  }, [open, defaultLeadId]);

  // Predictive Linked-Lead search: 300ms debounce against lead_id / address.
  useEffect(() => {
    const q = leadQuery.trim();
    if (!q || leadQuery === selectedLeadLabel) {
      setLeadSearchResults([]);
      setSearchedQuery("");
      setLeadSearchError(null);
      return;
    }
    const handle = window.setTimeout(async () => {
      setIsSearching(true);
      setLeadSearchError(null);
      try {
        const res = await fetch(
          `/api/leads/search?q=${encodeURIComponent(q)}`
        );
        if (!res.ok) {
          setLeadSearchResults([]);
          setLeadSearchError("Lead search failed. Try again.");
          return;
        }
        const data = (await res.json()) as LeadOption[];
        setLeadSearchResults(Array.isArray(data) ? data : []);
      } catch {
        setLeadSearchResults([]);
        setLeadSearchError("Lead search failed. Try again.");
      } finally {
        setSearchedQuery(q);
        setIsSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(handle);
  }, [leadQuery, selectedLeadLabel]);

  const showLeadDropdown =
    leadQuery.trim().length > 0 && leadQuery !== selectedLeadLabel;
  const showNoMatches =
    showLeadDropdown &&
    !isSearching &&
    !leadSearchError &&
    leadSearchResults.length === 0 &&
    searchedQuery === leadQuery.trim();

  function reset() {
    setTitle("");
    setDescription("");
    setDueDate("");
    setDueTime("");
    setLeadId(defaultLeadId ?? "");
    setLeadQuery("");
    setSelectedLeadLabel("");
    setLeadSearchResults([]);
    setError(null);
  }

  function handleSave() {
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    startTransition(async () => {
      const result = await createTask({
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        due_time: dueTime || null,
        lead_id: leadId || null,
        notes: null,
      });
      if (result.ok) {
        reset();
        onClose();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-surface px-3 py-2 text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";
  // Native date/time pickers: light gray border, white background, teal focus.
  const pickerClass =
    "w-full cursor-pointer rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-[#0d6c7d]";
  const labelClass =
    "block text-[10px] tracking-[0.5px] font-medium text-gray-500 mb-1";

  return (
    <Modal open={open} onClose={onClose} title="Add Task">
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Title</label>
          <input
            type="text"
            autoFocus={open}
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
          {showLeadDropdown && (leadSearchResults.length > 0 || showNoMatches || leadSearchError) && (
            <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
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
                  className="w-full cursor-pointer border-b border-gray-100 px-3 py-2 text-left text-[12px] text-ink last:border-b-0 hover:bg-gray-50"
                >
                  <div className="font-medium">{opt.lead_id}</div>
                  <div className="truncate text-[11px] text-gray-500">{opt.address}</div>
                </button>
              ))}
              {showNoMatches && (
                <div className="px-3 py-2 text-[12px] text-gray-500">No matching leads</div>
              )}
              {leadSearchError && (
                <div className="px-3 py-2 text-[12px] text-danger">{leadSearchError}</div>
              )}
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
            onClick={() => {
              reset();
              onClose();
            }}
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
            {pending ? "Saving" : "Add Task"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
