import type { LeadDetailWithCounts } from "@/lib/leads/fetch-detail";

// Fix 90: how a recovery type reads on screen. Proper Case, no dashes.
function recoveryTypeLabel(value: string | null | undefined): string {
  switch (value) {
    case "non_judicial":
      return "Non Judicial";
    case "judicial":
      return "Judicial";
    default:
      return "Unknown";
  }
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateTime(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-[12px] leading-[1.9]">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span className={muted ? "italic text-gray-400" : "text-ink"}>{value}</span>
    </div>
  );
}

export function QuickFactsCard({ lead }: { lead: LeadDetailWithCounts }) {
  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-4 shadow-card">
      <div className="mb-[11px] text-[10px] tracking-[0.5px] font-medium text-gray-500">
        Quick Facts
      </div>
      <div className="space-y-0">
        <Row label="Sale Date" value={fmtDate(lead.sale_date)} />
        <Row label="Recovery Type" value={recoveryTypeLabel(lead.recovery_type)} />
        <Row
          label="Case Number"
          value={lead.case_number ?? "—"}
          muted={!lead.case_number}
        />
        <Row
          label="Lead Source"
          value={lead.lead_source ?? "—"}
          muted={!lead.lead_source}
        />
        <Row label="Imported" value={fmtDateTime(lead.imported_at)} />
        <Row
          label="Attorney"
          value={lead.attorney?.name ?? "Not Assigned"}
          muted={!lead.attorney?.name}
        />
        <Row label="Assigned To" value="Bree Moss" />
      </div>
    </div>
  );
}
