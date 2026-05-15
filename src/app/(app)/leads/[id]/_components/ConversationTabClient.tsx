"use client";

import { useMemo, useState } from "react";
import { useTransition } from "react";
import {
  IconMail,
  IconMessage2,
  IconPaperclip,
  IconPencil,
  IconPhone,
  IconUserPlus,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import { ComposeBox } from "@/app/(app)/inbox/_components/ComposeBox";
import { HtmlMessage } from "@/app/(app)/inbox/_components/HtmlMessage";
import { formatPhoneUS } from "@/lib/phone";
import { upsertLeadParty } from "../_lead-parties-actions";
import type {
  LeadConversationMessage,
  LeadConversationThread,
  LeadPerson,
} from "./ConversationTab";

type ChannelFilter = "all" | "email" | "sms";

function initialsOf(name: string): string {
  const parts = (name || "?").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic colored avatar per person — same name always gets the same
// color. Tones tuned to read as a coherent set with the portal's petrol
// palette (no neon), so they help differentiate without looking random.
const AVATAR_PALETTE: { bg: string; text: string }[] = [
  { bg: "#0d6c7d", text: "#ffffff" },
  { bg: "#0a3d4a", text: "#ffffff" },
  { bg: "#1a8a9c", text: "#ffffff" },
  { bg: "#374151", text: "#ffffff" },
  { bg: "#7c3aed", text: "#ffffff" },
  { bg: "#b45309", text: "#ffffff" },
  { bg: "#047857", text: "#ffffff" },
  { bg: "#0369a1", text: "#ffffff" },
  { bg: "#9d174d", text: "#ffffff" },
  { bg: "#7e22ce", text: "#ffffff" },
];

function avatarColorFor(name: string): { bg: string; text: string } {
  const t = (name || "?").trim();
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
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
  // Filter id either refers to a known person (their LeadPerson.id) or a
  // recent-but-unsaved correspondent ("recent:foo@bar.com"). Both resolve
  // to a set of email addresses for the timeline match below.
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);
  const [composeTo, setComposeTo] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [savingRecent, startSavingRecent] = useTransition();
  const [recentSaved, setRecentSaved] = useState<Set<string>>(new Set());

  const reachable = useMemo(
    () => people.filter((p) => p.emails.length > 0),
    [people]
  );

  // Message count per person — for the badge after each name. Matches
  // each message's from / to / cc against the person's known emails so a
  // contact reachable on multiple addresses still aggregates correctly.
  const countByPersonId = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of reachable) {
      const emails = new Set(p.emails.map((e) => e.toLowerCase()));
      let count = 0;
      for (const m of messages) {
        if (emails.has(m.from_address.toLowerCase())) {
          count += 1;
          continue;
        }
        if (m.to_addresses.some((a) => emails.has(a.toLowerCase()))) {
          count += 1;
        }
      }
      map.set(p.id, count);
    }
    return map;
  }, [reachable, messages]);

  // Recent addresses — anyone who's appeared in this lead's messages but
  // ISN'T on the formal People list yet. Surfaced in their own row below
  // the main grid so the user can compose to them without doing the
  // "save as contact" dance first.
  const recentParticipants = useMemo(() => {
    const knownEmails = new Set<string>();
    for (const p of people) for (const e of p.emails) knownEmails.add(e.toLowerCase());
    for (const a of accounts) knownEmails.add(a.address.toLowerCase());
    const seen = new Map<string, { name: string; email: string; count: number }>();
    for (const m of messages) {
      const candidates: { email: string; name: string | null }[] = [
        { email: m.from_address, name: m.from_name ?? null },
        ...m.to_addresses.map((a) => ({ email: a, name: null })),
      ];
      for (const c of candidates) {
        const lc = c.email.toLowerCase().trim();
        if (!lc || knownEmails.has(lc)) continue;
        const existing = seen.get(lc);
        if (existing) {
          existing.count += 1;
          if (!existing.name && c.name) existing.name = c.name;
        } else {
          seen.set(lc, { name: c.name ?? c.email, email: c.email, count: 1 });
        }
      }
    }
    return Array.from(seen.values()).sort((a, b) => b.count - a.count);
  }, [people, accounts, messages]);

  const personById = useMemo(() => {
    const m = new Map<string, LeadPerson>();
    for (const p of people) m.set(p.id, p);
    return m;
  }, [people]);

  const selectedPerson =
    selectedFilterId && !selectedFilterId.startsWith("recent:")
      ? personById.get(selectedFilterId) ?? null
      : null;

  const selectedRecentEmail =
    selectedFilterId?.startsWith("recent:")
      ? selectedFilterId.slice("recent:".length)
      : null;

  const selectedLabel = selectedPerson
    ? selectedPerson.name
    : selectedRecentEmail ?? null;

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
    const matchSet = new Set<string>();
    if (selectedPerson) {
      for (const e of selectedPerson.emails) matchSet.add(e.toLowerCase());
      for (const p of selectedPerson.phones) matchSet.add(p);
    } else if (selectedRecentEmail) {
      matchSet.add(selectedRecentEmail.toLowerCase());
    }
    return messages.filter((m) => {
      if (channelFilter === "email" && m.channel === "quo_sms") return false;
      if (channelFilter === "sms" && m.channel !== "quo_sms") return false;
      if (matchSet.size > 0) {
        const from = m.from_address.toLowerCase();
        const to = m.to_addresses.map((a) => a.toLowerCase());
        if (!(matchSet.has(from) || to.some((a) => matchSet.has(a)))) return false;
      }
      return true;
    });
  }, [messages, channelFilter, selectedPerson, selectedRecentEmail]);

  const nameByAddress = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of people) {
      for (const e of p.emails) if (!m.has(e)) m.set(e, p.name);
    }
    return m;
  }, [people]);

  const primaryAccount = accounts[0];
  const noAccount = !primaryAccount;

  function openComposeTo(email: string | null) {
    setComposeTo(email);
    setComposing(true);
  }

  function toggleFilter(filterId: string) {
    setSelectedFilterId((cur) => (cur === filterId ? null : filterId));
  }

  function saveRecentAsContact(email: string, displayName: string) {
    const placeholderName =
      displayName && displayName !== email ? displayName : email.split("@")[0];
    startSavingRecent(async () => {
      const res = await upsertLeadParty({
        lead_id: leadId,
        role: "other",
        custom_role_label: "New Contact",
        name: placeholderName,
        email,
      });
      if (res.ok) {
        setRecentSaved((prev) => new Set(prev).add(email.toLowerCase()));
      }
    });
  }

  const FILTERS: { value: ChannelFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: counts.all },
    { value: "email", label: "Email", count: counts.email },
    { value: "sms", label: "SMS", count: counts.sms },
  ];

  return (
    <div>
      {/* PEOPLE — grid layout that uses the full width. Each cell is the
          avatar+name+role+actions design from the prior list pattern, but
          arranged 2/3/4 columns wide instead of stacking. No email preview
          (was clutter). Action icons on hover. */}
      {reachable.length > 0 && (
        <div className="mb-3 rounded-[10px] border border-gray-200 bg-surface px-4 py-[12px] shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="section-subheader m-0">People on this Lead</h3>
            {selectedLabel && (
              <button
                type="button"
                onClick={() => setSelectedFilterId(null)}
                className="inline-flex items-center gap-1 text-[10.5px] text-gray-500 hover:text-ink"
              >
                <IconX size={10} stroke={1.75} />
                Clear filter on {selectedLabel}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 md:grid-cols-3 xl:grid-cols-4">
            {reachable.map((p) => {
              const selected = selectedFilterId === p.id;
              const primaryEmail = p.emails[0] ?? null;
              const primaryPhone = p.phones[0] ?? null;
              const count = countByPersonId.get(p.id) ?? 0;
              const color = avatarColorFor(p.name);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleFilter(p.id)}
                  className={cn(
                    "group flex w-full items-center gap-2 rounded-md px-2 py-[6px] text-left transition-colors",
                    selected ? "bg-petrol-50" : "hover:bg-gray-50"
                  )}
                  title={
                    selected
                      ? "Click to clear filter"
                      : `Click to show only conversations with ${p.name}`
                  }
                >
                  <div
                    className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[9.5px] font-semibold"
                    style={{ background: color.bg, color: color.text }}
                  >
                    {initialsOf(p.name)}
                  </div>
                  <div className="min-w-0 flex-1 truncate leading-tight">
                    <div className="flex items-baseline gap-[5px] truncate text-[12.5px] font-medium text-ink">
                      <span className="truncate">{p.name}</span>
                      {count > 0 && (
                        <span className="shrink-0 text-[10px] font-medium tabular-nums text-petrol-500">
                          {count}
                        </span>
                      )}
                    </div>
                    <div className="truncate text-[10px] uppercase tracking-wide text-gray-400">
                      {p.role}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-[2px] opacity-0 transition-opacity group-hover:opacity-100">
                    {primaryEmail && !noAccount && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          openComposeTo(primaryEmail);
                        }}
                        className="rounded p-[4px] text-gray-500 hover:bg-petrol-50 hover:text-petrol-500"
                        title={`Email ${p.name}`}
                        aria-label="Email"
                      >
                        <IconMail size={12} stroke={1.75} />
                      </span>
                    )}
                    {primaryPhone && (
                      <a
                        href={`tel:${primaryPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded p-[4px] text-gray-500 hover:bg-petrol-50 hover:text-petrol-500"
                        title={`Call ${p.name}`}
                        aria-label="Call"
                      >
                        <IconPhone size={12} stroke={1.75} />
                      </a>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {recentParticipants.length > 0 && (
            <div className="mt-3 border-t border-gray-150 pt-3">
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Recent · not on this lead
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 md:grid-cols-3 xl:grid-cols-4">
                {recentParticipants.slice(0, 8).map((r) => {
                  const filterId = `recent:${r.email.toLowerCase()}`;
                  const selected = selectedFilterId === filterId;
                  const color = avatarColorFor(r.name);
                  const alreadySaved = recentSaved.has(r.email.toLowerCase());
                  return (
                    <div
                      key={r.email}
                      className={cn(
                        "group flex items-center gap-2 rounded-md px-2 py-[5px] transition-colors",
                        selected ? "bg-petrol-50" : "hover:bg-gray-50"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFilter(filterId)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        title={
                          selected
                            ? "Click to clear filter"
                            : `Show only messages with ${r.email}`
                        }
                      >
                        <div
                          className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[9px] font-semibold opacity-80"
                          style={{ background: color.bg, color: color.text }}
                        >
                          {initialsOf(r.name)}
                        </div>
                        <div className="min-w-0 flex-1 truncate leading-tight">
                          <div className="flex items-baseline gap-[5px] truncate text-[12px] text-ink">
                            <span className="truncate">{r.name}</span>
                            {r.count > 0 && (
                              <span className="shrink-0 text-[10px] tabular-nums text-gray-400">
                                {r.count}
                              </span>
                            )}
                          </div>
                          <div className="truncate text-[10px] text-gray-400">
                            {r.email}
                          </div>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-[2px] opacity-0 transition-opacity group-hover:opacity-100">
                        {!noAccount && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openComposeTo(r.email);
                            }}
                            className="rounded p-[4px] text-gray-500 hover:bg-petrol-50 hover:text-petrol-500"
                            title={`Compose to ${r.email}`}
                            aria-label="Compose"
                          >
                            <IconMail size={11} stroke={1.75} />
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={alreadySaved || savingRecent}
                          onClick={(e) => {
                            e.stopPropagation();
                            saveRecentAsContact(r.email, r.name);
                          }}
                          className={cn(
                            "rounded p-[4px]",
                            alreadySaved
                              ? "text-success-strong"
                              : "text-gray-500 hover:bg-petrol-50 hover:text-petrol-500"
                          )}
                          title={
                            alreadySaved
                              ? "Saved — refresh to see them above"
                              : "Save as a contact on this lead"
                          }
                          aria-label="Save as contact"
                        >
                          <IconUserPlus size={11} stroke={1.75} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOOLBAR */}
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
            <a
              href="/settings"
              className="text-[11px] text-petrol-500 hover:text-petrol-700"
            >
              Connect Gmail to send →
            </a>
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

      {/* TIMELINE — width-constrained so cards don't stretch */}
      <Timeline
        messages={visible}
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
  accountAddresses,
  nameByAddress,
}: {
  messages: LeadConversationMessage[];
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
    <div className="mx-auto flex max-w-[820px] flex-col gap-3">
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
  accountAddresses,
  nameByAddress,
}: {
  message: LeadConversationMessage;
  accountAddresses: string[];
  nameByAddress: Map<string, string>;
}) {
  const outbound = message.direction === "outbound";

  const senderName = outbound
    ? "You"
    : message.from_name ||
      nameByAddress.get(message.from_address.toLowerCase()) ||
      message.from_address;

  const recipients = message.to_addresses
    .filter((a) => !accountAddresses.includes(a.toLowerCase()))
    .map((a) => nameByAddress.get(a.toLowerCase()) || a);
  const recipientLabel =
    recipients.length === 0
      ? "you"
      : recipients.length === 1
        ? recipients[0]
        : `${recipients[0]} +${recipients.length - 1}`;

  const ChannelIcon = message.channel === "quo_sms" ? IconMessage2 : IconMail;
  const channelLabel = message.channel === "quo_sms" ? "SMS" : "Email";

  return (
    <article
      className={cn(
        "flex gap-3 rounded-[10px] border bg-surface px-3.5 py-3 shadow-card transition-shadow hover:shadow-card-hover",
        outbound ? "border-petrol-100 bg-petrol-50/30" : "border-gray-200"
      )}
    >
      <div
        className={cn(
          "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
          outbound
            ? "bg-petrol-500 text-white"
            : "bg-gray-100 text-gray-600"
        )}
      >
        {initialsOf(senderName)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0 text-[12px]">
            <span className="font-semibold text-ink">{senderName}</span>
            <span className="mx-[5px] text-gray-300">→</span>
            <span className="text-gray-600">{recipientLabel}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-[10px]">
            <span className="inline-flex items-center gap-[3px] rounded-full bg-gray-100 px-[6px] py-[1px] font-medium text-gray-500">
              <ChannelIcon size={9} stroke={2} />
              {channelLabel}
            </span>
            <span className="text-gray-400">{fmtTime(message.sent_at)}</span>
          </div>
        </div>
        {message.conversation_subject && (
          <div className="mt-[1px] truncate text-[11.5px] font-medium text-gray-700">
            {message.conversation_subject}
          </div>
        )}
        <div className="mt-[6px] text-[12.5px] leading-relaxed text-ink">
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
