import { getValidationUsage } from "@/lib/phone-validate";

// Billing & Add-ons — usage meters for any feature whose cost scales with use.
// Right now there's one add-on (Phone Validation via Veriphone); future add-ons
// (mail enrichment, AI summaries, etc.) plug into the same `org_addon_usage`
// table and render here.
export async function BillingSection({ orgId }: { orgId: string }) {
  const phone = await getValidationUsage(orgId);
  const pct = phone.cap > 0 ? Math.min(100, Math.round((phone.used / phone.cap) * 100)) : 0;
  const monthLabel = new Date(phone.period_month + "T00:00:00Z").toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  // Color thresholds — no yellow per house style.
  const barColor =
    pct >= 100
      ? "bg-danger"
      : pct >= 95
        ? "bg-danger"
        : pct >= 80
          ? "bg-petrol-700"
          : "bg-petrol-500";

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="section-subheader">Billing &amp; Add-ons</h2>
          <div className="mt-1 text-[12px] font-normal text-[#94a3b8]">
            Usage-metered features for {monthLabel}.
          </div>
        </div>
      </div>

      <div className="rounded-md border border-gray-150 bg-gray-50 p-3">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="text-[13px] font-medium text-ink">Phone Validation</div>
            <div className="mt-0.5 text-[11px] text-gray-500">
              Pre-screens imported and manually added numbers via Veriphone so dead lines stop reaching the call queue.
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[13px] font-medium text-ink tabular-nums">
              {phone.used.toLocaleString()} / {phone.cap.toLocaleString()}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-gray-500">{pct}% used</div>
          </div>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-150">
          <div
            className={`h-full ${barColor} transition-[width] duration-300`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct >= 100 && (
          <div className="mt-2 text-[11px] text-danger">
            Monthly quota reached. New phones land as &lsquo;Not Verified&rsquo; until the quota resets or the cap is raised.
          </div>
        )}
        {pct >= 80 && pct < 100 && (
          <div className="mt-2 text-[11px] text-gray-600">
            Approaching the monthly cap. Phones will keep validating until {phone.cap.toLocaleString()}.
          </div>
        )}
      </div>
    </div>
  );
}
