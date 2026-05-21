// Settings clone · Phase C.5 — Mail Bank Accounts wired to real data
// (display).
//
// Lists every MailBankAccountRow the org has on file. The Add Account
// drawer + Verify flow + Delete confirmation all stay disabled for now;
// Phase D wires them via the existing createMailBankAccount /
// verifyMailBankAccount / deleteMailBankAccount actions.

import type { MailBankAccountRow } from "@/lib/settings/fetch";

function maskLast4(last4: string | null): string {
  if (!last4) return "•••• ••••";
  return `•••• ${last4}`;
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
            Accounts attached to outgoing mail so checks have somewhere to
            land. Each account verifies via two-deposit confirmation before
            it can be used on letters.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled
          title="Add Account drawer ships in Phase D"
        >
          <i className="icon icon-plus" /> Add Account
        </button>
      </div>

      <div className="list mt-6">
        {initial.length === 0 ? (
          <div
            className="list-row"
            style={{ color: "var(--text-3)", fontSize: 13 }}
          >
            No bank accounts yet. Phase D adds the connect-account drawer.
          </div>
        ) : (
          initial.map((b) => (
            <div key={b.id} className="list-row">
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium">
                  {b.account_holder_name}
                </div>
                <div className="text-[12px] text-2 mt-0.5 tabular">
                  {b.bank_name ?? "Bank"} · Routing {maskLast4(b.routing_last_four)} · Account {maskLast4(b.account_last_four)}
                </div>
              </div>
              {b.status === "verified" ? (
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
              ) : b.status === "unverified" ? (
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
              ) : (
                <span
                  className="role-tab"
                  style={{
                    display: "inline-flex",
                    background: "var(--gray-100, #f3f4f6)",
                    color: "var(--text-2)",
                    minWidth: 0,
                  }}
                >
                  DISABLED
                </span>
              )}
              <div className="overflow ml-2">
                <div
                  className="icon-btn"
                  title="Manage (ships Phase D)"
                  style={{ opacity: 0.4, pointerEvents: "none" }}
                >
                  <i className="icon icon-more-horizontal" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
