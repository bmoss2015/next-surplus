import { fetchDocuments } from "@/lib/leads/fetch-tab-data";
import { DocumentsTabClient } from "./DocumentsTabClient";

export async function DocumentsTab({ leadId }: { leadId: string }) {
  const docs = await fetchDocuments(leadId);
  return <DocumentsTabClient leadId={leadId} initialDocs={docs} />;
}
