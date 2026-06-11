import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function fetchUrgentTaskCount(): Promise<{
  overdue: number;
  dueToday: number;
}> {
  const sb = await createClient();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [overdueRes, todayRes] = await Promise.all([
    sb
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("completed", false)
      .lt("due_date", todayStr),
    sb
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("completed", false)
      .eq("due_date", todayStr),
  ]);
  return {
    overdue: overdueRes.count ?? 0,
    dueToday: todayRes.count ?? 0,
  };
}
