import {
  STAGES,
  SALE_TYPES,
  OWNER_STATUSES,
  type Stage,
  type SaleType,
  type OwnerStatus,
  type SortColumn,
  type SortDir,
} from "./types";
import type { LeadsQuery } from "./query";

const SORT_COLUMNS: SortColumn[] = [
  "lead_id",
  "address",
  "owner",
  "stage",
  "sale_type",
  "estimated_surplus",
  "days_since_sale",
  "stage_changed_at",
];

function parseInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function parseLeadsSearchParams(
  raw: Record<string, string | string[] | undefined>
): LeadsQuery {
  const single = (key: string) => {
    const v = raw[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const stage = single("stage");
  const sale_type = single("sale_type");
  const owner_status = single("owner_status");
  const sort = single("sort");
  const dir = single("dir");

  return {
    q: single("q"),
    state: single("state"),
    sale_type: SALE_TYPES.includes(sale_type as SaleType)
      ? (sale_type as SaleType)
      : undefined,
    stage: STAGES.includes(stage as Stage) ? (stage as Stage) : undefined,
    owner_status: OWNER_STATUSES.includes(owner_status as OwnerStatus)
      ? (owner_status as OwnerStatus)
      : undefined,
    surplus_min: parseInt(single("surplus_min")),
    surplus_max: parseInt(single("surplus_max")),
    sort: SORT_COLUMNS.includes(sort as SortColumn)
      ? (sort as SortColumn)
      : undefined,
    dir: dir === "asc" || dir === "desc" ? (dir as SortDir) : undefined,
    page: parseInt(single("page")) ?? 1,
    pageSize: 25,
  };
}
