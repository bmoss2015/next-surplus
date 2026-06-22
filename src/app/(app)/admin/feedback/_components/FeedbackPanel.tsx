"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  updateFeedbackStatus,
  replyToFeedback,
  logCustomerReply,
} from "../_actions";

export type FeedbackStatus =
  | "new"
  | "triaged"
  | "planned"
  | "shipped"
  | "wont_do";

export type FeedbackMessage = {
  id: string;
  direction: "outbound" | "inbound";
  senderName: string | null;
  senderEmail: string | null;
  body: string;
  createdAt: string;
};

export type FeedbackRow = {
  id: string;
  type: "bug" | "idea" | "question";
  title: string;
  body: string;
  pageUrl: string | null;
  surface: string | null;
  status: FeedbackStatus;
  responseBody: string | null;
  respondedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    role: string;
  } | null;
  org: { id: string; name: string } | null;
  messages: FeedbackMessage[];
};

const STATUS_BUCKETS: { value: FeedbackStatus | "all"; label: string }[] = [
  { value: "new", label: "New" },
  { value: "triaged", label: "Triaged" },
  { value: "planned", label: "Planned" },
  { value: "shipped", label: "Shipped" },
  { value: "wont_do", label: "Won't Do" },
  { value: "all", label: "All" },
];

const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "triaged", label: "Triaged" },
  { value: "planned", label: "Planned" },
  { value: "shipped", label: "Shipped" },
  { value: "wont_do", label: "Won't Do" },
];

function typeLabel(t: FeedbackRow["type"]): string {
  if (t === "bug") return "Bug";
  if (t === "idea") return "Idea";
  return "Question";
}

function typeDotColor(t: FeedbackRow["type"]): string {
  if (t === "bug") return "var(--color-danger)";
  if (t === "idea") return "var(--color-petrol-700)";
  return "var(--color-gray-500)";
}

function TypeTag({ type }: { type: FeedbackRow["type"] }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-gray-700">
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: 9999,
          background: typeDotColor(type),
        }}
      />
      {typeLabel(type)}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 14) return `${diffD}d ago`;
  return formatDate(iso);
}

const STATUS_ACTIVE_STYLE = {
  background: "var(--color-petrol-700)",
  boxShadow:
    "0 1px 2px rgba(13,75,58,0.20), 0 4px 12px -4px rgba(13,75,58,0.30), inset 0 1px 0 rgba(255,255,255,0.10)",
};

export function FeedbackPanel({ rows }: { rows: FeedbackRow[] }) {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");
  const initialRow = initialId
    ? rows.find((r) => r.id === initialId) ?? null
    : null;
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus | "all">(
    initialRow ? initialRow.status : "new"
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    initialRow ? initialRow.id : null
  );

  useEffect(() => {
    const id = searchParams.get("id");
    if (id && rows.some((r) => r.id === id)) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setSelectedId(id);
      const row = rows.find((r) => r.id === id);
      if (row) setSelectedStatus(row.status);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [searchParams, rows]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = {
      new: 0,
      triaged: 0,
      planned: 0,
      shipped: 0,
      wont_do: 0,
      all: rows.length,
    };
    for (const r of rows) acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (selectedStatus === "all") return rows;
    return rows.filter((r) => r.status === selectedStatus);
  }, [rows, selectedStatus]);

  const selected = useMemo(
    () =>
      selectedId ? rows.find((r) => r.id === selectedId) ?? null : null,
    [rows, selectedId]
  );

  return (
    <div className="grid h-full grid-cols-[200px_minmax(320px,420px)_1fr] divide-x divide-gray-200">
      <aside className="overflow-y-auto bg-white p-4">
        <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-gray-500">
          Status
        </div>
        <nav className="flex flex-col gap-1">
          {STATUS_BUCKETS.map((b) => {
            const active = selectedStatus === b.value;
            return (
              <button
                key={b.value}
                type="button"
                onClick={() => setSelectedStatus(b.value)}
                className={
                  active
                    ? "flex h-9 cursor-pointer items-center justify-between rounded-md px-3 text-[13.25px] font-medium text-white"
                    : "flex h-9 cursor-pointer items-center justify-between rounded-md px-3 text-[13.25px] text-gray-500 hover:bg-[rgba(12,13,16,0.04)] hover:text-ink"
                }
                style={active ? STATUS_ACTIVE_STYLE : undefined}
              >
                <span>{b.label}</span>
                <span
                  className={
                    active ? "text-[11px] text-white/55" : "text-[11px] text-gray-400"
                  }
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {counts[b.value] ?? 0}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="overflow-y-auto bg-white">
        {filteredRows.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <div className="text-[14px] font-medium text-ink">
                No Feedback Here
              </div>
              <p className="mt-1 text-[12.5px] text-gray-500">
                Nothing in this bucket yet.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredRows.map((r) => {
              const isSelected = selectedId === r.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={
                      isSelected
                        ? "flex w-full cursor-pointer flex-col gap-1 bg-gray-50 px-4 py-3 text-left"
                        : "flex w-full cursor-pointer flex-col gap-1 px-4 py-3 text-left hover:bg-gray-50"
                    }
                  >
                    <div className="flex items-center gap-2">
                      <TypeTag type={r.type} />
                      {r.surface && (
                        <span className="text-[11.5px] text-gray-500">
                          {r.surface}
                        </span>
                      )}
                      <span className="ml-auto text-[11.5px] text-gray-400">
                        {timeAgo(r.createdAt)}
                      </span>
                    </div>
                    <div className="text-[13.5px] font-medium leading-snug text-ink line-clamp-2">
                      {r.title}
                    </div>
                    <div className="text-[12px] text-gray-500">
                      {r.user?.fullName ?? "Unknown"}
                      {r.org ? ` · ${r.org.name}` : ""}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="overflow-y-auto bg-surface-muted">
        {selected ? (
          <DetailPane row={selected} />
        ) : (
          <div className="flex h-full items-center justify-center text-center text-[13px] text-gray-500">
            Select a ticket to triage.
          </div>
        )}
      </section>
    </div>
  );
}

function DetailPane({ row }: { row: FeedbackRow }) {
  const [status, setStatus] = useState<FeedbackStatus>(row.status);
  const [reply, setReply] = useState("");
  const [inbound, setInbound] = useState("");
  const [pending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState<string | null>(null);
  const [inboundMessage, setInboundMessage] = useState<string | null>(null);

  function onStatusChange(next: FeedbackStatus) {
    setStatus(next);
    setStatusMessage(null);
    startTransition(async () => {
      const result = await updateFeedbackStatus({ id: row.id, status: next });
      if (!result.ok) {
        setStatus(row.status);
        setStatusMessage(result.error);
      } else {
        setStatusMessage("Saved");
      }
    });
  }

  function onSendReply() {
    if (!reply.trim()) return;
    setReplyMessage(null);
    startTransition(async () => {
      const result = await replyToFeedback({ id: row.id, message: reply.trim() });
      if (!result.ok) {
        setReplyMessage(result.error);
      } else {
        setReplyMessage("Reply Sent");
        setReply("");
      }
    });
  }

  function onLogInbound() {
    if (!inbound.trim()) return;
    setInboundMessage(null);
    startTransition(async () => {
      const result = await logCustomerReply({
        id: row.id,
        message: inbound.trim(),
      });
      if (!result.ok) {
        setInboundMessage(result.error);
      } else {
        setInboundMessage("Saved");
        setInbound("");
      }
    });
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <TypeTag type={row.type} />
          {row.surface && (
            <span className="text-[12px] text-gray-500">{row.surface}</span>
          )}
          <span className="ml-auto text-[12px] text-gray-500">
            {formatDate(row.createdAt)}
          </span>
        </div>
        <h2 className="mt-3 text-[18px] font-semibold leading-snug text-ink">
          {row.title}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px] text-gray-600">
          <span>
            <span className="text-gray-500">From:</span>{" "}
            {row.user?.fullName ?? "Unknown"}
            {row.user?.email ? ` <${row.user.email}>` : ""}
          </span>
          {row.org && (
            <span>
              <span className="text-gray-500">Org:</span>{" "}
              <Link
                href={`/admin/customers/${row.org.id}`}
                className="text-ink underline-offset-2 hover:underline"
              >
                {row.org.name}
              </Link>
            </span>
          )}
          {row.user?.role && (
            <span className="text-gray-500">
              Role: <span className="text-ink">{row.user.role}</span>
            </span>
          )}
          {row.pageUrl && (
            <span>
              <span className="text-gray-500">Page:</span>{" "}
              <span className="font-mono text-[11.5px] text-ink">
                {row.pageUrl}
              </span>
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-gray-500">
            Original Submission
          </div>
          <pre className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">
            {row.body}
          </pre>
        </div>

        <div className="mt-6 rounded-md border border-gray-200 bg-white p-4">
          <div className="mb-3 text-[12px] font-medium uppercase tracking-wider text-gray-500">
            Status
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const active = status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onStatusChange(opt.value)}
                  disabled={pending && active}
                  className={
                    active
                      ? "inline-flex h-8 cursor-pointer items-center justify-center rounded-md px-3 text-[12.5px] font-medium text-white"
                      : "inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-[12.5px] font-medium text-ink hover:border-petrol-300"
                  }
                  style={active ? STATUS_ACTIVE_STYLE : undefined}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {statusMessage && (
            <p className="mt-2 text-[12px] text-gray-500">{statusMessage}</p>
          )}
        </div>

        <div className="mt-6 rounded-md border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[12px] font-medium uppercase tracking-wider text-gray-500">
              Conversation
            </div>
            <div className="text-[11.5px] text-gray-400">
              {row.messages.length}{" "}
              {row.messages.length === 1 ? "Message" : "Messages"}
            </div>
          </div>
          {row.messages.length === 0 ? (
            <p className="text-[12.5px] text-gray-500">
              No replies yet. Send the first reply below.
            </p>
          ) : (
            <ul className="space-y-3">
              {row.messages.map((m) => (
                <MessageBubble key={m.id} m={m} />
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 rounded-md border border-gray-200 bg-white p-4">
          <div className="mb-2 text-[12px] font-medium uppercase tracking-wider text-gray-500">
            Reply To Customer
          </div>
          <p className="mb-3 text-[12px] text-gray-500">
            Sends an email from notifications@nextsurplus.com. Customer
            replies land at support@nextsurplus.com in your Gmail. Paste them
            back into the Log Customer Reply box below to keep the thread
            complete inside the portal.
          </p>
          <textarea
            rows={5}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={
              row.user?.email
                ? `Reply to ${row.user.fullName}.`
                : "Reply (this submitter has no email on file)."
            }
            disabled={!row.user?.email}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13.5px] text-ink focus:border-petrol-700 focus:outline-none disabled:bg-gray-50"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[12px] text-gray-500">{replyMessage ?? ""}</p>
            <button
              type="button"
              onClick={onSendReply}
              disabled={pending || !reply.trim() || !row.user?.email}
              className="btn btn-primary btn-sm"
            >
              {pending ? "Sending…" : "Send Reply"}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-md border border-gray-200 bg-white p-4">
          <div className="mb-2 text-[12px] font-medium uppercase tracking-wider text-gray-500">
            Log Customer Reply
          </div>
          <p className="mb-3 text-[12px] text-gray-500">
            When the customer replies in Gmail, paste their message here. No
            email is sent. The conversation thread above updates so this
            ticket holds the full back-and-forth.
          </p>
          <textarea
            rows={5}
            value={inbound}
            onChange={(e) => setInbound(e.target.value)}
            placeholder="Paste the customer's reply"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13.5px] text-ink focus:border-petrol-700 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[12px] text-gray-500">{inboundMessage ?? ""}</p>
            <button
              type="button"
              onClick={onLogInbound}
              disabled={pending || !inbound.trim()}
              className="btn btn-outline btn-sm"
            >
              {pending ? "Saving…" : "Save To Thread"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ m }: { m: FeedbackMessage }) {
  const isOutbound = m.direction === "outbound";
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-[11.5px]">
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: 9999,
            background: isOutbound
              ? "var(--color-petrol-700)"
              : "var(--color-gray-400)",
          }}
        />
        <span className="font-medium text-ink">
          {isOutbound ? "You" : m.senderName ?? "Customer"}
        </span>
        <span className="text-gray-500">
          {isOutbound ? "replied via email" : "replied"}
        </span>
        <span className="ml-auto text-gray-400">
          {formatDateTime(m.createdAt)}
        </span>
      </div>
      <div
        className="rounded-md border px-3 py-2"
        style={{
          borderColor: "var(--color-gray-200)",
          background: isOutbound ? "var(--color-surface-muted)" : "#ffffff",
        }}
      >
        <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
          {m.body}
        </pre>
      </div>
    </li>
  );
}
