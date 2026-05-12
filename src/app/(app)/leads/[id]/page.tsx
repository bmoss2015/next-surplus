import { notFound } from "next/navigation";
import { fetchLeadDetail } from "@/lib/leads/fetch-detail";
import { fetchLostReasons } from "@/lib/leads/lost-reasons";
import { listTeamMembers } from "./_discussion-actions";
import { AssignToField } from "./_components/AssignToField";
import { LeadDetailHeader } from "./_components/LeadDetailHeader";
import { StageProgressStrip } from "./_components/StageProgressStrip";
import { StageActions } from "./_components/StageActions";
import { MetricStripDetail } from "./_components/MetricStripDetail";
import { QuickFactsCard } from "./_components/QuickFactsCard";
import { AddTaskCard } from "./_components/AddTaskCard";
import { RecentActivityCard } from "./_components/RecentActivityCard";
import { LostBanner } from "./_components/LostBanner";
import { TabBar, type TabKey } from "./_components/TabBar";
import { OverviewTab } from "./_components/OverviewTab";
import { ContactsTab } from "./_components/ContactsTab";
import { ResearchTab } from "./_components/ResearchTab";
import { DocumentsTab } from "./_components/DocumentsTab";
import { NotesTab } from "./_components/NotesTab";
import { DiscussionTab } from "./_components/DiscussionTab";
import { ActivityTab } from "./_components/ActivityTab";
import { LeadEditDrawer } from "./_components/LeadEditDrawer";
import { RecoveryFeeField } from "./_components/RecoveryFeeField";
import { ConfirmedSurplusProvider } from "./_components/ConfirmedSurplusContext";

export const dynamic = "force-dynamic";

const VALID_TABS: TabKey[] = [
  "overview",
  "contacts",
  "research",
  "documents",
  "notes",
  "discussion",
  "activity",
];

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const rawTab = typeof sp.tab === "string" ? sp.tab : undefined;
  const activeTab: TabKey =
    rawTab && VALID_TABS.includes(rawTab as TabKey)
      ? (rawTab as TabKey)
      : "overview";

  const [lead, lostReasons, teamMembers] = await Promise.all([
    fetchLeadDetail(id),
    fetchLostReasons(),
    listTeamMembers(),
  ]);
  if (!lead) notFound();

  return (
    <ConfirmedSurplusProvider initial={lead.confirmed_surplus}>
    <div className="px-7 py-6">
      <LeadDetailHeader lead={lead} />

      {lead.stage === "lost" && <LostBanner reason={lead.lost_reason} />}

      <div className="rounded-[10px] border border-gray-200 bg-surface px-6 py-5 shadow-card">
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          <RecoveryFeeField
            leadId={lead.id}
            initial={lead.recovery_fee_percent}
          />
          <LeadEditDrawer
            lead={{
              id: lead.id,
              address: lead.address,
              city: lead.city,
              state: lead.state,
              zip: lead.zip,
              county: lead.county,
              sale_type: lead.sale_type,
              sale_date: lead.sale_date,
              case_number: lead.case_number,
              recovery_type: lead.recovery_type,
              parcel_number: lead.parcel_number,
            }}
          />
        </div>
        <StageProgressStrip leadId={lead.id} currentStage={lead.stage} />
        <MetricStripDetail lead={lead} />
      </div>

      <div className="mt-4">
        <TabBar active={activeTab} />
        <div className="grid grid-cols-[1fr_280px] gap-[18px]">
          <div className="min-w-0">
            {activeTab === "overview" && <OverviewTab lead={lead} />}
            {activeTab === "contacts" && <ContactsTab leadId={lead.id} />}
            {activeTab === "research" && <ResearchTab lead={lead} />}
            {activeTab === "documents" && <DocumentsTab leadId={lead.id} />}
            {activeTab === "notes" && <NotesTab leadId={lead.id} />}
            {activeTab === "discussion" && <DiscussionTab leadId={lead.id} />}
            {activeTab === "activity" && <ActivityTab leadId={lead.id} />}
          </div>

          <div className="flex flex-col gap-[14px]">
            <StageActions
              leadId={lead.id}
              currentStage={lead.stage}
              needsReview={lead.needs_action_flag}
              lostReasons={lostReasons}
            />
            <AssignToField
              leadId={lead.id}
              currentId={lead.assigned_to}
              members={teamMembers.map((m) => ({ id: m.id, fullName: m.fullName }))}
            />
            <QuickFactsCard lead={lead} />
            <AddTaskCard leadId={lead.id} />
            <RecentActivityCard leadId={lead.id} leadSource={lead.lead_source} />
          </div>
        </div>
      </div>
    </div>
    </ConfirmedSurplusProvider>
  );
}
