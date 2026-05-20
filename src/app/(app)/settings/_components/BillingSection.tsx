import { getValidationUsage } from "@/lib/phone-validate";
import { BackfillButton } from "./BackfillButton";

// Settings redesign — Billing panel.
//
// Functional: Phone Validation usage meter (Veriphone), via getValidationUsage
// and BackfillButton. This is the only currently-wired billing surface.
//
// Layout-only (not wired to a payment provider yet): plan-hero, payment
// method, billing email, invoice history. These are visual scaffolding so the
// page looks like the final design — Stripe integration lands in a follow-up.
export async function BillingSection({ orgId }: { orgId: string }) {
  const phone = await getValidationUsage(orgId);
  const pct = phone.cap > 0 ? Math.min(100, Math.round((phone.used / phone.cap) * 100)) : 0;
  const monthLabel = new Date(phone.period_month + "T00:00:00Z").toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  // Brand color for the meter unless we're hitting the danger zone.
  const barColor = pct >= 95 ? "#b91c1c" : "#0d4b3a";

  return (
    <div className="col-span-2 rounded-lg border border-gray-200 bg-surface p-6 shadow-card">
      <h2 className="section-subheader mb-0">Billing</h2>

      {/* Plan hero (layout only — no Stripe yet) */}
      <div className="plan-hero" style={{ marginTop: 16 }}>
        <div className="flex-1 min-w-0">
          <div className="plan-hero-eyebrow">Current Plan</div>
          <div className="plan-hero-name">Team</div>
          <div className="plan-hero-line">
            Unlimited leads · all features included. Add-ons billed monthly based on usage.
          </div>
        </div>
        <div
          className="flex-shrink-0 flex flex-col items-end justify-center"
          style={{ paddingLeft: 24, borderLeft: "1px solid rgba(255,255,255,0.18)" }}
        >
          <div className="plan-hero-price">
            $197<span className="plan-hero-price-suffix">/mo</span>
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 11.5,
              color: "rgba(255,255,255,0.62)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Plan management coming soon
          </div>
        </div>
      </div>

      <div className="pref-section-h">Add-Ons · Usage This Month ({monthLabel})</div>

      {/* Phone Validation — real usage meter from getValidationUsage */}
      <div className="addon-meter">
        <div className="addon-meter-head">
          <div className="min-w-0 flex-1">
            <div className="addon-meter-title">Phone Validation</div>
            <div className="addon-meter-desc">
              Pre-screens imported and manually added numbers via Veriphone so dead lines stop reaching the call queue.
            </div>
          </div>
          <div>
            <div className="addon-meter-num">
              <span className="tabular-nums">{phone.used.toLocaleString()}</span> /{" "}
              <span className="tabular-nums">{phone.cap.toLocaleString()}</span>
            </div>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#9298a3",
                marginTop: 2,
                textAlign: "right",
              }}
            >
              {pct}% Used
            </div>
          </div>
        </div>
        <div className="addon-meter-bar">
          <div
            className="addon-meter-bar-fill"
            style={{ width: `${pct}%`, background: barColor }}
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
        <div className="addon-meter-action">
          <BackfillButton />
        </div>
      </div>

      <ComingSoonAddon
        title="Skip Tracing Credits"
        desc="Pull current address, phone, and relatives on any lead."
      />
      <ComingSoonAddon
        title="Bulk Mail Discount"
        desc="Drops Click2Mail rates on letters and certified mail at high volume."
      />
      <ComingSoonAddon
        title="Priority Support"
        desc="Direct Slack channel with our team. Same-day response on weekdays."
      />

      <div className="pref-section-h">Payment Method</div>
      <div className="pref-row">
        <div className="min-w-0 flex-1 flex items-center gap-3">
          <span
            className="rounded-md text-white font-bold"
            style={{
              background: "#1a1f71",
              width: 44,
              height: 28,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              letterSpacing: "0.06em",
              flexShrink: 0,
            }}
          >
            VISA
          </span>
          <div>
            <div className="pref-row-title">No card on file</div>
            <div className="pref-row-desc">Card management lands once Stripe is wired up.</div>
          </div>
        </div>
        <button
          type="button"
          disabled
          className="rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-[12.5px] font-medium text-gray-500"
          title="Coming soon"
        >
          Add Card
        </button>
      </div>

      <div className="pref-section-h">Invoice History</div>
      <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-[12px] text-gray-500">
        No invoices yet. Invoice history appears here once your first billing cycle completes.
      </div>
    </div>
  );
}

function ComingSoonAddon({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="pref-row">
      <div className="min-w-0 flex-1">
        <div className="pref-row-title">{title}</div>
        <div className="pref-row-desc">{desc}</div>
      </div>
      <span
        className="rounded-full border border-gray-200 px-3 py-[3px] text-[10.5px] font-medium tracking-wider text-gray-400"
        style={{ letterSpacing: "0.04em" }}
      >
        Coming Soon
      </span>
    </div>
  );
}
