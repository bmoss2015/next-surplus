import { fetchActivity, fetchDocuments } from "@/lib/leads/fetch-tab-data";
import { ActivityTabClient } from "./ActivityTabClient";

export async function ActivityTab({ leadId }: { leadId: string }) {
  const [{ rows, leadSource }, docs] = await Promise.all([
    fetchActivity(leadId),
    fetchDocuments(leadId),
  ]);
  return (
    <ActivityTabClient rows={rows} leadSource={leadSource} documents={docs} />
  );
}
