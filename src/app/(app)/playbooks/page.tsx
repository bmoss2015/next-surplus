import Link from "next/link";
import { fetchPlaybooks } from "@/lib/playbooks/fetch-list";

export const dynamic = "force-dynamic";

// Playbooks index: every research template in the org, with the count of leads
// currently using it. Click a row to open the per-playbook board.
export default async function PlaybooksPage() {
  const playbooks = await fetchPlaybooks();

  return (
    <div className="px-7 py-6">
      <div className="mb-[22px]">
        <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
          Playbooks
        </h1>
        <div className="mt-1 text-[13px] text-gray-500">
          Each playbook is a research template. Click into one to see leads
          grouped by which step they're currently on.
        </div>
      </div>

      {playbooks.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-surface p-8 text-center text-sm text-gray-500">
          No playbooks yet. Create a research template in Settings to get
          started.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-surface">
          <div className="grid grid-cols-[1fr_120px_120px_120px] gap-4 border-b border-gray-200 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-gray-500">
            <span>Playbook</span>
            <span className="text-right">Steps</span>
            <span className="text-right">Active Leads</span>
            <span></span>
          </div>
          {playbooks.map((p) => (
            <Link
              key={p.id}
              href={`/playbooks/${p.id}`}
              className="grid grid-cols-[1fr_120px_120px_120px] items-center gap-4 border-b border-gray-100 px-5 py-4 transition-colors hover:bg-gray-50 last:border-b-0"
            >
              <div>
                <div className="text-sm font-medium text-ink">{p.name}</div>
                {(p.state || p.saleType) && (
                  <div className="mt-0.5 text-[11px] text-gray-500">
                    {[p.state, p.saleType].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
              <div className="text-right text-sm text-ink">{p.stepCount}</div>
              <div className="text-right text-sm text-ink">{p.activeLeads}</div>
              <div className="text-right text-xs text-petrol-700">Open →</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
