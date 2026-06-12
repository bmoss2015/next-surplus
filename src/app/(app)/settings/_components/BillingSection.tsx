"use client";

import { useState, useTransition } from "react";
import {
  runPhoneValidationBackfill,
  previewPhoneValidationBackfill,
} from "@/app/(app)/settings/_actions";
import { DEFAULT_CREDIT_COST_USD } from "@/lib/phone-validate";
import type { OrgBilling } from "@/lib/billing/fetch";

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

const PRICE_USD = 69;

function formatUsDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function BillingSection({
  phoneUsage,
  phoneValidationEnabled,
  invoiceEmail,
  billing,
}: {
  phoneUsage: PhoneValidationUsage;
  phoneValidationEnabled: boolean;
  invoiceEmail: string;
  billing: OrgBilling;
}) {
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null);
  const [backfillErr, setBackfillErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<BackfillPreview | null>(null);
  const [previewPending, startPreview] = useTransition();
  const [confirmPending, startConfirm] = useTransition();
  const [billingErr, setBillingErr] = useState<string | null>(null);
  const [billingPending, startBilling] = useTransition();

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

  function onStartTrial() {
    setBillingErr(null);
    startBilling(async () => {
      const res = await fetch("/api/stripe/create-checkout", { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        setBillingErr(body.error ?? "Could not start checkout. Please try again.");
        return;
      }
      window.location.href = body.url;
    });
  }

  function onManageBilling() {
    setBillingErr(null);
    startBilling(async () => {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        setBillingErr(body.error ?? "Could not open the billing portal. Please try again.");
        return;
      }
      window.open(body.url, "_blank", "noopener");
    });
  }

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

  const planHero = renderPlanHero({
    billing,
    pending: billingPending,
    onStartTrial,
    onManageBilling,
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

      {planHero}

      {billingErr && (
        <div className="billing-card-msg billing-card-msg-error" style={{ marginTop: 12 }}>
          {billingErr}
        </div>
      )}

      <h2 className="billing-section-h">Phone Validation</h2>
      {!phoneValidationEnabled ? (
        <div className="billing-card">
          <div className="billing-card-title">Paused</div>
          <div className="billing-card-desc" style={{ marginTop: 10 }}>
            Phone validation is currently paused. New phone numbers added
            via import or manually save as <strong>Not Verified</strong>{" "}
            and no credits are consumed. The validator code stays in place
            so it can be re-enabled by an admin once a provider is selected.
          </div>
        </div>
      ) : (
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
      )}

      {phoneValidationEnabled && preview && (
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
          Charged monthly for your subscription. Credit or debit cards. Outgoing
          checks pull from <a href="#mail-bank">Bank Accounts</a> instead.
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
            title="Invoice email is your account email"
          />
        </div>
        <div className="pref-row">
          <div className="flex-1 min-w-0">
            <div className="pref-row-title">Manage Payment Method</div>
            <div className="pref-row-desc">
              Update your card, view receipts, or cancel your plan.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={billingPending || !billing.stripeCustomerId}
            onClick={onManageBilling}
            title={
              billing.stripeCustomerId
                ? undefined
                : "Start a trial first to open the billing portal."
            }
          >
            {billingPending ? "Opening…" : "Manage Billing"}
          </button>
        </div>
      </div>
    </section>
  );
}

function renderPlanHero({
  billing,
  pending,
  onStartTrial,
  onManageBilling,
}: {
  billing: OrgBilling;
  pending: boolean;
  onStartTrial: () => void;
  onManageBilling: () => void;
}) {
  const status = billing.status;
  const trialEnd = formatUsDate(billing.trialEndsAt);
  const periodEnd = formatUsDate(billing.currentPeriodEnd);

  let eyebrow = "Current Plan";
  let planName = "Subscription";
  let line = `$${PRICE_USD}/month, unlimited users, all features included.`;
  let nextNote: string | null = null;
  let primaryLabel: string;
  let primaryHandler: () => void;
  let primaryVariant: "btn-primary" | "btn-outline" = "btn-primary";
  const ctaDisabled = pending;

  switch (status) {
    case "none":
      eyebrow = "Get Started";
      planName = "Try Free For 14 Days";
      line = `Then $${PRICE_USD}/month, unlimited users. Cancel anytime.`;
      primaryLabel = pending ? "Starting…" : "Start Free Trial";
      primaryHandler = onStartTrial;
      break;
    case "trialing":
      eyebrow = "Current Plan";
      planName = "Free Trial";
      line = `$${PRICE_USD}/month after the trial. Cancel anytime.`;
      nextNote = trialEnd ? `Trial ends ${trialEnd}` : null;
      primaryLabel = pending ? "Opening…" : "Manage Billing";
      primaryHandler = onManageBilling;
      primaryVariant = "btn-outline";
      break;
    case "active":
      eyebrow = "Current Plan";
      planName = "Active";
      line = `$${PRICE_USD}/month, unlimited users, all features included.`;
      nextNote = periodEnd ? `Next charge ${periodEnd}` : null;
      primaryLabel = pending ? "Opening…" : "Manage Billing";
      primaryHandler = onManageBilling;
      primaryVariant = "btn-outline";
      break;
    case "past_due":
      eyebrow = "Action Required";
      planName = "Payment Failed";
      line = "Update your card to keep using the portal without interruption.";
      primaryLabel = pending ? "Opening…" : "Update Payment Method";
      primaryHandler = onManageBilling;
      break;
    case "incomplete":
      eyebrow = "Action Required";
      planName = "Checkout Not Finished";
      line = "Your last checkout did not complete. Start again to begin your trial.";
      primaryLabel = pending ? "Starting…" : "Start Free Trial";
      primaryHandler = onStartTrial;
      break;
    case "cancelled":
      eyebrow = "Current Plan";
      planName = "Cancelled";
      line = `Resubscribe at $${PRICE_USD}/month, unlimited users.`;
      primaryLabel = pending ? "Starting…" : "Resubscribe";
      primaryHandler = onStartTrial;
      break;
    default:
      primaryLabel = "Start Free Trial";
      primaryHandler = onStartTrial;
  }

  return (
    <div className="plan-hero">
      <div className="plan-hero-left">
        <div className="plan-hero-eyebrow">{eyebrow}</div>
        <div className="plan-hero-name">{planName}</div>
        <div className="plan-hero-line">{line}</div>
      </div>
      <div className="plan-hero-right">
        <div className="plan-hero-price">
          ${PRICE_USD}
          <span className="plan-hero-price-suffix">/mo</span>
        </div>
        {nextNote && <div className="plan-hero-next">{nextNote}</div>}
        <button
          type="button"
          className={`btn ${primaryVariant} btn-sm mt-2`}
          disabled={ctaDisabled}
          onClick={primaryHandler}
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}

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
