"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  encryptToken,
  testImapSmtpConnection,
  type ImapSmtpCredentials,
} from "@/lib/email/imap";

export async function disconnectEmailAccount(
  accountId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  // RLS restricts deletes to the connector — this is safe.
  const { error } = await sb
    .from("channel_accounts")
    .delete()
    .eq("id", accountId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}

export async function setEmailAccountReadSync(
  accountId: string,
  enabled: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb
    .from("channel_accounts")
    .update({ sync_read_to_provider: enabled })
    .eq("id", accountId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateEmailAccountSignature(
  accountId: string,
  signatureHtml: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb
    .from("channel_accounts")
    .update({ signature_html: signatureHtml })
    .eq("id", accountId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/leads", "layout");
  return { ok: true };
}

export type ConnectImapInput = {
  address: string;
  display_name?: string;
  creds: ImapSmtpCredentials;
};

export async function connectImapAccount(
  input: ConnectImapInput
): Promise<{ ok: true; account_id: string } | { ok: false; error: string }> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: profile } = await sb
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.org_id) {
    return { ok: false, error: "Could not find your organization" };
  }

  const test = await testImapSmtpConnection(input.creds);
  if (!test.ok) return test;

  const svc = createServiceClient();
  const { data: inserted, error: insErr } = await svc
    .from("channel_accounts")
    .upsert(
      {
        org_id: profile.org_id,
        user_id: user.id,
        provider: "imap",
        address: input.address.toLowerCase().trim(),
        display_name: input.display_name ?? null,
        status: "active",
        imap_host: input.creds.imap_host,
        imap_port: input.creds.imap_port,
        imap_secure: input.creds.imap_secure,
        imap_username: input.creds.imap_username,
        imap_password_encrypted: encryptToken(input.creds.imap_password),
        smtp_host: input.creds.smtp_host,
        smtp_port: input.creds.smtp_port,
        smtp_secure: input.creds.smtp_secure,
        smtp_username: input.creds.smtp_username,
        smtp_password_encrypted: encryptToken(input.creds.smtp_password),
      },
      { onConflict: "user_id,provider,address" }
    )
    .select("id")
    .maybeSingle();
  if (insErr || !inserted) {
    return {
      ok: false,
      error: `Account save failed: ${insErr?.message ?? "no row"}`,
    };
  }
  revalidatePath("/settings");
  return { ok: true, account_id: inserted.id as string };
}
