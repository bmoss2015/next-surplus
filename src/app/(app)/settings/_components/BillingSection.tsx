"use client";

// Billing — plan, payment method, invoice history.

export function BillingSection({
  invoiceEmail,
}: {
  invoiceEmail: string;
}) {
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
          <h1 className="section-h1">Billing</h1>
          <p className="section-desc">
            Your plan, payment method, and invoice history.
          </p>
        </div>
      </div>

      <div className="plan-hero">
        <div className="plan-hero-left">
          <div className="plan-hero-eyebrow">Current Plan</div>
          <div className="plan-hero-name">Team</div>
          <div className="plan-hero-line">
            Unlimited leads · 10 seats · all features included
          </div>
        </div>
        <div className="plan-hero-right">
          <div className="plan-hero-price">
            $197
            <span className="plan-hero-price-suffix">/mo</span>
          </div>
          <div className="plan-hero-next">Next charge Jun 12, 2026</div>
          <button
            type="button"
            className="btn btn-outline btn-sm mt-2"
            disabled
            title="Stripe billing portal wires in Phase D"
          >
            Change Plan
          </button>
        </div>
      </div>

      <h2 className="billing-section-h">Payment Method</h2>
      <div className="billing-card">
        <div className="billing-card-desc" style={{ marginBottom: 16 }}>
          Charged monthly for your Next Surplus subscription. Credit or debit
          cards. Outgoing checks pull from <a href="#mail-bank">Bank Accounts</a>{" "}
          instead.
        </div>
        <div className="pref-row">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="card-brand">VISA</div>
            <div>
              <div className="pref-row-title">Visa ending in 4242</div>
              <div className="pref-row-desc">Expires 09 / 2027 · Bree Moss</div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled
            title="Stripe portal wires in Phase D"
          >
            Update Card
          </button>
        </div>
        <div className="pref-row">
          <div className="flex-1 min-w-0">
            <div className="pref-row-title">Send Invoices To</div>
            <div className="pref-row-desc">
              Receipts and renewal notices go here.
            </div>
          </div>
          <input
            className="input pref-row-input"
            type="email"
            defaultValue={invoiceEmail}
            disabled
            title="Save wires in Phase D"
          />
        </div>
      </div>

      <h2 className="billing-section-h">Invoice History</h2>
      <div className="billing-card">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Invoice</th>
              <th>Status</th>
              <th className="num">Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_INVOICES.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.period}</td>
                <td className="mono">{inv.id}</td>
                <td>
                  <span className="cov-status hot">
                    <span className="dot" />
                    Paid {inv.paid}
                  </span>
                </td>
                <td className="num">{inv.amount}</td>
                <td className="action">
                  <button
                    type="button"
                    className="icon-btn"
                    title="Download PDF (wires in Phase D)"
                    disabled
                    style={{ opacity: 0.4 }}
                  >
                    <i className="icon icon-download" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const SAMPLE_INVOICES = [
  { id: "INV-2026-05", period: "May 2026", paid: "May 12", amount: "$197.00" },
  { id: "INV-2026-04", period: "April 2026", paid: "Apr 12", amount: "$197.00" },
  { id: "INV-2026-03", period: "March 2026", paid: "Mar 12", amount: "$197.00" },
];
