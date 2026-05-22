"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  IconSearch,
  IconChevronDown,
  IconChevronRight,
  IconDownload,
  IconRefresh,
  IconExternalLink,
} from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import { MailStatusPill } from "@/components/mail/MailStatusPill";
import { LetterPreviewModal, type LetterPreviewData } from "@/components/mail/LetterPreviewModal";
import { fetchMailJobAction } from "../_fetchers";
import type {
  MailJobListRow,
  MailStats,
  MailStatusFilter,
} from "@/lib/mail/fetch";
import { MailDetailDrawer } from "./MailDetailDrawer";

const MAIL_CLASS_LABEL: Record<MailJobListRow["mail_class"], string> = {
  standard: "Standard",
  first_class: "First Class",
  certified: "Certified",
};

const STATUS_CHIPS: Array<{ id: MailStatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "in_flight", label: "In Transit" },
  { id: "delivered", label: "Delivered" },
  { id: "returned", label: "Returned" },
  { id: "failed", label: "Failed" },
];

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type BatchGroup = {
  batch_id: string;
  rows: MailJobListRow[];
  // For multi-recipient batches the parent row shows aggregated state.
  is_batch: boolean;
};

function groupByBatch(rows: MailJobListRow[]): BatchGroup[] {
  const map = new Map<string, MailJobListRow[]>();
  for (const r of rows) {
    const arr = map.get(r.batch_id) ?? [];
    arr.push(r);
    map.set(r.batch_id, arr);
  }
  // Preserve the order of first appearance in the input (already sorted
  // returned-first, then by created_at desc).
  const seen = new Set<string>();
  const groups: BatchGroup[] = [];
  for (const r of rows) {
    if (seen.has(r.batch_id)) continue;
    seen.add(r.batch_id);
    const batchRows = map.get(r.batch_id) ?? [];
    groups.push({
      batch_id: r.batch_id,
      rows: batchRows,
      is_batch: batchRows.length > 1,
    });
  }
  return groups;
}

function summarizeBatch(group: BatchGroup): {
  delivered: number;
  in_flight: number;
  returned: number;
  failed: number;
} {
  let delivered = 0;
  let in_flight = 0;
  let returned = 0;
  let failed = 0;
  for (const r of group.rows) {
    if (r.status === "delivered") delivered += 1;
    else if (r.status === "returned") returned += 1;
    else if (r.status === "failed") failed += 1;
    else in_flight += 1;
  }
  return { delivered, in_flight, returned, failed };
}

function rowsToCsv(rows: MailJobListRow[]): string {
  const header = [
    "id",
    "batch_id",
    "recipient_name",
    "address_line1",
    "city",
    "state",
    "postal_code",
    "mail_class",
    "status",
    "sent_at",
    "delivered_at",
    "returned_at",
    "tracking_number",
    "tracking_url",
    "include_check",
    "check_amount",
    "cost_cents",
    "error_message",
  ];
  const escape = (v: unknown): string => {
    if (v == null) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.batch_id,
        r.recipient_name,
        r.recipient_address_line1,
        r.recipient_city,
        r.recipient_state,
        r.recipient_postal_code,
        r.mail_class,
        r.status,
        r.sent_at ?? "",
        r.delivered_at ?? "",
        r.returned_at ?? "",
        r.tracking_number ?? "",
        r.tracking_url ?? "",
        r.include_check ? "yes" : "no",
        r.check_amount_cents != null ? (r.check_amount_cents / 100).toFixed(2) : "",
        r.cost_cents ?? "",
        r.error_message ?? "",
      ]
        .map(escape)
        .join(",")
    );
  }
  return lines.join("\n");
}

export function MailListClient({
  initialRows,
  initialStats,
  initialSearch,
  initialStatus,
  initialLeadId,
}: {
  initialRows: MailJobListRow[];
  initialStats: MailStats;
  initialSearch: string;
  initialStatus: MailStatusFilter;
  initialLeadId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState<MailStatusFilter>(initialStatus);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [letterPreview, setLetterPreview] = useState<LetterPreviewData | null>(null);
  const [, startTransition] = useTransition();

  const stats = initialStats;
  const rows = initialRows;
  const groups = useMemo(() => groupByBatch(rows), [rows]);

  // Push query-string changes when the user types or picks a filter.
  // Debounce search so we're not navigating on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search.trim()) params.set("q", search.trim());
      else params.delete("q");
      if (status !== "all") params.set("status", status);
      else params.delete("status");
      const next = params.toString();
      startTransition(() => {
        router.replace(`/mail${next ? `?${next}` : ""}`);
      });
    }, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  // Refresh on tab focus so users see updated statuses when they come
  // back to the tab. Cheap alternative to realtime subscriptions.
  useEffect(() => {
    function onFocus() {
      router.refresh();
    }
    function onVis() {
      if (document.visibilityState === "visible") router.refresh();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [router]);

  const exportCsv = useCallback(() => {
    const csv = rowsToCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `moss-mail-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [rows]);

  const openLetter = useCallback(async (jobId: string) => {
    const detail = await fetchMailJobAction(jobId);
    if (!detail) return;
    setLetterPreview({
      jobId: detail.id,
      recipientName: detail.recipient_name,
      bodyHtml: detail.body_html,
      trackingUrl: detail.tracking_url,
    });
  }, []);

  const toggleBatch = useCallback((batchId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  }, []);

  const statCards = [
    { label: "In Transit", value: stats.in_flight, sub: "Pieces Moving" },
    { label: "Delivered", value: stats.delivered, sub: "Reached Recipient" },
    {
      label: "Returned",
      value: stats.returned,
      sub: "Re-Verify Address",
      warn: stats.returned > 0,
    },
    { label: "Failed", value: stats.failed, sub: "Errored Before Mailing", warn: stats.failed > 0 },
  ];

  return (
    <div>
      {initialLeadId && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-petrol-200 bg-petrol-50/60 px-3 py-2 text-[12px] text-petrol-700">
          <span>
            Filtered to one lead.{" "}
            <Link
              href={`/leads/${initialLeadId}`}
              className="cursor-pointer font-medium underline"
            >
              Open Lead
            </Link>
          </span>
          <Link
            href="/mail"
            className="cursor-pointer text-[11px] font-medium hover:text-petrol-900"
          >
            Clear Filter
          </Link>
        </div>
      )}

      <div className="mb-5 grid grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-lg border bg-surface p-4 shadow-card ${
              card.warn ? "border-danger" : "border-gray-200"
            }`}
          >
            <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              {card.label}
            </div>
            <div
              className={`mt-1 text-[22px] font-medium ${
                card.warn ? "text-danger" : "text-ink"
              }`}
            >
              {card.value}
            </div>
            <div className="text-[11px] text-gray-500">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Search + filter chips + actions */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <IconSearch
            size={14}
            stroke={1.75}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Recipient, City, State"
            className="w-full rounded-md border border-gray-200 bg-white pl-8 pr-3 py-2 text-[12.5px] text-ink placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-petrol-300"
          />
        </div>
        <div className="flex items-center gap-1">
          {STATUS_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setStatus(chip.id)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-[11.5px] font-medium transition-colors",
                status === chip.id
                  ? "border-ink bg-ink text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-ink"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="cursor-pointer rounded-md border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
            title="Refresh"
          >
            <IconRefresh size={14} stroke={1.75} />
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-ink hover:bg-gray-50 disabled:opacity-50"
          >
            <IconDownload size={13} stroke={1.75} /> Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-surface shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-gray-500"></th>
              <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-gray-500">
                Recipient
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-gray-500">
                Class
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-gray-500">
                Status
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-gray-500">
                Sent
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-gray-500">
                Delivered
              </th>
              <th className="px-4 py-2 text-right text-[10px] font-medium uppercase tracking-wide text-gray-500">
                Track
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-[12px] text-gray-500"
                >
                  No mail matches the current filter.
                </td>
              </tr>
            ) : (
              groups.flatMap((group) => {
                const isExpanded = expanded.has(group.batch_id);
                if (!group.is_batch) {
                  const r = group.rows[0];
                  return [
                    <Row
                      key={r.id}
                      row={r}
                      indent={false}
                      onOpenDetail={() => setDetailId(r.id)}
                      onOpenLetter={() => void openLetter(r.id)}
                    />,
                  ];
                }
                const summary = summarizeBatch(group);
                const summaryRow = (
                  <tr
                    key={`batch-${group.batch_id}`}
                    className="border-b border-gray-150 last:border-b-0 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleBatch(group.batch_id)}
                  >
                    <td className="px-4 py-2 text-gray-400">
                      {isExpanded ? (
                        <IconChevronDown size={14} stroke={1.75} />
                      ) : (
                        <IconChevronRight size={14} stroke={1.75} />
                      )}
                    </td>
                    <td className="px-4 py-2 text-[13px]">
                      <div className="font-medium text-ink">
                        Batch of {group.rows.length}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {group.rows[0].recipient_name}
                        {group.rows.length > 1
                          ? ` + ${group.rows.length - 1} more`
                          : ""}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-[12px] text-ink">
                      {MAIL_CLASS_LABEL[group.rows[0].mail_class]}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap items-center gap-1">
                        {summary.delivered > 0 && (
                          <BatchPill label={`${summary.delivered} delivered`} tone="ok" />
                        )}
                        {summary.in_flight > 0 && (
                          <BatchPill label={`${summary.in_flight} in transit`} tone="neutral" />
                        )}
                        {summary.returned > 0 && (
                          <BatchPill label={`${summary.returned} returned`} tone="danger" />
                        )}
                        {summary.failed > 0 && (
                          <BatchPill label={`${summary.failed} failed`} tone="danger" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-[12px] text-gray-600">
                      {fmtDate(group.rows[0].sent_at)}
                    </td>
                    <td className="px-4 py-2 text-[12px] text-gray-600">—</td>
                    <td className="px-4 py-2 text-right text-[12px] text-gray-400">
                      —
                    </td>
                  </tr>
                );
                if (!isExpanded) return [summaryRow];
                return [
                  summaryRow,
                  ...group.rows.map((r) => (
                    <Row
                      key={r.id}
                      row={r}
                      indent={true}
                      onOpenDetail={() => setDetailId(r.id)}
                      onOpenLetter={() => void openLetter(r.id)}
                    />
                  )),
                ];
              })
            )}
          </tbody>
        </table>
      </div>

      <MailDetailDrawer
        jobId={detailId}
        onClose={() => setDetailId(null)}
        onOpenLetter={(d) => setLetterPreview(d)}
        onResent={() => {
          setDetailId(null);
          router.refresh();
        }}
      />

      <LetterPreviewModal
        data={letterPreview}
        onClose={() => setLetterPreview(null)}
      />
    </div>
  );
}

function Row({
  row,
  indent,
  onOpenDetail,
  onOpenLetter,
}: {
  row: MailJobListRow;
  indent: boolean;
  onOpenDetail: () => void;
  onOpenLetter: () => void;
}) {
  return (
    <tr className="border-b border-gray-150 last:border-b-0 hover:bg-gray-50">
      <td className={cn("px-4 py-2", indent && "pl-10")}></td>
      <td className="px-4 py-2 text-[13px]">
        <button
          type="button"
          onClick={onOpenDetail}
          className="cursor-pointer text-left"
        >
          <div className="font-medium text-ink hover:text-petrol-700">
            {row.recipient_name}
          </div>
          <div className="text-[11px] text-gray-500">
            {row.recipient_address_line1}, {row.recipient_city},{" "}
            {row.recipient_state} {row.recipient_postal_code}
            {row.include_check && row.check_amount_cents != null
              ? ` · check $${(row.check_amount_cents / 100).toFixed(2)}`
              : ""}
          </div>
        </button>
      </td>
      <td className="px-4 py-2 text-[12px] text-ink">
        {MAIL_CLASS_LABEL[row.mail_class]}
      </td>
      <td className="px-4 py-2">
        <MailStatusPill status={row.status} />
        {row.status === "failed" && row.error_message && (
          <div className="mt-[2px] text-[10px] text-danger max-w-[200px] truncate" title={row.error_message}>
            {row.error_message}
          </div>
        )}
      </td>
      <td className="px-4 py-2 text-[12px] text-gray-600">{fmtDate(row.sent_at)}</td>
      <td className="px-4 py-2 text-[12px] text-gray-600">
        {fmtDate(row.delivered_at ?? row.returned_at)}
      </td>
      <td className="px-4 py-2 text-right text-[12px]">
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenLetter}
            className="cursor-pointer text-petrol-500 hover:text-petrol-700"
            title="View Letter"
          >
            View
          </button>
          {row.tracking_url ? (
            <a
              href={row.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center gap-1 text-petrol-500 hover:text-petrol-700"
            >
              Track
              <IconExternalLink size={11} stroke={1.75} />
            </a>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      </td>
    </tr>
  );
}

function BatchPill({
  label,
  tone,
}: {
  label: string;
  tone: "ok" | "neutral" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-[1px] text-[10px] font-medium",
        tone === "ok" && "bg-white text-petrol-700 ring-1 ring-inset ring-petrol-200",
        tone === "neutral" && "bg-white text-ink ring-1 ring-inset ring-gray-200",
        tone === "danger" && "bg-white text-danger ring-1 ring-inset ring-danger/30"
      )}
    >
      {label}
    </span>
  );
}
