"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { IconX, IconFilter } from "@tabler/icons-react";
import {
  STAGES,
  STAGE_LABELS,
  SALE_TYPES,
  SALE_TYPE_LABELS,
  OWNER_STATUSES,
  OWNER_STATUS_LABELS,
  stateName,
  type Stage,
  type SaleType,
  type OwnerStatus,
} from "@/lib/leads/types";
import { formatCurrency } from "@/lib/leads/format";
import { cn } from "@/lib/cn";

export function LeadsFilters({ states }: { states: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "" || value === "all") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    // Reset page when any filter changes
    next.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  }

  function clearAll() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  const stateParam = params.get("state");
  const saleTypeParam = params.get("sale_type");
  const stageParam = params.get("stage");
  const ownerStatusParam = params.get("owner_status");
  const surplusMinParam = params.get("surplus_min");
  const surplusMaxParam = params.get("surplus_max");

  type Pill = { key: string; label: string; clear: Record<string, string | null> };
  const pills: Pill[] = [];
  if (stateParam) {
    pills.push({
      key: "state",
      label: stateName(stateParam),
      clear: { state: null },
    });
  }
  if (saleTypeParam && SALE_TYPES.includes(saleTypeParam as SaleType)) {
    pills.push({
      key: "sale_type",
      label: SALE_TYPE_LABELS[saleTypeParam as SaleType],
      clear: { sale_type: null },
    });
  }
  if (stageParam && STAGES.includes(stageParam as Stage)) {
    pills.push({
      key: "stage",
      label: STAGE_LABELS[stageParam as Stage],
      clear: { stage: null },
    });
  }
  if (ownerStatusParam && OWNER_STATUSES.includes(ownerStatusParam as OwnerStatus)) {
    pills.push({
      key: "owner_status",
      label: OWNER_STATUS_LABELS[ownerStatusParam as OwnerStatus],
      clear: { owner_status: null },
    });
  }
  if (surplusMinParam || surplusMaxParam) {
    const min = surplusMinParam ? formatCurrency(Number(surplusMinParam)) : null;
    const max = surplusMaxParam ? formatCurrency(Number(surplusMaxParam)) : null;
    const label =
      min && max
        ? `Surplus ${min} – ${max}`
        : min
          ? `Surplus ≥ ${min}`
          : `Surplus ≤ ${max}`;
    pills.push({
      key: "surplus",
      label,
      clear: { surplus_min: null, surplus_max: null },
    });
  }

  const hasFilters = pills.length > 0 || params.has("q");

  const selectClass =
    "rounded-md border border-white/20 bg-white/10 px-2.5 py-[6px] text-xs text-white outline-none transition-colors hover:bg-white/15 focus:border-petrol-300 focus:bg-white/15 cursor-pointer [&>option]:bg-petrol-700 [&>option]:text-white";
  const numberClass =
    "w-20 rounded-md border border-white/20 bg-white/10 px-2.5 py-[6px] text-xs text-white outline-none transition-colors placeholder:text-white/40 hover:bg-white/15 focus:border-petrol-300 focus:bg-white/15";

  return (
    <div
      className={cn(
        "mb-4 rounded-lg bg-petrol-700 px-4 py-3 shadow-card",
        isPending && "opacity-70"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.4px] text-white/70">
          <IconFilter size={13} stroke={1.75} />
          Filters
        </span>
        <select
          className={selectClass}
          value={params.get("state") ?? "all"}
          onChange={(e) => update({ state: e.target.value })}
        >
          <option value="all">All States</option>
          {states.map((code) => (
            <option key={code} value={code}>
              {stateName(code)}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={params.get("sale_type") ?? "all"}
          onChange={(e) => update({ sale_type: e.target.value })}
        >
          <option value="all">All Types</option>
          {SALE_TYPES.map((t) => (
            <option key={t} value={t}>
              {SALE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={params.get("stage") ?? "all"}
          onChange={(e) => update({ stage: e.target.value })}
        >
          <option value="all">All Stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={params.get("owner_status") ?? "all"}
          onChange={(e) => update({ owner_status: e.target.value })}
        >
          <option value="all">All Owners</option>
          {OWNER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {OWNER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <div className="ml-1 flex items-center gap-1 border-l border-white/20 pl-3">
          <span className="text-[11px] font-medium tracking-[0.4px] text-white/70">
            Surplus
          </span>
          <input
            type="number"
            placeholder="Min"
            className={numberClass}
            defaultValue={params.get("surplus_min") ?? ""}
            onBlur={(e) => update({ surplus_min: e.target.value })}
          />
          <span className="text-white/40">–</span>
          <input
            type="number"
            placeholder="Max"
            className={numberClass}
            defaultValue={params.get("surplus_max") ?? ""}
            onBlur={(e) => update({ surplus_max: e.target.value })}
          />
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto cursor-pointer rounded-md border border-white/30 bg-white/5 px-3 py-[6px] text-xs text-white/80 hover:border-white/60 hover:text-white"
          >
            Clear All
          </button>
        )}
      </div>

      {pills.length > 0 && (
        <div className="mt-[10px] flex flex-wrap items-center gap-[6px] border-t border-white/15 pt-[10px]">
          <span className="text-[11px] font-medium tracking-[0.4px] text-white/70">
            Active Filters
          </span>
          {pills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => update(pill.clear)}
              className="btn-primary inline-flex cursor-pointer items-center gap-[5px] rounded-full px-[10px] py-[3px] text-[11px] font-medium text-white"
            >
              {pill.label}
              <IconX size={12} stroke={2.25} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
