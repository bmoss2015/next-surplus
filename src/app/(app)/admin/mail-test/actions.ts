"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentProfile } from "@/lib/auth/current-user";
import {
  sendMail,
  type RecipientInput,
  type SendMailInput,
} from "@/lib/mail/actions";
import { HARNESS_TAG, SCENARIOS, type Scenario, type ScenarioId } from "./_scenarios";

const TEMPLATE_NAME = `${HARNESS_TAG} Test Letter`;
const BANK_HOLDER_NAME = `${HARNESS_TAG} Test Bank`;

export type RunResult = {
  scenarioId: ScenarioId;
  ok: boolean;
  expected: "pass" | "block";
  matched: boolean;
  durationMs: number;
  // What `sendMail` returned
  send: {
    ok: boolean;
    batch_id?: string;
    job_ids?: string[];
    provider_letter?: string;
    provider_check?: string;
    error?: string;
  };
  // Rows the harness pulled back for inspection
  jobs: Array<{
    id: string;
    status: string;
    provider: string;
    cost_cents: number | null;
    cost_source: string;
    recipient_name: string;
    error_message: string | null;
    include_check: boolean;
  }>;
  activities: Array<{ id: string; activity_type: string }>;
  notifications: Array<{ id: string; type: string; body_preview: string | null }>;
  notes: string[];
};

// ---------------------------------------------------------------------------
// Seed action — ensures the harness has a template + bank account to use.
// Safe to re-run; uses HARNESS_TAG marker to dedupe.

export async function seedMailTestArtifacts(): Promise<{
  ok: true;
  template_id: string;
  bank_account_id: string;
  bank_provider: "lob_test" | "stub_verified";
  notes: string[];
} | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  if (!profile.isAdmin) return { ok: false, error: "Admin only" };
  const sb = await createClient();
  const admin = createServiceClient();
  const notes: string[] = [];

  // Template
  let templateId: string;
  const { data: existingTpl } = await sb
    .from("mail_templates")
    .select("id")
    .eq("org_id", profile.orgId)
    .eq("name", TEMPLATE_NAME)
    .maybeSingle();
  if (existingTpl) {
    templateId = existingTpl.id as string;
    notes.push("Template already present, reused.");
  } else {
    const { data: insTpl, error: tplErr } = await sb
      .from("mail_templates")
      .insert({
        org_id: profile.orgId,
        name: TEMPLATE_NAME,
        body_html: TEMPLATE_BODY_HTML,
        default_mail_class: "first_class",
      })
      .select("id")
      .single();
    if (tplErr || !insTpl) {
      return { ok: false, error: `Template seed failed: ${tplErr?.message ?? "unknown"}` };
    }
    templateId = insTpl.id as string;
    notes.push("Template created.");
  }

  // Bank account — only seed if missing.
  let bankAccountId: string;
  let bankProvider: "lob_test" | "stub_verified";
  const { data: existingBank } = await sb
    .from("mail_bank_accounts")
    .select("id, status")
    .eq("org_id", profile.orgId)
    .eq("account_holder_name", BANK_HOLDER_NAME)
    .maybeSingle();
  if (existingBank) {
    bankAccountId = existingBank.id as string;
    bankProvider = "stub_verified";
    notes.push(`Bank account already present (status: ${existingBank.status}), reused.`);
  } else {
    const lobKey = process.env.LOB_API_KEY ?? "";
    if (lobKey.startsWith("test_")) {
      // Use Lob's published sandbox bank fixture so check sends actually
      // hit the real Lob test environment.
      const { lobCreateBankAccount, lobVerifyBankAccount } = await import(
        "@/lib/mail/lob"
      );
      const create = await lobCreateBankAccount({
        routing_number: "322271627",
        account_number: "123456789",
        account_holder_name: BANK_HOLDER_NAME,
        account_type: "company",
      });
      if (!create.ok) {
        return { ok: false, error: `Lob bank create failed: ${create.error}` };
      }
      const verify = await lobVerifyBankAccount(create.lob_bank_account_id, [
        11, 35,
      ]);
      if (!verify.ok) {
        return { ok: false, error: `Lob bank verify failed: ${verify.error}` };
      }
      // Insert via service client to bypass the admin-only RLS check on
      // mail_bank_accounts — Bree is admin so this is just a belt-and-
      // suspenders move.
      const { data: insBank, error: bankErr } = await admin
        .from("mail_bank_accounts")
        .insert({
          org_id: profile.orgId,
          lob_bank_account_id: create.lob_bank_account_id,
          bank_name: create.bank_name,
          account_holder_name: BANK_HOLDER_NAME,
          routing_last_four: create.routing_last_four,
          account_last_four: create.account_last_four,
          status: "verified",
          verified_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (bankErr || !insBank) {
        return { ok: false, error: `Bank insert failed: ${bankErr?.message ?? "unknown"}` };
      }
      bankAccountId = insBank.id as string;
      bankProvider = "lob_test";
      notes.push("Lob sandbox bank account created and verified.");
    } else {
      // Live key (or unset). Insert a placeholder with a stub Lob ID so
      // gate scenarios still work; live check sends will fail at the Lob
      // API call, which the harness surfaces in the provider response.
      const stubLobId = `bnk_stub_${Date.now().toString(36)}`;
      const { data: insBank, error: bankErr } = await admin
        .from("mail_bank_accounts")
        .insert({
          org_id: profile.orgId,
          lob_bank_account_id: stubLobId,
          bank_name: "Harness Test Bank",
          account_holder_name: BANK_HOLDER_NAME,
          routing_last_four: "1627",
          account_last_four: "6789",
          status: "verified",
          verified_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (bankErr || !insBank) {
        return { ok: false, error: `Bank insert failed: ${bankErr?.message ?? "unknown"}` };
      }
      bankAccountId = insBank.id as string;
      bankProvider = "stub_verified";
      notes.push(
        "Lob is not in test mode; inserted a stub-verified bank row. Check scenarios will fail at the Lob API call (expected)."
      );
    }
  }

  return {
    ok: true,
    template_id: templateId,
    bank_account_id: bankAccountId,
    bank_provider: bankProvider,
    notes,
  };
}

// ---------------------------------------------------------------------------
// Run a single scenario end-to-end.

export async function runMailTestScenario(input: {
  scenarioId: ScenarioId;
  template_id: string;
  bank_account_id: string;
}): Promise<RunResult> {
  const scenario = SCENARIOS.find((s) => s.id === input.scenarioId);
  if (!scenario) {
    return emptyResult(input.scenarioId, "pass", `Unknown scenario: ${input.scenarioId}`);
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    return emptyResult(scenario.id, scenario.expect, "Not signed in");
  }
  const sb = await createClient();
  const admin = createServiceClient();
  const t0 = Date.now();
  const notes: string[] = [];

  // Optionally blank the company name to test the gate.
  let savedCompanyName: string | null = null;
  if (scenario.omitCompanyName) {
    const { data: orgRow } = await sb
      .from("orgs")
      .select("name")
      .eq("id", profile.orgId)
      .single();
    savedCompanyName = (orgRow?.name as string | null) ?? null;
    await admin.from("orgs").update({ name: "" }).eq("id", profile.orgId);
    notes.push("Temporarily blanked org.name to exercise the gate.");
  }

  try {
    const recipients = buildRecipients(scenario.recipients);
    const body_html = buildBody(scenario.body);
    const sendInput: SendMailInput = {
      recipients,
      template_id:
        scenario.body === "merged" ? input.template_id : null,
      body_html,
      mail_class: "first_class",
      color: scenario.color,
      include_check: scenario.check.include,
      check_amount_cents: scenario.check.include
        ? scenario.check.amount_cents
        : null,
      check_memo: scenario.check.include ? "Mail harness test" : null,
      bank_account_id:
        scenario.check.include && !scenario.omitBank
          ? input.bank_account_id
          : null,
    };

    const send = await sendMail(sendInput);
    const durationMs = Date.now() - t0;

    if (!send.ok) {
      const matched =
        scenario.expect === "block" &&
        (!scenario.expectedErrorContains ||
          send.error.toLowerCase().includes(
            scenario.expectedErrorContains.toLowerCase()
          ));
      // Even on block, the harness still wants to surface any notification
      // the failure path produced (mail_failed bell entry).
      const recentNotifs = await fetchRecentNotificationsForScenario(profile.id);
      return {
        scenarioId: scenario.id,
        ok: send.ok,
        expected: scenario.expect,
        matched,
        durationMs,
        send: { ok: false, error: send.error },
        jobs: [],
        activities: [],
        notifications: recentNotifs,
        notes,
      };
    }

    // Pull the resulting rows. Filter by batch_id so we only return rows
    // this run created, even if seeding accidentally left others behind.
    const { data: jobs } = await sb
      .from("mail_jobs")
      .select(
        "id, status, provider, cost_cents, recipient_name, error_message, include_check"
      )
      .eq("batch_id", send.batch_id);

    const jobIds = (jobs ?? []).map((j) => j.id as string);
    const { data: activities } =
      jobIds.length > 0
        ? await sb
            .from("activities")
            .select("id, activity_type, payload")
            .eq("activity_type", "mail_sent")
            .order("created_at", { ascending: false })
            .limit(20)
        : { data: [] };
    const activitiesForBatch = (activities ?? []).filter((a) => {
      const p = a.payload as { batch_id?: string } | null;
      return p?.batch_id === send.batch_id;
    });

    const notifications = await fetchRecentNotificationsForScenario(profile.id);

    return {
      scenarioId: scenario.id,
      ok: true,
      expected: scenario.expect,
      matched: scenario.expect === "pass",
      durationMs,
      send: {
        ok: true,
        batch_id: send.batch_id,
        job_ids: send.job_ids,
        provider_letter: send.provider_letter,
        provider_check: send.provider_check,
      },
      jobs: (jobs ?? []).map((j) => ({
        id: j.id as string,
        status: j.status as string,
        provider: j.provider as string,
        cost_cents: (j.cost_cents as number | null) ?? null,
        cost_source: describeCostSource(
          j.provider as string,
          (j.include_check as boolean) ?? false
        ),
        recipient_name: j.recipient_name as string,
        error_message: (j.error_message as string | null) ?? null,
        include_check: (j.include_check as boolean) ?? false,
      })),
      activities: activitiesForBatch.map((a) => ({
        id: a.id as string,
        activity_type: a.activity_type as string,
      })),
      notifications,
      notes,
    };
  } finally {
    if (savedCompanyName !== null) {
      await admin
        .from("orgs")
        .update({ name: savedCompanyName })
        .eq("id", profile.orgId);
    }
  }
}

// ---------------------------------------------------------------------------
// Bulk-delete all currently-failed mail_jobs rows. After the no-persist-on-
// sync-failure change, "failed" rows should be rare; this sweeps any legacy
// failed records (e.g. the Susan Martinez artifact from earlier testing).
// Activity entries on related leads are intentionally left in place —
// what happened on the lead remains historical truth.

export async function deleteStaleFailedMailJobs(): Promise<{
  ok: true;
  deleted: number;
} | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  if (!profile.isAdmin) return { ok: false, error: "Admin only" };
  const admin = createServiceClient();

  const { data, count, error } = await admin
    .from("mail_jobs")
    .delete({ count: "exact" })
    .eq("org_id", profile.orgId)
    .eq("status", "failed")
    .select("id");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mail");
  return { ok: true, deleted: count ?? (data?.length ?? 0) };
}

// ---------------------------------------------------------------------------
// Cleanup — delete every artifact the harness created or that we tagged.

export async function cleanupMailTestArtifacts(): Promise<{
  ok: true;
  deleted: { jobs: number; activities: number; notifications: number; templates: number; bank_accounts: number };
} | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  if (!profile.isAdmin) return { ok: false, error: "Admin only" };
  const admin = createServiceClient();

  // Jobs the harness created — match (a) the harness scenarios which use
  // HARNESS_TAG in recipient_name, OR (b) the sample-data rows which use
  // provider_id starting with "sample_". Sample rows keep clean
  // recipient names ("Margaret Chen") so the dashboard reads like
  // production data.
  const { data: jobs } = await admin
    .from("mail_jobs")
    .select("id")
    .eq("org_id", profile.orgId)
    .or(
      `recipient_name.ilike.${HARNESS_TAG}%,provider_id.ilike.sample_%`
    );
  const jobIds = (jobs ?? []).map((j) => j.id as string);
  let activitiesDeleted = 0;
  if (jobIds.length > 0) {
    // Activities reference mail_job_id in their payload jsonb, not via FK.
    const { data: acts } = await admin
      .from("activities")
      .select("id, payload")
      .eq("activity_type", "mail_sent");
    const actIds = (acts ?? [])
      .filter((a) => {
        const p = a.payload as { mail_job_id?: string } | null;
        return p?.mail_job_id ? jobIds.includes(p.mail_job_id) : false;
      })
      .map((a) => a.id as string);
    if (actIds.length > 0) {
      const { count } = await admin
        .from("activities")
        .delete({ count: "exact" })
        .in("id", actIds);
      activitiesDeleted = count ?? actIds.length;
    }
    await admin.from("mail_jobs").delete().in("id", jobIds);
  }

  const { count: notifDeleted } = await admin
    .from("notifications")
    .delete({ count: "exact" })
    .eq("recipient_id", profile.id)
    .like("body_preview", `%${HARNESS_TAG}%`);

  const { count: tplDeleted } = await admin
    .from("mail_templates")
    .delete({ count: "exact" })
    .eq("org_id", profile.orgId)
    .like("name", `${HARNESS_TAG}%`);

  const { count: bankDeleted } = await admin
    .from("mail_bank_accounts")
    .delete({ count: "exact" })
    .eq("org_id", profile.orgId)
    .like("account_holder_name", `${HARNESS_TAG}%`);

  return {
    ok: true,
    deleted: {
      jobs: jobIds.length,
      activities: activitiesDeleted,
      notifications: notifDeleted ?? 0,
      templates: tplDeleted ?? 0,
      bank_accounts: bankDeleted ?? 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers

const TEMPLATE_BODY_HTML = `
<p>{system.today_long}</p>
<p>{contact.first_name} {contact.last_name}<br/>
{contact.address}</p>
<p>Dear {contact.first_name},</p>
<p>This is a Moss Equity mail-harness test letter. It exercises the
template merge path: today's date is {system.today}, and you live in
{contact.city}, {contact.state}.</p>
<p>Sincerely,<br/>{sender.signer_name}<br/>{sender.signer_title}<br/>
{sender.company_name}</p>
`.trim();

function buildBody(kind: Scenario["body"]): string {
  if (kind === "empty") return "";
  if (kind === "short") {
    return "<p>This is a Moss Equity mail-harness blank-letter test piece.</p>";
  }
  if (kind === "merged") {
    return TEMPLATE_BODY_HTML;
  }
  // long — enough text to push the letter to multiple pages on standard
  // 8.5x11 print. Repeating a Lorem block keeps the pagination predictable
  // without baking in tens of KB of text.
  const para = `<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>`;
  return Array.from({ length: 12 }, () => para).join("\n");
}

function buildRecipients(count: 0 | 1 | 3): RecipientInput[] {
  const all: RecipientInput[] = [
    {
      name: `${HARNESS_TAG} Jane Recipient`,
      line1: "123 Test Lane",
      city: "Austin",
      state: "TX",
      postal_code: "78701",
      country: "US",
      merge_context: {
        "contact.first_name": "Jane",
        "contact.last_name": "Recipient",
        "contact.address": "123 Test Lane, Austin, TX 78701",
        "contact.city": "Austin",
        "contact.state": "TX",
      },
    },
    {
      name: `${HARNESS_TAG} Bob Tester`,
      line1: "456 Probe Way",
      line2: "Unit 7",
      city: "Dallas",
      state: "TX",
      postal_code: "75201",
      country: "US",
      merge_context: {
        "contact.first_name": "Bob",
        "contact.last_name": "Tester",
        "contact.address": "456 Probe Way Unit 7, Dallas, TX 75201",
        "contact.city": "Dallas",
        "contact.state": "TX",
      },
    },
    {
      name: `${HARNESS_TAG} Carol Sample`,
      line1: "789 QA Boulevard",
      city: "Houston",
      state: "TX",
      postal_code: "77002",
      country: "US",
      merge_context: {
        "contact.first_name": "Carol",
        "contact.last_name": "Sample",
        "contact.address": "789 QA Boulevard, Houston, TX 77002",
        "contact.city": "Houston",
        "contact.state": "TX",
      },
    },
  ];
  return all.slice(0, count);
}

function describeCostSource(provider: string, isCheck: boolean): string {
  if (provider === "lob" && isCheck) {
    return "Lob check rate from app_pricing_config.wholesale_pricing_cents";
  }
  if (provider === "lob") {
    return "Lob letter rate from app_pricing_config.wholesale_pricing_cents";
  }
  if (provider === "stub") return "stub fixture (Lob not configured)";
  if (provider === "click2mail") return "legacy C2M row (provider deprecated)";
  return provider;
}

async function fetchRecentNotificationsForScenario(profileId: string) {
  const sb = await createClient();
  const { data } = await sb
    .from("notifications")
    .select("id, type, body_preview, created_at")
    .eq("recipient_id", profileId)
    .ilike("body_preview", `%${HARNESS_TAG}%`)
    .order("created_at", { ascending: false })
    .limit(5);
  return (data ?? []).map((n) => ({
    id: n.id as string,
    type: n.type as string,
    body_preview: (n.body_preview as string | null) ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Sample-data seeder — drops 7 realistic mail_jobs rows directly into the
// table via service client so Bree can evaluate the UI on a populated
// list without spending real provider credits. All rows are tagged with
// HARNESS_TAG in the recipient_name so cleanup sweeps them.

const SAMPLE_BODY_HTML = `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #111; margin: 0.75in;">
<div><p>March 14, 2026</p><p>Dear neighbor,</p><p>Our research indicates you may be entitled to funds being held by the county following a recent property sale. Moss Equity Partners specializes in recovering these surplus funds on behalf of rightful owners.</p><p>If you'd like to discuss whether this applies to your situation, please reply by mail or call us at (512) 555-0142. There is no cost to you to learn more.</p><p>Sincerely,<br/>Bree Moss<br/>Moss Equity Partners</p></div>
</body></html>`;

export type SeededLeadStage = {
  lead_id: string;
  label: string;
  stage_name: string;
  piece_count: number;
};

export async function seedSampleMailData(): Promise<
  | {
      ok: true;
      inserted: number;
      lead_id: string | null;
      stages: SeededLeadStage[];
    }
  | { ok: false; error: string }
> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  if (!profile.isAdmin) return { ok: false, error: "Admin only" };
  const sb = await createClient();
  const admin = createServiceClient();

  // Pull the 4 most-recently-touched leads so the seeder can distribute
  // pieces across them. Each lead ends up representing a distinct mail
  // stage (just sent / delivered / needs attention / advanced) so Bree
  // can navigate between them and compare the lead surfaces side-by-
  // side. Falls back to null if no leads exist on staging.
  const { data: leadsData } = await sb
    .from("leads")
    .select("id, address, city, state, lead_id")
    .order("updated_at", { ascending: false })
    .limit(4);
  const leads = (leadsData ?? []) as Array<{
    id: string;
    address: string | null;
    city: string | null;
    state: string | null;
    lead_id: string | null;
  }>;
  const leadId = leads[0]?.id ?? null;

  // Pull the org address for the from_* snapshot.
  const { data: org } = await sb
    .from("orgs")
    .select(
      "name, address_line1, address_line2, city, region, postal_code, country"
    )
    .eq("id", profile.orgId)
    .single();
  if (!org) return { ok: false, error: "Org settings missing" };

  const daysAgo = (n: number) =>
    new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

  // The 7 sample pieces. Mix of statuses, dates, and one multi-recipient
  // batch. Distributed across leads[0..3] so each lead represents a
  // distinct mail stage:
  //   leads[0] → "Just Sent"        (1 in-transit)
  //   leads[1] → "Delivered"        (1 delivered + 1 certified delivered)
  //   leads[2] → "Needs Attention"  (1 returned)
  //   leads[3] → "Active Campaign"  (batch of 2 + 1 check)
  type Sample = {
    name: string;
    line1: string;
    city: string;
    state: string;
    zip: string;
    status: "processing" | "in_transit" | "delivered" | "returned" | "queued";
    sent_days_ago: number;
    delivered_days_ago?: number;
    returned_days_ago?: number;
    mail_class?: "first_class" | "standard" | "certified";
    include_check?: boolean;
    check_amount_cents?: number;
    tracking_number?: string;
    batch_with?: string;
    lead_idx: number; // which seeded lead this piece attaches to
  };
  const samples: Sample[] = [
    {
      name: `Margaret Chen`,
      line1: "412 Oakwood Drive",
      city: "Austin",
      state: "TX",
      zip: "78745",
      status: "delivered",
      sent_days_ago: 14,
      delivered_days_ago: 9,
      mail_class: "first_class",
      tracking_number: "9400111899223344556677",
      lead_idx: 1,
    },
    {
      name: `David Rodriguez`,
      line1: "78 Pinecrest Avenue",
      city: "Houston",
      state: "TX",
      zip: "77019",
      status: "delivered",
      sent_days_ago: 11,
      delivered_days_ago: 7,
      mail_class: "certified",
      tracking_number: "9400111899223344556712",
      lead_idx: 1,
    },
    {
      name: `Patricia Williams`,
      line1: "1023 Heritage Lane",
      city: "Dallas",
      state: "TX",
      zip: "75204",
      status: "in_transit",
      sent_days_ago: 3,
      mail_class: "first_class",
      tracking_number: "9400111899223344556728",
      lead_idx: 0,
    },
    {
      name: `James O'Brien`,
      line1: "245 Magnolia Court",
      city: "San Antonio",
      state: "TX",
      zip: "78216",
      status: "returned",
      sent_days_ago: 18,
      returned_days_ago: 5,
      mail_class: "first_class",
      tracking_number: "9400111899223344556735",
      lead_idx: 2,
    },
    {
      // Sent 1 day ago — realistic lifecycle puts this still at the
      // print plant (processing), since Lob typically takes ~24h to
      // hand off to USPS. No tracking_number yet (that lands on the
      // .mailed webhook event when the piece actually leaves).
      name: `Linda Foster (batch)`,
      line1: "5511 Westbrook Way",
      city: "Fort Worth",
      state: "TX",
      zip: "76107",
      status: "processing",
      sent_days_ago: 1,
      mail_class: "first_class",
      batch_with: "robert-batch",
      lead_idx: 3,
    },
    {
      name: `Robert Foster (batch)`,
      line1: "5511 Westbrook Way",
      city: "Fort Worth",
      state: "TX",
      zip: "76107",
      status: "processing",
      sent_days_ago: 1,
      mail_class: "first_class",
      batch_with: "robert-batch",
      lead_idx: 3,
    },
    {
      name: `Susan Park (check)`,
      line1: "918 Cedar Springs Rd",
      city: "Austin",
      state: "TX",
      zip: "78704",
      status: "in_transit",
      sent_days_ago: 5,
      mail_class: "first_class",
      include_check: true,
      check_amount_cents: 482500,
      tracking_number: "9400111899223344556766",
      lead_idx: 3,
    },
  ];

  // Group by batch_with key so siblings share a batch_id.
  const batchKeyToId = new Map<string, string>();
  const rows = samples.map((s) => {
    const batchKey = s.batch_with ?? `solo-${randomUUID()}`;
    let batchId = batchKeyToId.get(batchKey);
    if (!batchId) {
      batchId = randomUUID();
      batchKeyToId.set(batchKey, batchId);
    }
    const attachedLeadId = leads[s.lead_idx]?.id ?? leadId;
    return {
      id: randomUUID(),
      org_id: profile.orgId,
      batch_id: batchId,
      lead_id: attachedLeadId,
      recipient_name: s.name,
      recipient_address_line1: s.line1,
      recipient_city: s.city,
      recipient_state: s.state,
      recipient_postal_code: s.zip,
      recipient_country: "US",
      from_name: (org.name as string | null) ?? "Next Surplus",
      from_address_line1: (org.address_line1 as string | null) ?? "100 Main St",
      from_address_line2: (org.address_line2 as string | null) ?? null,
      from_city: (org.city as string | null) ?? "Austin",
      from_state: (org.region as string | null) ?? "TX",
      from_postal_code: (org.postal_code as string | null) ?? "78701",
      from_country: (org.country as string | null) ?? "US",
      body_html: SAMPLE_BODY_HTML,
      mail_class: s.mail_class ?? "first_class",
      include_check: s.include_check ?? false,
      check_amount_cents: s.check_amount_cents ?? null,
      check_memo: s.include_check ? "Surplus Recovery" : null,
      provider: "lob",
      provider_id: `sample_${randomUUID().slice(0, 8)}`,
      tracking_number: s.tracking_number ?? null,
      tracking_url: s.tracking_number
        ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${s.tracking_number}`
        : null,
      status: s.status,
      cost_cents: s.include_check ? 144 : 71,
      sent_at: daysAgo(s.sent_days_ago),
      delivered_at: s.delivered_days_ago != null ? daysAgo(s.delivered_days_ago) : null,
      returned_at: s.returned_days_ago != null ? daysAgo(s.returned_days_ago) : null,
      created_by: profile.id,
      created_at: daysAgo(s.sent_days_ago),
    };
  });

  const { error } = await admin.from("mail_jobs").insert(rows);
  if (error) return { ok: false, error: error.message };

  // Drop matching activity rows on each attached lead so the Activity
  // tab + Overview recent-activity card show them too.
  const activityRows = rows
    .filter((r) => r.lead_id)
    .map((r) => ({
      lead_id: r.lead_id as string,
      user_id: profile.id,
      activity_type:
        r.status === "delivered"
          ? "mail_delivered"
          : r.status === "returned"
            ? "mail_returned"
            : "mail_sent",
      payload: {
        mail_job_id: r.id,
        batch_id: r.batch_id,
        recipient_name: r.recipient_name,
        recipient_address: `${r.recipient_address_line1}, ${r.recipient_city}, ${r.recipient_state} ${r.recipient_postal_code}`,
        mail_class: r.mail_class,
        include_check: r.include_check,
        check_amount_cents: r.check_amount_cents,
        tracking_url: r.tracking_url,
        tracking_number: r.tracking_number,
        provider: r.provider,
      },
      created_at: r.sent_at,
    }));
  if (activityRows.length > 0) {
    await admin.from("activities").insert(activityRows);
  }

  // Build the stage list so the harness UI can show clickable URLs to
  // each lead, labeled with what state they demonstrate.
  const STAGE_NAMES = [
    "Just Sent — 1 in transit",
    "Delivered — successful contact",
    "Needs Attention — returned piece",
    "Active Campaign — batch + check",
  ];
  const stages: SeededLeadStage[] = leads.slice(0, 4).map((l, idx) => {
    const pieces = rows.filter((r) => r.lead_id === l.id);
    return {
      lead_id: l.id,
      label:
        (l.lead_id as string | null) ??
        [l.address, l.city, l.state].filter(Boolean).join(", ") ??
        l.id,
      stage_name: STAGE_NAMES[idx] ?? "Sample",
      piece_count: pieces.length,
    };
  });

  revalidatePath("/mail");
  for (const stage of stages) {
    revalidatePath(`/leads/${stage.lead_id}`);
  }
  return { ok: true, inserted: rows.length, lead_id: leadId, stages };
}

function emptyResult(
  scenarioId: ScenarioId,
  expected: "pass" | "block",
  error: string
): RunResult {
  return {
    scenarioId,
    ok: false,
    expected,
    matched: false,
    durationMs: 0,
    send: { ok: false, error },
    jobs: [],
    activities: [],
    notifications: [],
    notes: [error],
  };
}
