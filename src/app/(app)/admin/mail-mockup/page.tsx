import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Mockup index. Lead section winner = V2. Main /mail still being
// iterated — V6 / V7 / V8 are the new candidates after Bree rejected
// V1 / V3 / V4-main / V5.

export default async function MailMockupIndexPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  const leadVariant = {
    slug: "v2",
    label: "V2 (Lead section) — winner",
    blurb:
      "Bree picked the V2 lead section. Updated this round: compose row is half-height, header reads \"Sent Mail\", button reads \"Send Mail\". Scroll to the bottom of the V2 page to see the lead view.",
  };

  const mainVariants = [
    {
      slug: "v6",
      label: "V6 — KPI Dashboard + status lists",
      blurb:
        "The report-look aesthetic Bree liked: big KPI tiles + horizontal pipeline bar, now wired to operational data (In Transit / Sent Today / Delivered This Week / Returned This Month). Status-grouped lists below for the working surface. No Action Required block (lead-only per agreement).",
    },
    {
      slug: "v9",
      label: "V9 — KPI Dashboard + activity stream",
      blurb:
        "Same KPI + pipeline hero, then the body is a chronological activity stream of mail events instead of status lists. Each row is a thing that happened: \"Margaret Chen's letter reached Austin 20 min ago.\" Reads like a Stripe events log. Same visual language as V6.",
    },
    {
      slug: "v10",
      label: "V10 — KPI Dashboard + horizontal swimlanes",
      blurb:
        "Same KPI + pipeline hero, then three horizontal swimlanes — one row per status — each a 4-up grid of compact piece cards. Different from V3's vertical kanban; scans left-to-right per lane. More gallery + dashboard than dashboard + list.",
    },
    {
      slug: "v7",
      label: "V7 — Stripe-style List (alternative)",
      blurb:
        "Dense refined transaction list, kept as an alternative if the KPI-dashboard hero feels like too much. Different aesthetic from V6/V9/V10.",
    },
    {
      slug: "v8",
      label: "V8 — Inbox Zero (alternative)",
      blurb:
        "Minimal view; only loud thing is returned pieces. Doesn't fit the report-look direction Bree liked; kept for reference.",
    },
  ];

  const rejected = [
    { slug: "v1", label: "V1 · Constellation", note: "Too sporadic for mail data" },
    { slug: "v3", label: "V3 · Workspace Kanban", note: "Same as every CRM" },
    { slug: "v4", label: "V4 · Split-Pane Inbox", note: "Main view too mailbox-y" },
    { slug: "v5", label: "V5 · Timeline / Flow", note: "Charts aren't appropriate for this" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-7 py-9">
      <div className="mx-auto max-w-3xl">
        <h1 className="m-0 text-[28px] font-semibold tracking-tight text-ink">
          Mail Redesign Mockups
        </h1>
        <p className="mt-2 text-[14px] text-gray-600">
          Lead section is settled. Main /mail is still being iterated.
          V6 / V7 / V8 are the new candidates after V1, V3, V4-main,
          and V5 were rejected.
        </p>

        {/* Lead winner */}
        <div className="mt-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0d4b3a]">
            Lead Mail Tab
          </div>
          <Link
            href={`/admin/mail-mockup/${leadVariant.slug}`}
            className="mt-3 block rounded-2xl border border-[#0d4b3a]/25 bg-white p-6 transition-shadow hover:shadow-card cursor-pointer"
          >
            <div className="text-[16px] font-semibold text-ink">
              {leadVariant.label}
            </div>
            <div className="mt-2 text-[13px] text-gray-600">
              {leadVariant.blurb}
            </div>
            <div className="mt-3 text-[12px] font-medium text-[#0d4b3a]">
              Open V2 →
            </div>
          </Link>
        </div>

        {/* Main candidates */}
        <div className="mt-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Main /Mail — Three Candidates
          </div>
          <div className="mt-3 space-y-3">
            {mainVariants.map((v) => (
              <Link
                key={v.slug}
                href={`/admin/mail-mockup/${v.slug}`}
                className="block rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-card cursor-pointer"
              >
                <div className="text-[16px] font-semibold text-ink">
                  {v.label}
                </div>
                <div className="mt-2 text-[13px] text-gray-600">{v.blurb}</div>
                <div className="mt-3 text-[12px] font-medium text-petrol-600">
                  Open mockup →
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Rejected — kept for reference */}
        <div className="mt-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Rejected (kept for reference)
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {rejected.map((v) => (
              <Link
                key={v.slug}
                href={`/admin/mail-mockup/${v.slug}`}
                className="block rounded-xl border border-gray-200 bg-white px-4 py-3 cursor-pointer hover:bg-gray-50"
              >
                <div className="text-[13px] font-semibold text-gray-500">
                  {v.label}
                </div>
                <div className="mt-[2px] text-[11.5px] text-gray-400">
                  {v.note}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
