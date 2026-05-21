// Settings clone · Phase C.6 — Bank Accounts restructured to match mockup.
//
// Two-column bank-grid of bank-card panels. Each card shows:
//   head — bank name + holder + status tab (VERIFIED / VERIFY)
//   rows — Account, Routing, Verified-or-Added date
//   foot — "Default for outgoing checks" caption OR "Enter Test Deposits"
//          button (for unverified) + remove icon
//
// Add/Verify/Delete actions all stay disabled — they ship in Phase D.

import type { MailBankAccountRow } from "@/lib/settings/fetch";

function maskLast4(last4: string | null): string {
  if (!last4) return "•••• ••••";
  return `**** ${last4}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MailBankAccountsSection({
  initial,
}: {
  initial: MailBankAccountRow[];
}) {
  return (
    <section id="panel-mail-bank" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Mail</a>
        <i className="icon icon-chevron-right" />
        <span>Bank Accounts</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Bank Accounts</h1>
          <p className="section-desc">
            Verified accounts available to draw outgoing checks from. Routing
            and account numbers are stored only by Lob.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled
          title="Add Account drawer ships in Phase D"
        >
          <i className="icon icon-plus" /> Add Bank Account
        </button>
      </div>

      {initial.length === 0 ? (
        <div
          style={{
            marginTop: 24,
            padding: "32px 24px",
            background: "var(--surface)",
            border: "1px dashed var(--hairline)",
            borderRadius: 12,
            textAlign: "center",
            color: "var(--text-3)",
            fontSize: 13,
          }}
        >
          No bank accounts yet. Phase D adds the connect-account drawer.
        </div>
      ) : (
        <div className="bank-grid">
          {initial.map((b, idx) => (
            <BankCard key={b.id} bank={b} isFirst={idx === 0} />
          ))}
        </div>
      )}
    </section>
  );
}

function BankCard({
  bank,
  isFirst,
}: {
  bank: MailBankAccountRow;
  isFirst: boolean;
}) {
  const isVerified = bank.status === "verified";
  return (
    <div className="bank-card">
      <div className="bank-card-head">
        <div>
          <div className="bank-card-bank">
            {bank.bank_name ?? "Bank Account"}
          </div>
          <div className="bank-card-holder">{bank.account_holder_name}</div>
        </div>
        {isVerified ? (
          <span
            className="role-tab"
            style={{
              display: "inline-flex",
              background: "var(--brand)",
              color: "#fff",
              minWidth: 0,
            }}
          >
            VERIFIED
          </span>
        ) : (
          <span
            className="role-tab"
            style={{
              display: "inline-flex",
              background: "transparent",
              color: "var(--brand)",
              border: "1px solid var(--brand)",
              minWidth: 0,
            }}
          >
            VERIFY
          </span>
        )}
      </div>
      <div className="bank-card-row">
        <span className="l">Account</span>
        <span className="v">{maskLast4(bank.account_last_four)}</span>
      </div>
      <div className="bank-card-row">
        <span className="l">Routing</span>
        <span className="v">{maskLast4(bank.routing_last_four)}</span>
      </div>
      <div className="bank-card-row">
        <span className="l">{isVerified ? "Verified" : "Added"}</span>
        <span className="v">{formatDate(bank.verified_at)}</span>
      </div>
      <div className="bank-card-foot">
        {isVerified ? (
          <span className="text-[11px] text-3">
            {isFirst ? "Default for outgoing checks" : ""}
          </span>
        ) : (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled
            title="Test-deposit flow ships in Phase D"
          >
            Enter Test Deposits
          </button>
        )}
        <button
          type="button"
          className="icon-btn"
          title="Remove (ships Phase D)"
          disabled
          style={{ opacity: 0.4 }}
        >
          <i className="icon icon-trash" />
        </button>
      </div>
    </div>
  );
}
