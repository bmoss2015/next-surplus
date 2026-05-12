import { createClient } from "@/lib/supabase/server";
import { LeadTasksTabClient, type TabTaskRow } from "./LeadTasksTabClient";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// Fix QQQQ: Tasks is a first-class tab in the lead-detail body. It lists every
// open task for this lead grouped by due date, with an always-visible inline
// add form at the bottom — the right-rail Tasks card is gone.
export async function LeadTasksTab({ leadId }: { leadId: string }) {
  const sb = await createClient();
  const { data } = await sb
    .from("tasks")
    .select("id, title, description, due_date, due_time, priority")
    .eq("lead_id", leadId)
    .eq("completed", false);

  const tasks = (data ?? []) as TabTaskRow[];
  return (
    <LeadTasksTabClient leadId={leadId} initialTasks={tasks} todayKey={todayKey()} />
  );
}
