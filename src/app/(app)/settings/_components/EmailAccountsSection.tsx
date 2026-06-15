"use client";

// Email Accounts panel. Lists the connected Gmail accounts and provides
// a Disconnect button (server action wired) with a confirmation prompt.
// Per-account preference toggles (sync read, send default, auto-archive,
// daily digest) are still display-only since the underlying columns
// don't all exist; Disconnect is the action that actually fires now.

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  disconnectEmailAccount,
  setEmailAccountReadSync,
  updateEmailAccountSignature,
} from "@/app/(app)/settings/_email-actions";
import { RichTextEditor } from "@/components/email/RichTextEditor";
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
  const router = useRouter();
  const search = useSearchParams();
  const connectStatus = search.get("email_connect");
  const reason = search.get("reason");

  function clearBanner() {
    const url = new URL(window.location.href);
    url.searchParams.delete("email_connect");
    url.searchParams.delete("reason");
    router.replace(url.pathname + url.search + url.hash);
  }

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

      {connectStatus === "success" && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-petrol-200 bg-petrol-50 px-3 py-2 text-[12.5px] text-petrol-700">
          <span>
            Account Connected. Initial sync is running in the background.
          </span>
          <button
            type="button"
            onClick={clearBanner}
            className="cursor-pointer text-petrol-500 hover:text-petrol-700"
          >
            Dismiss
          </button>
        </div>
      )}
      {connectStatus === "error" && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12.5px] text-danger">
          <span>
            Connection Failed{reason ? ` — ${reason.replace(/_/g, " ")}` : ""}.
          </span>
          <button
            type="button"
            onClick={clearBanner}
            className="cursor-pointer text-danger hover:text-danger-strong"
          >
            Dismiss
          </button>
        </div>
      )}

      {initial.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-surface p-8 text-center">
          <h2 className="m-0 mb-1 text-[15px] font-medium text-ink">
            Connect Your Inbox
          </h2>
          <p className="m-0 mb-5 text-[13px] text-gray-500">
            Read and send email from the portal using your existing inbox.
          </p>
          <div className="flex items-center justify-center gap-2">
            <a
              href="/api/oauth/google/start"
              className="inline-flex h-9 items-center gap-2 rounded-md btn-primary px-4 text-[13px] font-medium text-white"
            >
              Connect Gmail
            </a>
            <a
              href="/api/oauth/microsoft/start"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-4 text-[13px] font-medium text-ink hover:border-petrol-300"
            >
              Connect Outlook
            </a>
          </div>
        </div>
      ) : (
        <>
          {initial.map((acct) => (
            <AccountBlock key={acct.id} acct={acct} />
          ))}
          <div className="mt-4 flex items-center justify-end gap-2">
            <a
              href="/api/oauth/google/start"
              className="text-[12px] text-petrol-500 hover:text-petrol-700"
            >
              Connect Another Gmail
            </a>
            <span className="text-[12px] text-gray-300">·</span>
            <a
              href="/api/oauth/microsoft/start"
              className="text-[12px] text-petrol-500 hover:text-petrol-700"
            >
              Connect Outlook
            </a>
          </div>
        </>
      )}
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
        <ReadSyncPref acct={acct} />
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
      <RichTextEditor
        value={value}
        onChange={setValue}
        placeholder="Bree Moss · Managing Partner · 713-555-0184"
        minRows={5}
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

function ReadSyncPref({ acct }: { acct: EmailAccountRow }) {
  const router = useRouter();
  const [on, setOn] = useState(acct.sync_read_to_provider);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      await setEmailAccountReadSync(acct.id, next);
      router.refresh();
    });
  }

  return (
    <div className="inbox-pref">
      <div>
        <div className="inbox-pref-title">Sync Read Status To Gmail</div>
        <div className="inbox-pref-desc">
          When you mark an email read here, also clear the unread label in
          Gmail.
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Toggle sync read status to Gmail"
        onClick={toggle}
        className={"toggle cursor-pointer" + (on ? " on" : "")}
      />
    </div>
  );
}
