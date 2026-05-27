import Link from "next/link";
import { fetchPlaybooks } from "@/lib/playbooks/fetch-list";

export const dynamic = "force-dynamic";

// Playbooks index: every research template in the org with per-template stats.
// Pattern C from the multi-template mockup: each row is its own bordered card,
// name + step subtitle on the left, metrics packed adjacent to it (no big
// horizontal gap), "Open Board ->" pushed to the right edge via ml-auto.
export default async function PlaybooksPage() {
  const playbooks = await fetchPlaybooks();

  return (
    <div className="px-7 py-6">
      <div className="mb-3 max-w-4xl">
        <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
          Playbooks
        </h1>
        <div className="mt-1 text-[13px] text-gray-500">
          Each playbook is a reusable outreach checklist. Click into one to see
          leads grouped by which step they're currently on.
        </div>
      </div>

      {playbooks.length === 0 ? (
        <div className="max-w-4xl rounded-lg border border-gray-200 bg-surface p-8 text-center text-sm text-gray-500">
          No playbooks yet. Create one in Settings to get started.
        </div>
      ) : (
        <div className="max-w-4xl space-y-2">
          {playbooks.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-8 rounded-md border border-gray-200 bg-surface px-4 py-3 transition-colors hover:border-petrol-300"
            >
              <div className="min-w-0 max-w-[280px]">
                <Link
                  href={`/playbooks/${p.id}`}
                  className="truncate text-sm font-medium text-ink hover:text-petrol-700 hover:underline"
                >
                  {p.name}
                </Link>
                <div className="mt-0.5 truncate text-[11px] text-gray-500">
                  {p.stepCount} {p.stepCount === 1 ? "step" : "steps"}
                  {(p.state || p.saleType) && (
                    <>
                      {" · "}
                      {[p.state, p.saleType].filter(Boolean).join(" · ")}
                    </>
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[11px] text-gray-500">Active</div>
                <div className="text-sm font-medium text-ink">
                  {p.activeLeads}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[11px] text-gray-500">
                  Completed (30d)
                </div>
                <div className="text-sm font-medium text-ink">
                  {p.completedLast30Days}
                </div>
              </div>
              <Link
                href={`/playbooks/${p.id}`}
                className="ml-auto text-xs font-medium text-petrol-700 hover:underline"
              >
                Open Board →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
