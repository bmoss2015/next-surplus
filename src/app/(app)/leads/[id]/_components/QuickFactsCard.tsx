import type { LeadDetailWithCounts } from "@/lib/leads/fetch-detail";
import { formatRecoveryType } from "@/lib/leads/recovery-type";
import { SectionSubheader } from "./SectionSubheader";

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Fix JJJJ3 PART 2: one row per fact, label left, value right. The value is
// always a single line — overflow gets truncated with an ellipsis and the full
// text is exposed on hover via the title attribute. min-w-0 on the value cell
// is what actually enables the truncation inside the flex parent.
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
      <span className="shrink-0 text-xs text-[#6b7280]">{label}</span>
      <span
        title={value}
        className={
          (muted
            ? "text-sm italic text-gray-400"
            : "text-sm font-medium text-[#111827]") + " min-w-0 truncate text-right"
        }
      >
        {value}
      </span>
    </div>
  );
}

// Fix JJJJ3 PART 2: Quick Facts shows only the four highest-signal facts —
// Sale Date, Recovery Type, Lead Source, Attorney. Case Number, Parcel Number,
// Data Source, and Import Date moved off this panel (they still live on the
// Property Info tab).
export function QuickFactsCard({ lead }: { lead: LeadDetailWithCounts }) {
  const attorneyName = lead.attorney?.name ?? "";
  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-4 shadow-card">
      <SectionSubheader>Quick Facts</SectionSubheader>
      <div className="space-y-0">
        <Row label="Sale Date" value={fmtDate(lead.sale_date)} />
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
