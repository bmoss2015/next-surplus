"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  IconMail,
  IconMessage2,
  IconRefresh,
  IconSearch,
  IconCircleFilled,
  IconPencilPlus,
} from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import { triggerSync } from "../_actions";
import type {
  InboxThreadRow,
  InboxFilter,
  InboxFilterCounts,
  EmailAccountRow,
} from "@/lib/email/types";
import type { EmailTemplateRow } from "@/lib/settings/fetch";

const SendEmailModal = dynamic(
  () => import("@/Components/email/SendEmailModal").then((m) => m.SendEmailModal),
  { ssr: false }
);

const FILTERS: {
  value: InboxFilter;
  label: string;
  countKey: keyof InboxFilterCounts;
}[] = [
  { value: "all", label: "All", countKey: "all" },
  { value: "unread", label: "Unread", countKey: "unread" },
  { value: "email", label: "Email", countKey: "email" },
  { value: "sms", label: "SMS", countKey: "sms" },
  { value: "unlinked", label: "Unlinked", countKey: "unlinked" },
];

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "Now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function senderLabel(t: InboxThreadRow, selfAddresses: string[]): string {
  const selfSet = new Set(selfAddresses.map((a) => a.toLowerCase()));
  const others = t.participants.filter(
    (p) => p.address && !selfSet.has(p.address.toLowerCase())
  );
  const first = others[0] ?? t.participants[0];
  if (!first) return "Unknown";
  return first.name || first.address;
}

export function ThreadList({
  rows,
  filter,
  q,
  selectedId,
  selfAddresses,
  counts,
  accounts,
  templates,
}: {
  rows: InboxThreadRow[];
  filter: InboxFilter;
  q: string;
  selectedId: string | null;
  selfAddresses: string[];
  counts: InboxFilterCounts;
  accounts: EmailAccountRow[];
  templates: EmailTemplateRow[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();
  const [refreshing, startRefresh] = useTransition();
  const [composeOpen, setComposeOpen] = useState(false);
  const canCompose = accounts.some((a) => a.status === "active");

  function refresh() {
    startRefresh(async () => {
      await triggerSync();
      router.refresh();
    });
  }

  function hrefForFilter(f: InboxFilter): string {
    const next = new URLSearchParams(sp.toString());
    next.set("filter", f);
    next.delete("c");
    return `${pathname}?${next.toString()}`;
  }

  function hrefForThread(id: string): string {
    const next = new URLSearchParams(sp.toString());
    next.set("c", id);
    return `${pathname}?${next.toString()}`;
  }

  function hrefForSearch(newQ: string): string {
    const next = new URLSearchParams(sp.toString());
    if (newQ) next.set("q", newQ);
    else next.delete("q");
    next.delete("c");
    return `${pathname}?${next.toString()}`;
  }

  return (
    <>
    <div className="flex h-full w-[360px] flex-col border-r border-gray-200 bg-surface">
      <div className="border-b border-gray-200 px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={() => setComposeOpen(true)}
          disabled={!canCompose}
          title={canCompose ? "Write a New Email" : "Connect an Email Account in Settings First"}
          className="btn-primary mb-3 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md py-[7px] text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IconPencilPlus size={13} stroke={1.75} />
          New Email
        </button>
        <div className="flex items-center gap-2">
          <form
            action={pathname}
            method="get"
            className="relative flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              const newQ = String(formData.get("q") ?? "");
              window.location.href = hrefForSearch(newQ);
            }}
          >
            <IconSearch
              size={13}
              stroke={1.75}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search inbox"
              className="w-full rounded-md border border-gray-200 bg-surface pl-7 pr-2 py-[6px] text-[12px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
            />
          </form>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="rounded-md border border-gray-200 bg-surface p-[6px] text-gray-500 hover:border-petrol-500 hover:text-petrol-500 disabled:opacity-50"
            title="Refresh"
            aria-label="Refresh"
          >
            <IconRefresh
              size={13}
              stroke={1.75}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-[3px]">
          {FILTERS.map((f) => {
            const count = counts[f.countKey];
            const active = filter === f.value;
            return (
              <Link
                key={f.value}
                href={hrefForFilter(f.value)}
                className={cn(
                  "inline-flex flex-1 items-baseline justify-center gap-[4px] whitespace-nowrap rounded-md px-[6px] py-[3px] text-[10.5px]",
                  active
                    ? "bg-petrol-500 font-medium text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <span>{f.label}</span>
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    active ? "text-white/70" : "text-gray-400"
                  )}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="p-6 text-center text-[12px] text-gray-500">
            No conversations match this view.
          </div>
        ) : (
          rows.map((t) => {
            const selected = t.id === selectedId;
            const unread = t.unread_count > 0;
            return (
              <Link
                key={t.id}
                href={hrefForThread(t.id)}
                className={cn(
                  "block border-b border-gray-150 px-4 py-3 transition-colors",
                  selected
                    ? "bg-petrol-50"
                    : "bg-surface hover:bg-gray-50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {t.channel === "quo_sms" ? (
                      <IconMessage2
                        size={13}
                        stroke={1.75}
                        className="shrink-0 text-petrol-500"
                      />
                    ) : (
                      <IconMail
                        size={13}
                        stroke={1.75}
                        className="shrink-0 text-petrol-500"
                      />
                    )}
                    <span
                      className={cn(
                        "truncate text-[12px]",
                        unread ? "font-semibold text-ink" : "text-gray-700"
                      )}
                    >
                      {senderLabel(t, selfAddresses)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {unread && (
                      <IconCircleFilled
                        size={6}
                        className="text-petrol-500"
                      />
                    )}
                    <span className="text-[10px] text-gray-400">
                      {relativeTime(t.last_message_at)}
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    "mt-1 truncate text-[12px]",
                    unread ? "font-medium text-ink" : "text-gray-600"
                  )}
                >
                  {t.subject || "(No subject)"}
                </div>
                <div className="mt-[2px] truncate text-[11px] text-gray-500">
                  {t.last_message_preview ?? ""}
                </div>
                {t.lead_label && (
                  <div className="mt-[2px] text-[10px] text-petrol-500">
                    → {t.lead_label}
                    {t.lead_address ? ` · ${t.lead_address}` : ""}
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
    {composeOpen && (
      <SendEmailModal
        open
        onClose={() => setComposeOpen(false)}
        leadId={null}
        candidates={[]}
        templates={templates}
        accounts={accounts}
      />
    )}
    </>
  );
}
