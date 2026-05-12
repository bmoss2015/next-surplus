import Link from "next/link";
import { IconDownload } from "@tabler/icons-react";
import { fetchLeads, fetchDistinctStates } from "@/lib/leads/query";
import { parseLeadsSearchParams } from "@/lib/leads/parse-search-params";
import { ViewToggle } from "../_components/ViewToggle";
import { LeadsFilters } from "../_components/LeadsFilters";
import { LeadsTable } from "../_components/LeadsTable";
import { SearchBox } from "../_components/SearchBox";
import { Pagination } from "../_components/Pagination";
import { LeadsActions } from "../_components/LeadsActions";

export const dynamic = "force-dynamic";

export default async function LeadsTablePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseLeadsSearchParams(params);
  const [{ leads, total }, states] = await Promise.all([
    fetchLeads(query),
    fetchDistinctStates(),
  ]);

  // Build the export URL with all current filters preserved
  const exportParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") exportParams.set(key, value);
  }
  const exportHref = `/leads/export?${exportParams.toString()}`;
  const isArchived = query.archived === true;

  return (
    <div className="px-7 py-6">
      {/* Fix EEE Patch: archived view gets a distinct heading and a back link;
          the Daily Work / Kanban / Table switcher is hidden here. */}
      {isArchived && (
        <Link
          href="/leads/table"
          className="mb-3 inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-petrol-500"
        >
          ← Active Leads
        </Link>
      )}
      <div className="mb-[22px] flex items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
            {isArchived ? "Archived Leads" : "Leads"}
          </h1>
          <div className="mt-1 text-[13px] text-gray-500">
            {total === 0
              ? isArchived
                ? "No archived leads"
                : "No leads match the current filters"
              : `${total} ${total === 1 ? "lead" : "leads"}${
                  isArchived ? " archived" : " matching filters"
                }`}
          </div>
        </div>
        {!isArchived && (
          <div className="flex items-center gap-4">
            <Link
              href="/leads/table?archived=1"
              className="text-[12px] text-gray-400 underline-offset-[3px] hover:text-petrol-500"
            >
              Archived
            </Link>
            <ViewToggle active="table" />
          </div>
        )}
      </div>

      <LeadsFilters states={states} />

      <div className="mb-3 flex items-center justify-between">
        <SearchBox />
        <div className="flex items-center gap-2">
          <Link
            href={exportHref}
            className="inline-flex items-center gap-[6px] rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-xs text-ink hover:border-petrol-500 hover:text-petrol-500"
          >
            <IconDownload size={13} stroke={1.75} />
            Export CSV
          </Link>
          <LeadsActions />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-surface shadow-card">
        <LeadsTable leads={leads} />
        <Pagination
          page={query.page ?? 1}
          pageSize={query.pageSize ?? 25}
          total={total}
        />
      </div>
    </div>
  );
}
