"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  IconTrash,
  IconCheck,
  IconExternalLink,
  IconPlus,
  IconPencil,
  IconX,
} from "@tabler/icons-react";
import {
  toggleTaskCompleted,
  deleteTask,
  bulkCompleteTasks,
  bulkDeleteTasks,
} from "../_actions";
import type { TaskRow } from "@/lib/tasks/fetch";
import { AddTaskModal } from "./AddTaskModal";
import { EditTaskDrawer } from "./EditTaskDrawer";
import { useRole } from "@/components/RoleProvider";
import { cn } from "@/lib/cn";

type BucketKey = "overdue" | "today" | "week" | "later" | "none";

type Section = {
  key: BucketKey;
  label: string;
  empty: string;
  tasks: TaskRow[];
  /** Amber-styled section (Overdue). */
  warn?: boolean;
};

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Buckets the open (incomplete) tasks for the page sections. Mirrors the
// server-side `bucketTasks` in @/lib/tasks/fetch; kept here so this client
// component can re-bucket after optimistic edits without importing the
// server-only fetch module.
function buildSections(tasks: TaskRow[]): Section[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayK = dateKey(now);
  const sevenOut = new Date(now);
  sevenOut.setDate(sevenOut.getDate() + 7);
  const sevenOutK = dateKey(sevenOut);

  const b: Record<BucketKey, TaskRow[]> = {
    overdue: [],
    today: [],
    week: [],
    later: [],
    none: [],
  };

  for (const t of tasks) {
    if (t.completed) continue;
    if (!t.due_date) {
      b.none.push(t);
      continue;
    }
    if (t.due_date < todayK) b.overdue.push(t);
    else if (t.due_date === todayK) b.today.push(t);
    else if (t.due_date <= sevenOutK) b.week.push(t);
    else b.later.push(t);
  }

  const sections: Section[] = [];
  // Fix P: only show the Overdue section (header + list) when something is
  // actually overdue — no empty-state row.
  if (b.overdue.length > 0) {
    sections.push({
      key: "overdue",
      label: "Overdue",
      empty: "Nothing Overdue",
      tasks: b.overdue,
      warn: true,
    });
  }
  sections.push(
    { key: "today", label: "Today", empty: "Nothing Due Today", tasks: b.today },
    {
      key: "week",
      label: "This Week",
      empty: "Nothing Due This Week",
      tasks: b.week,
    },
    {
      key: "later",
      label: "Later",
      empty: "Nothing Scheduled Later",
      tasks: b.later,
    },
    {
      key: "none",
      label: "No Due Date",
      empty: "No Tasks Without A Due Date",
      tasks: b.none,
    }
  );
  return sections;
}

function fmtDue(date: string | null, time: string | null): string {
  if (!date) return "";
  const d = new Date(date + "T00:00:00");
  const datePart = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  if (!time) return datePart;
  const [h, m] = time.split(":");
  const hh = parseInt(h, 10);
  const ampm = hh >= 12 ? "pm" : "am";
  const displayH = hh % 12 || 12;
  return `${datePart} · ${displayH}:${m}${ampm}`;
}

export function TasksList({
  initialTasks,
  overdueOnly = false,
}: {
  initialTasks: TaskRow[];
  overdueOnly?: boolean;
}) {
  const { isAdmin } = useRole();
  const [tasks, setTasks] = useState(initialTasks);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [showOverdueOnly, setShowOverdueOnly] = useState(overdueOnly);
  const [, startTransition] = useTransition();

  // Fix CCCCC PART 2: the auto-created "Needs Review" tasks are pinned in their
  // own block above every dated section — never bucketed into "No Due Date".
  function isNeedsReview(t: TaskRow): boolean {
    return !t.completed && t.title === "Needs Review" && t.source === "system";
  }
  const needsReviewTasks = tasks.filter(isNeedsReview);
  const allSections = buildSections(tasks.filter((t) => !isNeedsReview(t)));
  const sections = showOverdueOnly
    ? allSections.filter((s) => s.key === "overdue")
    : allSections;
  const completedCount = tasks.filter((t) => t.completed).length;
  const completed = tasks.filter((t) => t.completed).slice(0, 20); // cap completed list

  function toggle(task: TaskRow) {
    const next = !task.completed;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              completed: next,
              completed_at: next ? new Date().toISOString() : null,
            }
          : t
      )
    );
    startTransition(async () => {
      await toggleTaskCompleted(task.id, next);
    });
  }

  function remove(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
    startTransition(async () => {
      await deleteTask(taskId);
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function bulkComplete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setTasks((prev) =>
      prev.map((t) =>
        ids.includes(t.id)
          ? { ...t, completed: true, completed_at: new Date().toISOString() }
          : t
      )
    );
    setSelected(new Set());
    startTransition(async () => {
      await bulkCompleteTasks(ids);
    });
  }

  function bulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
    setSelected(new Set());
    startTransition(async () => {
      await bulkDeleteTasks(ids);
    });
  }

  return (
    <>
      <div className="mb-[22px] flex items-start justify-between">
        <div>
          <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
            Tasks
          </h1>
          <div className="mt-1 text-[13px] text-gray-500">
            {tasks.filter((t) => !t.completed).length} Open ·{" "}
            {completedCount} Completed
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex cursor-pointer items-center gap-1 rounded-md btn-primary px-3 py-2 text-xs font-medium text-white"
        >
          <IconPlus size={13} stroke={2} />
          Add Task
        </button>
      </div>

      {showOverdueOnly && (
        <div className="mb-3 flex items-center justify-between rounded-md border-l-4 border-l-[#0d4b3a] border border-[#0d4b3a] bg-[#e0f2f7] px-3 py-2 text-[#04261c]">
          <div className="text-[12px] font-medium">
            Showing Overdue Tasks Only
          </div>
          <button
            type="button"
            onClick={() => setShowOverdueOnly(false)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#0d4b3a] bg-surface px-2 py-[3px] text-[11px] text-[#04261c] hover:bg-[#e0f2f7]"
          >
            <IconX size={11} stroke={2} />
            Show All Tasks
          </button>
        </div>
      )}

      {selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-petrol-200 bg-petrol-50 px-3 py-2">
          <div className="text-[12px] text-petrol-700">
            {selected.size} Selected
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={bulkComplete}
              className="cursor-pointer rounded-md btn-primary px-3 py-[5px] text-xs font-medium text-white"
            >
              Complete
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={bulkDelete}
                className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[5px] text-xs text-danger hover:border-danger"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[5px] text-xs text-ink hover:border-petrol-500"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {needsReviewTasks.length > 0 && (
          <div>
            <div className="mb-2 flex items-baseline justify-between rounded-md border-l-4 border-l-[#04261c] bg-[#e8f4f6] px-3 py-2">
              <h2 className="m-0 text-[13px] font-semibold text-[#04261c]">Needs Review</h2>
              <span className="text-[11px] text-[#04261c]">{needsReviewTasks.length}</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-l-4 border-[#04261c] border-l-[#04261c] bg-surface shadow-card">
              {needsReviewTasks.map((task) => (
                <TaskRowDisplay
                  key={task.id}
                  task={task}
                  selected={selected.has(task.id)}
                  onToggleSelect={() => toggleSelect(task.id)}
                  onToggleComplete={() => toggle(task)}
                  onEdit={() => setEditing(task)}
                  onRemove={() => remove(task.id)}
                />
              ))}
            </div>
          </div>
        )}
        {showOverdueOnly && sections.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-surface px-4 py-6 text-center text-[12px] text-gray-500 shadow-card">
            Nothing Overdue.
          </div>
        )}
        {sections.map((section) => (
          <div key={section.key}>
            <div
              className={cn(
                "mb-2 flex items-baseline justify-between rounded-md",
                section.warn
                  ? "border-l-4 border-l-[#0d4b3a] bg-[#e0f2f7] px-3 py-2"
                  : ""
              )}
            >
              <h2
                className={cn(
                  "m-0 text-[13px] font-medium",
                  section.warn ? "text-[#04261c]" : "text-ink"
                )}
              >
                {section.label}
              </h2>
              <span
                className={cn(
                  "text-[11px]",
                  section.warn ? "text-[#04261c]" : "text-gray-500"
                )}
              >
                {section.tasks.length}
              </span>
            </div>
            <div
              className={cn(
                "overflow-hidden rounded-lg border bg-surface shadow-card",
                section.warn
                  ? "border-[#0d4b3a] border-l-4 border-l-[#0d4b3a]"
                  : "border-gray-200"
              )}
            >
              {section.tasks.length === 0 ? (
                <div
                  className={cn(
                    "px-4 py-3 text-center text-[12px]",
                    section.warn
                      ? "bg-[#e0f2f7] text-[#04261c]"
                      : "text-gray-500"
                  )}
                >
                  {section.empty}
                </div>
              ) : (
                section.tasks.map((task) => (
                  <TaskRowDisplay
                    key={task.id}
                    task={task}
                    selected={selected.has(task.id)}
                    warn={section.warn}
                    onToggleSelect={() => toggleSelect(task.id)}
                    onToggleComplete={() => toggle(task)}
                    onEdit={() => setEditing(task)}
                    onRemove={() => remove(task.id)}
                  />
                ))
              )}
            </div>
          </div>
        ))}

        {!showOverdueOnly && completed.length > 0 && (
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="m-0 text-[13px] font-medium text-gray-500">
                Recently Completed
              </h2>
              <span className="text-[11px] text-gray-500">
                {completed.length}
              </span>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 opacity-80">
              {completed.map((task) => (
                <TaskRowDisplay
                  key={task.id}
                  task={task}
                  selected={false}
                  onToggleSelect={() => {}}
                  onToggleComplete={() => toggle(task)}
                  onEdit={() => setEditing(task)}
                  onRemove={() => remove(task.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <AddTaskModal open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <EditTaskDrawer
        task={editing}
        onClose={() => setEditing(null)}
        onSaved={(updated) =>
          setTasks((prev) =>
            prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
          )
        }
      />
    </>
  );
}

function TaskRowDisplay({
  task,
  selected,
  warn,
  onToggleSelect,
  onToggleComplete,
  onEdit,
  onRemove,
}: {
  task: TaskRow;
  selected: boolean;
  warn?: boolean;
  onToggleSelect: () => void;
  onToggleComplete: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { isAdmin } = useRole();
  const router = useRouter();
  // Fix CCCCC PART 4: clicking a task row opens its linked lead; tasks with no
  // lead open the edit drawer instead. (Selection for bulk actions moved to the
  // explicit checkbox on the left.)
  function openTarget() {
    if (task.lead) router.push(`/leads/${task.lead_id}`);
    else onEdit();
  }
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openTarget}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          openTarget();
        }
      }}
      className={cn(
        "group flex cursor-pointer items-center gap-3 border-b border-gray-150 px-4 py-3 last:border-b-0",
        selected && (warn ? "bg-[#e0f2f7]" : "bg-petrol-50")
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onClick={(e) => e.stopPropagation()}
        onChange={onToggleSelect}
        className="h-[14px] w-[14px] shrink-0 cursor-pointer"
        aria-label="Select task"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete();
        }}
        aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
        className={cn(
          "flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded border transition-colors",
          task.completed
            ? "border-petrol-500 bg-petrol-500 text-white"
            : "border-gray-300 bg-surface hover:border-petrol-500"
        )}
      >
        {task.completed && <IconCheck size={11} stroke={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-[13px] font-medium",
            task.completed ? "text-gray-400 line-through" : "text-ink"
          )}
        >
          {task.title}
        </div>
        {task.description && (
          <div
            className={cn(
              "mt-[2px] text-[12px]",
              task.completed ? "text-gray-400" : "text-gray-600"
            )}
          >
            {task.description}
          </div>
        )}
        {(task.lead || task.due_date) && (
          <div
            className={cn(
              "mt-[2px] text-[11px]",
              warn && !task.completed ? "text-[#04261c]" : "text-gray-500"
            )}
          >
            {task.due_date && (
              <span>{fmtDue(task.due_date, task.due_time)}</span>
            )}
            {task.due_date && task.lead && <span> · </span>}
            {task.lead && (
              <Link
                href={`/leads/${task.lead_id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-mono hover:text-petrol-500"
              >
                {task.lead.lead_id}
              </Link>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="cursor-pointer text-gray-400 hover:text-petrol-500"
        aria-label="Edit task"
        title="Edit Task"
      >
        <IconPencil size={13} stroke={1.75} />
      </button>
      {task.lead && (
        <Link
          href={`/leads/${task.lead_id}`}
          onClick={(e) => e.stopPropagation()}
          className="cursor-pointer text-gray-400 hover:text-petrol-500"
          aria-label="Open lead"
          title="Open Lead"
        >
          <IconExternalLink size={13} stroke={1.75} />
        </Link>
      )}
      {isAdmin && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="cursor-pointer text-gray-400 hover:text-danger"
          aria-label="Delete task"
          title="Delete Task"
        >
          <IconTrash size={13} stroke={1.75} />
        </button>
      )}
    </div>
  );
}
