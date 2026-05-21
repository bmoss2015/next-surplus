// Settings clone · Phase C.5 — Billing wired to real data (display).
//
// One add-on right now (Phone Validation) — usage meter with monthly cap.
// Phase D adds the Backfill button from BackfillButton.tsx; for now the
// admin tools section stays disabled.

export type PhoneValidationUsage = {
  used: number;
  cap: number;
  period_month: string;
};

export function BillingSection({
  phoneUsage,
}: {
  phoneUsage: PhoneValidationUsage;
}) {
  const pct =
    phoneUsage.cap > 0
      ? Math.min(100, Math.round((phoneUsage.used / phoneUsage.cap) * 100))
      : 0;
  const monthLabel = new Date(
    phoneUsage.period_month + "T00:00:00Z"
  ).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

  // Bar color per the mockup pattern — emerald until 80%, deepens to ink at
  // 95%+, switches to danger past 100%. No yellow.
  const barColor =
    pct >= 100
      ? "var(--danger)"
      : pct >= 80
        ? "var(--brand-deep)"
        : "var(--brand)";

  return (
    <section id="panel-billing" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Workspace</a>
        <i className="icon icon-chevron-right" />
        <span>Billing</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Billing &amp; Add-ons</h1>
          <p className="section-desc">
            Usage-metered features for {monthLabel}.
          </p>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-head">
          <div>
            <div className="settings-card-eyebrow">Add-On</div>
            <div className="settings-card-title">Phone Validation</div>
            <div className="settings-card-desc">
              Pre-screens imported and manually-added numbers so dead lines
              stop reaching the call queue.
            </div>
          </div>
          <div className="settings-card-control">
            <div style={{ textAlign: "right" }}>
              <div
                className="text-[13px] font-medium tabular"
                style={{ color: "var(--ink)" }}
              >
                {phoneUsage.used.toLocaleString()} /{" "}
                {phoneUsage.cap.toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--text-3)",
                  marginTop: 2,
                }}
              >
                {pct}% used
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: "0 24px 22px" }}>
          <div
            className="addon-meter-bar"
            style={{
              height: 6,
              background: "var(--gray-150, #f1f3f5)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              className="addon-meter-bar-fill"
              style={{
                width: `${pct}%`,
                height: "100%",
                background: barColor,
                transition: "width 0.3s ease",
              }}
            />
          </div>
          {pct >= 100 && (
            <div
              className="mt-2"
              style={{ color: "var(--danger)", fontSize: 11 }}
            >
              Monthly quota reached. New phones land as &lsquo;Not
              Verified&rsquo; until the quota resets.
            </div>
          )}
          {pct >= 80 && pct < 100 && (
            <div
              className="mt-2"
              style={{ color: "var(--text-2)", fontSize: 11 }}
            >
              Approaching the monthly cap. Phones will keep validating until{" "}
              {phoneUsage.cap.toLocaleString()}.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
