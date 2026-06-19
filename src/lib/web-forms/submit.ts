import "server-only";

import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";
import {
  renderEmailShell,
  renderEmailEyebrow,
  renderEmailHeadline,
  renderEmailIntro,
  renderEmailDataBlock,
  renderEmailButton,
} from "@/lib/email-template";

export type WebFormSubmission = {
  formId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  state: string | null;
  smsConsentService: boolean;
  smsConsentMarketing: boolean;
  honeypot: string | null;
  ipAddress: string | null;
};

export type SubmitResult =
  | { ok: true; successMessage: string }
  | { ok: false; error: string };

const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_ENV === "production"
    ? "https://app.nextsurplus.com"
    : "https://staging.nextsurplus.com");

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function submitWebForm(input: WebFormSubmission): Promise<SubmitResult> {
  const sb = createServiceClient();

  const { data: form, error: formError } = await sb
    .from("web_forms")
    .select(
      "id, org_id, name, is_active, assignment_type, assigned_to, round_robin_users, last_assigned_index, default_stage, lead_source, success_message, honeypot_field_name, rate_limit_per_minute, store_sms_consent"
    )
    .eq("id", input.formId)
    .maybeSingle();

  if (formError || !form) {
    return { ok: false, error: "Form not found." };
  }

  if (!form.is_active) {
    return { ok: false, error: "This form is not currently accepting submissions." };
  }

  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { ok: true, successMessage: form.success_message };
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() || null;
  const state = input.state?.trim().toUpperCase() || null;

  if (!firstName || !lastName) {
    return { ok: false, error: "First and last name are required." };
  }
  if (!isEmail(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!state) {
    return { ok: false, error: "Please select the state where the property was located." };
  }

  if (input.ipAddress) {
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { count } = await sb
      .from("web_form_rate_limits")
      .select("ip_address", { count: "exact", head: true })
      .eq("web_form_id", form.id)
      .eq("ip_address", input.ipAddress)
      .gte("submitted_at", oneMinuteAgo);

    if (typeof count === "number" && count >= form.rate_limit_per_minute) {
      return { ok: false, error: "Too many submissions. Please try again in a minute." };
    }
  }

  let assigneeId: string | null = null;
  let nextIndex = form.last_assigned_index ?? 0;

  if (form.assignment_type === "round_robin") {
    const pool = (form.round_robin_users ?? []) as string[];
    if (pool.length > 0) {
      const idx = nextIndex % pool.length;
      assigneeId = pool[idx];
      nextIndex = idx + 1;
    }
  } else {
    assigneeId = (form.assigned_to as string | null) ?? null;
  }

  const placeholderAddress = "Web Form Inquiry";
  const placeholderCity = "Unknown";
  const placeholderZip = "00000";

  const customData = {
    source: "web_form",
    form_id: form.id,
    form_name: form.name,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    inquiry_state: state,
    sms_consent_service: input.smsConsentService,
    sms_consent_marketing: input.smsConsentMarketing,
    submitted_at: new Date().toISOString(),
  };

  const { data: lead, error: leadError } = await sb
    .from("leads")
    .insert({
      org_id: form.org_id,
      address: placeholderAddress,
      city: placeholderCity,
      state,
      zip: placeholderZip,
      sale_type: "MTG",
      lead_source: form.lead_source ?? "website",
      assigned_to: assigneeId,
      custom_data: customData,
    })
    .select("id, lead_id")
    .single();

  if (leadError || !lead) {
    return { ok: false, error: leadError?.message ?? "Could not create lead." };
  }

  const fullName = `${firstName} ${lastName}`.trim();

  const { data: owner } = await sb
    .from("owners")
    .insert({
      org_id: form.org_id,
      lead_id: lead.id,
      full_name: fullName,
      is_primary: true,
    })
    .select("id")
    .single();

  if (owner) {
    const contacts: Array<Record<string, unknown>> = [
      {
        org_id: form.org_id,
        owner_id: owner.id,
        lead_id: lead.id,
        channel: "email",
        value: email,
        is_primary: true,
      },
    ];
    if (phone) {
      contacts.push({
        org_id: form.org_id,
        owner_id: owner.id,
        lead_id: lead.id,
        channel: "phone",
        value: phone,
        is_primary: true,
      });
    }
    await sb.from("contacts").insert(contacts);
  }

  await sb.from("activities").insert({
    org_id: form.org_id,
    lead_id: lead.id,
    activity_type: "lead_created",
    payload: {
      source: "web_form",
      form_name: form.name,
      submitted_at: new Date().toISOString(),
    },
  });

  if (assigneeId) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDate = tomorrow.toISOString().slice(0, 10);

    await sb.from("tasks").insert({
      org_id: form.org_id,
      lead_id: lead.id,
      user_id: assigneeId,
      title: `Follow up: ${fullName} (Web Form)`,
      due_date: dueDate,
      priority: "high",
      source: "manual",
    });
  }

  await sb.from("web_form_submissions").insert({
    web_form_id: form.id,
    org_id: form.org_id,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    state,
    sms_consent_service: input.smsConsentService,
    sms_consent_marketing: input.smsConsentMarketing,
    created_lead_id: lead.id,
    assigned_to: assigneeId,
    ip_address: input.ipAddress,
  });

  if (form.assignment_type === "round_robin") {
    await sb
      .from("web_forms")
      .update({ last_assigned_index: nextIndex })
      .eq("id", form.id);
  }

  if (input.ipAddress) {
    await sb.from("web_form_rate_limits").insert({
      ip_address: input.ipAddress,
      web_form_id: form.id,
    });
    const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
    await sb
      .from("web_form_rate_limits")
      .delete()
      .lt("submitted_at", oneHourAgo);
  }

  if (assigneeId) {
    await sendAssigneeEmail({
      assigneeId,
      formName: form.name,
      firstName,
      lastName,
      email,
      phone,
      state,
      leadSource: form.lead_source ?? "website",
      leadId: lead.id,
    });
  }

  return { ok: true, successMessage: form.success_message };
}

async function sendAssigneeEmail(args: {
  assigneeId: string;
  formName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  state: string | null;
  leadSource: string;
  leadId: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const sb = createServiceClient();
  const { data: profile } = await sb
    .from("profiles")
    .select("email")
    .eq("id", args.assigneeId)
    .maybeSingle();

  const toEmail = (profile?.email as string | null) ?? null;
  if (!toEmail) return;

  const resend = new Resend(apiKey);
  const fullName = `${args.firstName} ${args.lastName}`.trim();
  const subject = `New Lead from Website: ${fullName}`;
  const preheader = `${fullName} submitted the ${args.formName}.`;

  const rows = [
    { label: "Name", value: fullName },
    { label: "Email", value: args.email },
  ];
  if (args.phone) rows.push({ label: "Phone", value: args.phone });
  if (args.state) rows.push({ label: "State", value: args.state });
  rows.push({ label: "Source", value: args.leadSource });

  const bodyHtml = `
    ${renderEmailEyebrow("New Web Form Submission")}
    ${renderEmailHeadline(fullName)}
    ${renderEmailIntro(`Submitted via ${args.formName}. A high-priority follow-up task has been added to your queue.`)}
    ${renderEmailDataBlock(rows)}
    ${renderEmailButton({ href: `${APP_BASE_URL}/leads/${args.leadId}`, label: "View Lead" })}
  `;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "Next Surplus <noreply@nextsurplus.com>",
      to: toEmail,
      subject,
      html: renderEmailShell({ subject, bodyHtml, preheader }),
    });
  } catch (err) {
    console.error("[web-form] assignee email failed:", err);
  }
}
