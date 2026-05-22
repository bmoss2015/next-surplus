import { fetchMailDashboard } from "@/lib/mail/fetch";
import { MailListClient } from "@/app/(app)/mail/_components/MailListClient";

// Lead-scoped view of /mail Sent. Same drill-in drawer, batch grouping,
// search, and CSV export — just pre-filtered to this lead's pieces.
// Bree's call: she's looking up "every piece ever sent to this lead"
// often enough to deserve its own tab, even though the Overview Mail
// card + Activity timeline + global /mail filter would cover the same
// information. Close.com (comms-heavy CRM) does it the same way; Attio/
// Affinity/Pipedrive don't, but Moss's mail volume per lead earns it.

export async function MailTab({ leadId }: { leadId: string }) {
  const { stats, rows } = await fetchMailDashboard({
    leadId,
    windowDays: 365,
    limit: 200,
  });

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <MailListClient
        initialRows={rows}
        initialStats={stats}
        initialSearch=""
        initialStatus="all"
        initialLeadId={leadId}
        showNeedsAttention
      />
    </div>
  );
}
