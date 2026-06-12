"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  IconMail,
  IconMessage2,
  IconPaperclip,
  IconPencil,
  IconPhone,
  IconUserPlus,
  IconX,
  IconArrowBackUp,
  IconArrowBackUpDouble,
  IconArrowForwardUp,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconPhoto,
} from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import { ComposeBox } from "@/app/(app)/inbox/_components/ComposeBox";
import { HtmlMessage } from "@/app/(app)/inbox/_components/HtmlMessage";
import { markThreadRead } from "@/app/(app)/inbox/_actions";
import { upsertLeadParty } from "../_lead-parties-actions";
import { SendEmailModal } from "@/components/email/SendEmailModal";
import type { ThreadDetail, ThreadMessage } from "@/lib/email/types";
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

const AVATAR_PALETTE: { bg: string; text: string }[] = [
  { bg: "#13644e", text: "#ffffff" },
  { bg: "#0d4b3a", text: "#ffffff" },
  { bg: "#4a9c75", text: "#ffffff" },
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

function fmtClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtShort(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return fmtClock(iso);
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(
    "en-US",
    sameYear
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" }
  );
}

function fmtLong(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ClientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span suppressHydrationWarning className={className}>
      {children}
    </span>
  );
}

type LightboxImage = {
  filename: string;
  src: string;
};

function isImageMime(mime: string | null): boolean {
  return !!mime && mime.toLowerCase().startsWith("image/");
}

function attachmentUrl(storagePath: string | null): string {
  return storagePath ? `/api/email/attachment?path=${encodeURIComponent(storagePath)}` : "#";
}

type ThreadGroup = {
  id: string;
  subject: string | null;
  channel: LeadConversationMessage["channel"];
  messages: LeadConversationMessage[];
  lastAt: string;
  unreadCount: number;
};

function groupByThread(messages: LeadConversationMessage[]): ThreadGroup[] {
  const map = new Map<string, LeadConversationMessage[]>();
  for (const m of messages) {
    const arr = map.get(m.conversation_id) ?? [];
    arr.push(m);
    map.set(m.conversation_id, arr);
  }
  const out: ThreadGroup[] = [];
  for (const [id, msgs] of map) {
    msgs.sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
    const last = msgs[msgs.length - 1];
    out.push({
      id,
      subject: last.conversation_subject,
      channel: last.channel,
      messages: msgs,
      lastAt: last.sent_at,
      unreadCount: msgs.filter((m) => m.direction === "inbound" && !m.is_read).length,
    });
  }
  out.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  return out;
}

export function ConversationTabClient({
  leadId,
  threads,
  messages,
  accounts,
  people,
  sendEmailButton,
  emailCandidates,
  emailTemplates,
  emailAccounts,
}: {
  leadId: string;
  threads: LeadConversationThread[];
  messages: LeadConversationMessage[];
  accounts: { id: string; address: string; display_name: string | null }[];
  people: LeadPerson[];
  sendEmailButton?: React.ReactNode;
  emailCandidates?: import("@/lib/email/lead-recipients").EmailRecipientCandidate[];
  emailTemplates?: import("@/lib/settings/fetch").EmailTemplateRow[];
  emailAccounts?: import("@/lib/email/types").EmailAccountRow[];
}) {
  void threads;

  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);
  const [composeTo, setComposeTo] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [savingRecent, startSavingRecent] = useTransition();
  const [recentSaved, setRecentSaved] = useState<Set<string>>(new Set());
  const [replyTo, setReplyTo] = useState<{
    mode: "reply" | "replyAll" | "forward";
    message: LeadConversationMessage;
  } | null>(null);
  const [readOverrides, setReadOverrides] = useState<Set<string>>(new Set());
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{
    images: LightboxImage[];
    index: number;
  } | null>(null);
  // Multi-email picker overlay — when the user clicks "Email <Name>" on a
  // contact who has two or more email addresses, we surface a picker first
  // instead of silently picking the first one.
  const [emailPicker, setEmailPicker] = useState<{
    name: string;
    emails: string[];
  } | null>(null);

  const readerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerPx, setContainerPx] = useState<number>(0);

  useEffect(() => {
    function recompute() {
      const el = containerRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const margin = 24;
      const next = Math.max(420, Math.round(window.innerHeight - top - margin));
      setContainerPx(next);
    }
    recompute();
    window.addEventListener("resize", recompute);
    const ro = new ResizeObserver(recompute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => {
      window.removeEventListener("resize", recompute);
      ro.disconnect();
    };
  }, []);

  // Esc + arrow keys for the lightbox.
  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
      else if (e.key === "ArrowLeft") {
        setLightbox((cur) =>
          cur ? { ...cur, index: (cur.index - 1 + cur.images.length) % cur.images.length } : cur
        );
      } else if (e.key === "ArrowRight") {
        setLightbox((cur) =>
          cur ? { ...cur, index: (cur.index + 1) % cur.images.length } : cur
        );
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  function markRead(conversationId: string) {
    if (readOverrides.has(conversationId)) return;
    const hasUnread = messages.some(
      (m) => m.conversation_id === conversationId && m.direction === "inbound" && !m.is_read
    );
    if (!hasUnread) return;
    setReadOverrides((prev) => {
      const next = new Set(prev);
      next.add(conversationId);
      return next;
    });
    void markThreadRead(conversationId);
  }

  // A contact is "reachable" if they have at least one non-empty email OR
  // phone. Phone-only contacts belong here — the user can still call them
  // today (tel: link on hover) and SMS will land in the same stream once the
  // QUO send path is wired. We only filter out contacts who have no way to
  // be reached at all.
  const reachable = useMemo(
    () =>
      people.filter((p) => {
        const hasEmail = p.emails.some(
          (e) => typeof e === "string" && e.trim().length > 0
        );
        const hasPhone = p.phones.some(
          (n) => typeof n === "string" && n.trim().length > 0
        );
        return hasEmail || hasPhone;
      }),
    [people]
  );

  // Honor ?compose_to=<email> from the URL — used by the Contacts tab to jump
  // here with the compose drawer already open for a specific address.
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const target = searchParams.get("compose_to");
    if (!target) return;
    // One-shot mount sync from the URL — opens the compose drawer pre-filled
    // for the address the Contacts tab handed off.
    /* eslint-disable react-hooks/set-state-in-effect */
    setComposeTo(target);
    setComposing(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // Clear the param so re-renders don't keep re-opening the drawer.
    const next = new URLSearchParams(searchParams.toString());
    next.delete("compose_to");
    router.replace(`${pathname}?${next.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        if (m.to_addresses.some((a) => emails.has(a.toLowerCase()))) count += 1;
      }
      map.set(p.id, count);
    }
    return map;
  }, [reachable, messages]);

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
  const selectedRecentEmail = selectedFilterId?.startsWith("recent:")
    ? selectedFilterId.slice("recent:".length)
    : null;
  const selectedLabel = selectedPerson ? selectedPerson.name : selectedRecentEmail ?? null;

  const counts = useMemo(() => {
    let email = 0, sms = 0;
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

  const threadGroups = useMemo(() => {
    const groups = groupByThread(visible);
    return groups.map((g) => (readOverrides.has(g.id) ? { ...g, unreadCount: 0 } : g));
  }, [visible, readOverrides]);

  // Auto-pick the most recent thread when nothing is selected or when the
  // current selection got filtered out.
  useEffect(() => {
    // Auto-pick the most recent thread when nothing is selected or the
    // current selection got filtered out. Real Effect — selection follows
    // the data set, not a user action.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (threadGroups.length === 0) {
      if (selectedThreadId !== null) setSelectedThreadId(null);
      return;
    }
    if (!selectedThreadId || !threadGroups.find((t) => t.id === selectedThreadId)) {
      setSelectedThreadId(threadGroups[0].id);
      markRead(threadGroups[0].id);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadGroups.map((t) => t.id).join(",")]);

  // Scroll the reader to the top when the selected thread changes — like
  // every real email client.
  useEffect(() => {
    const el = readerRef.current;
    if (el) el.scrollTop = 0;
  }, [selectedThreadId]);

  const nameByAddress = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of people) {
      for (const e of p.emails) if (!m.has(e)) m.set(e, p.name);
    }
    return m;
  }, [people]);

  const accountAddresses = useMemo(() => accounts.map((a) => a.address.toLowerCase()), [accounts]);

  const primaryAccount = accounts[0];
  const noAccount = !primaryAccount;
  const selectedThread = threadGroups.find((t) => t.id === selectedThreadId) ?? null;

  function openComposeTo(email: string | null) {
    setComposeTo(email);
    setComposing(true);
  }

  function toggleFilter(filterId: string) {
    setSelectedFilterId((cur) => (cur === filterId ? null : filterId));
  }

  function selectThread(threadId: string) {
    setSelectedThreadId(threadId);
    markRead(threadId);
  }

  function startReply(mode: "reply" | "replyAll" | "forward", message: LeadConversationMessage) {
    setReplyTo({ mode, message });
    markRead(message.conversation_id);
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
      if (res.ok) setRecentSaved((prev) => new Set(prev).add(email.toLowerCase()));
    });
  }

  const FILTERS: { value: ChannelFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: counts.all },
    { value: "email", label: "Email", count: counts.email },
    { value: "sms", label: "SMS", count: counts.sms },
  ];

  return (
    <div>
      {/* CONTACTS */}
      {reachable.length > 0 && (
        <div className="mb-3 rounded-[10px] border border-gray-200 bg-surface px-4 py-[12px] shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="section-subheader m-0">Contacts</h3>
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
              const cleanEmails = p.emails.filter(
                (e) => typeof e === "string" && e.trim().length > 0
              );
              const primaryPhone = p.phones[0] ?? null;
              const count = countByPersonId.get(p.id) ?? 0;
              const color = avatarColorFor(p.name);
              return (
                <div
                  key={p.id}
                  className={cn(
                    "group relative flex w-full items-center gap-2 rounded-md px-2 py-[6px] transition-colors",
                    selected ? "bg-petrol-50" : "hover:bg-gray-50"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleFilter(p.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <div
                      className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                      style={{ background: color.bg, color: color.text }}
                    >
                      {initialsOf(p.name)}
                    </div>
                    {/* Name + icons share line 1; role sits on line 2 — keeps
                        the icons visually attached to the contact name, not
                        floating between two lines of text. */}
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[12.5px] font-medium text-ink">
                          {p.name}
                        </span>
                        {count > 0 && (
                          <span className="shrink-0 text-[10px] font-medium tabular-nums text-petrol-500">
                            {count}
                          </span>
                        )}
                        <span className="ml-3 flex shrink-0 items-center gap-1 text-gray-400">
                          {cleanEmails.length > 0 && !noAccount && (
                            <span onClick={(e) => e.stopPropagation()}>
                              <EmailButton
                                emails={cleanEmails}
                                onPick={(email) => openComposeTo(email)}
                                contactName={p.name}
                              />
                            </span>
                          )}
                          {primaryPhone && (
                            <a
                              href={`tel:${primaryPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded p-[3px] text-gray-400 hover:bg-petrol-50 hover:text-petrol-500"
                              title={`Call ${primaryPhone}`}
                            >
                              <IconPhone size={14} stroke={1.75} />
                            </a>
                          )}
                        </span>
                      </div>
                      <div className="mt-[1px] truncate text-[10px] uppercase tracking-wide text-gray-400">
                        {p.role}
                      </div>
                    </div>
                  </button>
                </div>
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
                          <div className="truncate text-[10px] text-gray-400">{r.email}</div>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-[2px]">
                        {!noAccount && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openComposeTo(r.email);
                            }}
                            className="rounded p-[4px] text-gray-500 hover:bg-petrol-50 hover:text-petrol-500"
                          >
                            <IconMail size={14} stroke={1.75} />
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
                        >
                          <IconUserPlus size={14} stroke={1.75} />
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

      {/* TOOLBAR — flat, no card. */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-[3px]">
          {FILTERS.map((f) => {
            const active = channelFilter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setChannelFilter(f.value)}
                className={cn(
                  "relative inline-flex items-baseline gap-1.5 px-3 py-1 text-[12px] transition-colors",
                  active
                    ? "font-semibold text-ink"
                    : "text-gray-500 hover:text-ink"
                )}
              >
                <span>{f.label}</span>
                <span className="text-[10.5px] tabular-nums text-gray-400">{f.count}</span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-2 -bottom-[2px] h-[2px] bg-petrol-500"
                  />
                )}
              </button>
            );
          })}
        </div>
        {noAccount ? (
          <a
            href="/settings"
            className="inline-flex items-center gap-1 rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white"
            title="Connect Gmail to start sending"
          >
            <IconMail size={13} stroke={2} />
            Connect Gmail to Send
          </a>
        ) : (
          sendEmailButton ?? (
            <button
              type="button"
              onClick={() => openComposeTo(null)}
              className="inline-flex items-center gap-1 rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white"
              title="Compose a new message"
            >
              <IconPencil size={13} stroke={2} />
              Send Email
            </button>
          )
        )}
      </div>

      {/* TWO-COLUMN READER — Hey.com / Apple Mail / Front pattern. No cards.
          Hairline divider between the two columns. Each column scrolls
          independently inside a fixed-height surface so the page feels like a
          real email client instead of a list of vertical cards. */}
      <div
        ref={containerRef}
        className="grid rounded-[6px] border border-gray-200 bg-surface"
        style={{
          gridTemplateColumns: "320px 1fr",
          height: containerPx > 0 ? `${containerPx}px` : "min(82vh, 920px)",
        }}
      >
        {/* LEFT — thread list. Pure type, no avatars, no chrome. */}
        <aside
          className="flex flex-col border-r border-gray-200 bg-[#fbfcfd] overflow-hidden"
          style={{ height: containerPx > 0 ? `${containerPx}px` : undefined }}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div className="text-[11.5px] font-medium text-gray-500">
              {threadGroups.length === 0
                ? "No conversations"
                : `${threadGroups.length} ${threadGroups.length === 1 ? "conversation" : "conversations"}`}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {threadGroups.length === 0 ? (
              <div className="px-4 py-10 text-center text-[12px] text-gray-400">
                No threads.
              </div>
            ) : (
              <ul className="divide-y divide-gray-150">
                {threadGroups.map((t) => (
                  <ThreadRow
                    key={t.id}
                    thread={t}
                    selected={t.id === selectedThreadId}
                    onSelect={() => selectThread(t.id)}
                    accountAddresses={accountAddresses}
                    nameByAddress={nameByAddress}
                  />
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* RIGHT — internal scroll using JS-measured pixel height. No CSS
            inheritance, no flex/grid track math. Reader is overflow:auto with
            explicit pixel height set in inline style; reply bar shrinks to its
            content height and sits below. */}
        <section
          className="flex flex-col overflow-hidden bg-surface"
          style={{ height: containerPx > 0 ? `${containerPx}px` : undefined }}
        >
          <div
            ref={readerRef}
            className="flex-1 overflow-y-auto"
            style={{ minHeight: 0 }}
          >
          {selectedThread ? (
            <ThreadReader
              thread={selectedThread}
              accountAddresses={accountAddresses}
              nameByAddress={nameByAddress}
              onAction={startReply}
              noAccount={noAccount}
              onOpenLightbox={(images, index) => setLightbox({ images, index })}
            />
          ) : selectedPerson || selectedRecentEmail ? (
            // Contact filtered but no prior thread exists — make the next
            // step obvious instead of a dead-end empty state.
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              {selectedPerson && (
                <div
                  className="flex h-[44px] w-[44px] items-center justify-center rounded-full text-[14px] font-semibold"
                  style={{
                    background: avatarColorFor(selectedPerson.name).bg,
                    color: avatarColorFor(selectedPerson.name).text,
                  }}
                >
                  {initialsOf(selectedPerson.name)}
                </div>
              )}
              <div>
                <div className="text-[14px] font-semibold text-ink">
                  No conversation with{" "}
                  {selectedPerson?.name ?? selectedRecentEmail} yet
                </div>
                <div className="mt-1 text-[12px] text-gray-500">
                  Start one — they&apos;ll see it land in their inbox like any
                  other email.
                </div>
              </div>
              {!noAccount && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedPerson) {
                      const clean = selectedPerson.emails.filter(
                        (e) => typeof e === "string" && e.trim().length > 0
                      );
                      if (clean.length > 1) {
                        setEmailPicker({
                          name: selectedPerson.name,
                          emails: clean,
                        });
                        return;
                      }
                      openComposeTo(clean[0] ?? null);
                      return;
                    }
                    openComposeTo(selectedRecentEmail ?? null);
                  }}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-md btn-primary px-3.5 py-[7px] text-[12px] font-medium text-white"
                >
                  <IconPencil size={13} stroke={2} />
                  Email {selectedPerson?.name ?? selectedRecentEmail}
                </button>
              )}
              {noAccount && (
                <a
                  href="/settings"
                  className="mt-1 inline-flex items-center gap-1.5 rounded-md btn-primary px-3.5 py-[7px] text-[12px] font-medium text-white"
                >
                  <IconMail size={13} stroke={2} />
                  Connect Gmail to Send
                </a>
              )}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 py-12 text-center text-[13px] text-gray-400">
              No conversation yet.
              {!noAccount && " Use New Message to start one, or click a contact above to email them."}
            </div>
          )}
          </div>
          {selectedThread && !noAccount && (() => {
            const last = selectedThread.messages[selectedThread.messages.length - 1];
            const hasMultiple = last.to_addresses.length + last.cc_addresses.length > 1;
            return (
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 bg-white px-5 py-3">
                <button
                  type="button"
                  onClick={() => startReply("reply", last)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md btn-primary px-4 py-[7px] text-[12.5px] font-medium text-white"
                >
                  <IconArrowBackUp size={13} stroke={2} />
                  Reply
                </button>
                {hasMultiple && (
                  <button
                    type="button"
                    onClick={() => startReply("replyAll", last)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3.5 py-[7px] text-[12.5px] font-medium text-[#0f1729] hover:border-[#0d4b3a]/40"
                  >
                    <IconArrowBackUpDouble size={13} stroke={2} />
                    Reply All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startReply("forward", last)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3.5 py-[7px] text-[12.5px] font-medium text-[#0f1729] hover:border-[#0d4b3a]/40"
                >
                  <IconArrowForwardUp size={13} stroke={2} />
                  Forward
                </button>
              </div>
            );
          })()}
        </section>
      </div>

      {/* Floating compose — new message */}
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

      {/* Multi-email picker — surfaced before compose when a contact has
          more than one email address on file. */}
      {emailPicker && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setEmailPicker(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] overflow-hidden rounded-[10px] border border-gray-200 bg-surface shadow-elevated"
          >
            <div className="flex items-center justify-between border-b border-gray-150 px-4 py-3">
              <div>
                <div className="text-[14px] font-semibold text-ink">
                  Email {emailPicker.name}
                </div>
                <div className="text-[11px] text-gray-500">
                  Which address?
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmailPicker(null)}
                className="rounded p-1 text-gray-400 hover:text-ink"
                aria-label="Close"
              >
                <IconX size={14} stroke={2} />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {emailPicker.emails.map((email) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => {
                    const picked = email;
                    setEmailPicker(null);
                    openComposeTo(picked);
                  }}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-petrol-50"
                >
                  <span className="truncate text-[13px] text-ink">{email}</span>
                  <IconMail size={12} stroke={1.75} className="shrink-0 text-petrol-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image lightbox */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onPrev={() =>
            setLightbox((cur) =>
              cur ? { ...cur, index: (cur.index - 1 + cur.images.length) % cur.images.length } : cur
            )
          }
          onNext={() =>
            setLightbox((cur) =>
              cur ? { ...cur, index: (cur.index + 1) % cur.images.length } : cur
            )
          }
        />
      )}

      {/* Floating reply pop-out — use the new SendEmailModal when email
          data is available so reply/replyAll/forward picks up the same
          template + merge-field tooling as Send Email. Falls back to the
          legacy ComposeBox if the email data wasn't passed in. */}
      {replyTo && emailCandidates && emailTemplates && emailAccounts && (() => {
        const m = replyTo.message;
        const accountForReply = accounts.find((a) => a.id === m.channel_account_id) ?? primaryAccount;
        if (!accountForReply) return null;
        const accountLc = accountForReply.address.toLowerCase();
        const isInbound = m.direction === "inbound";
        const replyAllRecipients = new Set<string>([...m.to_addresses, ...m.cc_addresses]);
        if (isInbound) replyAllRecipients.delete(accountLc);
        const primaryTo = isInbound ? m.from_address : (m.to_addresses[0] ?? "");
        const replyAllCcEmails = Array.from(replyAllRecipients).filter(
          (a) => a.toLowerCase() !== primaryTo.toLowerCase()
        );
        const toList =
          replyTo.mode === "forward"
            ? []
            : [{ name: m.from_name ?? primaryTo, email: primaryTo }];
        const ccList =
          replyTo.mode === "replyAll"
            ? replyAllCcEmails.map((e) => ({ name: e, email: e }))
            : [];
        const quotedHtml = m.body_html
          ? `<br/><br/><blockquote style="margin:0 0 0 0.8ex;border-left:1px solid #ccc;padding-left:1ex;">${m.body_html}</blockquote>`
          : `<br/><br/>> ${(m.body_text ?? m.snippet ?? "").replace(/\n/g, "\n> ")}`;
        return (
          <SendEmailModal
            open
            onClose={() => setReplyTo(null)}
            leadId={leadId}
            candidates={emailCandidates}
            templates={emailTemplates}
            accounts={emailAccounts}
            replyContext={{
              mode: replyTo.mode,
              threadId: m.provider_thread_key,
              inReplyTo: m.provider_message_id ? `<${m.provider_message_id}>` : null,
              referencesChain: [
                ...(m.references_chain ?? []),
                ...(m.provider_message_id ? [`<${m.provider_message_id}>`] : []),
              ],
              accountId: accountForReply.id,
              defaultTo: toList,
              defaultCc: ccList,
              baseSubject: m.conversation_subject ?? "",
              quotedHtml,
              originalFrom: { name: m.from_name, address: m.from_address },
              originalSentAt: m.sent_at,
            }}
          />
        );
      })()}

      {/* Legacy reply pop-out — only renders if the new SendEmailModal
          data wasn't provided. Kept for parity until every entry path
          passes the email data. */}
      {replyTo && (!emailCandidates || !emailTemplates || !emailAccounts) && (() => {
        const m = replyTo.message;
        const accountForReply = accounts.find((a) => a.id === m.channel_account_id) ?? primaryAccount;
        if (!accountForReply) return null;
        const threadDetail: ThreadDetail = {
          id: m.conversation_id,
          subject: m.conversation_subject,
          channel: m.channel,
          channel_account_id: m.channel_account_id,
          provider_thread_key: m.provider_thread_key,
          lead_id: leadId,
          lead_label: null,
          lead_address: null,
          participants: [],
          messages: [],
        };
        const threadMessage: ThreadMessage = {
          id: m.id,
          direction: m.direction,
          channel: m.channel,
          from_address: m.from_address,
          from_name: m.from_name,
          to_addresses: m.to_addresses,
          cc_addresses: m.cc_addresses,
          subject: m.conversation_subject,
          body_text: m.body_text,
          body_html: m.body_html,
          snippet: m.snippet,
          sent_at: m.sent_at,
          is_read: m.is_read,
          in_reply_to: m.in_reply_to,
          references_chain: m.references_chain,
          provider_message_id: m.provider_message_id,
          metadata: m.metadata,
          attachments: m.attachments.map((a) => ({
            id: a.id,
            filename: a.filename,
            mime_type: a.mime_type,
            size_bytes: a.size_bytes,
            storage_path: a.storage_path,
            is_inline: a.is_inline,
          })),
        };
        return (
          <div className="fixed bottom-0 right-0 z-40 m-4 flex h-[78vh] w-[520px] flex-col overflow-hidden rounded-[10px] border border-gray-200 bg-surface shadow-elevated">
            <ComposeBox
              mode={replyTo.mode}
              thread={threadDetail}
              replyTo={threadMessage}
              accountAddress={accountForReply.address}
              onClose={() => setReplyTo(null)}
            />
          </div>
        );
      })()}
    </div>
  );
}

// LEFT-COLUMN ROW — Hey.com style. Pure type, no avatars in the list, no
// box chrome. Selected gets a petrol left rail + warm bg.
function ThreadRow({
  thread,
  selected,
  onSelect,
  accountAddresses,
  nameByAddress,
}: {
  thread: ThreadGroup;
  selected: boolean;
  onSelect: () => void;
  accountAddresses: string[];
  nameByAddress: Map<string, string>;
}) {
  const participants = useMemo(() => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const m of thread.messages) {
      const fromLc = m.from_address.toLowerCase();
      if (!accountAddresses.includes(fromLc) && !seen.has(fromLc)) {
        seen.add(fromLc);
        names.push(m.from_name || nameByAddress.get(fromLc) || m.from_address);
      }
      for (const to of m.to_addresses) {
        const toLc = to.toLowerCase();
        if (!accountAddresses.includes(toLc) && !seen.has(toLc)) {
          seen.add(toLc);
          names.push(nameByAddress.get(toLc) || to);
        }
      }
    }
    return names;
  }, [thread.messages, accountAddresses, nameByAddress]);

  const hasUnread = thread.unreadCount > 0;
  const participantText = participants.length === 0
    ? "—"
    : participants.length === 1
      ? participants[0]
      : `${participants[0]} +${participants.length - 1}`;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "relative block w-full px-4 py-3 text-left transition-colors",
          selected ? "bg-petrol-50" : "hover:bg-white"
        )}
      >
        {selected && (
          <span
            aria-hidden
            className="absolute left-0 top-0 h-full w-[3px] bg-petrol-500"
          />
        )}
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "truncate text-[13px] tracking-[-0.005em]",
              hasUnread ? "font-bold text-ink" : "font-semibold text-ink"
            )}
          >
            {participantText}
          </span>
          <ClientText
            className={cn(
              "shrink-0 whitespace-nowrap text-[10.5px] tabular-nums",
              hasUnread ? "font-semibold text-petrol-500" : "text-gray-400"
            )}
          >
            {fmtShort(thread.lastAt)}
          </ClientText>
        </div>
        {thread.subject && (
          <div
            className={cn(
              "mt-[2px] truncate text-[12px]",
              hasUnread ? "font-medium text-ink" : "text-gray-700"
            )}
          >
            {thread.subject}
          </div>
        )}
        <div className="mt-[2px] flex items-center justify-between gap-2">
          <div className="truncate text-[11px] text-gray-400">
            {thread.messages[thread.messages.length - 1].snippet ??
              (thread.messages[thread.messages.length - 1].body_text?.slice(0, 100) ?? "")}
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-[10px] text-gray-400">
            {thread.messages.length > 1 && (
              <span className="tabular-nums">{thread.messages.length}</span>
            )}
            {hasUnread && (
              <span className="inline-block h-[6px] w-[6px] rounded-full bg-petrol-500" />
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

// RIGHT COLUMN — Magazine-style reading view. Big subject heading at the
// top, participants line below, then messages flow with strong typography
// and hairline dividers. No card chrome. No tinted backgrounds.
function ThreadReader({
  thread,
  accountAddresses,
  nameByAddress,
  onAction,
  noAccount,
  onOpenLightbox,
}: {
  thread: ThreadGroup;
  accountAddresses: string[];
  nameByAddress: Map<string, string>;
  onAction: (mode: "reply" | "replyAll" | "forward", message: LeadConversationMessage) => void;
  noAccount: boolean;
  onOpenLightbox: (images: LightboxImage[], index: number) => void;
}) {
  const participantsLabel = useMemo(() => {
    const names: string[] = [];
    const seen = new Set<string>();
    for (const m of thread.messages) {
      const fromLc = m.from_address.toLowerCase();
      if (!accountAddresses.includes(fromLc) && !seen.has(fromLc)) {
        seen.add(fromLc);
        names.push(m.from_name || nameByAddress.get(fromLc) || m.from_address);
      }
      for (const to of m.to_addresses) {
        const toLc = to.toLowerCase();
        if (!accountAddresses.includes(toLc) && !seen.has(toLc)) {
          seen.add(toLc);
          names.push(nameByAddress.get(toLc) || to);
        }
      }
    }
    return names.join(", ");
  }, [thread.messages, accountAddresses, nameByAddress]);

  const ChannelIcon = thread.channel === "quo_sms" ? IconMessage2 : IconMail;
  const lastMsg = thread.messages[thread.messages.length - 1];

  return (
    <div className="mx-auto w-full max-w-[760px] px-8 py-8">
      {/* SUBJECT — magazine-headline scale. */}
      <header className="mb-6 border-b border-gray-200 pb-5">
        <h2 className="flex items-start gap-3 text-[22px] font-semibold leading-[1.25] tracking-[-0.015em] text-ink">
          <ChannelIcon size={18} stroke={2} className="mt-[5px] shrink-0 text-petrol-500" />
          <span>{thread.subject || "(No subject)"}</span>
        </h2>
        <div className="mt-2 pl-[30px] text-[12.5px] text-gray-500">
          {participantsLabel || "—"} <span className="text-gray-300">·</span>{" "}
          {thread.messages.length} {thread.messages.length === 1 ? "message" : "messages"}
        </div>
      </header>

      {/* MESSAGES — flow with hairlines, no cards. */}
      <div className="space-y-8">
        {thread.messages.map((m, idx) => (
          <Message
            key={m.id}
            message={m}
            accountAddresses={accountAddresses}
            nameByAddress={nameByAddress}
            isLast={idx === thread.messages.length - 1}
            onAction={(mode) => onAction(mode, m)}
            noAccount={noAccount}
            onOpenLightbox={onOpenLightbox}
          />
        ))}
      </div>

    </div>
  );
}

type MxStatus = "checking" | "valid" | "invalid" | "error";

function StatusDot({ status }: { status: MxStatus | undefined }) {
  const bg =
    status === "valid"
      ? "bg-success"
      : status === "invalid"
        ? "bg-danger"
        : status === "error"
          ? "bg-gray-400"
          : status === "checking"
            ? "bg-gray-300 animate-pulse"
            : "bg-gray-200";
  return (
    <span
      aria-hidden
      className={cn("inline-block h-[7px] w-[7px] shrink-0 rounded-full", bg)}
    />
  );
}

// Multi-email picker. Single email → click sends compose target directly.
// Multiple → click opens a small dropdown listing every address so the user
// can choose which one to write to. Closes on outside click or Escape.
//
// Each address auto-runs an MX-record check on dropdown open and displays
// a colored dot — green = the domain accepts mail, red = no MX records or
// bad domain. Catches obvious typos like `@gnail.com` at no cost.
function EmailButton({
  emails,
  onPick,
  contactName,
}: {
  emails: string[];
  onPick: (email: string) => void;
  contactName: string;
}) {
  const [open, setOpen] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, MxStatus>>({});
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Verify every address in parallel when the dropdown opens. Results stay
  // cached for the session so a quick close/re-open doesn't re-query.
  useEffect(() => {
    if (!open) return;
    const toCheck = emails.filter((e) => !statuses[e]);
    if (toCheck.length === 0) return;
    // Mark addresses as "checking" then kick off parallel verify-mx fetches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatuses((prev) => {
      const next = { ...prev };
      for (const e of toCheck) next[e] = "checking";
      return next;
    });
    for (const e of toCheck) {
      void (async () => {
        try {
          const res = await fetch("/api/email/verify-mx", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: e }),
          });
          const data = (await res.json()) as
            | { ok: true; status: "valid" | "invalid" }
            | { ok: false; error: string };
          setStatuses((prev) => ({
            ...prev,
            [e]: data.ok ? data.status : "error",
          }));
        } catch {
          setStatuses((prev) => ({ ...prev, [e]: "error" }));
        }
      })();
    }
  }, [open, emails, statuses]);

  if (emails.length === 1) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPick(emails[0]);
        }}
        className="rounded p-[4px] text-gray-500 hover:bg-petrol-50 hover:text-petrol-500"
        title={`Email ${contactName} at ${emails[0]}`}
        aria-label="Email"
      >
        <IconMail size={14} stroke={1.75} />
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded p-[4px] text-gray-500 hover:bg-petrol-50 hover:text-petrol-500"
        title={`Email ${contactName} (${emails.length} addresses)`}
        aria-label="Email"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <IconMail size={14} stroke={1.75} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 min-w-[260px] overflow-hidden rounded-md border border-gray-200 bg-surface shadow-elevated"
        >
          <div className="border-b border-gray-100 bg-gray-50 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Email {contactName}
          </div>
          {emails.map((email) => {
            const s = statuses[email];
            return (
              <button
                key={email}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onPick(email);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-ink hover:bg-petrol-50"
                title={
                  s === "valid"
                    ? "MX records found — domain accepts mail"
                    : s === "invalid"
                      ? "No MX records — likely bad address"
                      : s === "checking"
                        ? "Verifying…"
                        : s === "error"
                          ? "Verification failed"
                          : "Click to pick"
                }
              >
                <StatusDot status={s} />
                <span className="truncate">{email}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const image = images[index];
  if (!image) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Close"
        title="Close (Esc)"
      >
        <IconX size={20} stroke={2} />
      </button>
      <a
        href={image.src}
        download={image.filename}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-16 top-5 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Download"
        title="Download"
      >
        <IconDownload size={20} stroke={2} />
      </a>
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-5 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
            aria-label="Previous"
            title="Previous (←)"
          >
            <IconChevronLeft size={24} stroke={2} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
            aria-label="Next"
            title="Next (→)"
          >
            <IconChevronRight size={24} stroke={2} />
          </button>
        </>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt={image.filename}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] max-w-[92vw] rounded-md object-contain shadow-2xl"
      />
      <div
        className="absolute bottom-5 left-1/2 inline-flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-[12px] text-white backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="truncate">{image.filename}</span>
        {images.length > 1 && (
          <span className="text-white/70 tabular-nums">
            {index + 1} / {images.length}
          </span>
        )}
      </div>
    </div>
  );
}

function Message({
  message,
  accountAddresses,
  nameByAddress,
  isLast,
  onAction,
  noAccount,
  onOpenLightbox,
}: {
  message: LeadConversationMessage;
  accountAddresses: string[];
  nameByAddress: Map<string, string>;
  isLast: boolean;
  onAction: (mode: "reply" | "replyAll" | "forward") => void;
  noAccount: boolean;
  onOpenLightbox: (images: LightboxImage[], index: number) => void;
}) {
  void isLast;
  void onAction;
  void noAccount;

  const outbound = message.direction === "outbound";

  // Split images from other attachments so we can render images as thumbnails
  // and pipe them into the lightbox.
  const visibleAttachments = message.attachments.filter((att) => !att.is_inline);
  const imageAttachments: LightboxImage[] = visibleAttachments
    .filter((att) => isImageMime(att.mime_type))
    .map((att) => ({ filename: att.filename, src: attachmentUrl(att.storage_path) }));
  const fileAttachments = visibleAttachments.filter((att) => !isImageMime(att.mime_type));
  const senderName = outbound
    ? "You"
    : message.from_name || nameByAddress.get(message.from_address.toLowerCase()) || message.from_address;
  const senderColor = outbound
    ? { bg: "#13644e", text: "#ffffff" }
    : avatarColorFor(senderName);

  const recipients = message.to_addresses
    .filter((a) => !accountAddresses.includes(a.toLowerCase()))
    .map((a) => nameByAddress.get(a.toLowerCase()) || a);
  const recipientLabel =
    recipients.length === 0
      ? "you"
      : recipients.length === 1
        ? recipients[0]
        : `${recipients[0]} +${recipients.length - 1}`;

  return (
    <article>
      <div className="flex items-start gap-3">
        <div
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold"
          style={{ background: senderColor.bg, color: senderColor.text }}
        >
          {initialsOf(senderName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[14px] font-semibold tracking-[-0.005em] text-ink">
                {senderName}
              </span>
              <span className="ml-2 text-[12px] text-gray-400">
                to {recipientLabel}
              </span>
            </div>
            <ClientText className="shrink-0 whitespace-nowrap text-[11.5px] tabular-nums text-gray-400">
              {fmtLong(message.sent_at)}
            </ClientText>
          </div>
          <div className="mt-3 text-[14.5px] leading-[1.7] text-ink">
            {message.body_html ? (
              <HtmlMessage html={message.body_html} />
            ) : (
              <div className="whitespace-pre-wrap">
                {message.body_text ?? message.snippet ?? ""}
              </div>
            )}
          </div>
          {imageAttachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {imageAttachments.map((img, i) => (
                <button
                  key={img.src}
                  type="button"
                  onClick={() => onOpenLightbox(imageAttachments, i)}
                  className="group relative h-[140px] w-[180px] overflow-hidden rounded-md border border-gray-200 bg-gray-50"
                  title={img.filename}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={img.filename}
                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                  />
                  <span className="absolute bottom-0 left-0 right-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-[10.5px] text-white">
                    <IconPhoto size={10} stroke={2} className="mr-1 inline" />
                    {img.filename}
                  </span>
                </button>
              ))}
            </div>
          )}
          {fileAttachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {fileAttachments.map((att) => (
                <a
                  key={att.id}
                  href={attachmentUrl(att.storage_path)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[11.5px] text-ink hover:bg-petrol-50 hover:text-petrol-700"
                >
                  <IconPaperclip size={11} stroke={1.75} />
                  {att.filename}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
