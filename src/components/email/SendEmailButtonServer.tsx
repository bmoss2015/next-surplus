import "server-only";
import { buildLeadEmailCandidates } from "@/lib/email/lead-recipients";
import { fetchEmailTemplates } from "@/lib/settings/fetch";
import { fetchMyEmailAccounts } from "@/lib/email/fetch";
import { SendEmailButton } from "./SendEmailButton";

export async function SendEmailButtonServer({
  leadId,
  label,
  iconOnly,
  className,
}: {
  leadId: string;
  label?: string;
  iconOnly?: boolean;
  className?: string;
}) {
  const [{ candidates }, templates, accounts] = await Promise.all([
    buildLeadEmailCandidates(leadId),
    fetchEmailTemplates(),
    fetchMyEmailAccounts(),
  ]);
  return (
    <SendEmailButton
      leadId={leadId}
      candidates={candidates}
      templates={templates}
      accounts={accounts}
      label={label}
      iconOnly={iconOnly}
      className={className}
    />
  );
}
