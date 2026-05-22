import Link from "next/link";
import { IconArrowRight, IconMail } from "@tabler/icons-react";
import { fetchMailDashboard } from "@/lib/mail/fetch";
import { MailCardClient } from "./MailCardClient";

// Compact mail card for the lead Overview tab. Shows the 5 most recent
// pieces for this lead so an operator can answer "what's in flight to
// this person?" without leaving Overview. Anything older drops to a
// "View All" link that opens /mail filtered by lead.

export async function MailCard({ leadId }: { leadId: string }) {
  const { rows } = await fetchMailDashboard({
    leadId,
    limit: 5,
    windowDays: 365,
  });

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="section-subheader">Mail</h3>
        <Link
          href={`/mail?lead=${leadId}`}
          className="inline-flex items-center gap-1 text-[11.5px] font-medium text-petrol-500 hover:text-petrol-700"
        >
          View All
          <IconArrowRight size={12} stroke={2} />
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-[12px] text-gray-500">
          <IconMail size={16} stroke={1.5} className="text-gray-400" />
          No Mail Sent To This Lead Yet
        </div>
      ) : (
        <MailCardClient rows={rows} />
      )}
    </div>
  );
}
