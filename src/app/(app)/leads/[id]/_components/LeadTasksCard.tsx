import { createClient } from "@/lib/supabase/server";
import { SectionSubheader } from "./SectionSubheader";
import { AddTaskCard } from "./AddTaskCard";
import { LeadTasksList, type LeadTaskRow } from "./LeadTasksList";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// Fix MM: right-rail Tasks card — open tasks for this lead under the Add Task
// control. Empty state above the button; list (max 5, overdue first) below it.
export async function LeadTasksCard({ leadId }: { leadId: string }) {
  const sb = await createClient();
  const { data } = await sb
    .from("tasks")
    .select("id, title, due_date")
    .eq("lead_id", leadId)
    .eq("completed", false);

  const today = todayKey();
  const all = ((data ?? []) as LeadTaskRow[]).slice().sort((a, b) => {
    const aOver = a.due_date != null && a.due_date < today;
    const bOver = b.due_date != null && b.due_date < today;
    if (aOver !== bOver) return aOver ? -1 : 1; // overdue first
    if (a.due_date == null && b.due_date == null) return 0;
    if (a.due_date == null) return 1; // no due date sinks to the bottom
    if (b.due_date == null) return -1;
    return a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0;
  });

  const visible = all.slice(0, 5);
  const total = all.length;

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-4 shadow-card">
      <SectionSubheader>Tasks</SectionSubheader>
      {total === 0 && (
        <div className="mb-2 text-[11px] text-gray-400">No tasks yet</div>
      )}
      <AddTaskCard leadId={leadId} />
      {total > 0 && (
        <LeadTasksList
          leadId={leadId}
          initialTasks={visible}
          totalCount={total}
          todayKey={today}
        />
      )}
    </div>
  );
}
