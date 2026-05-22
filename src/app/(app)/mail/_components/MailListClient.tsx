"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  IconSearch,
  IconChevronDown,
  IconChevronRight,
  IconDownload,
  IconExternalLink,
  IconTruckDelivery,
  IconHomeCheck,
  IconArrowBackUp,
} from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import { MailStatusPill } from "@/components/mail/MailStatusPill";
import { LetterPreviewModal, type LetterPreviewData } from "@/components/mail/LetterPreviewModal";
import { displayRecipientName } from "@/components/mail/displayName";
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
];

function fmtSurplus(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${Math.round(dollars / 1_000)}K`;
  return `$${Math.round(dollars)}`;
}

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
  showNeedsAttention = false,
}: {
  initialRows: MailJobListRow[];
  initialStats: MailStats;
  initialSearch: string;
  initialStatus: MailStatusFilter;
  initialLeadId: string | null;
  // Needs Attention surfaces returned/failed pieces above the table.
  // Only renders when scoped to a single lead — on the global /mail
  // dashboard it'd surface returned pieces across all leads which is
  // noise. Lead Mail tab passes true; /mail leaves it false.
  showNeedsAttention?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
        const base = pathname || "/mail";
        // scroll: false stops Next from scrolling to top on every chip
        // click — the user expects only the rows to change.
        router.replace(`${base}${next ? `?${next}` : ""}`, { scroll: false });
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

  const toggleBatch = useCallback((batchId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  }, []);

  return (
    <div>

      {/* Typographic stat banner. Three numbers inline as a magazine
          masthead instead of a SaaS tile grid. Reads differently from
          every other dashboard in the portal. */}
      <div className="mb-6 border-b border-gray-200 pb-5">
        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
          <StatNumber
            value={stats.in_flight}
            label="In Transit"
            Icon={IconTruckDelivery}
            tone="neutral"
          />
          <span className="hidden text-gray-200 sm:inline">|</span>
          <StatNumber
            value={stats.delivered}
            label="Delivered"
            Icon={IconHomeCheck}
            tone="ok"
          />
          <span className="hidden text-gray-200 sm:inline">|</span>
          <StatNumber
            value={stats.returned}
            label="Returned"
            Icon={IconArrowBackUp}
            tone={stats.returned > 0 ? "danger" : "neutral"}
          />
        </div>
      </div>

      {/* Needs Attention — lead-scoped only. Hides on the global /mail
          dashboard because surfacing returned pieces across every lead
          is noise; an operator works on one lead at a time. */}
      {showNeedsAttention && (
        <NeedsAttentionSection
          rows={rows}
          onOpen={(id) => setDetailId(id)}
        />
      )}

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
            placeholder="Search by name, city, or state"
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
                "cursor-pointer rounded-[4px] border px-[10px] py-[5px] text-[9.5px] font-semibold uppercase leading-none tracking-[0.12em] transition-colors",
                status === chip.id
                  ? "border-ink bg-ink text-white"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-ink"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
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

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/60">
              <th className="w-[64px] px-4 py-3"></th>
              <th className="px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500">
                Recipient
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500">
                Class
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500">
                Sent
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500">
                Delivered
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500">
                Tracking
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
                    <td className="px-4 py-2 text-left text-[12px] text-gray-400">
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
        onDeleted={() => {
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
}: {
  row: MailJobListRow;
  indent: boolean;
  onOpenDetail: () => void;
}) {
  return (
    <tr className="border-b border-gray-150 last:border-b-0 hover:bg-gray-50">
      <td className={cn("py-3", indent ? "pl-10 w-8" : "w-2")}></td>
      <td className="px-4 py-3 text-[13px]">
        <button
          type="button"
          onClick={onOpenDetail}
          className="cursor-pointer text-left"
        >
          <div className="font-semibold text-ink hover:text-petrol-700">
            {displayRecipientName(row.recipient_name)}
          </div>
          {(row.lead_label || row.lead_surplus_cents != null) && (
            <div className="mt-[1px] text-[11px] text-gray-500">
              {row.lead_label && (
                <span className="text-ink/70">{row.lead_label}</span>
              )}
              {row.lead_label && row.lead_surplus_cents != null && (
                <span className="text-gray-400"> · </span>
              )}
              {row.lead_surplus_cents != null && (
                <span>{fmtSurplus(row.lead_surplus_cents)} surplus</span>
              )}
            </div>
          )}
          <div className="text-[11.5px] text-gray-500">
            {row.recipient_address_line1}, {row.recipient_city},{" "}
            {row.recipient_state} {row.recipient_postal_code}
            {row.include_check && row.check_amount_cents != null
              ? ` · check $${(row.check_amount_cents / 100).toFixed(2)}`
              : ""}
          </div>
        </button>
      </td>
      <td className="px-4 py-3 text-[12px] text-ink">
        {MAIL_CLASS_LABEL[row.mail_class]}
      </td>
      <td className="px-4 py-3">
        <MailStatusPill status={row.status} />
        {row.status === "failed" && row.error_message && (
          <div className="mt-[2px] text-[10px] text-danger max-w-[200px] truncate" title={row.error_message}>
            {row.error_message}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-[12px] text-gray-600">{fmtDate(row.sent_at)}</td>
      <td className="px-4 py-3 text-[12px] text-gray-600">
        {fmtDate(row.delivered_at ?? row.returned_at)}
      </td>
      <td className="px-4 py-3 text-left text-[12px]">
        {row.tracking_number ? (
          row.tracking_url ? (
            <a
              href={row.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center gap-1 font-mono text-[11.5px] text-petrol-500 hover:text-petrol-700"
              onClick={(e) => e.stopPropagation()}
            >
              {row.tracking_number}
              <IconExternalLink size={11} stroke={1.75} />
            </a>
          ) : (
            <span className="font-mono text-[11.5px] text-ink">
              {row.tracking_number}
            </span>
          )
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
}

// Visually distinct card-stack section that floats returned/failed
// pieces above the main table so actionable items don't get buried.
// Renders nothing when there are zero. Layout intentionally differs
// from the table — paired cards with a left-border accent, larger
// type, primary action button per card. This is the "different layout
// per section" Bree liked from the settings panels.
function NeedsAttentionSection({
  rows,
  onOpen,
}: {
  rows: MailJobListRow[];
  onOpen: (id: string) => void;
}) {
  const needs = rows.filter((r) => r.status === "returned" || r.status === "failed");
  if (needs.length === 0) return null;
  return (
    <section className="mb-5">
      <div className="mb-2">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-gray-500">
          Needs Attention
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {needs.slice(0, 4).map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onOpen(r.id)}
            className="cursor-pointer rounded-lg border border-l-4 border-gray-200 border-l-danger bg-white px-4 py-3 text-left transition-shadow hover:shadow-card"
          >
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium text-ink">
                  {displayRecipientName(r.recipient_name)}
                </div>
                <div className="truncate text-[11.5px] text-gray-500">
                  {r.recipient_address_line1}, {r.recipient_city},{" "}
                  {r.recipient_state} {r.recipient_postal_code}
                </div>
              </div>
              <span className="shrink-0 text-[10.5px] font-medium uppercase tracking-wide text-danger">
                Returned
              </span>
            </div>
            {r.error_message && (
              <div className="mt-2 line-clamp-2 text-[11.5px] text-gray-700">
                {r.error_message}
              </div>
            )}
            <div className="mt-2 text-[11.5px] font-medium text-petrol-600">
              Fix Address &amp; Resend →
            </div>
          </button>
        ))}
      </div>
      {needs.length > 4 && (
        <div className="mt-2 text-[11px] text-gray-500">
          + {needs.length - 4} more. Use the Returned filter below to see all.
        </div>
      )}
    </section>
  );
}

function StatNumber({
  value,
  label,
  Icon,
  tone = "neutral",
}: {
  value: number;
  label: string;
  Icon: typeof IconTruckDelivery;
  tone?: "neutral" | "ok" | "danger";
}) {
  return (
    <div className="flex items-baseline gap-2">
      <Icon
        size={16}
        stroke={1.75}
        className={cn(
          "translate-y-[1px]",
          tone === "ok" && "text-petrol-500",
          tone === "danger" && "text-danger",
          tone === "neutral" && "text-gray-400"
        )}
      />
      <span
        className={cn(
          "text-[40px] font-semibold leading-none tracking-tight",
          tone === "danger" ? "text-danger" : "text-ink"
        )}
      >
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-[0.1em] text-gray-500">
        {label}
      </span>
    </div>
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
        "inline-flex items-center justify-center rounded-[4px] px-[8px] py-[4px] text-[9px] font-semibold uppercase leading-none tracking-[0.1em]",
        tone === "ok" && "bg-petrol-500 text-white",
        tone === "neutral" && "bg-ink text-white",
        tone === "danger" && "bg-danger text-white"
      )}
    >
      {label}
    </span>
  );
}
