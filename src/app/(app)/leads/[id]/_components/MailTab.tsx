import { fetchMailDashboard } from "@/lib/mail/fetch";
import {
  fetchOwnersWithContacts,
  fetchRelatives,
} from "@/lib/leads/fetch-detail";
import { fetchLeadParties } from "@/lib/leads/lead-parties";
import { buildLeadSendMailCandidates } from "@/lib/mail/lead-candidates";
import { MailListClient } from "@/app/(app)/mail/_components/MailListClient";
import { SendMailButtonServer } from "@/components/mail/SendMailButtonServer";
import { MailingAddresses } from "./Overview/MailingAddresses";

// Lead Mail tab has its own design distinct from the global /mail
// dashboard. Two sections, visually separated:
//
//   1. COMPOSE — mailing addresses on file for this lead + the Send
//      Mail launcher button. Lifts the mail-sending UX from the
//      Contacts tab so an operator working from the Mail tab can do
//      everything without switching tabs.
//   2. HISTORY — chronological list of every piece sent to or from
//      anyone on this lead (returned/failed pieces float to the top
//      via the Needs Attention card).
//
// Anchor: Attio / Affinity / Pipedrive all use a compose-at-top + feed-
// below pattern on per-record views (vs. the table pattern they use on
// global dashboards). Lifting that here so the lead Mail tab reads
// distinctly from /mail.

export async function MailTab({ leadId }: { leadId: string }) {
  const [{ owners, contacts }, relatives, leadParties, candidates, dashboard] =
    await Promise.all([
      fetchOwnersWithContacts(leadId),
      fetchRelatives(leadId),
      fetchLeadParties(leadId),
      buildLeadSendMailCandidates(leadId),
      fetchMailDashboard({ leadId, windowDays: 365, limit: 200 }),
    ]);

  const totalAddresses = contacts.filter(
    (c) => c.channel === "mailing_address" && c.value.trim().length > 0
  ).length;

  return (
    <div className="space-y-5">
      {/* COMPOSE section — prominent at the top */}
      <section className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
        <header className="mb-4 flex items-baseline justify-between">
          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
              Compose Mail
            </h2>
            <div className="mt-1 text-[13px] text-ink">
              {totalAddresses === 0
                ? "No mailing addresses on file yet. Add one to send."
                : totalAddresses === 1
                  ? "1 mailing address on file."
                  : `${totalAddresses} mailing addresses on file.`}
            </div>
          </div>
          <SendMailButtonServer candidates={candidates} />
        </header>
        <MailingAddresses
          leadId={leadId}
          initialAddresses={contacts}
          owners={owners}
          relatives={relatives}
          leadParties={leadParties}
        />
      </section>

      {/* HISTORY section — visually distinct from compose */}
      <section className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
        <header className="mb-4">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
            Mail History
          </h2>
          <div className="mt-1 text-[13px] text-gray-500">
            Every piece sent on this lead. Returned pieces float to the
            top so addresses can be fixed.
          </div>
        </header>
        <MailListClient
          initialRows={dashboard.rows}
          initialStats={dashboard.stats}
          initialSearch=""
          initialStatus="all"
          initialLeadId={leadId}
          showNeedsAttention
        />
      </section>
    </div>
  );
}
