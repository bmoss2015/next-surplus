import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import type { LeadDetailWithCounts } from "@/lib/leads/fetch-detail";
import { primaryOwner, toTitleCase } from "@/lib/leads/format";
import { SALE_TYPE_LABELS } from "@/lib/leads/types";
import { LeadActionsMenu } from "./LeadActionsMenu";

function formatSaleDate(date: string | null): string {
  if (!date) return "Sale date pending";
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function LeadDetailHeader({
  lead,
}: {
  lead: LeadDetailWithCounts;
}) {
  const owner = primaryOwner(lead);
  const unchecked = lead.unchecked_verification_count;

  return (
    <div className="mb-4">
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-[6px] text-xs text-gray-500">
        <Link href="/leads" className="hover:text-petrol-500">
          Leads
        </Link>
        <IconChevronRight size={12} stroke={1.75} />
        <span className="font-medium text-ink">{lead.lead_id}</span>
      </div>

      {/* Card */}
      <div className="rounded-[10px] border border-gray-200 bg-surface px-6 py-5 shadow-card">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-[5px] border border-gray-200 bg-gray-150 px-[10px] py-1 font-mono text-[11px] font-medium text-ink">
                {lead.lead_id}
              </span>
              {lead.stage === "lost" && (
                <span className="rounded-[5px] border border-danger-border bg-danger-bg px-[10px] py-1 text-[11px] font-medium text-danger">
                  Lost
                </span>
              )}
              {lead.stage === "won" && (
                <span className="rounded-[5px] border border-success-strong/30 bg-success-bg px-[10px] py-1 text-[11px] font-medium text-success-strong">
                  Won
                </span>
              )}
              {unchecked > 0 && lead.stage !== "lost" && (
                <span className="rounded-[5px] border border-danger-border bg-danger-bg px-[10px] py-1 text-[11px] font-medium text-danger">
                  {unchecked} {unchecked === 1 ? "Item" : "Items"} Unchecked
                </span>
              )}
              {lead.below_floor && lead.stage !== "lost" && (
                <span className="rounded-[5px] border border-warn-border bg-warn-bg px-[10px] py-1 text-[11px] font-medium text-warn-strong">
                  Below Floor
                </span>
              )}
              {lead.needs_action_flag && lead.stage !== "lost" && (
                <span className="rounded-[5px] border border-petrol-200 bg-petrol-50 px-[10px] py-1 text-[11px] font-medium text-petrol-500">
                  Needs Action
                </span>
              )}
            </div>
            <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
              {lead.address}, {lead.city} {lead.state} {lead.zip}
            </h1>
            <div className="mt-1 text-[13px] text-gray-500">
              {owner}
              {lead.county ? ` · ${toTitleCase(lead.county)} County` : ""} ·{" "}
              {SALE_TYPE_LABELS[lead.sale_type]} · Sale Date{" "}
              {formatSaleDate(lead.sale_date)}
            </div>
          </div>
          <LeadActionsMenu
            leadId={lead.id}
            archived={lead.archived}
            redirectTo="/leads"
          />
        </div>
      </div>
    </div>
  );
}
