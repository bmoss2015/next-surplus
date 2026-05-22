import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { fetchMailDashboard } from "@/lib/mail/fetch";
import { MailSectionTabs } from "./_components/MailSectionTabs";
import { MailDashboardV6 } from "./_components/MailDashboardV6";

export const dynamic = "force-dynamic";

export default async function MailDashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");
  const { stats, rows } = await fetchMailDashboard({ windowDays: 30 });

  return (
    <div className="px-7 py-6">
      <MailSectionTabs />
      <div className="mb-6">
        <h1 className="m-0 text-[28px] font-semibold tracking-tight text-ink">
          Sent Mail
        </h1>
        <div className="mt-1 text-[12.5px] text-gray-500">
          Last 30 days. Older pieces are archived under each lead.
        </div>
      </div>
      <MailDashboardV6 rows={rows} stats={stats} />
    </div>
  );
}
