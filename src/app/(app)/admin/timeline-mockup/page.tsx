import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import type {
  ActivityFullRow,
  DocumentRow,
} from "@/lib/leads/fetch-tab-data";
import { ActivityTabClient } from "@/app/(app)/leads/[id]/_components/ActivityTabClient";

// Mockup page for the adaptive lead-detail timeline. Renders the same
// component used on real lead pages, but feeds it synthetic activity data at
// three densities so we can preview all three layout modes side by side.

export default async function TimelineMockupPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  const documents: DocumentRow[] = [];
  const leadSource = "Manual Entry";

  const sparseRows = buildMockRows(5);
  const mediumRows = buildMockRows(12);
  const denseRows = buildMockRows(20);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 py-8">
      <header>
        <h1 className="text-[20px] font-semibold text-ink">
          Adaptive Lead Timeline — Mockup
        </h1>
        <p className="mt-1 text-[12.5px] text-gray-500">
          Three Density Modes Rendered Side By Side Using Synthetic Activity
          Data. Mode Is Chosen From Row Count Alone.
        </p>
      </header>

      <Section
        title="Mode 1 — List (≤8 Events)"
        blurb="Today's Vertical Timeline. No Visual Change Below Eight Events."
      >
        <ActivityTabClient
          rows={sparseRows}
          leadSource={leadSource}
          documents={documents}
        />
      </Section>

      <Section
        title="Mode 2 — Centered (9–15 Events)"
        blurb="Same Rows, Fixed-Height Scroller, Auto-Centered On Mount So The Middle Event Is In View."
      >
        <ActivityTabClient
          rows={mediumRows}
          leadSource={leadSource}
          documents={documents}
        />
      </Section>

      <Section
        title="Mode 3 — Headline + Rail (16+ Events)"
        blurb="Top Card Surfaces The Most Recent Event With Full Actions. Earlier Events Collapse Into A Compact Click-To-Expand Rail."
      >
        <ActivityTabClient
          rows={denseRows}
          leadSource={leadSource}
          documents={documents}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        <p className="mt-[2px] text-[11.5px] text-gray-500">{blurb}</p>
      </div>
      {children}
    </section>
  );
}

// Synthetic activity feed. Newest-first to match fetch order. Each row gets a
// distinct created_at so relative-time stamps spread out realistically.
function buildMockRows(count: number): ActivityFullRow[] {
  const now = Date.now();
  const types: Array<{ type: string; payload: Record<string, unknown> }> = [
    { type: "lead_created", payload: {} },
    {
      type: "stage_change",
      payload: { from: "new_leads", to: "ready_to_call" },
    },
    { type: "note", payload: { body: "Spoke with cousin, owner moved to Houston" } },
    {
      type: "document_uploaded",
      payload: { filename: "Deed Of Trust.pdf" },
    },
    {
      type: "mail_sent",
      payload: {
        recipient_name: "Margaret Chen",
        mail_class: "first_class",
        mail_job_id: "mock-job-1",
      },
    },
    {
      type: "mail_delivered",
      payload: { recipient_name: "Margaret Chen", mail_job_id: "mock-job-1" },
    },
    {
      type: "stage_change",
      payload: { from: "ready_to_call", to: "in_contact" },
    },
    { type: "note", payload: { body: "Left voicemail at primary number" } },
    {
      type: "assignment_change",
      payload: { full_name: "Bree Moss" },
    },
    {
      type: "task_created",
      payload: { title: "Follow Up On Mail Delivery" },
    },
    {
      type: "mail_returned",
      payload: { recipient_name: "James Chen", mail_job_id: "mock-job-2" },
    },
    {
      type: "verification_checked",
      payload: {},
    },
    {
      type: "research_update",
      payload: { text: "Confirmed Surplus Of $42,300 With Court Clerk" },
    },
    {
      type: "task_completed",
      payload: { title: "Verify Property Address" },
    },
    {
      type: "stage_change",
      payload: { from: "in_contact", to: "agreement_sent" },
    },
    { type: "note", payload: { body: "Owner asked to schedule a call Friday" } },
    {
      type: "document_uploaded",
      payload: { filename: "Signed Engagement Letter.pdf" },
    },
    {
      type: "mail_sent",
      payload: {
        recipient_name: "Patricia Cole",
        mail_class: "certified",
        mail_job_id: "mock-job-3",
        include_check: true,
        check_amount_cents: 25000,
      },
    },
    {
      type: "stage_change",
      payload: { from: "agreement_sent", to: "claim_filed" },
    },
    { type: "note", payload: { body: "Filed motion with court clerk this morning" } },
  ];

  const rows: ActivityFullRow[] = [];
  for (let i = 0; i < count; i += 1) {
    const template = types[i % types.length]!;
    const createdAt = new Date(now - i * 3 * 3600 * 1000).toISOString();
    rows.push({
      id: `mock-${i}`,
      activity_type: template.type,
      payload: template.payload,
      created_at: createdAt,
      user_id: i % 4 === 0 ? null : "mock-user",
      actor_first_name: i % 4 === 0 ? null : "Bree",
    });
  }
  return rows;
}
