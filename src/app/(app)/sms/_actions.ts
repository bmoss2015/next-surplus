"use server";

// SMS server actions. Outbound send via Telnyx /v2/messages with the
// runtime STOP append rule (first outbound per contact + every 30 days).
// All outbound sends are blocked until the org's A2P brand + campaign
// reach status='approved'.

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

const STOP_APPEND_TEXT = " Reply STOP to opt out.";
const STOP_REFRESH_DAYS = 30;

type SendResult =
  | { ok: true; message_id: string; stop_appended: boolean }
  | { ok: false; error: string };

export async function sendSms(input: {
  to_e164: string;
  body: string;
  contact_id?: string | null;
  lead_id?: string | null;
  from_phone_number_id?: string | null;
}): Promise<SendResult> {
  const profile = await getCurrentProfile();
  if (!profile?.orgId) return { ok: false, error: "Not signed in" };

  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) return { ok: false, error: "TELNYX_API_KEY missing" };

  const sb = await createClient();

  const { data: brand } = await sb
    .from("a2p_brand_registrations")
    .select("status")
    .maybeSingle();
  if (brand?.status !== "approved") {
    return { ok: false, error: "SMS sending is blocked until A2P 10DLC brand is approved" };
  }

  const { data: optOut } = await sb
    .from("contact_opt_outs")
    .select("id")
    .eq("org_id", profile.orgId)
    .eq("e164", input.to_e164)
    .maybeSingle();
  if (optOut) {
    return { ok: false, error: "Recipient has opted out of SMS from this organization" };
  }

  let fromE164: string | null = null;
  if (input.from_phone_number_id) {
    const { data } = await sb
      .from("phone_numbers")
      .select("e164")
      .eq("id", input.from_phone_number_id)
      .eq("sms_enabled", true)
      .eq("status", "active")
      .maybeSingle();
    if (data) fromE164 = data.e164 as string;
  }
  if (!fromE164) {
    const { data } = await sb
      .from("phone_numbers")
      .select("e164")
      .eq("status", "active")
      .eq("sms_enabled", true)
      .limit(1)
      .maybeSingle();
    if (data) fromE164 = data.e164 as string;
  }
  if (!fromE164) {
    return { ok: false, error: "No SMS-enabled active phone number found for this org" };
  }

  let stopAppended = false;
  let finalBody = input.body;
  if (input.contact_id) {
    const { data: contact } = await sb
      .from("contacts")
      .select("last_stop_appended_at")
      .eq("id", input.contact_id)
      .maybeSingle();
    const last = contact?.last_stop_appended_at as string | null | undefined;
    const needsAppend =
      !last ||
      Date.now() - new Date(last).getTime() > STOP_REFRESH_DAYS * 24 * 60 * 60 * 1000;
    if (needsAppend && !finalBody.toLowerCase().includes("stop")) {
      finalBody = finalBody.trimEnd() + STOP_APPEND_TEXT;
      stopAppended = true;
    }
  }

  try {
    const res = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromE164, to: input.to_e164, text: finalBody }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Telnyx HTTP ${res.status}: ${text}` };
    }
    const json = (await res.json()) as { data?: { id?: string } };
    const messageId = json.data?.id;
    if (!messageId) return { ok: false, error: "Telnyx response missing message id" };

    await sb.from("sms_messages").insert({
      org_id: profile.orgId,
      contact_id: input.contact_id ?? null,
      lead_id: input.lead_id ?? null,
      direction: "outbound",
      from_e164: fromE164,
      to_e164: input.to_e164,
      body: finalBody,
      telnyx_message_id: messageId,
      status: "sent",
      stop_appended: stopAppended,
      sent_at: new Date().toISOString(),
    });
    if (stopAppended && input.contact_id) {
      await sb
        .from("contacts")
        .update({ last_stop_appended_at: new Date().toISOString() })
        .eq("id", input.contact_id);
    }
    revalidatePath(`/lead/${input.lead_id}`);
    return { ok: true, message_id: messageId, stop_appended: stopAppended };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Telnyx send failed" };
  }
}
