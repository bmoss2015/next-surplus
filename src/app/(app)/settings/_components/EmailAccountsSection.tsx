"use client";

import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  IconMail,
  IconPlugConnected,
  IconTrash,
  IconAlertTriangle,
  IconCircleCheck,
} from "@tabler/icons-react";
import type { EmailAccountRow } from "@/lib/email/types";
import {
  disconnectEmailAccount,
  setEmailAccountReadSync,
} from "../_email-actions";

function relativeTime(iso: string | null): string {
  if (!iso) return "Never synced";
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

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
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="section-subheader">Email Accounts</h2>
          <div className="mt-1 text-[12px] font-normal text-[#94a3b8]">
            {rows.length === 0
              ? "Connect your Gmail to send and receive directly from the portal."
              : `${rows.length} account${rows.length === 1 ? "" : "s"} connected. Connect another to monitor multiple inboxes from this portal.`}
          </div>
        </div>
        {rows.length === 0 ? (
          <a
            href="/api/oauth/google/start"
            className="inline-flex items-center gap-1 rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white"
          >
            <IconPlugConnected size={13} stroke={2} />
            Connect Gmail
          </a>
        ) : (
          <a
            href="/api/oauth/google/start"
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-xs font-medium text-ink hover:border-petrol-500"
          >
            <IconPlugConnected size={13} stroke={2} />
            Connect Another
          </a>
        )}
      </div>

      {connectStatus === "success" && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-petrol-200 bg-petrol-50 px-3 py-2 text-[12px] text-petrol-700">
          <span className="inline-flex items-center gap-2">
            <IconCircleCheck size={14} stroke={2} />
            Account connected. Initial sync is running in the background.
          </span>
          <button
            type="button"
            onClick={clearBanner}
            className="text-petrol-500 hover:text-petrol-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {connectStatus === "error" && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
          <span className="inline-flex items-center gap-2">
            <IconAlertTriangle size={14} stroke={2} />
            Connection failed{reason ? ` — ${reason}` : ""}.
          </span>
          <button
            type="button"
            onClick={clearBanner}
            className="text-danger hover:text-danger-strong"
          >
            Dismiss
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-[12px] text-gray-500">
          No accounts connected. Click Connect Gmail to begin.
        </div>
      ) : (
        <div className="divide-y divide-gray-150">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-petrol-50 text-petrol-500">
                <IconMail size={16} stroke={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium text-ink">
                    {row.address}
                  </span>
                  {row.status === "active" && (
                    <span className="rounded-full bg-success-bg px-2 py-[2px] text-[10px] font-medium text-success-strong">
                      Active
                    </span>
                  )}
                  {row.status === "reauth_required" && (
                    <span className="rounded-full bg-danger-bg px-2 py-[2px] text-[10px] font-medium text-danger">
                      Reconnect
                    </span>
                  )}
                  {row.status === "disabled" && (
                    <span className="rounded-full bg-gray-100 px-2 py-[2px] text-[10px] font-medium text-gray-500">
                      Disabled
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-500">
                  {row.display_name ? `${row.display_name} · ` : ""}
                  {row.provider === "gmail" ? "Gmail" : row.provider}
                  {" · "}Last sync {relativeTime(row.last_synced_at)}
                </div>
                <label className="mt-2 flex cursor-pointer items-start gap-2 text-[11.5px] text-gray-700">
                  <input
                    type="checkbox"
                    checked={row.sync_read_to_provider}
                    onChange={(e) => toggleReadSync(row.id, e.target.checked)}
                    className="mt-[2px] cursor-pointer"
                  />
                  <span>
                    <span className="font-medium">Sync read status to Gmail</span>
                    <span className="block text-[10.5px] text-gray-500">
                      When you mark an email read in the portal, also remove
                      the UNREAD label in Gmail so your real inbox stays in
                      sync.
                    </span>
                  </span>
                </label>
              </div>
              <button
                type="button"
                onClick={() => remove(row.id)}
                className="shrink-0 text-gray-400 hover:text-danger"
                aria-label="Disconnect"
                title="Disconnect"
              >
                <IconTrash size={14} stroke={1.75} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
