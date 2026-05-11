import { fetchResearch } from "@/lib/leads/fetch-research";
import type { LeadDetailWithCounts } from "@/lib/leads/fetch-detail";
import { ResearchTabClient } from "./ResearchTabClient";

export async function ResearchTab({ lead }: { lead: LeadDetailWithCounts }) {
  const data = await fetchResearch(lead.id, lead.state, lead.sale_type);
  return (
    <ResearchTabClient
      leadId={lead.id}
      template={data.template}
      progressByIndex={data.progressByIndex}
      overallFindings={data.overallFindings}
    />
  );
}
