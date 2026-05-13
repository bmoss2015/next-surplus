import type { LeadDetailWithCounts } from "@/lib/leads/fetch-detail";
import { formatRecoveryType } from "@/lib/leads/recovery-type";
import { toTitleCase } from "@/lib/leads/format";
import { SectionSubheader } from "./SectionSubheader";

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Fix LLLL3 PART 1: every Quick Facts row uses the same 11px type on both
// label and value, single-line. min-w-0 on the value cell + truncate gives the
// ellipsis treatment when content overflows the sidebar width; the title attr
// exposes the full value on hover.
function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 leading-[1.9]">
      <span className="shrink-0 text-[11px] text-[#6b7280]">{label}</span>
      <span
        title={value}
        className={
          (muted
            ? "text-[11px] italic text-[#9ca3af]"
            : "text-[11px] font-medium text-[#111827]") +
          " min-w-0 truncate text-right"
        }
      >
        {value}
      </span>
    </div>
  );
}

// Fix LLLL3 PART 1: Owner Name = primary owner's full name, optionally with
// "and N others" when the lead carries additional owners. Empty when no owner
// is on file (dash via the Row component).
function ownerLabel(owners: LeadDetailWithCounts["owners"]): string {
  if (!owners || owners.length === 0) return "—";
  const primary = owners.find((o) => o.is_primary) ?? owners[0];
  const others = owners.length - 1;
  const name = (primary.full_name ?? "").trim() || "Unknown";
  return others > 0 ? `${name} and ${others} others` : name;
}

export function QuickFactsCard({ lead }: { lead: LeadDetailWithCounts }) {
  const attorneyName = lead.attorney?.name ?? "";
  const owner = ownerLabel(lead.owners);
  const countyLabel = lead.county ? toTitleCase(lead.county) : "—";
  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-4 shadow-card">
      <SectionSubheader>Quick Facts</SectionSubheader>
      <div className="space-y-0">
        <Row label="Owner Name" value={owner} muted={owner === "—"} />
        <Row label="Sale Date" value={fmtDate(lead.sale_date)} />
        <Row label="State" value={lead.state || "—"} muted={!lead.state} />
        <Row label="County" value={countyLabel} muted={countyLabel === "—"} />
        <Row
          label="Case Number"
          value={lead.case_number ?? "—"}
          muted={!lead.case_number}
        />
        <Row label="Recovery Type" value={formatRecoveryType(lead.recovery_type)} />
        <Row
          label="Lead Source"
          value={lead.lead_source ?? "—"}
          muted={!lead.lead_source}
        />
        <Row
          label="Attorney"
          value={attorneyName || "Not Assigned"}
          muted={!attorneyName}
        />
      </div>
    </div>
  );
}
