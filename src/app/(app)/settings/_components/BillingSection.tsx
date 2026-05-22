"use client";

// Billing — plan, phone-validation credit meter (pulls live remaining from
// Clearout), payment method, invoice history. Each section sits in its own
// card so the eye can step between them; section headers carry the heading
// rather than a thin uppercase rule.
//
// The credit meter prefers live Clearout balance (auto-updates when Bree
// tops off at clearoutphone.io). Falls back to the local cap-minus-used
// calc only if the Clearout call fails.

import { useState, useTransition } from "react";
import { runPhoneValidationBackfill } from "@/app/(app)/settings/_actions";
import { DEFAULT_CREDIT_COST_USD } from "@/lib/phone-validate";

export type PhoneValidationUsage = {
  remainingCredits: number | null;
  usedThisMonth: number;
  usedAllTime: number;
  fallbackCap: number;
  source: "clearout_live" | "fallback";
};

export function BillingSection({
  phoneUsage,
  invoiceEmail,
}: {
  phoneUsage: PhoneValidationUsage;
  invoiceEmail: string;
}) {
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null);
  const [backfillErr, setBackfillErr] = useState<string | null>(null);
  const [backfillPending, startBackfill] = useTransition();

  function onBackfill() {
    setBackfillErr(null);
    setBackfillMsg(null);
    if (
      !window.confirm(
        "Validate every untested phone in this org (on non-lost leads)? Uses credits from the balance above."
      )
    ) {
      return;
    }
    startBackfill(async () => {
      const res = await runPhoneValidationBackfill();
      if (!res.ok) {
        setBackfillErr(res.error);
        return;
      }
      setBackfillMsg(
        "Started — every untested phone on non-lost leads is queueing now. Refresh to see the balance update."
      );
    });
  }

  // Live remaining wins; fall back to cap-minus-all-time when Clearout
  // can't be reached. The meter bar uses remaining vs the larger of
  // (remaining + usedAllTime) and fallbackCap so the bar makes sense even
  // when the user just topped off (recent purchases push remaining > cap).
  const remaining = phoneUsage.remainingCredits ?? Math.max(
    0,
    phoneUsage.fallbackCap - phoneUsage.usedAllTime
  );
  const reference = Math.max(
    remaining + phoneUsage.usedAllTime,
    phoneUsage.fallbackCap,
    1
  );
  const pct = Math.min(100, Math.round((remaining / reference) * 100));
  const spentThisMonthUsd = phoneUsage.usedThisMonth * DEFAULT_CREDIT_COST_USD;
  const spentThisMonthLabel = spentThisMonthUsd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
            Your plan, add-ons, payment method, and invoice history.
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

      <h2 className="billing-section-h">Phone Validation</h2>
      <div className="billing-card">
        <div className="billing-card-head">
          <div className="flex-1 min-w-0">
            <div className="billing-card-title">Credit Balance</div>
            <div className="billing-card-desc">
              Real-time line-status and carrier check via Clearout Phone — covers
              both mobile and landline. Pre-screens imported and manually added
              numbers so dead lines stop reaching the call queue.
            </div>
          </div>
          <div className="billing-card-counts">
            <div className="billing-card-num">
              <span className="tabular">{remaining.toLocaleString()}</span>
            </div>
            <div className="billing-card-lab">
              {phoneUsage.source === "clearout_live"
                ? "Credits Remaining"
                : "Credits Left (cached)"}
            </div>
          </div>
        </div>
        <div className="billing-card-bar">
          <div
            className="billing-card-bar-fill"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="billing-card-stats">
          <div>
            <div className="billing-stat-num">
              {phoneUsage.usedThisMonth.toLocaleString()}
            </div>
            <div className="billing-stat-lab">Validations This Month</div>
          </div>
          <div>
            <div className="billing-stat-num">{spentThisMonthLabel}</div>
            <div className="billing-stat-lab">
              Spent This Month (≈ ${DEFAULT_CREDIT_COST_USD.toFixed(4)}/credit)
            </div>
          </div>
          <div>
            <div className="billing-stat-num">
              {phoneUsage.usedAllTime.toLocaleString()}
            </div>
            <div className="billing-stat-lab">Validations All-Time</div>
          </div>
        </div>
        <div className="billing-card-foot">
          Top off at{" "}
          <a
            href="https://app.clearoutphone.io/dashboard/credits"
            target="_blank"
            rel="noopener noreferrer"
          >
            clearoutphone.io
          </a>{" "}
          when the balance runs low — no auto-recharge.
        </div>
        <div className="billing-card-action">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={backfillPending}
            onClick={onBackfill}
          >
            {backfillPending ? "Starting…" : "Run Backfill"}
          </button>
          <span className="billing-card-action-hint">
            Validates every untested phone on non-lost leads in the background.
          </span>
        </div>
        {backfillMsg && (
          <div className="billing-card-msg billing-card-msg-success">
            {backfillMsg}
          </div>
        )}
        {backfillErr && (
          <div className="billing-card-msg billing-card-msg-error">
            {backfillErr}
          </div>
        )}
      </div>

      <h2 className="billing-section-h">Payment Method</h2>
      <div className="billing-card">
        <div className="billing-card-desc" style={{ marginBottom: 16 }}>
          Charged monthly for your Moss Equity subscription. Credit or debit
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
