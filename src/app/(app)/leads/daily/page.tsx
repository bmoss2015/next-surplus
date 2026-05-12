import Link from "next/link";
import { fetchDailyWork, type DailyWorkLead } from "@/lib/leads/fetch-daily-work";
import { ViewToggle } from "../_components/ViewToggle";
import { StagePill } from "@/components/StagePill";
import { LitigatorBadge } from "@/components/LitigatorBadge";
import { LeadActionsMenu } from "../[id]/_components/LeadActionsMenu";
import { formatCurrency, primaryOwner } from "@/lib/leads/format";

export const dynamic = "force-dynamic";

export default async function DailyWorkPage() {
  const { needsAction, awaitingExternal } = await fetchDailyWork();
  const total = needsAction.length + awaitingExternal.length;

  return (
    <div className="px-7 py-6">
      <div className="mb-[22px] flex items-start justify-between">
        <div>
          <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
            Leads
          </h1>
          <div className="mt-1 text-[13px] text-gray-500">
            {total === 0
              ? "Nothing demanding your attention today"
              : `${total} ${total === 1 ? "lead needs" : "leads need"} you today`}
          </div>
        </div>
        <ViewToggle active="daily" />
      </div>

      <Section
        marker="bg-petrol-500"
        title="Needs Your Action"
        leads={needsAction}
        emptyText="Nothing In Your Queue"
      />

      <div className="h-6" />

      <Section
        marker="bg-gray-400"
        title="Awaiting External"
        leads={awaitingExternal}
        emptyText="No External Waits In Flight"
      />
    </div>
  );
}

function Section({
  marker,
  title,
  leads,
  emptyText,
}: {
  marker: string;
  title: string;
  leads: DailyWorkLead[];
  emptyText: string;
}) {
  return (
    <div>
      <div className="mb-[10px] flex items-center gap-[10px] px-1">
        <span className={`h-4 w-1 rounded-sm ${marker}`} />
        <h2 className="section-subheader">
          {title}
        </h2>
        <span className="rounded-full bg-gray-150 px-2 py-[2px] text-[11px] font-medium text-gray-500">
          {leads.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-surface shadow-card">
        {leads.length === 0 ? (
          <div className="px-4 py-6 text-center text-[12px] text-gray-500">
            {emptyText}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[120px_1fr_140px_150px_120px] items-center gap-[14px] border-b border-gray-200 bg-gray-50 px-[18px] py-[9px] text-[11px] tracking-[0.4px] text-gray-500">
              <span>Lead ID</span>
              <span>Address</span>
              <span>Stage</span>
              <span>Awaiting</span>
              <span className="text-right">Est. Surplus</span>
            </div>
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="group relative border-b border-gray-150 last:border-b-0 hover:bg-gray-50"
              >
                <Link
                  href={`/leads/${lead.id}`}
                  className="grid grid-cols-[120px_1fr_140px_150px_120px] items-center gap-[14px] px-[18px] py-[13px] pr-[44px]"
                >
                  <span className="truncate font-mono text-[11px] text-gray-500">
                    {lead.lead_id}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-medium text-ink">
                        {lead.address}
                      </span>
                      {lead.has_litigator && <LitigatorBadge className="shrink-0" />}
                    </div>
                    <div className="truncate text-[11px] text-gray-500">
                      {primaryOwner(lead)} · {lead.city}, {lead.state}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <StagePill stage={lead.stage} />
                  </div>
                  <div className="truncate text-[11.5px] text-petrol-500">
                    {lead.reason}
                  </div>
                  <div className="truncate text-right text-[13px] font-medium text-ink">
                    {formatCurrency(lead.estimated_surplus)}
                  </div>
                </Link>
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <LeadActionsMenu
                    leadId={lead.id}
                    archived={lead.archived}
                    triggerClassName="opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
