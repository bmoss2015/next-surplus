import { fetchResearch } from "@/lib/leads/fetch-research";
import type { LeadDetailWithCounts } from "@/lib/leads/fetch-detail";
import { ResearchTabClient } from "./ResearchTabClient";

export async function ResearchTab({ lead }: { lead: LeadDetailWithCounts }) {
  const data = await fetchResearch(lead.id, lead.state, lead.sale_type);
  const primaryOwner =
    (lead.owners ?? []).find((o) => o.is_primary) ?? lead.owners?.[0] ?? null;
  return (
    <ResearchTabClient
      leadId={lead.id}
      templates={data.templates}
      availableTemplates={data.availableTemplates}
      overallFindings={data.overallFindings}
      leadInfo={{
        name: primaryOwner?.full_name ?? null,
        address: lead.address ?? null,
        city: lead.city ?? null,
        state: lead.state ?? null,
        saleType: lead.sale_type ?? null,
        importedAt: lead.imported_at ?? null,
        stage: lead.stage ?? null,
      }}
    />
  );
}
