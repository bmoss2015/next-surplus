// Settings clone · Phase C.3 — Email Accounts wired to real data (display).
//
// Lists the currently-signed-in user's connected channel accounts. The
// per-account toggles (sync read, send default, auto-archive, daily digest)
// are visual-only here — only sync_read_to_provider has a column today; the
// other three are surfaced for parity with the mockup. Disconnect / Connect
// another inbox link to the existing OAuth flow (out of scope for Phase C;
// Phase D wires them).

import type { EmailAccountRow } from "@/lib/email/types";

function formatSyncedAt(ts: string | null): string {
  if (!ts) return "Never synced";
  const d = new Date(ts);
  const now = Date.now();
  const mins = Math.round((now - d.getTime()) / 60000);
  if (mins < 1) return "Synced just now";
  if (mins < 60) return `Synced ${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `Synced ${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  return `Last synced ${d.toLocaleDateString()}`;
}

export function EmailAccountsSection({
  initial,
}: {
  initial: EmailAccountRow[];
}) {
  return (
    <section id="panel-email-accounts" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Account</a>
        <i className="icon icon-chevron-right" />
        <span>Email Accounts</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Email Accounts</h1>
          <p className="section-desc">
            Connect Gmail so the portal can read and send email from this
            inbox.
          </p>
        </div>
      </div>

      {initial.length === 0 ? (
        <div
          className="inbox-head"
          style={{ color: "var(--text-3)", fontSize: 13 }}
        >
          No email accounts connected. Use the button below to start the
          Gmail OAuth flow.
        </div>
      ) : (
        initial.map((acct) => (
          <AccountBlock key={acct.id} acct={acct} />
        ))
      )}

      <button
        type="button"
        className="inbox-add"
        disabled
        title="Connect flow ships in Phase D"
      >
        + Connect another inbox
      </button>
    </section>
  );
}

function AccountBlock({ acct }: { acct: EmailAccountRow }) {
  const statusText =
    acct.status === "active"
      ? `Active · ${formatSyncedAt(acct.last_synced_at).toLowerCase()}`
      : acct.status === "reauth_required"
        ? "Re-authentication required"
        : "Disabled";

  return (
    <>
      <div className="inbox-head">
        <div className="inbox-avatar">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="inbox-email">{acct.address}</div>
          <div className="inbox-status">
            <span className="inbox-status-pulse" />
            {statusText}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm inbox-disconnect"
          disabled
          title="Disconnect ships in Phase D"
        >
          Disconnect
        </button>
      </div>

      <div className="inbox-prefs">
        <Pref
          title="Sync read status to Gmail"
          desc="When you mark an email read here, also clear the unread label in Gmail."
          on={acct.sync_read_to_provider}
        />
        <Pref
          title="Send from this address"
          desc="Use this inbox as the default sender when composing email from a lead."
          on
        />
        <Pref
          title="Auto-archive sent mail"
          desc="Strip the inbox label from emails sent through the portal."
          on={false}
        />
        <Pref
          title="Daily digest"
          desc="Get a 9 a.m. summary of new threads and unread mail."
          on={false}
        />
      </div>
    </>
  );
}

function Pref({
  title,
  desc,
  on,
}: {
  title: string;
  desc: string;
  on: boolean;
}) {
  return (
    <div className="inbox-pref">
      <div>
        <div className="inbox-pref-title">{title}</div>
        <div className="inbox-pref-desc">{desc}</div>
      </div>
      <div
        className={"toggle" + (on ? " on" : "")}
        title="Per-account toggles wire in Phase D"
        style={{ pointerEvents: "none", opacity: 0.6 }}
      />
    </div>
  );
}
