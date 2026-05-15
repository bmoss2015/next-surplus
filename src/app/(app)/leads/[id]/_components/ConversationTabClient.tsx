"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  IconMail,
  IconMessage2,
  IconPaperclip,
  IconPlus,
} from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import { ComposeBox } from "@/app/(app)/inbox/_components/ComposeBox";
import { HtmlMessage } from "@/app/(app)/inbox/_components/HtmlMessage";
import type {
  LeadConversationMessage,
  LeadConversationThread,
} from "./ConversationTab";

type ViewMode = "activity" | "threads";

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}


export function ConversationTabClient({
  leadId,
  threads,
  messages,
  accounts,
}: {
  leadId: string;
  threads: LeadConversationThread[];
  messages: LeadConversationMessage[];
  accounts: { id: string; address: string; display_name: string | null }[];
}) {
  const [view, setView] = useState<ViewMode>("activity");
  const [contactFilter, setContactFilter] = useState<string>("all");
  const [composing, setComposing] = useState(false);

  const contacts = useMemo(() => {
    const set = new Set<string>();
    for (const m of messages) {
      if (m.direction === "inbound") set.add(m.from_address);
      else {
        for (const a of m.to_addresses) set.add(a);
      }
    }
    return Array.from(set).sort();
  }, [messages]);

  const filteredMessages = useMemo(() => {
    if (contactFilter === "all") return messages;
    return messages.filter(
      (m) =>
        m.from_address === contactFilter ||
        m.to_addresses.includes(contactFilter)
    );
  }, [messages, contactFilter]);

  const primaryAccount = accounts[0];
  const noAccount = !primaryAccount;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="inline-flex gap-[3px] rounded-lg bg-gray-150 p-1">
            <button
              type="button"
              onClick={() => setView("activity")}
              className={cn(
                "rounded-md px-3 py-[6px] text-[11px] transition-colors",
                view === "activity"
                  ? "bg-petrol-500 font-medium text-white"
                  : "text-gray-500 hover:text-ink"
              )}
            >
              Activity
            </button>
            <button
              type="button"
              onClick={() => setView("threads")}
              className={cn(
                "rounded-md px-3 py-[6px] text-[11px] transition-colors",
                view === "threads"
                  ? "bg-petrol-500 font-medium text-white"
                  : "text-gray-500 hover:text-ink"
              )}
            >
              Threads
            </button>
          </div>
          {contacts.length > 0 && (
            <select
              value={contactFilter}
              onChange={(e) => setContactFilter(e.target.value)}
              className="rounded-md border border-gray-200 bg-surface px-2 py-[5px] text-[11px] outline-none focus:border-petrol-500"
            >
              <option value="all">All Contacts</option>
              {contacts.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          {noAccount ? (
            <Link
              href="/settings"
              className="text-[11px] text-petrol-500 hover:text-petrol-700"
            >
              Connect Gmail to send →
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="inline-flex items-center gap-1 rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white"
            >
              <IconPlus size={13} stroke={2} />
              Compose
            </button>
          )}
        </div>
      </div>

      {view === "activity" ? (
        <ActivityView messages={filteredMessages} />
      ) : (
        <ThreadsView threads={threads} />
      )}

      {composing && primaryAccount && (
        <div className="fixed bottom-0 right-0 z-40 m-4 flex h-[78vh] w-[520px] flex-col overflow-hidden rounded-[10px] border border-gray-200 bg-surface shadow-elevated">
          <ComposeBox
            mode="new"
            accountId={primaryAccount.id}
            accountAddress={primaryAccount.address}
            defaultLeadId={leadId}
            onClose={() => setComposing(false)}
          />
        </div>
      )}
    </div>
  );
}

function ActivityView({ messages }: { messages: LeadConversationMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-[12px] text-gray-500">
        No conversation activity yet. Sent and received messages will appear
        here as they happen.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {messages.map((m) => (
        <div
          key={m.id}
          className={cn(
            "rounded-[10px] border px-4 py-3 shadow-card",
            m.direction === "outbound"
              ? "border-petrol-100 bg-petrol-50/40"
              : "border-gray-200 bg-surface"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[12px]">
              {m.channel === "quo_sms" ? (
                <IconMessage2 size={12} stroke={1.75} className="text-petrol-500" />
              ) : (
                <IconMail size={12} stroke={1.75} className="text-petrol-500" />
              )}
              <span className="font-medium text-ink">
                {m.from_name || m.from_address}
              </span>
              <span className="text-gray-400">→</span>
              <span className="text-gray-600">{m.to_addresses.join(", ")}</span>
            </div>
            <span className="text-[10px] text-gray-400">{fmtTime(m.sent_at)}</span>
          </div>
          {m.conversation_subject && (
            <div className="mt-1 text-[11px] font-medium text-gray-500">
              {m.conversation_subject}
            </div>
          )}
          <div className="mt-2 text-[12.5px] leading-relaxed text-ink">
            {m.body_html ? (
              <HtmlMessage html={m.body_html} />
            ) : (
              <div className="whitespace-pre-wrap">
                {m.body_text ?? m.snippet ?? ""}
              </div>
            )}
          </div>
          {m.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {m.attachments
                .filter((a) => !a.is_inline)
                .map((a) => (
                  <a
                    key={a.id}
                    href={
                      a.storage_path
                        ? `/api/email/attachment?path=${encodeURIComponent(a.storage_path)}`
                        : "#"
                    }
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[11px] text-ink hover:border-petrol-500"
                  >
                    <IconPaperclip size={11} stroke={1.75} />
                    {a.filename}
                  </a>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ThreadsView({ threads }: { threads: LeadConversationThread[] }) {
  if (threads.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-[12px] text-gray-500">
        No threads linked to this lead yet.
      </div>
    );
  }
  return (
    <div className="divide-y divide-gray-150 rounded-[10px] border border-gray-200 bg-surface shadow-card">
      {threads.map((t) => (
        <Link
          key={t.id}
          href={`/inbox?c=${t.id}`}
          className="block px-4 py-3 hover:bg-gray-50"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium text-ink">
                {t.subject ?? "(No subject)"}
              </div>
              <div className="mt-[2px] truncate text-[11px] text-gray-500">
                {t.participants.map((p) => p.name || p.address).join(", ")}
              </div>
              <div className="mt-1 truncate text-[11px] text-gray-600">
                {t.last_message_preview ?? ""}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {t.unread_count > 0 && (
                <span className="rounded-full bg-petrol-500 px-2 py-[1px] text-[10px] font-medium text-white">
                  {t.unread_count}
                </span>
              )}
              <span className="text-[10px] text-gray-400">
                {t.last_message_at
                  ? new Date(t.last_message_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : ""}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
