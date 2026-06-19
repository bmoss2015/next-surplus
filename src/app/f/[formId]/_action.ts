"use server";

import { headers } from "next/headers";
import { submitWebForm, type SubmitResult } from "@/lib/web-forms/submit";

export async function submitInquiry(input: {
  formId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  smsConsentService: boolean;
  smsConsentMarketing: boolean;
  honeypot: string;
}): Promise<SubmitResult> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() ?? null;

  return submitWebForm({
    formId: input.formId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone || null,
    state: input.state || null,
    smsConsentService: input.smsConsentService,
    smsConsentMarketing: input.smsConsentMarketing,
    honeypot: input.honeypot || null,
    ipAddress,
  });
}
