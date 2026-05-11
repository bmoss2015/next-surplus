import "server-only";
import { createClient } from "@/lib/supabase/server";

export type TaskRow = {
  id: string;
  lead_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  completed: boolean;
  completed_at: string | null;
  priority: "high" | "medium" | "low";
  source: string;
  notes: string | null;
  created_at: string;
  lead: { lead_id: string; address: string } | null;
};

export type TaskBuckets = {
  overdue: TaskRow[];
  today: TaskRow[];
  week: TaskRow[];
  later: TaskRow[];
  none: TaskRow[];
};

function todayKey(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function fetchTasks(): Promise<TaskRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("tasks")
    .select(
      `id, lead_id, title, description, due_date, due_time, completed, completed_at,
       priority, source, notes, created_at,
       lead:leads(lead_id, address)`
    )
    .order("completed", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as TaskRow[];
}

// Buckets the open (incomplete) tasks for the Tasks page sections. `overdue`
// holds tasks whose due_date is strictly before today; `today` holds tasks due
// today; the rest fall into week / later / none.
export function bucketTasks(tasks: TaskRow[]): TaskBuckets {
  const today = todayKey();
  const sevenOut = new Date();
  sevenOut.setHours(0, 0, 0, 0);
  sevenOut.setDate(sevenOut.getDate() + 7);
  const sevenOutKey = (() => {
    const y = sevenOut.getFullYear();
    const m = String(sevenOut.getMonth() + 1).padStart(2, "0");
    const day = String(sevenOut.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();

  const buckets: TaskBuckets = {
    overdue: [],
    today: [],
    week: [],
    later: [],
    none: [],
  };

  for (const t of tasks) {
    if (t.completed) continue;
    if (!t.due_date) {
      buckets.none.push(t);
      continue;
    }
    if (t.due_date < today) buckets.overdue.push(t);
    else if (t.due_date === today) buckets.today.push(t);
    else if (t.due_date <= sevenOutKey) buckets.week.push(t);
    else buckets.later.push(t);
  }

  return buckets;
}

// Convenience for callers that want the buckets directly from the DB.
export async function fetchTaskBuckets(): Promise<TaskBuckets> {
  return bucketTasks(await fetchTasks());
}
