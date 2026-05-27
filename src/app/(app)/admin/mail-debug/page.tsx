import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Quick diagnostic page that lists the latest mail_jobs rows with
// their actual database state. Lets us debug "the UI says X but the
// DB says Y" issues without needing direct SQL access. Admin-only.

export const dynamic = "force-dynamic";

export default async function MailDebugPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.isAdmin) redirect("/");

  const admin = createServiceClient();
  const { data: rows } = await admin
    .from("mail_jobs")
    .select(
      "id, recipient_name, batch_id, status, tracking_number, provider, provider_id, rendered_pdf_path, sent_at, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(20);

  const lobKeyPrefix = (process.env.LOB_API_KEY ?? "").slice(0, 5);
  const gotenbergSet = Boolean(process.env.GOTENBERG_URL);
  const webhookSecretSet = Boolean(process.env.LOB_WEBHOOK_SECRET);
  // Server component runs once per request; reading the clock here
  // gives every row the same "now" anchor for age math below.
  /* eslint-disable-next-line react-hooks/purity */
  const nowMs = Date.now();

  return (
    <div className="mx-auto max-w-[1100px] px-8 py-8">
      <h1 className="mb-1 text-[22px] font-semibold text-ink">Mail Debug</h1>
      <p className="mb-6 text-[13px] text-gray-600">
        Latest 20 mail_jobs rows + server-side env state. Use this to
        verify what&apos;s actually in the DB vs what the UI is rendering.
      </p>

      <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-4">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Env state
        </div>
        <div className="text-[13px] text-ink">
          <div>
            LOB_API_KEY:{" "}
            <span className="font-mono">
              {lobKeyPrefix ? `${lobKeyPrefix}…` : "(not set)"}
            </span>
          </div>
          <div>
            GOTENBERG_URL:{" "}
            <span className="font-mono">{gotenbergSet ? "set" : "(not set)"}</span>
          </div>
          <div>
            LOB_WEBHOOK_SECRET:{" "}
            <span className="font-mono">
              {webhookSecretSet ? "set" : "(not set)"}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="w-full text-[12px]">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-[10.5px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-3 py-2 font-medium">Recipient</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Tracking</th>
              <th className="px-3 py-2 font-medium">Provider</th>
              <th className="px-3 py-2 font-medium">PDF cached</th>
              <th className="px-3 py-2 font-medium">Age</th>
              <th className="px-3 py-2 font-medium">Batch</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => {
              const created = (r.created_at as string | null) ?? null;
              const ageSec = created
                ? Math.round((nowMs - new Date(created).getTime()) / 1000)
                : 0;
              const ageLabel =
                ageSec < 60
                  ? `${ageSec}s`
                  : ageSec < 3600
                    ? `${Math.round(ageSec / 60)}m`
                    : `${Math.round(ageSec / 3600)}h`;
              return (
                <tr key={r.id as string} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-3 py-2 text-ink">
                    {r.recipient_name as string}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="rounded px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide"
                      style={
                        r.status === "processing" || r.status === "queued"
                          ? { background: "#f1f3f5", color: "#3a4047" }
                          : r.status === "in_transit"
                            ? { background: "#0a0d14", color: "#fff" }
                            : r.status === "delivered"
                              ? { background: "#ecfdf5", color: "#067647" }
                              : { background: "#fef2f2", color: "#b42318" }
                      }
                    >
                      {r.status as string}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-gray-600">
                    {(r.tracking_number as string | null) ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-gray-600">
                    {r.provider as string}
                  </td>
                  <td className="px-3 py-2 text-[11px]">
                    {r.rendered_pdf_path ? "yes" : "—"}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-gray-600">
                    {ageLabel}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-gray-500">
                    {(r.batch_id as string).slice(0, 8)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!rows || rows.length === 0) && (
          <div className="px-3 py-6 text-center text-[12px] text-gray-500">
            No mail_jobs rows.
          </div>
        )}
      </div>
    </div>
  );
}
