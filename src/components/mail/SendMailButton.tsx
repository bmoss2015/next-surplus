"use client";

import { useState } from "react";
import { IconMail } from "@tabler/icons-react";
import { SendMailModal, type SendMailModalRecipient } from "./SendMailModal";
import type { MailTemplateRow } from "@/lib/settings/fetch";

export type SendMailFromAddress = {
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postal_code: string;
};

export type SendMailButtonProps = {
  label?: string;
  candidates: SendMailModalRecipient[];
  templates: MailTemplateRow[];
  bankAccounts: { id: string; label: string; verified: boolean }[];
  defaultMailClass?: "standard" | "first_class" | "certified";
  iconOnly?: boolean;
  className?: string;
  // Org has a complete return address. Computed server-side so we can grey
  // out the button without the user needing to open the modal first.
  mailReady: boolean;
  fromAddress: SendMailFromAddress;
  // Customer-facing rate schedule. Passed to the modal so the cost
  // estimate reflects "what you'll pay" not the underlying provider cost.
  pricing?: {
    letter_first_class_bw: number;
    letter_first_class_color: number;
    letter_standard_bw: number;
    letter_standard_color: number;
    letter_certified_bw: number;
    letter_certified_color: number;
    letter_extra_page_bw: number;
    letter_extra_page_color: number;
    check_base: number;
  } | null;
  preflightVerifyEnabled?: boolean;
};

export function SendMailButton({
  label = "Send Mail",
  candidates,
  templates,
  bankAccounts,
  defaultMailClass,
  iconOnly,
  className,
  mailReady,
  fromAddress,
  pricing,
  preflightVerifyEnabled,
}: SendMailButtonProps) {
  const [open, setOpen] = useState(false);
  // Always render the button as clickable — the modal carries the
  // explanation when something is missing (no return address, no
  // candidates, etc.). Per Bree's feedback: error inside the modal,
  // don't hide the entry point.
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Send mail to ${candidates.length} candidate${
          candidates.length === 1 ? "" : "s"
        }`}
        className={
          className ??
          "btn-primary inline-flex cursor-pointer items-center gap-1 rounded-md px-3 py-[6px] text-[12px] font-medium text-white"
        }
      >
        <IconMail size={13} stroke={2} />
        {!iconOnly && label}
      </button>
      {open && (
        <SendMailModal
          open={open}
          onClose={() => setOpen(false)}
          templates={templates}
          candidates={candidates}
          bankAccounts={bankAccounts}
          defaultMailClass={defaultMailClass}
          mailReady={mailReady}
          fromAddress={fromAddress}
          pricing={pricing}
          preflightVerifyEnabled={preflightVerifyEnabled}
        />
      )}
    </>
  );
}
