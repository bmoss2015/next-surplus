import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { fetchMailDashboard, type MailStatusFilter } from "@/lib/mail/fetch";
import { MailSectionTabs } from "./_components/MailSectionTabs";
import { MailListClient } from "./_components/MailListClient";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  status?: string;
  lead?: string;
}>;

function parseStatus(s: string | undefined): MailStatusFilter {
  if (s === "in_flight" || s === "delivered" || s === "returned" || s === "failed") {
    return s;
  }
  return "all";
}

export default async function MailDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");
  const params = await searchParams;
  const status = parseStatus(params.status);
  const search = (params.q ?? "").trim() || null;
  const leadId = (params.lead ?? "").trim() || null;
  const { stats, rows } = await fetchMailDashboard({
    windowDays: 30,
    search,
    status,
    leadId,
  });

  return (
    <div className="px-7 py-6">
      <MailSectionTabs />
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
            Sent Mail
          </h1>
          <div className="mt-1 text-[13px] text-gray-500">
            Status of physical mail sent through the portal. Returned items
            appear first so you can fix the address and resend.
          </div>
        </div>
      </div>

      <MailListClient
        initialRows={rows}
        initialStats={stats}
        initialSearch={search ?? ""}
        initialStatus={status}
        initialLeadId={leadId}
      />
    </div>
  );
}
