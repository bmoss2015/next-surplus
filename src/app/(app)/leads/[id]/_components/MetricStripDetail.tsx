"use client";

import type { LeadDetailWithCounts } from "@/lib/leads/fetch-detail";
import { formatCurrency, daysSince, ownerStatusOf, toTitleCase } from "@/lib/leads/format";
import { OWNER_STATUS_LABELS, type OwnerStatus } from "@/lib/leads/types";
import { cn } from "@/lib/cn";
import { useConfirmedSurplus } from "./ConfirmedSurplusContext";
import { activeSurplus, surplusBasisLabel } from "@/lib/leads/active-surplus";

function ownerSummary(lead: LeadDetailWithCounts): string {
  const owners = lead.owners ?? [];
  if (owners.length === 0) return "No owners on file";
  const primary = owners.find((o) => o.is_primary) ?? owners[0];
  const status = OWNER_STATUS_LABELS[primary.status as OwnerStatus] ?? "Unknown";
  if (owners.length === 1) {
    return `${status} · 1 Owner`;
  }
  const allLiving = owners.every((o) => o.status === "living");
  const allDeceased = owners.every((o) => o.status === "deceased");
  if (allLiving) return `Living · ${owners.length} Owners`;
  if (allDeceased) return `Deceased · ${owners.length} Owners`;
  return `Mixed · ${owners.length} Owners`;
}

function saleProcessLabel(lead: LeadDetailWithCounts): string {
  const saleType = lead.sale_type === "TAX" ? "Tax Sale" : "Mortgage Foreclosure";
  if (!lead.recovery_type) return saleType;
  const judicial = lead.recovery_type === "judicial" ? "Judicial" : "Nonjudicial";
  return `${saleType} · ${judicial}`;
}

function formatSaleDate(date: string | null): string {
  if (!date) return "Pending";
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Cell({
  label,
  children,
  variant,
  sub,
}: {
  label: string;
  children: React.ReactNode;
  variant?: "default" | "highlight" | "payout";
  sub?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col px-4 py-[14px]",
        variant === "highlight" &&
          "bg-gradient-to-br from-petrol-50 to-petrol-100",
        variant === "payout" &&
          "bg-gradient-to-br from-petrol-700 to-petrol-500 text-white"
      )}
    >
      <div
        className={cn(
          "mb-2 text-[11px] tracking-[0.4px]",
          variant === "payout" ? "text-white/85" : "text-gray-500",
          variant === "highlight" && "text-petrol-700"
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "font-medium tracking-tight",
          variant === "payout" ? "text-[20px] text-white" : "text-[18px] text-ink"
        )}
      >
        {children}
      </div>
      {sub && (
        <div
          className={cn(
            "mt-[3px] text-[11px]",
            variant === "payout"
              ? "text-white/85"
              : variant === "highlight"
                ? "text-petrol-700"
                : "text-gray-500"
          )}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export function MetricStripDetail({ lead }: { lead: LeadDetailWithCounts }) {
  const days = daysSince(lead.sale_date);
  const ownerStatusKey = ownerStatusOf(lead);
  const { confirmedSurplus } = useConfirmedSurplus();
  const { value: active, basis } = activeSurplus({
    confirmed_surplus: confirmedSurplus,
    estimated_surplus: lead.estimated_surplus,
    closing_bid: lead.closing_bid,
    source_surplus: lead.source_surplus,
  });
  const netPayout = active * (1 - lead.recovery_fee_percent / 100) - lead.attorney_cost;

  return (
    <div className="grid grid-cols-6 overflow-hidden rounded-lg border border-gray-200 bg-surface">
      <div className="border-r border-gray-200">
        <Cell label="Estimated Surplus" sub="Estimated, Based On Available Data">
          {formatCurrency(lead.estimated_surplus)}
        </Cell>
      </div>

      <div className="border-r border-petrol-200">
        <Cell
          label="Confirmed Surplus"
          variant="highlight"
          sub={confirmedSurplus != null ? "Verified By County" : "Not Yet Confirmed"}
        >
          {confirmedSurplus != null ? (
            formatCurrency(confirmedSurplus)
          ) : (
            <span className="text-[13px] text-gray-400 font-normal">—</span>
          )}
        </Cell>
      </div>

      <div className="border-r border-petrol-700">
        <Cell
          label="Est. Net Surplus"
          variant="payout"
          sub={surplusBasisLabel(basis)}
        >
          {formatCurrency(netPayout)}
        </Cell>
      </div>

      <div className="border-r border-gray-200">
        <Cell
          label="Owner Status"
          sub={`${
            OWNER_STATUS_LABELS[ownerStatusKey as OwnerStatus] ?? "Unknown"
          } Primary`}
        >
          <span className="text-[14px] font-medium text-ink">
            {ownerSummary(lead)}
          </span>
        </Cell>
      </div>

      <div className="border-r border-gray-200">
        <Cell
          label="Sale Process"
          sub={lead.county ? `${toTitleCase(lead.county)} County` : ""}
        >
          <span className="text-[14px] font-medium text-ink">
            {saleProcessLabel(lead)}
          </span>
        </Cell>
      </div>

      <div>
        <Cell
          label="Days Since Sale"
          sub={lead.sale_date ? formatSaleDate(lead.sale_date) : ""}
        >
          {days != null ? days : "—"}
        </Cell>
      </div>
    </div>
  );
}
