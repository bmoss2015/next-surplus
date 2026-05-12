import Link from "next/link";
import type { LeadRow } from "@/lib/leads/types";
import { StagePill } from "@/components/StagePill";
import { formatCurrency, primaryOwner, ownerStatusOf } from "@/lib/leads/format";
import { activeSurplus, activeNetPayout } from "@/lib/leads/active-surplus";
import { OWNER_STATUS_LABELS, SALE_TYPE_LABELS } from "@/lib/leads/types";
import { BelowFloorIcon } from "@/components/BelowFloorIcon";
import { LitigatorBadge } from "@/components/LitigatorBadge";
import { SortHeader } from "./SortHeader";
import { LeadActionsMenu } from "../[id]/_components/LeadActionsMenu";

export function LeadsTable({
  leads,
  hideBelowFloor = false,
}: {
  leads: LeadRow[];
  hideBelowFloor?: boolean;
}) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-[11px] tracking-[0.4px] text-gray-500">
          No Matching Leads
        </div>
        <div className="mt-2 text-sm text-ink">
          Adjust Filters Or Clear Them To See More Results
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left font-medium">
              <SortHeader column="lead_id" label="Lead ID" />
            </th>
            <th className="px-4 py-3 text-left font-medium">
              <SortHeader column="address" label="Address" />
            </th>
            <th className="px-4 py-3 text-left font-medium">
              <span className="text-[11px] tracking-[0.4px] text-gray-500">
                Owner
              </span>
            </th>
            <th className="px-4 py-3 text-left font-medium">
              <SortHeader column="stage" label="Stage" />
            </th>
            <th className="px-4 py-3 text-left font-medium">
              <SortHeader column="sale_type" label="Type" />
            </th>
            <th className="px-4 py-3 text-right font-medium">
              <SortHeader column="estimated_surplus" label="Surplus" align="right" />
            </th>
            <th className="px-4 py-3 text-left font-medium">
              <span className="text-[11px] tracking-[0.4px] text-gray-500">
                Status
              </span>
            </th>
            <th className="w-[44px] px-2 py-3" aria-hidden />
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const ownerName = primaryOwner(lead);
            const ownerStatus = ownerStatusOf(lead);
            return (
              <tr
                key={lead.id}
                className="group border-b border-gray-150 transition-colors hover:bg-gray-50"
              >
                <td className="px-4 py-[10px]">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="font-mono text-[11px] text-gray-500 hover:text-petrol-500"
                  >
                    {lead.lead_id}
                  </Link>
                </td>
                <td className="px-4 py-[10px]">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="font-medium text-ink hover:text-petrol-500"
                  >
                    {lead.address}
                  </Link>
                  <div className="text-[11px] text-gray-500">
                    {lead.city}, {lead.state} {lead.zip}
                  </div>
                </td>
                <td className="px-4 py-[10px]">
                  <div className="text-ink">{ownerName}</div>
                  <div className="text-[11px] text-gray-500">
                    {OWNER_STATUS_LABELS[ownerStatus as keyof typeof OWNER_STATUS_LABELS] ?? ownerStatus}
                  </div>
                </td>
                <td className="px-4 py-[10px]">
                  <StagePill stage={lead.stage} />
                </td>
                <td className="px-4 py-[10px] text-gray-500">
                  {SALE_TYPE_LABELS[lead.sale_type]}
                </td>
                <td className="px-4 py-[10px] text-right">
                  <div className="font-medium text-ink">
                    {formatCurrency(activeSurplus(lead).value)}
                  </div>
                  {lead.below_floor && !hideBelowFloor ? (
                    <div className="flex items-center justify-end text-[11px]">
                      <BelowFloorIcon size={14} />
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-500">
                      Est. Net Payout {formatCurrency(activeNetPayout(lead))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-[10px]">
                  <div className="flex flex-wrap items-center gap-1">
                    {lead.archived ? (
                      <span className="inline-block rounded bg-gray-150 px-2 py-[2px] text-[11px] font-medium text-gray-500">
                        Archived
                      </span>
                    ) : lead.needs_action_flag ? (
                      <span className="inline-block rounded bg-danger-bg px-2 py-[2px] text-[11px] font-medium text-danger">
                        Needs Action
                      </span>
                    ) : lead.has_litigator ? null : lead.stage === "new_leads" &&
                      !lead.has_activity ? (
                      <span className="inline-block rounded bg-[#e0f2f7] px-2 py-[2px] text-[11px] font-medium text-[#0a3d4a]">
                        New
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">—</span>
                    )}
                    {lead.has_litigator && <LitigatorBadge />}
                  </div>
                </td>
                <td className="px-2 py-[10px] text-right">
                  <div className="flex justify-end">
                    <LeadActionsMenu
                      leadId={lead.id}
                      archived={lead.archived}
                      triggerClassName="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
