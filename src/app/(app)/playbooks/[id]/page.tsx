import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPlaybookBoard } from "@/lib/playbooks/fetch-board";
import { PlaybookBoard } from "./_components/PlaybookBoard";

export const dynamic = "force-dynamic";

export default async function PlaybookBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const board = await fetchPlaybookBoard(id);
  if (!board) notFound();

  const totalActive = board.steps.reduce((acc, s) => acc + s.leads.length, 0);

  return (
    <div className="px-7 py-6">
      <div className="mb-[22px] flex items-start justify-between">
        <div>
          <Link
            href="/playbooks"
            className="text-[11px] uppercase tracking-wider text-gray-500 hover:text-ink"
          >
            ← All Playbooks
          </Link>
          <h1 className="mt-1 text-[22px] font-medium tracking-tight text-ink">
            {board.templateName}
          </h1>
          <div className="mt-1 text-[13px] text-gray-500">
            {totalActive} active leads across {board.steps.length} steps
            {board.completedLeads.length > 0
              ? ` · ${board.completedLeads.length} completed`
              : ""}
          </div>
        </div>
      </div>

      <PlaybookBoard board={board} />
    </div>
  );
}
