"use client";

import { useMemo, useState, useTransition } from "react";
import { IconAlertTriangle, IconPlus } from "@tabler/icons-react";
import { completeLeadTask } from "../_actions";
import { createTask } from "@/app/(app)/tasks/_actions";
import { cn } from "@/lib/cn";

export type TabTaskRow = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: "high" | "medium" | "low";
};

type Priority = "high" | "medium" | "low";

function fmtDue(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function addDays(key: string, n: number): string {
  const d = new Date(key + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

const PRIORITY_PILL: Record<Priority, string> = {
  high: "bg-[#fef2f2] text-[#991b1b] border border-[#fca5a5]",
  medium: "bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]",
  low: "bg-[#f8fafc] text-[#94a3b8] border border-[#e2e8f0]",
};
const PRIORITY_LABEL: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const GROUPS = ["Overdue", "Today", "This Week", "Later", "No Due Date"] as const;
type Group = (typeof GROUPS)[number];

export function LeadTasksTabClient({
  leadId,
  initialTasks,
  todayKey,
}: {
  leadId: string;
  initialTasks: TabTaskRow[];
  todayKey: string;
}) {
  const [tasks, setTasks] = useState<TabTaskRow[]>(initialTasks);
  const [, startTransition] = useTransition();

  // Inline add form (always visible).
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [error, setError] = useState<string | null>(null);
  const [pending, formPending] = useTransition();

  const weekEnd = addDays(todayKey, 7);

  function groupOf(t: TabTaskRow): Group {
    if (t.due_date == null) return "No Due Date";
    if (t.due_date < todayKey) return "Overdue";
    if (t.due_date === todayKey) return "Today";
    if (t.due_date <= weekEnd) return "This Week";
    return "Later";
  }

  const grouped = useMemo(() => {
    const map: Record<Group, TabTaskRow[]> = {
      Overdue: [],
      Today: [],
      "This Week": [],
      Later: [],
      "No Due Date": [],
    };
    for (const t of tasks) map[groupOf(t)].push(t);
    for (const g of GROUPS) {
      map[g].sort((a, b) => {
        if (a.due_date == null && b.due_date == null) return 0;
        if (a.due_date == null) return 1;
        if (b.due_date == null) return -1;
        return a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0;
      });
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, todayKey, weekEnd]);

  function complete(t: TabTaskRow) {
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    startTransition(async () => {
      await completeLeadTask(t.id, leadId, t.title);
    });
  }

  function submit() {
    const t = title.trim();
    if (!t) {
      setError("Title Is Required");
      return;
    }
    setError(null);
    const desc = description.trim() || null;
    const dd = dueDate || null;
    const dt = dueTime || null;
    const pr = priority;
    formPending(async () => {
      const res = await createTask({
        title: t,
        description: desc,
        due_date: dd,
        due_time: dt,
        priority: pr,
        lead_id: leadId,
        notes: null,
      });
      if (res.ok) {
        setTasks((prev) => [
          ...prev,
          { id: res.id, title: t, description: desc, due_date: dd, due_time: dt, priority: pr },
        ]);
        setTitle("");
        setDescription("");
        setDueDate("");
        setDueTime("");
        setPriority("medium");
      } else {
        setError(res.error);
      }
    });
  }

  const total = tasks.length;
  const fieldClass =
    "w-full rounded-md border border-gray-200 bg-surface px-2.5 py-[7px] text-[12.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";
  const labelClass = "mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500";

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0a3d4a]">
          Tasks
        </h3>
        <span className="text-[11px] text-gray-400">
          {total} {total === 1 ? "Open Task" : "Open Tasks"}
        </span>
      </div>

      {total === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[12.5px] text-gray-500">
          No open tasks on this lead. Add one below.
        </div>
      ) : (
        <div className="space-y-4">
          {GROUPS.map((g) => {
            const rows = grouped[g];
            if (rows.length === 0) return null;
            return (
              <div key={g}>
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">
                  {g}
                </div>
                <div className="space-y-2">
                  {rows.map((t) => {
                    const overdue = t.due_date != null && t.due_date < todayKey;
                    return (
                      <div
                        key={t.id}
                        className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3"
                      >
                        <button
                          type="button"
                          onClick={() => complete(t)}
                          aria-label="Mark task complete"
                          title="Mark complete"
                          className="mt-[2px] h-[15px] w-[15px] shrink-0 cursor-pointer rounded-[3px] border border-gray-300 transition-colors hover:border-petrol-500 hover:bg-petrol-50"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[13px] font-medium leading-snug text-ink">
                              {t.title}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-2 py-[1px] text-[10px] font-medium leading-none",
                                PRIORITY_PILL[t.priority]
                              )}
                            >
                              {PRIORITY_LABEL[t.priority]}
                            </span>
                          </div>
                          {t.description && (
                            <div className="mt-[2px] text-[11.5px] leading-snug text-gray-500">
                              {t.description}
                            </div>
                          )}
                          {t.due_date && (
                            <div
                              className={cn(
                                "mt-1 flex items-center gap-1 text-[10.5px]",
                                overdue ? "font-medium text-petrol-500" : "text-gray-400"
                              )}
                            >
                              {overdue && <IconAlertTriangle size={10} stroke={2.25} />}
                              {overdue ? "Overdue · " : "Due "}
                              {fmtDue(t.due_date)}
                              {t.due_time ? ` · ${t.due_time}` : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Always-visible inline add form (no modal). */}
      <div className="mt-5 rounded-xl border border-gray-200 bg-[#f8fafc] p-4">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0a3d4a]">
          Add Task
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Call Owner Before Friday"
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional Details"
              className={cn(fieldClass, "resize-y")}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={cn(fieldClass, "cursor-pointer")}
              />
            </div>
            <div>
              <label className={labelClass}>Time</label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className={cn(fieldClass, "cursor-pointer")}
              />
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className={cn(fieldClass, "cursor-pointer")}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
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
            className="btn-primary inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-[7px] text-xs font-medium disabled:opacity-50"
          >
            <IconPlus size={13} stroke={2} />
            {pending ? "Adding…" : "Add Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
