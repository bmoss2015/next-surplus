"use client";

// Email Accounts panel. Lists the connected Gmail accounts and provides
// a Disconnect button (server action wired) with a confirmation prompt.
// Per-account preference toggles (sync read, send default, auto-archive,
// daily digest) are still display-only since the underlying columns
// don't all exist; Disconnect is the action that actually fires now.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { disconnectEmailAccount, updateEmailAccountSignature } from "@/app/(app)/settings/_email-actions";
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
          style={{ color: "var(--text-2)", fontSize: 13 }}
        >
          No email accounts connected. Use the button below to start the
          Gmail OAuth flow.
        </div>
      ) : (
        initial.map((acct) => (
          <AccountBlock key={acct.id} acct={acct} />
        ))
      )}

      {/* "+ Connect another inbox" intentionally removed — only one
          connected Gmail per user is supported right now. Re-enable when
          multi-inbox + OAuth-connect flow lands. */}
    </section>
  );
}

function AccountBlock({ acct }: { acct: EmailAccountRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const statusText =
    acct.status === "active"
      ? `Active · ${formatSyncedAt(acct.last_synced_at).toLowerCase()}`
      : acct.status === "reauth_required"
        ? "Re-authentication required"
        : "Disabled";

  function onClickDisconnect() {
    if (!confirming) {
      setConfirming(true);
      setErr(null);
      return;
    }
    startTransition(async () => {
      const res = await disconnectEmailAccount(acct.id);
      if (!res.ok) {
        setErr(res.error);
        setConfirming(false);
        return;
      }
      router.refresh();
    });
  }

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
          {err && (
            <div
              className="mt-1 text-[11.5px]"
              style={{ color: "var(--danger)" }}
            >
              {err}
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm inbox-disconnect"
          onClick={onClickDisconnect}
          disabled={pending}
          style={
            confirming
              ? { color: "var(--danger)", borderColor: "var(--danger)" }
              : undefined
          }
        >
          {pending
            ? "Disconnecting…"
            : confirming
              ? "Click again to confirm"
              : "Disconnect"}
        </button>
      </div>

      <SignatureEditor acct={acct} />

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

function SignatureEditor({ acct }: { acct: EmailAccountRow }) {
  const router = useRouter();
  const [value, setValue] = useState(acct.signature_html ?? "");
  const [pending, startTransition] = useTransition();
  const [savedFlash, setSavedFlash] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const dirty = value !== (acct.signature_html ?? "");

  function save() {
    setErr(null);
    startTransition(async () => {
      const res = await updateEmailAccountSignature(acct.id, value);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
      router.refresh();
    });
  }

  return (
    <div className="mt-4 rounded-[10px] border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.08em] text-gray-500">
          Signature
        </div>
        {savedFlash && (
          <span className="text-[11px] font-medium text-green-700">Saved</span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={6}
        placeholder={"Bree Moss\nManaging Partner · Moss Equity Partners\n713-555-0184"}
        className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-[13px] leading-[1.55] outline-none focus:border-[#0d4b3a]"
        style={{ fontFamily: "Inter, sans-serif" }}
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        {err && <span className="mr-auto text-[11px] text-red-600">{err}</span>}
        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending}
          className="btn btn-primary btn-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save Signature"}
        </button>
      </div>
    </div>
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
