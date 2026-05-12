import { fetchKanbanLeads } from "@/lib/leads/fetch-kanban";
import { ViewToggle } from "./_components/ViewToggle";
import { KanbanBoard } from "./kanban/_components/KanbanBoard";

export const dynamic = "force-dynamic";

// Fix P: the Leads page now defaults to the Kanban view — navigating to
// /leads loads Kanban. The table moved to /leads/table.
export default async function LeadsPage() {
  const grouped = await fetchKanbanLeads();
  const total = Object.values(grouped).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <div className="px-7 py-6">
      <div className="mb-[22px] flex items-start justify-between">
        <div>
          <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
            Leads
          </h1>
          <div className="mt-1 text-[13px] text-gray-500">
            {total} active leads. Drag cards between columns to advance stages.
          </div>
        </div>
        <ViewToggle active="kanban" />
      </div>
      <KanbanBoard initialGrouped={grouped} />
    </div>
  );
}
