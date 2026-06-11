"use client";

import { SendEmailModal, type SendEmailReplyContext } from "./SendEmailModal";
import type { EmailRecipientCandidate } from "@/lib/email/lead-recipients";
import type { EmailTemplateRow } from "@/lib/settings/fetch";
import type { EmailAccountRow } from "@/lib/email/types";

export type SendEmailComposeHostProps = {
  leadId: string;
  open: boolean;
  onClose: () => void;
  candidates: EmailRecipientCandidate[];
  templates: EmailTemplateRow[];
  accounts: EmailAccountRow[];
  replyContext?: SendEmailReplyContext | null;
};

export function SendEmailComposeHost(props: SendEmailComposeHostProps) {
  return (
    <SendEmailModal
      open={props.open}
      onClose={props.onClose}
      leadId={props.leadId}
      candidates={props.candidates}
      templates={props.templates}
      accounts={props.accounts}
      replyContext={props.replyContext ?? null}
    />
  );
}
