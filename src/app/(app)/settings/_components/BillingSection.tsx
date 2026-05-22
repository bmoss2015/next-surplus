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
import {
  runPhoneValidationBackfill,
  previewPhoneValidationBackfill,
} from "@/app/(app)/settings/_actions";
import { DEFAULT_CREDIT_COST_USD } from "@/lib/phone-validate";

type BackfillPreview = {
  uniquePhones: number;
  totalRows: number;
  estimatedCostUsd: number;
  costPerCreditUsd: number;
};

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
  const [preview, setPreview] = useState<BackfillPreview | null>(null);
  const [previewPending, startPreview] = useTransition();
  const [confirmPending, startConfirm] = useTransition();

  function onBackfillClick() {
    setBackfillErr(null);
    setBackfillMsg(null);
    startPreview(async () => {
      const res = await previewPhoneValidationBackfill();
      if (!res.ok) {
        setBackfillErr(res.error);
        return;
      }
      setPreview({
        uniquePhones: res.uniquePhones,
        totalRows: res.totalRows,
        estimatedCostUsd: res.estimatedCostUsd,
        costPerCreditUsd: res.costPerCreditUsd,
      });
    });
  }

  function onCancelPreview() {
    if (confirmPending) return;
    setPreview(null);
  }

  function onConfirmBackfill() {
    if (!preview) return;
    startConfirm(async () => {
      const res = await runPhoneValidationBackfill();
      if (!res.ok) {
        setBackfillErr(res.error);
        setPreview(null);
        return;
      }
      setBackfillMsg(
        `Started. Validating ${preview.uniquePhones.toLocaleString()} unique phone numbers in the background. Refresh to see the balance update.`
      );
      setPreview(null);
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
              Real-time line status and carrier check on every phone number,
              covering both mobile and landline. Pre-screens imported and
              manually added numbers so dead lines stop reaching the call queue.
            </div>
          </div>
          <div className="billing-card-counts">
            <div className="billing-card-num">
              <span className="tabular">{remaining.toLocaleString()}</span>
            </div>
            <div className="billing-card-lab">Credits Remaining</div>
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
          Credits do not auto-recharge. Add more before the balance runs low
          so new phones keep getting screened.
        </div>
        <div className="billing-card-action">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={previewPending || confirmPending}
            onClick={onBackfillClick}
          >
            {previewPending ? "Counting…" : "Run Backfill"}
          </button>
          <span className="billing-card-action-hint">
            Validates every untested phone on non-lost leads in the background.
            You will see the credit cost before anything runs.
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

      {preview && (
        <BackfillConfirmModal
          preview={preview}
          confirming={confirmPending}
          remaining={remaining}
          onCancel={onCancelPreview}
          onConfirm={onConfirmBackfill}
        />
      )}

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

function BackfillConfirmModal({
  preview,
  confirming,
  remaining,
  onCancel,
  onConfirm,
}: {
  preview: BackfillPreview;
  confirming: boolean;
  remaining: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const costLabel = preview.estimatedCostUsd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const insufficient = preview.uniquePhones > remaining;
  const dupSavings = preview.totalRows - preview.uniquePhones;

  return (
    <div className="backfill-modal-overlay" onClick={confirming ? undefined : onCancel}>
      <div
        className="backfill-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="backfill-modal-title"
      >
        <h3 id="backfill-modal-title" className="backfill-modal-title">
          Confirm Phone Validation Backfill
        </h3>
        {preview.uniquePhones === 0 ? (
          <p className="backfill-modal-empty">
            No untested phones to validate. Every phone on non-lost leads has
            already been screened.
          </p>
        ) : (
          <>
            <div className="backfill-modal-grid">
              <div>
                <div className="backfill-modal-num">
                  {preview.uniquePhones.toLocaleString()}
                </div>
                <div className="backfill-modal-lab">
                  Unique Phones To Validate
                </div>
              </div>
              <div>
                <div className="backfill-modal-num">{costLabel}</div>
                <div className="backfill-modal-lab">
                  Estimated Cost (at ${preview.costPerCreditUsd.toFixed(4)}/credit)
                </div>
              </div>
              <div>
                <div className="backfill-modal-num">
                  {remaining.toLocaleString()}
                </div>
                <div className="backfill-modal-lab">Credits Available</div>
              </div>
            </div>
            {dupSavings > 0 && (
              <p className="backfill-modal-note">
                {preview.totalRows.toLocaleString()} rows total, but{" "}
                {dupSavings.toLocaleString()} are duplicates of numbers already
                in the batch, so you only pay for the unique ones.
              </p>
            )}
            {insufficient && (
              <p className="backfill-modal-warn">
                Not enough credits. Add more before running the backfill, or it
                will stop partway through.
              </p>
            )}
          </>
        )}
        <div className="backfill-modal-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onCancel}
            disabled={confirming}
          >
            Cancel
          </button>
          {preview.uniquePhones > 0 && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onConfirm}
              disabled={confirming || insufficient}
            >
              {confirming ? "Starting…" : "Validate Now"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
