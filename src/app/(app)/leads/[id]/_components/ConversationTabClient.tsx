"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  IconMail,
  IconMessage2,
  IconPaperclip,
  IconPencil,
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

const AVATAR_PALETTE = [
  { bg: "#0d6c7d", text: "#ffffff" }, // petrol
  { bg: "#0a3d4a", text: "#ffffff" }, // petrol-dark
  { bg: "#1a8a9c", text: "#ffffff" }, // petrol-light
  { bg: "#374151", text: "#ffffff" }, // slate
  { bg: "#7c3aed", text: "#ffffff" }, // violet
  { bg: "#b45309", text: "#ffffff" }, // amber-dark
  { bg: "#047857", text: "#ffffff" }, // emerald
  { bg: "#b91c1c", text: "#ffffff" }, // danger
  { bg: "#0369a1", text: "#ffffff" }, // sky
  { bg: "#7e22ce", text: "#ffffff" }, // purple
];

function avatarFor(name: string): { initials: string; color: { bg: string; text: string } } {
  const trimmed = (name || "?").trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const initials = parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) hash = (hash * 31 + trimmed.charCodeAt(i)) | 0;
  const color = AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
  return { initials, color };
}

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
  const [composeTo, setComposeTo] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

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
    return messages.filter((m) => {
      if (channelFilter === "email" && m.channel === "quo_sms") return false;
      if (channelFilter === "sms" && m.channel !== "quo_sms") return false;
      return true;
    });
  }, [messages, channelFilter]);

  const threadById = useMemo(() => {
    const m = new Map<string, LeadConversationThread>();
    for (const t of threads) m.set(t.id, t);
    return m;
  }, [threads]);

  // Resolve names for outbound recipients and inbound senders, so cards can
  // show "You → Robert Smith" instead of "you@…  →  robert@…".
  const nameByAddress = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of people) {
      for (const e of p.emails) if (!m.has(e)) m.set(e, p.name);
    }
    return m;
  }, [people]);

  const primaryAccount = accounts[0];
  const noAccount = !primaryAccount;

  const FILTERS: { value: ChannelFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: counts.all },
    { value: "email", label: "Email", count: counts.email },
    { value: "sms", label: "SMS", count: counts.sms },
  ];

  function openComposeTo(personEmail: string | null) {
    setComposeTo(personEmail);
    setComposing(true);
  }

  return (
    <div>
      {/* PEOPLE STRIP — primary affordance for "send to a person on this lead" */}
      {people.length > 0 && (
        <div className="mb-3 rounded-[10px] border border-gray-200 bg-surface p-3 shadow-card">
          <div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-gray-400">
            People — click to send
          </div>
          <div className="flex flex-wrap gap-2">
            {people.map((p) => {
              const a = avatarFor(p.name);
              const email = p.emails[0] ?? null;
              const sendable = !!email && !noAccount;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={!sendable}
                  onClick={() => sendable && openComposeTo(email)}
                  className={cn(
                    "group inline-flex items-center gap-[8px] rounded-full border bg-surface pl-[3px] pr-3 py-[3px] text-[12px] transition-colors",
                    sendable
                      ? "border-gray-200 hover:border-petrol-500 hover:bg-petrol-50"
                      : "cursor-not-allowed border-gray-150 opacity-60"
                  )}
                  title={
                    !email
                      ? "No email on file"
                      : noAccount
                        ? "Connect Gmail to send"
                        : `Compose to ${email}`
                  }
                >
                  <span
                    className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9.5px] font-semibold"
                    style={{ background: a.color.bg, color: a.color.text }}
                  >
                    {a.initials}
                  </span>
                  <span className="flex flex-col items-start leading-tight">
                    <span className="font-medium text-ink">{p.name}</span>
                    <span className="text-[9.5px] uppercase tracking-wide text-gray-400">
                      {p.role}
                    </span>
                  </span>
                  {sendable && (
                    <IconPencil
                      size={11}
                      stroke={1.75}
                      className="text-gray-400 group-hover:text-petrol-500"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TOOLBAR — channel filters + general compose */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
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
              onClick={() => openComposeTo(null)}
              className="inline-flex items-center gap-1 rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white"
            >
              <IconPencil size={13} stroke={2} />
              New Message
            </button>
          )}
        </div>
      </div>

      {/* TIMELINE */}
      <Timeline
        messages={visible}
        threadById={threadById}
        accountAddresses={accounts.map((a) => a.address.toLowerCase())}
        nameByAddress={nameByAddress}
      />

      {/* Floating compose */}
      {composing && primaryAccount && (
        <div className="fixed bottom-0 right-0 z-40 m-4 flex h-[78vh] w-[520px] flex-col overflow-hidden rounded-[10px] border border-gray-200 bg-surface shadow-elevated">
          <ComposeBox
            mode="new"
            accountId={primaryAccount.id}
            accountAddress={primaryAccount.address}
            defaultTo={composeTo ?? undefined}
            defaultLeadId={leadId}
            onClose={() => {
              setComposing(false);
              setComposeTo(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

function Timeline({
  messages,
  threadById,
  accountAddresses,
  nameByAddress,
}: {
  messages: LeadConversationMessage[];
  threadById: Map<string, LeadConversationThread>;
  accountAddresses: string[];
  nameByAddress: Map<string, string>;
}) {
  if (messages.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-[12px] text-gray-500">
        No conversation activity yet. Sent and received messages will appear
        here as they happen.
      </div>
    );
  }

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
          <div className="flex flex-col gap-2">
            {g.items.map((m) => (
              <MessageCard
                key={m.id}
                message={m}
                thread={threadById.get(m.conversation_id)}
                accountAddresses={accountAddresses}
                nameByAddress={nameByAddress}
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
  accountAddresses,
  nameByAddress,
}: {
  message: LeadConversationMessage;
  thread: LeadConversationThread | undefined;
  accountAddresses: string[];
  nameByAddress: Map<string, string>;
}) {
  const outbound = message.direction === "outbound";

  // Sender label: "You" for outbound, otherwise resolve to a contact name if
  // we have one, else fall back to the email address.
  const senderName = outbound
    ? "You"
    : message.from_name ||
      nameByAddress.get(message.from_address.toLowerCase()) ||
      message.from_address;

  // Recipient label: drop the user's own addresses, prefer names over emails.
  const recipients = message.to_addresses
    .filter((a) => !accountAddresses.includes(a.toLowerCase()))
    .map((a) => nameByAddress.get(a.toLowerCase()) || a);
  const recipientLabel =
    recipients.length === 0
      ? "you"
      : recipients.length === 1
        ? recipients[0]
        : `${recipients[0]} +${recipients.length - 1}`;

  const a = avatarFor(senderName);
  const channelLabel = message.channel === "quo_sms" ? "SMS" : "Email";
  const ChannelIcon = message.channel === "quo_sms" ? IconMessage2 : IconMail;

  return (
    <article
      className={cn(
        "flex gap-3 rounded-[10px] border bg-surface px-4 py-3 shadow-card transition-shadow hover:shadow-card-hover",
        outbound ? "border-petrol-100 bg-petrol-50/30" : "border-gray-200"
      )}
    >
      {/* Avatar */}
      <div
        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
        style={{ background: a.color.bg, color: a.color.text }}
      >
        {a.initials}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0 text-[12.5px]">
            <span className="font-semibold text-ink">{senderName}</span>
            <span className="mx-[6px] text-gray-400">→</span>
            <span className="text-gray-600">{recipientLabel}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-[3px] rounded-full bg-gray-100 px-[7px] py-[1px] text-[10px] font-medium text-gray-500">
              <ChannelIcon size={10} stroke={2} />
              {channelLabel}
            </span>
            <span className="text-[10px] text-gray-400">
              {fmtTime(message.sent_at)}
            </span>
          </div>
        </div>
        {message.conversation_subject && (
          <div className="mt-[2px] truncate text-[11.5px] font-medium text-gray-600">
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
              .filter((att) => !att.is_inline)
              .map((att) => (
                <a
                  key={att.id}
                  href={
                    att.storage_path
                      ? `/api/email/attachment?path=${encodeURIComponent(att.storage_path)}`
                      : "#"
                  }
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[11px] text-ink hover:border-petrol-500"
                >
                  <IconPaperclip size={11} stroke={1.75} />
                  {att.filename}
                </a>
              ))}
          </div>
        )}
        {thread && (
          <div className="mt-2">
            <Link
              href={`/inbox?c=${thread.id}`}
              className="text-[10.5px] text-petrol-500 hover:text-petrol-700"
              title="Open this thread in the Inbox"
            >
              Open Thread →
            </Link>
          </div>
        )}
      </div>
    </article>
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
