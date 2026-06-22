import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type FeedbackStatus =
  | "new"
  | "triaged"
  | "planned"
  | "shipped"
  | "wont_do";

function formatDate(iso: string | null): string {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function planLabel(tier: string | null): string {
  if (!tier) return "Unknown";
  if (tier === "founder") return "Founder (Locked)";
  if (tier === "beta_founder") return "Beta Founder";
  if (tier === "standard") return "Standard";
  return tier;
}

export default async function CustomerSummaryPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.canViewFeedback) redirect("/");

  const { orgId } = await params;
  const admin = createServiceClient();

  const { data: org } = await admin
    .from("orgs")
    .select("id, name, created_at, plan_tier")
    .eq("id", orgId)
    .maybeSingle();

  if (!org) {
    return (
      <div className="p-8">
        <Link
          href="/admin/feedback"
          className="text-[13px] text-gray-500 hover:text-ink"
        >
          {"← Back to Feedback"}
        </Link>
        <p className="mt-6 text-[14px] text-danger">Org not found.</p>
      </div>
    );
  }

  const [{ count: userCount }, { data: feedbackRows }] = await Promise.all([
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId),
    admin
      .from("feedback")
      .select("status, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
  ]);

  const feedbackByStatus = {
    new: 0,
    triaged: 0,
    planned: 0,
    shipped: 0,
    wont_do: 0,
  } as Record<FeedbackStatus, number>;
  for (const r of (feedbackRows ?? []) as Array<{
    status: FeedbackStatus;
    created_at: string;
  }>) {
    feedbackByStatus[r.status] = (feedbackByStatus[r.status] ?? 0) + 1;
  }
  const totalFeedback = (feedbackRows ?? []).length;
  const lastFeedbackAt =
    (feedbackRows ?? [])[0]?.created_at ?? null;

  return (
    <div className="mx-auto max-w-3xl p-8">
      <Link
        href="/admin/feedback"
        className="text-[13px] text-gray-500 hover:text-ink"
      >
        {"← Back to Feedback"}
      </Link>

      <div className="mt-6 rounded-md border border-gray-200 bg-white p-6">
        <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
          Customer Summary
        </div>
        <h1 className="mt-2 text-[24px] font-semibold text-ink">{org.name}</h1>
        <p className="mt-1 text-[12.5px] text-gray-500">Org ID: {org.id}</p>

        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Metric label="Plan" value={planLabel(org.plan_tier as string | null)} />
          <Metric label="Signed Up" value={formatDate(org.created_at as string | null)} />
          <Metric label="Users" value={String(userCount ?? 0)} />
          <Metric label="Total Feedback" value={String(totalFeedback)} />
        </div>
      </div>

      <div className="mt-6 rounded-md border border-gray-200 bg-white p-6">
        <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
          Feedback By Status
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Metric label="New" value={String(feedbackByStatus.new)} />
          <Metric label="Triaged" value={String(feedbackByStatus.triaged)} />
          <Metric label="Planned" value={String(feedbackByStatus.planned)} />
          <Metric label="Shipped" value={String(feedbackByStatus.shipped)} />
          <Metric label="Won't Do" value={String(feedbackByStatus.wont_do)} />
        </div>
        {lastFeedbackAt && (
          <p className="mt-4 text-[12.5px] text-gray-500">
            Last submission: {formatDate(lastFeedbackAt)}
          </p>
        )}
      </div>

      <p className="mt-6 text-[12px] text-gray-500">
        This view shows org metadata only. Customer CRM data (leads, contacts,
        mail, inbox) is intentionally not exposed here.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-[15px] font-medium text-ink">{value}</div>
    </div>
  );
}
