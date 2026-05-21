"use client";

// Settings clone · Phase E.6 — Billing with live Run Backfill button.
//
// Plan-hero, Payment Method, and Invoice History stay static until a
// Stripe integration ships (separate project — no SDK or webhook handler
// in this codebase). The Phone Validation add-on meter is real, and the
// Run Backfill button now fires runPhoneValidationBackfill — the server
// action kicks off the sweep via after() and returns immediately, so the
// UI just confirms the run started.

import { useState, useTransition } from "react";
import { runPhoneValidationBackfill } from "@/app/(app)/settings/_actions";

export type PhoneValidationUsage = {
  used: number;
  cap: number;
  period_month: string;
};

const COMING_SOON: { title: string; desc: string }[] = [
  {
    title: "Skip Tracing Credits",
    desc: "Pull current address, phone, and relatives on any lead.",
  },
  {
    title: "Bulk Mail Discount",
    desc: "Drops Click2Mail rates on letters and certified mail at high volume.",
  },
  {
    title: "Priority Support",
    desc: "Direct Slack channel with our team. Same-day response on weekdays.",
  },
];

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
        "Validate every untested phone in this org (on non-lost leads)? Uses the validation quota above."
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
        "Started — every untested phone on non-lost leads is queueing now. The counter above updates as each one finishes."
      );
    });
  }

  const pct =
    phoneUsage.cap > 0
      ? Math.min(100, Math.round((phoneUsage.used / phoneUsage.cap) * 100))
      : 0;
  const periodDate = new Date(phoneUsage.period_month + "T00:00:00Z");
  const resetsLabel = new Date(
    periodDate.getUTCFullYear(),
    periodDate.getUTCMonth() + 1,
    1
  ).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" });

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

      <div className="pref-section-h">Add-Ons · Usage This Month</div>

      <div className="addon-meter">
        <div className="addon-meter-head">
          <div className="flex-1 min-w-0">
            <div className="addon-meter-title">Phone Validation</div>
            <div className="addon-meter-desc">
              Pre-screens imported and manually added numbers via Veriphone
              so dead lines stop reaching the call queue.
            </div>
          </div>
          <div className="addon-meter-counts">
            <div className="addon-meter-num">
              <span className="tabular">{phoneUsage.used.toLocaleString()}</span>{" "}
              /{" "}
              <span className="tabular">{phoneUsage.cap.toLocaleString()}</span>
            </div>
            <div className="addon-meter-lab">{pct}% Used</div>
          </div>
        </div>
        <div className="addon-meter-bar">
          <div
            className="addon-meter-bar-fill"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="addon-meter-foot">
          Resets {resetsLabel} · Free tier (
          {phoneUsage.cap.toLocaleString()} / month)
        </div>
        <div className="addon-meter-action">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={backfillPending}
            onClick={onBackfill}
          >
            {backfillPending ? "Starting…" : "Run Backfill"}
          </button>
          <span className="addon-meter-action-hint">
            Validates every untested phone on non-lost leads in the background.
          </span>
        </div>
        {backfillMsg && (
          <div
            style={{
              marginTop: 10,
              color: "var(--success)",
              fontSize: 12,
            }}
          >
            {backfillMsg}
          </div>
        )}
        {backfillErr && (
          <div
            style={{
              marginTop: 10,
              color: "var(--danger)",
              fontSize: 12,
            }}
          >
            {backfillErr}
          </div>
        )}
      </div>

      {COMING_SOON.map((row) => (
        <div className="pref-row" key={row.title}>
          <div className="flex-1 min-w-0">
            <div className="pref-row-title">{row.title}</div>
            <div className="pref-row-desc">{row.desc}</div>
          </div>
          <span className="addon-pending">Coming Soon</span>
        </div>
      ))}

      <div className="pref-section-h">Payment Method</div>
      <div
        style={{
          fontSize: 12.5,
          color: "var(--text-2)",
          margin: "-4px 0 8px",
          lineHeight: 1.5,
        }}
      >
        Charged monthly for your Moss Equity subscription. Credit or debit
        cards. Outgoing checks pull from{" "}
        <a href="#mail-bank">Bank Accounts</a> instead.
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

      <div className="pref-section-h">Invoice History</div>
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
    </section>
  );
}

const SAMPLE_INVOICES = [
  { id: "INV-2026-05", period: "May 2026", paid: "May 12", amount: "$197.00" },
  { id: "INV-2026-04", period: "April 2026", paid: "Apr 12", amount: "$197.00" },
  { id: "INV-2026-03", period: "March 2026", paid: "Mar 12", amount: "$197.00" },
];
