import { redirect } from "next/navigation";
import Link from "next/link";
import { IconExternalLink } from "@tabler/icons-react";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { fetchMailDashboard, type MailJobListRow } from "@/lib/mail/fetch";
import { MailSectionTabs } from "./_components/MailSectionTabs";

export const dynamic = "force-dynamic";

const MAIL_CLASS_LABEL: Record<MailJobListRow["mail_class"], string> = {
  standard: "Standard",
  first_class: "First Class",
  certified: "Certified",
};

const STATUS_LABEL: Record<MailJobListRow["status"], string> = {
  queued: "Queued",
  in_transit: "In Transit",
  delivered: "Delivered",
  returned: "Returned",
  failed: "Failed",
};

const STATUS_CLASS: Record<MailJobListRow["status"], string> = {
  queued: "bg-gray-100 text-gray-600",
  in_transit: "bg-petrol-50 text-petrol-700",
  delivered: "bg-success/10 text-success",
  returned: "bg-danger-bg text-danger",
  failed: "bg-danger-bg text-danger",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function MailDashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");
  const { stats, rows } = await fetchMailDashboard({ windowDays: 30 });

  const statCards = [
    { label: "Sent", value: stats.sent, sub: "Last 30 days" },
    { label: "In Transit", value: stats.in_transit, sub: "Pieces moving" },
    { label: "Delivered", value: stats.delivered, sub: "Reached recipient" },
    { label: "Returned", value: stats.returned, sub: "Re-verify address", warn: true },
  ];

  return (
    <div className="px-7 py-6">
      <MailSectionTabs />
      <div className="mb-[22px]">
        <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
          Sent Mail
        </h1>
        <div className="mt-1 text-[13px] text-gray-500">
          Status of physical mail sent through the portal. Returned items
          appear first so you can re-verify addresses and resend.
        </div>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-lg border bg-surface p-4 shadow-card ${
              card.warn && card.value > 0
                ? "border-danger"
                : "border-gray-200"
            }`}
          >
            <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              {card.label}
            </div>
            <div
              className={`mt-1 text-[22px] font-medium ${
                card.warn && card.value > 0 ? "text-danger" : "text-ink"
              }`}
            >
              {card.value}
            </div>
            <div className="text-[11px] text-gray-500">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-surface shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Recipient
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Mail Class
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Status
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Sent
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Delivered
              </th>
              <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Tracking
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-[12px] text-gray-500"
                >
                  No mail sent yet. Open a lead and click Send Mail next to a
                  mailing address to get started.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-150 last:border-b-0"
                >
                  <td className="px-4 py-2 text-[13px]">
                    {row.lead_id ? (
                      <Link
                        href={`/leads/${row.lead_id}`}
                        className="cursor-pointer text-ink hover:text-petrol-500"
                      >
                        <div className="font-medium">{row.recipient_name}</div>
                        <div className="text-[11px] text-gray-500">
                          {row.recipient_address_line1}, {row.recipient_city},{" "}
                          {row.recipient_state} {row.recipient_postal_code}
                          {row.include_check && row.check_amount_cents != null
                            ? ` · check $${(row.check_amount_cents / 100).toFixed(2)}`
                            : ""}
                        </div>
                      </Link>
                    ) : (
                      <div>
                        <div className="font-medium text-ink">
                          {row.recipient_name}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {row.recipient_address_line1}, {row.recipient_city},{" "}
                          {row.recipient_state} {row.recipient_postal_code}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-[12px] text-ink">
                    {MAIL_CLASS_LABEL[row.mail_class]}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-[2px] text-[10px] font-medium ${STATUS_CLASS[row.status]}`}
                    >
                      {STATUS_LABEL[row.status]}
                    </span>
                    {row.status === "failed" && row.error_message && (
                      <div className="mt-[2px] text-[10px] text-danger">
                        {row.error_message}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-[12px] text-gray-600">
                    {fmtDate(row.sent_at)}
                  </td>
                  <td className="px-4 py-2 text-[12px] text-gray-600">
                    {fmtDate(row.delivered_at ?? row.returned_at)}
                  </td>
                  <td className="px-4 py-2 text-right text-[12px]">
                    {row.tracking_url ? (
                      <a
                        href={row.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex cursor-pointer items-center gap-1 text-petrol-500 hover:text-petrol-700"
                      >
                        Track
                        <IconExternalLink size={11} stroke={1.75} />
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
