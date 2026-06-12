import {
  fetchOwnersWithContacts,
  fetchRelatives,
  fetchAttorneyOptions,
} from "@/lib/leads/fetch-detail";
import { fetchLeadParties, fetchOrgCustomRoles } from "@/lib/leads/lead-parties";
import { createClient } from "@/lib/supabase/server";
import { ContactsTabClient } from "./ContactsTabClient";
import { RelativesSection } from "./RelativesSection";
import { AttorneyAssignment } from "./AttorneyAssignment";
import { MailingAddresses } from "./Overview/MailingAddresses";
import { OtherContactsSection } from "./OtherContactsSection";

export async function ContactsTab({ leadId }: { leadId: string }) {
  const sb = await createClient();
  const [
    { owners, contacts },
    relatives,
    attorneys,
    leadRow,
    leadParties,
    customRoles,
  ] = await Promise.all([
    fetchOwnersWithContacts(leadId),
    fetchRelatives(leadId),
    fetchAttorneyOptions(),
    sb.from("leads").select("attorney_id, attorney_cost").eq("id", leadId).maybeSingle(),
    fetchLeadParties(leadId),
    fetchOrgCustomRoles(),
  ]);

  const currentAttorneyId =
    (leadRow.data?.attorney_id as string | null | undefined) ?? null;
  const currentAttorneyCost =
    (leadRow.data?.attorney_cost as number | null | undefined) ?? null;

  const selectedAttorney = attorneys.find((a) => a.id === currentAttorneyId) ?? null;
  return (
    <>
      <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="section-subheader">Assigned Attorney</h3>
            <div className="mt-1 text-[12px] text-gray-500">
              Moss&apos;s retained attorney for this case. The fee here flows
              into the recovery breakdown — separate from owners, relatives,
              and other contacts because it&apos;s our billable resource, not
              a party on the lead&apos;s side.
            </div>
          </div>
          {selectedAttorney && (
            <div className="flex shrink-0 items-center gap-2 rounded-md border border-petrol-100 bg-petrol-50 px-3 py-[6px]">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-petrol-700 to-petrol-500 text-[10px] font-semibold text-white">
                {selectedAttorney.name
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase() ?? "")
                  .join("")}
              </div>
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[12px] font-medium text-ink">
                  {selectedAttorney.name}
                </div>
                <div className="text-[10px] text-gray-500">
                  {selectedAttorney.states_covered.join(", ") || "—"}
                  {selectedAttorney.default_cost != null
                    ? ` · $${selectedAttorney.default_cost.toLocaleString()} default`
                    : ""}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-3">
          <AttorneyAssignment
            leadId={leadId}
            attorneys={attorneys}
            currentAttorneyId={currentAttorneyId}
            currentAttorneyCost={currentAttorneyCost}
          />
        </div>
      </div>
      <div className="mt-4">
        <ContactsTabClient
          leadId={leadId}
          initialOwners={owners}
          initialContacts={contacts}
        />
      </div>
      <RelativesSection
        leadId={leadId}
        initial={relatives}
        contacts={contacts}
      />
      <OtherContactsSection
        leadId={leadId}
        initial={leadParties}
        customRoles={customRoles}
        contacts={contacts}
      />
      <div className="mt-4">
        <MailingAddresses
          leadId={leadId}
          initialAddresses={contacts}
          owners={owners}
          relatives={relatives}
          leadParties={leadParties}
        />
      </div>
    </>
  );
}
