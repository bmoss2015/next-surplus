import Link from "next/link";
import { IconDownload } from "@tabler/icons-react";
import { fetchLeads } from "@/lib/leads/query";
import { parseLeadsSearchParams } from "@/lib/leads/parse-search-params";
import { LeadsTable } from "@/app/(app)/leads/_components/LeadsTable";
import { SearchBox } from "@/app/(app)/leads/_components/SearchBox";
import { Pagination } from "@/app/(app)/leads/_components/Pagination";
import { ClaimsFilters } from "./_components/ClaimsFilters";

export const dynamic = "force-dynamic";

const CLAIMS_STAGES = ["with_attorney", "claim_filed", "won"] as const;

export default async function ClaimsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const baseQuery = parseLeadsSearchParams(params);

  // Force stage to one of the claims stages. If user picked a non-claims stage
  // somehow, default to all three by leaving stage undefined and relying on a
  // post-filter via .in() — handled below.
  const requestedStage =
    typeof params.stage === "string" &&
    CLAIMS_STAGES.includes(params.stage as (typeof CLAIMS_STAGES)[number])
      ? (params.stage as (typeof CLAIMS_STAGES)[number])
      : undefined;

  // We need an OR-style filter for "stage in (with_attorney, claim_filed, won)".
  // The base fetchLeads only supports a single stage; we run three queries and
  // merge if no specific stage is selected. For v0 scale (~20 active claims)
  // this is fine.
  let combined: Awaited<ReturnType<typeof fetchLeads>>;
  if (requestedStage) {
    combined = await fetchLeads({ ...baseQuery, stage: requestedStage });
  } else {
    const [a, b, c] = await Promise.all([
      fetchLeads({ ...baseQuery, stage: "with_attorney", page: 1, pageSize: 200 }),
      fetchLeads({ ...baseQuery, stage: "claim_filed", page: 1, pageSize: 200 }),
      fetchLeads({ ...baseQuery, stage: "won", page: 1, pageSize: 200 }),
    ]);
    const all = [...a.leads, ...b.leads, ...c.leads];
    combined = {
      leads: all
        .sort(
          (x, y) =>
            new Date(y.imported_at).getTime() -
            new Date(x.imported_at).getTime()
        )
        .slice(
          ((baseQuery.page ?? 1) - 1) * (baseQuery.pageSize ?? 25),
          ((baseQuery.page ?? 1) - 1) * (baseQuery.pageSize ?? 25) +
            (baseQuery.pageSize ?? 25)
        ),
      total: a.total + b.total + c.total,
    };
  }

  const exportParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") exportParams.set(key, value);
  }
  if (!exportParams.has("stage") && !requestedStage) {
    // Default export to all three claims stages
    exportParams.set("stage_in", CLAIMS_STAGES.join(","));
  }
  const exportHref = `/leads/export?${exportParams.toString()}`;

  return (
    <div className="px-7 py-6">
      <div className="mb-[22px]">
        <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
          Claims
        </h1>
        <div className="mt-1 text-[13px] text-gray-500">
          Leads filed with an attorney, at a county, or already won.{" "}
          {combined.total} total
        </div>
      </div>

      <ClaimsFilters />

      <div className="mb-3 flex items-center justify-between">
        <SearchBox />
        <Link
          href={exportHref}
          className="inline-flex items-center gap-[6px] rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-xs text-ink hover:border-petrol-500 hover:text-petrol-500"
        >
          <IconDownload size={13} stroke={1.75} />
          Export CSV
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-surface shadow-card">
        <LeadsTable leads={combined.leads} hideBelowFloor />
        <Pagination
          page={baseQuery.page ?? 1}
          pageSize={baseQuery.pageSize ?? 25}
          total={combined.total}
        />
      </div>
    </div>
  );
}
