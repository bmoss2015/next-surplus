import { fetchTasks } from "@/lib/tasks/fetch";
import { TasksList } from "./_components/TasksList";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await fetchTasks();

  return (
    <div className="px-7 py-6">
      <TasksList initialTasks={tasks} />
    </div>
  );
}
