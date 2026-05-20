"use client";

import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { EmailAccountRow } from "@/lib/email/types";
import {
  disconnectEmailAccount,
  setEmailAccountReadSync,
} from "../_email-actions";

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const days = Math.floor(hr / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

// Settings redesign — Email Accounts panel, minimal Linear/Plain-style layout.
// Hero block with live-pulse status + minimal toggle rows beneath. Functional
// wiring (OAuth, sync, disconnect) is unchanged.
export function EmailAccountsSection({ initial }: { initial: EmailAccountRow[] }) {
  const [rows, setRows] = useState(initial);
  const [, startTransition] = useTransition();
  const search = useSearchParams();
  const router = useRouter();

  const connectStatus = search.get("email_connect");
  const reason = search.get("reason");

  function remove(id: string) {
    if (!confirm("Disconnect this account? Future syncs will stop.")) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
    startTransition(async () => {
      await disconnectEmailAccount(id);
      router.refresh();
    });
  }

  function toggleReadSync(id: string, next: boolean) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, sync_read_to_provider: next } : r))
    );
    startTransition(async () => {
      await setEmailAccountReadSync(id, next);
      router.refresh();
    });
  }

  function clearBanner() {
    const url = new URL(window.location.href);
    url.searchParams.delete("email_connect");
    url.searchParams.delete("reason");
    router.replace(url.pathname + url.search);
  }

  return (
    <div className="col-span-2 rounded-lg border border-gray-200 bg-surface p-6 shadow-card">
      <h2 className="section-subheader mb-0">Email Accounts</h2>

      {connectStatus === "success" && (
        <div className="mt-4 mb-2 flex items-center justify-between rounded-md border border-petrol-200 bg-petrol-50 px-3 py-2 text-[12px] text-petrol-700">
          <span>Account connected. Initial sync is running in the background.</span>
          <button type="button" onClick={clearBanner} className="text-petrol-500 hover:text-petrol-700">Dismiss</button>
        </div>
      )}
      {connectStatus === "error" && (
        <div className="mt-4 mb-2 flex items-center justify-between rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
          <span>Connection failed{reason ? ` — ${reason}` : ""}.</span>
          <button type="button" onClick={clearBanner} className="text-danger hover:text-danger-strong">Dismiss</button>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
          <div className="text-[13px] text-ink font-medium">No accounts connected</div>
          <div className="mt-1 text-[12px] text-gray-500">Connect Gmail so the portal can read and send mail from this inbox.</div>
          <a
            href="/api/oauth/google/start"
            className="mt-3 inline-flex items-center gap-1 rounded-md btn-primary px-3 py-[7px] text-[12.5px] font-medium text-white"
          >
            Connect Gmail
          </a>
        </div>
      ) : (
        rows.map((row) => (
          <div key={row.id}>
            <div className="flex items-center gap-4 pt-6 pb-6 border-b border-gray-200">
              <div
                className="flex-shrink-0 inline-flex items-center justify-center text-white"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #0d4b3a 0%, #04261c 100%)",
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[17px] font-semibold text-ink" style={{ letterSpacing: "-0.022em" }}>
                  {row.address}
                </div>
                <div className="mt-1 inline-flex items-center gap-2 text-[12.5px] text-gray-500">
                  <PulseDot active={row.status === "active"} />
                  {row.status === "active" && `Active · synced ${relativeTime(row.last_synced_at)}`}
                  {row.status === "reauth_required" && "Reconnect required"}
                  {row.status === "disabled" && "Disabled"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(row.id)}
                className="rounded-md px-3 py-[6px] text-[12.5px] font-medium text-gray-500 hover:text-danger"
              >
                Disconnect
              </button>
            </div>

            <div className="pref-row">
              <div className="min-w-0 flex-1">
                <div className="pref-row-title">Sync read status to Gmail</div>
                <div className="pref-row-desc">
                  When you mark an email read here, also clear the unread label in Gmail.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={row.sync_read_to_provider}
                onClick={() => toggleReadSync(row.id, !row.sync_read_to_provider)}
                className={cn(
                  "relative inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer items-center rounded-full transition-colors",
                  row.sync_read_to_provider ? "bg-petrol-500" : "bg-gray-300"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow transition-transform",
                    row.sync_read_to_provider ? "translate-x-[18px]" : "translate-x-[2px]"
                  )}
                />
              </button>
            </div>
          </div>
        ))
      )}

      {rows.length > 0 && (
        <a
          href="/api/oauth/google/start"
          className="mt-4 inline-block text-[13px] text-petrol-500 hover:text-petrol-700 hover:underline"
        >
          + Connect another inbox
        </a>
      )}
    </div>
  );
}

function PulseDot({ active }: { active: boolean }) {
  if (!active) {
    return <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#9298a3", display: "inline-block" }} />;
  }
  return (
    <span style={{ position: "relative", display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#0d4b3a" }}>
      <span
        style={{
          position: "absolute",
          inset: -3,
          borderRadius: "50%",
          border: "1.5px solid #0d4b3a",
          opacity: 0.35,
          animation: "pulse-ring 2.2s ease-out infinite",
        }}
      />
    </span>
  );
}
