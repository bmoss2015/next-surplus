import { createClient } from "@/lib/supabase/server";
import { fetchMailDashboard } from "@/lib/mail/fetch";
import { LeadMailV11Client } from "./LeadMailV11Client";

// V11 lead Mail tab. Stats header + split-pane below (compact left
// rail + V2-style detail with portrait letter on the right). All
// per-lead mail history shown; older pieces aren't archived since
// each lead has limited volume (typical 3-10 pieces, sometimes more
// for high-touch cases).

export async function MailTab({ leadId }: { leadId: string }) {
  const sb = await createClient();

  // Pull mail for this lead + count addresses on file in parallel.
  const [{ rows }, addressCountRes] = await Promise.all([
    fetchMailDashboard({
      leadId,
      windowDays: 365,
      limit: 200,
    }),
    sb
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", leadId)
      .eq("channel", "mailing_address"),
  ]);
  const mailingAddressCount = addressCountRes.count ?? 0;

  const inTransitCount = rows.filter(
    (r) => r.status === "queued" || r.status === "in_transit"
  ).length;
  const deliveredCount = rows.filter((r) => r.status === "delivered").length;
  const returnedCount = rows.filter(
    (r) => r.status === "returned" || r.status === "failed"
  ).length;

  return (
    <LeadMailV11Client
      rows={rows}
      totalSent={rows.length}
      inTransitCount={inTransitCount}
      deliveredCount={deliveredCount}
      returnedCount={returnedCount}
      leadId={leadId}
      mailingAddressCount={mailingAddressCount}
    />
  );
}
