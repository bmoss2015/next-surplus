import { createClient } from "@/lib/supabase/server";
import { fetchMailDashboard } from "@/lib/mail/fetch";
import {
  fetchMailTemplates,
  fetchMailBankAccounts,
  fetchOrgInfo,
  fetchMyCustomerPricing,
} from "@/lib/settings/fetch";
import { buildLeadSendMailCandidates } from "@/lib/mail/lead-candidates";
import { LeadMailV11Client } from "./LeadMailV11Client";

// V11 lead Mail tab. Stats header + split-pane below (compact left
// rail + V2-style detail with portrait letter on the right). All
// per-lead mail history shown; older pieces aren't archived since
// each lead has limited volume (typical 3-10 pieces, sometimes more
// for high-touch cases).

export async function MailTab({ leadId }: { leadId: string }) {
  const sb = await createClient();

  // Pull everything in parallel — mail history + Send Mail modal data.
  const [
    { rows },
    addressCountRes,
    candidates,
    templates,
    bankAccounts,
    org,
    customerPricing,
  ] = await Promise.all([
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
    buildLeadSendMailCandidates(leadId),
    fetchMailTemplates(),
    fetchMailBankAccounts(),
    fetchOrgInfo(),
    fetchMyCustomerPricing(),
  ]);

  const mailingAddressCount = addressCountRes.count ?? 0;

  const processingCount = rows.filter(
    (r) => r.status === "processing" || r.status === "queued"
  ).length;
  const inTransitCount = rows.filter((r) => r.status === "in_transit").length;
  const deliveredCount = rows.filter((r) => r.status === "delivered").length;
  const returnedCount = rows.filter(
    (r) => r.status === "returned" || r.status === "failed"
  ).length;

  // Map bank accounts to the shape SendMailModal wants — same logic
  // SendMailButtonServer uses, kept here so the lead Mail tab doesn't
  // depend on the contacts-tab button being mounted to send mail.
  const banks = bankAccounts.map((b) => ({
    id: b.id,
    label: [
      b.bank_name,
      b.account_holder_name,
      b.account_last_four ? `**** ${b.account_last_four}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    verified: b.status === "verified",
  }));

  const mailReady = Boolean(
    org.address_line1 && org.city && org.region && org.postal_code
  );

  const fromAddress = {
    name: org.name || "",
    line1: org.address_line1 ?? "",
    line2: org.address_line2 ?? null,
    city: org.city ?? "",
    region: org.region ?? "",
    postal_code: org.postal_code ?? "",
  };

  return (
    <LeadMailV11Client
      rows={rows}
      totalSent={rows.length}
      processingCount={processingCount}
      inTransitCount={inTransitCount}
      deliveredCount={deliveredCount}
      returnedCount={returnedCount}
      leadId={leadId}
      mailingAddressCount={mailingAddressCount}
      candidates={candidates}
      templates={templates}
      bankAccounts={banks}
      mailReady={mailReady}
      fromAddress={fromAddress}
      pricing={customerPricing?.customer_mail_pricing_cents ?? null}
    />
  );
}
