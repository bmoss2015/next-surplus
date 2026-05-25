"use server";

import { fetchMailJob, type MailJobDetailRow } from "@/lib/mail/fetch";

export async function fetchMailJobAction(
  id: string
): Promise<MailJobDetailRow | null> {
  return fetchMailJob(id);
}
