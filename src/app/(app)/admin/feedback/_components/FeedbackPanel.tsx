"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { updateFeedbackStatus, replyToFeedback } from "../_actions";

export type FeedbackStatus =
  | "new"
  | "triaged"
  | "planned"
  | "shipped"
  | "wont_do";

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

function typeChipClasses(t: FeedbackRow["type"]): string {
  const base =
    "inline-flex h-5 items-center rounded px-2 text-[11px] font-medium";
  if (t === "bug") return `${base} bg-danger text-white`;
  if (t === "idea") return `${base} bg-ink text-white`;
  return `${base} bg-petrol-600 text-white`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
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
                    ? "flex h-9 cursor-pointer items-center justify-between rounded-md bg-ink px-3 text-[13px] font-medium text-white"
                    : "flex h-9 cursor-pointer items-center justify-between rounded-md px-3 text-[13px] font-medium text-ink hover:bg-gray-100"
                }
              >
                <span>{b.label}</span>
                <span
                  className={
                    active ? "text-[12px] text-white/70" : "text-[12px] text-gray-500"
                  }
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
                      <span className={typeChipClasses(r.type)}>
                        {typeLabel(r.type)}
                      </span>
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
  const [pending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState<string | null>(null);

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

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <span className={typeChipClasses(row.type)}>{typeLabel(row.type)}</span>
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
                      ? "inline-flex h-8 cursor-pointer items-center justify-center rounded-md bg-ink px-3 text-[12.5px] font-medium text-white"
                      : "inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-[12.5px] font-medium text-ink hover:border-petrol-300"
                  }
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
          <div className="mb-3 text-[12px] font-medium uppercase tracking-wider text-gray-500">
            Reply
          </div>
          {row.responseBody && row.respondedAt && (
            <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-gray-500">
                Last Reply, {formatDate(row.respondedAt)}
              </div>
              <pre className="whitespace-pre-wrap text-[13px] text-ink">
                {row.responseBody}
              </pre>
            </div>
          )}
          <textarea
            rows={5}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={
              row.user?.email
                ? `Reply to ${row.user.fullName}. Sent from support@nextsurplus.com.`
                : "Reply (this submitter has no email on file)."
            }
            disabled={!row.user?.email}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13.5px] text-ink focus:border-petrol-500 focus:outline-none focus:ring-1 focus:ring-petrol-500 disabled:bg-gray-50"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[12px] text-gray-500">{replyMessage ?? ""}</p>
            <button
              type="button"
              onClick={onSendReply}
              disabled={pending || !reply.trim() || !row.user?.email}
              className="inline-flex h-9 w-28 cursor-pointer items-center justify-center rounded-md btn-primary text-[13px] font-medium text-white disabled:opacity-60"
            >
              {pending ? "Sending" : "Send Reply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
