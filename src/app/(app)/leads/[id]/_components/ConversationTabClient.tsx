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
  LeadPerson,
} from "./ConversationTab";

type ChannelFilter = "all" | "email" | "sms";

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
  people,
}: {
  leadId: string;
  threads: LeadConversationThread[];
  messages: LeadConversationMessage[];
  accounts: { id: string; address: string; display_name: string | null }[];
  people: LeadPerson[];
}) {
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [personFilter, setPersonFilter] = useState<string>("all");
  const [composing, setComposing] = useState(false);

  // Map a person to the email/phone we'll match against messages.
  const personById = useMemo(() => {
    const m = new Map<string, LeadPerson>();
    for (const p of people) m.set(p.id, p);
    return m;
  }, [people]);

  const counts = useMemo(() => {
    let email = 0,
      sms = 0;
    for (const m of messages) {
      if (m.channel === "quo_sms") sms += 1;
      else email += 1;
    }
    return { all: messages.length, email, sms };
  }, [messages]);

  const visible = useMemo(() => {
    const selected = personFilter !== "all" ? personById.get(personFilter) : null;
    const matchSet = new Set<string>();
    if (selected) {
      for (const e of selected.emails) matchSet.add(e.toLowerCase());
      for (const p of selected.phones) matchSet.add(p);
    }

    return messages.filter((m) => {
      if (channelFilter === "email" && m.channel === "quo_sms") return false;
      if (channelFilter === "sms" && m.channel !== "quo_sms") return false;
      if (selected) {
        const from = m.from_address.toLowerCase();
        const to = m.to_addresses.map((a) => a.toLowerCase());
        const hit =
          matchSet.has(from) || to.some((a) => matchSet.has(a));
        if (!hit) return false;
      }
      return true;
    });
  }, [messages, channelFilter, personFilter, personById]);

  // Map of conversation_id -> thread row, for the inbox-link affordance on
  // each card. Lets users jump from a single message into its full Gmail
  // thread context in the Inbox.
  const threadById = useMemo(() => {
    const m = new Map<string, LeadConversationThread>();
    for (const t of threads) m.set(t.id, t);
    return m;
  }, [threads]);

  const primaryAccount = accounts[0];
  const noAccount = !primaryAccount;

  const FILTERS: { value: ChannelFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: counts.all },
    { value: "email", label: "Email", count: counts.email },
    { value: "sms", label: "SMS", count: counts.sms },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Channel filter pills — same shape as Inbox filter pills */}
          <div className="inline-flex items-center gap-[3px] rounded-md bg-gray-150 p-[2px]">
            {FILTERS.map((f) => {
              const active = channelFilter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setChannelFilter(f.value)}
                  className={cn(
                    "inline-flex items-baseline gap-[5px] whitespace-nowrap rounded px-[10px] py-[5px] text-[11px]",
                    active
                      ? "bg-petrol-500 font-medium text-white"
                      : "text-gray-600 hover:text-ink"
                  )}
                >
                  <span>{f.label}</span>
                  <span
                    className={cn(
                      "text-[10px] tabular-nums",
                      active ? "text-white/70" : "text-gray-400"
                    )}
                  >
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Person filter — real named people from this lead's records */}
          {people.length > 0 && (
            <select
              value={personFilter}
              onChange={(e) => setPersonFilter(e.target.value)}
              className="rounded-md border border-gray-200 bg-surface px-2 py-[5px] text-[11px] outline-none focus:border-petrol-500"
            >
              <option value="all">Everyone On This Lead</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.role} · {p.name}
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

      {/* Timeline */}
      <Timeline messages={visible} threadById={threadById} />

      {/* Floating Compose */}
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

function Timeline({
  messages,
  threadById,
}: {
  messages: LeadConversationMessage[];
  threadById: Map<string, LeadConversationThread>;
}) {
  if (messages.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-[12px] text-gray-500">
        No conversation activity yet. Sent and received messages will appear
        here as they happen.
      </div>
    );
  }

  // Group by calendar day to render a date divider above each cluster. Modern
  // CRMs default to this presentation — easier to scan than a flat list.
  const groups = groupByDay(messages);

  return (
    <div className="flex flex-col gap-3">
      {groups.map((g) => (
        <section key={g.key}>
          <div className="my-2 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-150" />
            <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
              {g.label}
            </div>
            <div className="h-px flex-1 bg-gray-150" />
          </div>
          <div className="flex flex-col gap-3">
            {g.items.map((m) => (
              <MessageCard
                key={m.id}
                message={m}
                thread={threadById.get(m.conversation_id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function MessageCard({
  message,
  thread,
}: {
  message: LeadConversationMessage;
  thread: LeadConversationThread | undefined;
}) {
  const outbound = message.direction === "outbound";
  return (
    <div
      className={cn(
        "rounded-[10px] border px-4 py-3 shadow-card",
        outbound
          ? "border-petrol-100 bg-petrol-50/40"
          : "border-gray-200 bg-surface"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[12px]">
          {message.channel === "quo_sms" ? (
            <IconMessage2
              size={12}
              stroke={1.75}
              className="text-petrol-500"
            />
          ) : (
            <IconMail size={12} stroke={1.75} className="text-petrol-500" />
          )}
          <span className="font-medium text-ink">
            {message.from_name || message.from_address}
          </span>
          <span className="text-gray-400">→</span>
          <span className="truncate text-gray-600">
            {message.to_addresses.join(", ")}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-[10px] text-gray-400">
            {fmtTime(message.sent_at)}
          </span>
          {thread && (
            <Link
              href={`/inbox?c=${thread.id}`}
              className="text-[10px] text-petrol-500 hover:text-petrol-700"
              title="Open this thread in the Inbox"
            >
              Open Thread →
            </Link>
          )}
        </div>
      </div>
      {message.conversation_subject && (
        <div className="mt-[2px] text-[11px] font-medium text-gray-500">
          {message.conversation_subject}
        </div>
      )}
      <div className="mt-2 text-[12.5px] leading-relaxed text-ink">
        {message.body_html ? (
          <HtmlMessage html={message.body_html} />
        ) : (
          <div className="whitespace-pre-wrap">
            {message.body_text ?? message.snippet ?? ""}
          </div>
        )}
      </div>
      {message.attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {message.attachments
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
  );
}

function groupByDay(messages: LeadConversationMessage[]): {
  key: string;
  label: string;
  items: LeadConversationMessage[];
}[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 24 * 3600 * 1000;
  const groups: Record<string, LeadConversationMessage[]> = {};
  for (const m of messages) {
    const d = new Date(m.sent_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }
  return Object.entries(groups)
    .sort((a, b) => {
      const aDate = new Date(a[1][0].sent_at).getTime();
      const bDate = new Date(b[1][0].sent_at).getTime();
      return aDate - bDate;
    })
    .map(([key, items]) => {
      const d = new Date(items[0].sent_at);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      let label: string;
      if (dayStart === today) label = "Today";
      else if (dayStart === yesterday) label = "Yesterday";
      else
        label = d.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: now.getFullYear() === d.getFullYear() ? undefined : "numeric",
        });
      return { key, label, items };
    });
}
