import { notFound } from "next/navigation";
import { fetchLeadDetail } from "@/lib/leads/fetch-detail";
import { fetchLostReasons } from "@/lib/leads/lost-reasons";
import { createClient } from "@/lib/supabase/server";
import { listTeamMembers } from "./_discussion-actions";
import { AssignToField } from "./_components/AssignToField";
import { LeadDetailHeader } from "./_components/LeadDetailHeader";
import { StageProgressStrip } from "./_components/StageProgressStrip";
import { StageActions } from "./_components/StageActions";
import { MetricStripDetail } from "./_components/MetricStripDetail";
import { QuickFactsCard } from "./_components/QuickFactsCard";
import { RecentActivityCard } from "./_components/RecentActivityCard";
import { LostBanner } from "./_components/LostBanner";
import { TabBar, type TabKey } from "./_components/TabBar";
import { fetchDataSources } from "./_actions";
import { fetchLeadSources } from "../../imports/_actions";
import { OverviewTab } from "./_components/OverviewTab";
import { PropertyInfoTab } from "./_components/PropertyInfoTab";
import { ContactsTab } from "./_components/ContactsTab";
import { ResearchTab } from "./_components/ResearchTab";
import { DocumentsTab } from "./_components/DocumentsTab";
import { NotesTab } from "./_components/NotesTab";
import { LeadTasksTab } from "./_components/LeadTasksTab";
import { ActivityTab } from "./_components/ActivityTab";
import { RecoveryFeeField } from "./_components/RecoveryFeeField";
import { ConfirmedSurplusProvider } from "./_components/ConfirmedSurplusContext";

export const dynamic = "force-dynamic";

const VALID_TABS: TabKey[] = [
  "overview",
  "property",
  "contacts",
  "research",
  "documents",
  "notes",
  "tasks",
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
  // Notify-mention links and the bell historically pointed at ?tab=discussion;
  // the Notes tab took that experience over, so any legacy URL lands on Notes.
  const normalizedTab = rawTab === "discussion" ? "notes" : rawTab;
  const activeTab: TabKey =
    normalizedTab && VALID_TABS.includes(normalizedTab as TabKey)
      ? (normalizedTab as TabKey)
      : "overview";

  const sb = await createClient();
  const [lead, lostReasons, teamMembers, openTaskRes] = await Promise.all([
    fetchLeadDetail(id),
    fetchLostReasons(),
    listTeamMembers(),
    sb
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", id)
      .eq("completed", false),
  ]);
  if (!lead) notFound();
  const openTaskCount = openTaskRes.count ?? 0;
  const [dataSources, leadSources] =
    activeTab === "property"
      ? await Promise.all([fetchDataSources(), fetchLeadSources()])
      : [[] as string[], [] as string[]];

  return (
    <ConfirmedSurplusProvider initial={lead.confirmed_surplus}>
    <div className="px-7 py-6">
      <LeadDetailHeader lead={lead} />

      {lead.stage === "lost" && <LostBanner reason={lead.lost_reason} />}

      <div className="rounded-[10px] border border-gray-200 bg-surface px-6 py-5 shadow-card">
        <StageProgressStrip leadId={lead.id} currentStage={lead.stage} />
        <MetricStripDetail lead={lead} />
      </div>

      <div className="mt-4">
        <TabBar active={activeTab} openTaskCount={openTaskCount} />
        <div className="grid grid-cols-[1fr_280px] gap-[18px]">
          <div className="min-w-0">
            {activeTab === "overview" && <OverviewTab lead={lead} />}
            {activeTab === "property" && (
              <PropertyInfoTab lead={lead} dataSources={dataSources} leadSources={leadSources} />
            )}
            {activeTab === "contacts" && <ContactsTab leadId={lead.id} />}
            {activeTab === "research" && <ResearchTab lead={lead} />}
            {activeTab === "documents" && <DocumentsTab leadId={lead.id} />}
            {activeTab === "notes" && <NotesTab leadId={lead.id} />}
            {activeTab === "tasks" && <LeadTasksTab leadId={lead.id} />}
            {activeTab === "activity" && <ActivityTab leadId={lead.id} />}
          </div>

          {/* Fix QQQQ: Tasks moved to a body tab — the right rail is Recovery
              Fee, Stage Actions, Quick Facts, Assigned To, Recent Activity. */}
          <div className="flex flex-col gap-[14px]">
            <div className="rounded-[10px] border border-gray-200 bg-surface p-4 shadow-card">
              <RecoveryFeeField
                leadId={lead.id}
                initial={lead.recovery_fee_percent}
              />
            </div>
            <StageActions
              leadId={lead.id}
              currentStage={lead.stage}
              needsReview={lead.needs_action_flag}
              lostReasons={lostReasons}
            />
            <QuickFactsCard lead={lead} />
            <AssignToField
              leadId={lead.id}
              currentId={lead.assigned_to}
              members={teamMembers.map((m) => ({ id: m.id, fullName: m.fullName }))}
            />
            <RecentActivityCard leadId={lead.id} leadSource={lead.lead_source} />
          </div>
        </div>
      </div>
    </div>
    </ConfirmedSurplusProvider>
  );
}
