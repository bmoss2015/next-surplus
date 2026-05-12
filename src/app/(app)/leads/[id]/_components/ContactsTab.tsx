import {
  fetchOwnersWithContacts,
  fetchRelatives,
  fetchAttorneyOptions,
} from "@/lib/leads/fetch-detail";
import { createClient } from "@/lib/supabase/server";
import { ContactsTabClient } from "./ContactsTabClient";
import { RelativesSection } from "./RelativesSection";
import { AttorneyAssignment } from "./AttorneyAssignment";
import { MailingAddresses } from "./Overview/MailingAddresses";

export async function ContactsTab({ leadId }: { leadId: string }) {
  const sb = await createClient();
  const [{ owners, contacts }, relatives, attorneys, leadRow] =
    await Promise.all([
      fetchOwnersWithContacts(leadId),
      fetchRelatives(leadId),
      fetchAttorneyOptions(),
      sb.from("leads").select("attorney_id, attorney_cost").eq("id", leadId).maybeSingle(),
    ]);

  const currentAttorneyId =
    (leadRow.data?.attorney_id as string | null | undefined) ?? null;
  const currentAttorneyCost =
    (leadRow.data?.attorney_cost as number | null | undefined) ?? null;

  return (
    <>
      <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
        <h3 className="section-subheader">
          Assigned Attorney
        </h3>
        <div className="mt-2">
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
      <RelativesSection leadId={leadId} initial={relatives} />
      <div className="mt-4">
        <MailingAddresses
          leadId={leadId}
          initialAddresses={contacts}
          owners={owners}
          relatives={relatives}
        />
      </div>
    </>
  );
}
