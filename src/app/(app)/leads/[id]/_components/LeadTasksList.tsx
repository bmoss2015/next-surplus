"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { IconAlertTriangle } from "@tabler/icons-react";
import { completeLeadTask } from "../_actions";

export type LeadTaskRow = {
  id: string;
  title: string;
  due_date: string | null;
};

function fmtDue(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Fix MM: the open-tasks list under the Add Task control. Checking a task
// completes it immediately (server logs a "Task Completed" activity) and the
// row disappears.
export function LeadTasksList({
  leadId,
  initialTasks,
  totalCount,
  todayKey,
}: {
  leadId: string;
  initialTasks: LeadTaskRow[];
  totalCount: number;
  todayKey: string;
}) {
  const [tasks, setTasks] = useState<LeadTaskRow[]>(initialTasks);
  const [, startTransition] = useTransition();

  function complete(t: LeadTaskRow) {
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    startTransition(async () => {
      await completeLeadTask(t.id, leadId, t.title);
    });
  }

  if (tasks.length === 0) return null;

  return (
    <div className="mt-3 space-y-2 border-t border-gray-150 pt-3">
      {tasks.map((t) => {
        const overdue = t.due_date != null && t.due_date < todayKey;
        return (
          <div key={t.id} className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => complete(t)}
              aria-label="Mark task complete"
              title="Mark complete"
              className="mt-[2px] h-[14px] w-[14px] shrink-0 cursor-pointer rounded-[3px] border border-gray-300 transition-colors hover:border-petrol-500 hover:bg-petrol-50"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[12px] leading-snug text-ink">{t.title}</div>
              {t.due_date && (
                <div
                  className={`mt-[1px] flex items-center gap-1 text-[10.5px] ${
                    overdue ? "font-medium text-petrol-500" : "text-gray-400"
                  }`}
                >
                  {overdue && <IconAlertTriangle size={10} stroke={2.25} />}
                  {overdue ? `Overdue · ${fmtDue(t.due_date)}` : fmtDue(t.due_date)}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {totalCount > 5 && (
        <Link
          href={`/tasks?lead=${leadId}`}
          className="block pt-1 text-[11px] font-medium text-petrol-500 hover:text-petrol-700"
        >
          View All {totalCount} Tasks
        </Link>
      )}
    </div>
  );
}
