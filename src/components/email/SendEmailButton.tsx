"use client";

import { useState } from "react";
import { IconMailForward } from "@tabler/icons-react";
import { SendEmailModal } from "./SendEmailModal";
import type { EmailRecipientCandidate } from "@/lib/email/lead-recipients";
import type { EmailTemplateRow } from "@/lib/settings/fetch";
import type { EmailAccountRow } from "@/lib/email/types";

export type SendEmailButtonProps = {
  leadId: string;
  candidates: EmailRecipientCandidate[];
  templates: EmailTemplateRow[];
  accounts: EmailAccountRow[];
  signatureHtml?: string | null;
  label?: string;
  iconOnly?: boolean;
  className?: string;
};

export function SendEmailButton({
  leadId,
  candidates,
  templates,
  accounts,
  signatureHtml,
  label = "Send Email",
  iconOnly,
  className,
}: SendEmailButtonProps) {
  const [open, setOpen] = useState(false);
  const noEmailContacts = candidates.length === 0;
  const noActiveAccount = accounts.filter((a) => a.status === "active").length === 0;

  const baseClasses =
    "btn-primary cursor-pointer rounded-md px-3.5 py-2 text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={noActiveAccount}
        title={
          noActiveAccount
            ? "Connect Gmail in Settings → Email Accounts first."
            : noEmailContacts
              ? "No email addresses on this lead. Open will let you type one."
              : label
        }
        className={className ?? baseClasses}
      >
        <IconMailForward
          size={13}
          stroke={1.75}
          className={iconOnly ? "" : "mr-1 inline -translate-y-px"}
        />
        {!iconOnly && label}
      </button>
      <SendEmailModal
        open={open}
        onClose={() => setOpen(false)}
        leadId={leadId}
        candidates={candidates}
        templates={templates}
        accounts={accounts}
        signatureHtml={signatureHtml}
      />
    </>
  );
}
