import { NextResponse } from "next/server";
import { fetchLeads } from "@/lib/leads/query";
import { parseLeadsSearchParams } from "@/lib/leads/parse-search-params";
import { primaryOwner, ownerStatusOf, daysSince } from "@/lib/leads/format";
import { OWNER_STATUS_LABELS, STAGE_LABELS } from "@/lib/leads/types";

const COLUMNS = [
  "lead_id",
  "address",
  "city",
  "state",
  "zip",
  "county",
  "sale_type",
  "sale_date",
  "stage",
  "stage_changed_at",
  "days_since_sale",
  "primary_owner",
  "owner_status",
  "closing_bid",
  "estimated_surplus",
  "estimated_net_payout",
  "recovery_fee_percent",
  "attorney_cost",
  "redemption_ends",
  "filing_deadline",
  "below_floor",
  "needs_action_flag",
  "imported_at",
];

function csvEscape(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value;
  }

  const query = parseLeadsSearchParams(params);
  // Export ignores pagination; pull up to a sane upper bound
  const { leads } = await fetchLeads({ ...query, page: 1, pageSize: 5000 });

  const lines: string[] = [];
  lines.push(COLUMNS.join(","));

  for (const lead of leads) {
    const ownerStatus = ownerStatusOf(lead);
    const row = [
      lead.lead_id,
      lead.address,
      lead.city,
      lead.state,
      lead.zip,
      lead.county ?? "",
      lead.sale_type,
      lead.sale_date ?? "",
      STAGE_LABELS[lead.stage],
      lead.stage_changed_at,
      daysSince(lead.sale_date) ?? "",
      primaryOwner(lead),
      OWNER_STATUS_LABELS[ownerStatus as keyof typeof OWNER_STATUS_LABELS] ?? ownerStatus,
      lead.closing_bid ?? "",
      lead.estimated_surplus ?? "",
      lead.estimated_net_payout ?? "",
      lead.recovery_fee_percent,
      lead.attorney_cost,
      lead.redemption_ends ?? "",
      lead.filing_deadline ?? "",
      lead.below_floor == null ? "" : lead.below_floor ? "true" : "false",
      lead.needs_action_flag ? "true" : "false",
      lead.imported_at,
    ];
    lines.push(row.map(csvEscape).join(","));
  }

  const body = lines.join("\r\n");
  const filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
