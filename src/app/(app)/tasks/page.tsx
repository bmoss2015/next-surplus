import { fetchTasks } from "@/lib/tasks/fetch";
import { TasksList } from "./_components/TasksList";

export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; lead?: string }>;
}) {
  const { filter, lead } = await searchParams;
  const tasks = await fetchTasks();
  // Fix MM: "View All Tasks" links from a lead arrive as ?lead=<id>.
  const visible = lead ? tasks.filter((t) => t.lead_id === lead) : tasks;

  return (
    <div className="px-7 py-6">
      <TasksList initialTasks={visible} overdueOnly={filter === "overdue"} />
    </div>
  );
}
