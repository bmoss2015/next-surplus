"use client";

import type { LeadDetailWithCounts } from "@/lib/leads/fetch-detail";
import { formatCurrency, daysSince, ownerStatusOf, toTitleCase } from "@/lib/leads/format";
import { OWNER_STATUS_LABELS, type OwnerStatus } from "@/lib/leads/types";
import { cn } from "@/lib/cn";
import { useConfirmedSurplus } from "./ConfirmedSurplusContext";

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
  sub?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col px-4 py-[14px]",
        variant === "highlight" && "bg-gradient-to-br from-petrol-50 to-petrol-100",
        variant === "payout" && "bg-gradient-to-br from-petrol-700 to-petrol-500 text-white"
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

// Fix UUUU2: the metric strip's surplus card — title flips between "Confirmed
// Surplus" and "Calculated Surplus". The surplus figure is read-only here; the
// inline Confirm / Edit button has been removed.
export function MetricStripDetail({ lead }: { lead: LeadDetailWithCounts }) {
  const days = daysSince(lead.sale_date);
  const ownerStatusKey = ownerStatusOf(lead);
  const { confirmedSurplus } = useConfirmedSurplus();

  const liensTotal = lead.total_liens ?? 0;
  const calculatedSurplus =
    lead.closing_bid != null ? lead.closing_bid - (lead.outstanding_debt ?? 0) - liensTotal : null;
  const hasConfirmed = confirmedSurplus != null && confirmedSurplus !== 0;
  const surplusTitle = hasConfirmed ? "Confirmed Surplus" : "Calculated Surplus";
  const surplusValue = hasConfirmed ? confirmedSurplus : calculatedSurplus;
  const surplusSub = hasConfirmed ? "Manually Verified" : "Not Yet Confirmed";
  const surplusForMath = hasConfirmed ? (confirmedSurplus as number) : calculatedSurplus ?? 0;
  const recoveryFeeAmount = surplusForMath * (lead.recovery_fee_percent / 100);
  // Fix EEEEE: Est. Net Payout = recovery fee $ − attorney cost.
  const netPayout = recoveryFeeAmount - lead.attorney_cost;
  const payoutSub = hasConfirmed
    ? "Based On Confirmed Surplus"
    : lead.closing_bid != null
      ? "Based On Calculated Surplus"
      : "No Surplus On File Yet";

  return (
    <div className="grid grid-cols-5 overflow-hidden rounded-lg border border-gray-200 bg-surface">
      <div className="border-r border-petrol-200">
        <Cell label={surplusTitle} variant="highlight" sub={surplusSub}>
          {formatCurrency(surplusValue)}
        </Cell>
      </div>

      <div className="border-r border-petrol-700">
        <Cell label="Est. Net Payout" variant="payout" sub={payoutSub}>
          {formatCurrency(netPayout)}
        </Cell>
      </div>

      <div className="border-r border-gray-200">
        <Cell
          label="Owner Status"
          sub={`${OWNER_STATUS_LABELS[ownerStatusKey as OwnerStatus] ?? "Unknown"} Primary`}
        >
          <span className="text-[14px] font-medium text-ink">{ownerSummary(lead)}</span>
        </Cell>
      </div>

      <div className="border-r border-gray-200">
        <Cell
          label="Sale Process"
          sub={lead.county ? `${toTitleCase(lead.county)} County` : ""}
        >
          <span className="text-[14px] font-medium text-ink">{saleProcessLabel(lead)}</span>
        </Cell>
      </div>

      <div>
        <Cell
          label="Days Since Sale"
          sub={lead.sale_date ? formatSaleDate(lead.sale_date) : ""}
        >
          {days != null ? `${days} Days` : "—"}
        </Cell>
      </div>
    </div>
  );
}
