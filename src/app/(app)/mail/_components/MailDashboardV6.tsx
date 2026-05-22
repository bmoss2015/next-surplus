"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  IconMail,
  IconChevronDown,
} from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import { displayRecipientName } from "@/components/mail/displayName";
import type { MailJobListRow, MailStats } from "@/lib/mail/fetch";
import {
  MailToolbar,
  type MailFilterState,
  DEFAULT_MAIL_FILTERS,
  filtersAreActive,
  readFiltersFromParams,
  writeFiltersToParams,
} from "./MailToolbar";

// V6 main /mail tab. Filter toolbar + KPI strip + pipeline bar + three
// status sections (In Transit with batch grouping, Delivered, Returned).
//
// Filters apply client-side over the 200-row / 30-day fetch. Group
// headers stay; filters narrow contents. Empty groups hide when filters
// are active (so you don't read "No deliveries" as a real-state signal
// when it's actually filter-state). With no filters, empty groups show
// the friendly empty row so the page never looks broken.

type Section = "in_transit" | "delivered" | "returned";

type BatchOrPiece =
  | { kind: "piece"; piece: MailJobListRow }
  | { kind: "batch"; batchId: string; pieces: MailJobListRow[] };

function groupByBatch(rows: MailJobListRow[]): BatchOrPiece[] {
  const byBatch = new Map<string, MailJobListRow[]>();
  for (const r of rows) {
    const arr = byBatch.get(r.batch_id) ?? [];
    arr.push(r);
    byBatch.set(r.batch_id, arr);
  }
  const seen = new Set<string>();
  const out: BatchOrPiece[] = [];
  for (const r of rows) {
    if (seen.has(r.batch_id)) continue;
    seen.add(r.batch_id);
    const arr = byBatch.get(r.batch_id) ?? [];
    if (arr.length > 1) {
      out.push({ kind: "batch", batchId: r.batch_id, pieces: arr });
    } else {
      out.push({ kind: "piece", piece: arr[0] });
    }
  }
  return out;
}

function fmtDateLong(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysAgoLabel(iso: string | null): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

function isWithinDays(iso: string | null, days: number): boolean {
  if (!iso) return false;
  const ms = Date.now() - new Date(iso).getTime();
  return ms <= days * 24 * 60 * 60 * 1000 && ms >= 0;
}

function matchesFilters(
  r: MailJobListRow,
  f: MailFilterState,
  qNorm: string
): boolean {
  // Status — UI groups status into 3 buckets (in_transit, delivered,
  // returned). Map row statuses to those buckets for the match.
  if (f.status.length > 0) {
    const bucket =
      r.status === "queued" || r.status === "in_transit"
        ? "in_transit"
        : r.status === "delivered"
          ? "delivered"
          : "returned";
    if (!f.status.includes(bucket)) return false;
  }
  if (f.mailClass.length > 0 && !f.mailClass.includes(r.mail_class)) {
    return false;
  }
  if (f.provider.length > 0 && !f.provider.includes(r.provider)) {
    return false;
  }
  // Date range narrows the fetched 30-day window.
  if (f.dateRange === "7d" && !isWithinDays(r.sent_at ?? r.created_at, 7)) {
    return false;
  }
  if (qNorm) {
    const hay = [
      r.recipient_name,
      r.recipient_address_line1,
      r.recipient_address_line2 ?? "",
      r.recipient_city,
      r.recipient_state,
      r.recipient_postal_code,
      r.tracking_number ?? "",
      r.lead_label ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(qNorm)) return false;
  }
  return true;
}

export function MailDashboardV6({
  rows,
  stats,
}: {
  rows: MailJobListRow[];
  stats: MailStats;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => readFiltersFromParams(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const setFilters = useCallback(
    (next: MailFilterState) => {
      const params = writeFiltersToParams(
        new URLSearchParams(searchParams.toString()),
        next
      );
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams]
  );

  const hasActiveFilters = filtersAreActive(filters);

  // Filtered rows (search + chip filters applied)
  const filteredRows = useMemo(() => {
    const qNorm = filters.q.trim().toLowerCase();
    if (!hasActiveFilters) return rows;
    return rows.filter((r) => matchesFilters(r, filters, qNorm));
  }, [rows, filters, hasActiveFilters]);

  // Derived KPIs — operate on filtered rows so the strip reflects the
  // current view. Stats from server stay raw; KPI strip is the live
  // read of what's on screen.
  const sentToday = useMemo(
    () => filteredRows.filter((r) => isWithinDays(r.sent_at, 1)).length,
    [filteredRows]
  );
  const deliveredThisWeek = useMemo(
    () =>
      filteredRows.filter(
        (r) => r.status === "delivered" && isWithinDays(r.delivered_at, 7)
      ).length,
    [filteredRows]
  );

  const inTransitRows = filteredRows.filter(
    (r) => r.status === "queued" || r.status === "in_transit"
  );
  const deliveredRows = filteredRows.filter((r) => r.status === "delivered");
  const returnedRows = filteredRows.filter(
    (r) => r.status === "returned" || r.status === "failed"
  );

  const inTransitGrouped = groupByBatch(inTransitRows);

  // Stats source — when filters are active, recompute from filtered
  // rows so KPIs reflect what's visible. With no filters, use the
  // server-side stats (which are accurate even past the 200-row fetch
  // cap).
  const displayStats = hasActiveFilters
    ? {
        in_flight: inTransitRows.length,
        delivered: deliveredRows.length,
        returned: returnedRows.length,
        spent_cents: 0,
      }
    : stats;

  return (
    <div>
      <MailToolbar filters={filters} onChange={setFilters} />

      {/* KPI strip — no subtext, four operational counts */}
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="In Transit" value={displayStats.in_flight} />
        <Kpi label="Sent Today" value={sentToday} />
        <Kpi label="Delivered This Week" value={deliveredThisWeek} />
        <Kpi
          label={hasActiveFilters ? "Returned" : "Returned This Month"}
          value={displayStats.returned}
          warn={displayStats.returned > 0}
        />
      </div>

      {/* Pipeline bar */}
      <PipelineSection
        inTransit={displayStats.in_flight}
        delivered={displayStats.delivered}
        returned={displayStats.returned}
      />

      {/* Three status sections. With filters active, empty sections hide
          (so the page doesn't claim "no deliveries" when it really means
          "none match"). With no filters, empty sections show the empty
          state row. */}
      {(inTransitGrouped.length > 0 || !hasActiveFilters) && (
        <ListSection eyebrow="In Transit">
          {inTransitGrouped.length === 0 ? (
            <EmptyRow text="No pieces in transit." />
          ) : (
            inTransitGrouped.map((item) =>
              item.kind === "batch" ? (
                <BatchRow batch={item.pieces} batchId={item.batchId} key={item.batchId} />
              ) : (
                <PieceRow piece={item.piece} section="in_transit" key={item.piece.id} />
              )
            )
          )}
        </ListSection>
      )}

      {(deliveredRows.length > 0 || !hasActiveFilters) && (
        <ListSection eyebrow="Delivered">
          {deliveredRows.length === 0 ? (
            <EmptyRow text="No deliveries in the last 30 days." />
          ) : (
            deliveredRows.map((p) => (
              <PieceRow piece={p} section="delivered" key={p.id} />
            ))
          )}
        </ListSection>
      )}

      {(returnedRows.length > 0 || !hasActiveFilters) && (
        <ListSection eyebrow="Returned" tone="danger">
          {returnedRows.length === 0 ? (
            <EmptyRow text="No returned pieces." />
          ) : (
            returnedRows.map((p) => (
              <PieceRow piece={p} section="returned" key={p.id} />
            ))
          )}
        </ListSection>
      )}

      {hasActiveFilters && filteredRows.length === 0 && (
        <div className="mt-5 rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center text-[13px] text-gray-500 shadow-card">
          No pieces match these filters.
        </div>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  warn,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
      <div
        className={cn(
          "text-[10px] font-semibold uppercase tracking-[0.14em]",
          warn ? "text-danger" : "text-gray-500"
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "mt-3 text-[42px] font-semibold leading-none tracking-tight tabular-nums",
          warn ? "text-danger" : "text-ink"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function PipelineSection({
  inTransit,
  delivered,
  returned,
}: {
  inTransit: number;
  delivered: number;
  returned: number;
}) {
  const total = inTransit + delivered + returned;
  if (total === 0) return null;
  return (
    <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
      <div className="flex items-baseline justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
          Pipeline
        </div>
        <div className="text-[11px] text-gray-500">{total} pieces total</div>
      </div>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-gray-100">
        <div className="bg-ink" style={{ width: `${(inTransit / total) * 100}%` }} />
        <div
          className="bg-petrol-500"
          style={{ width: `${(delivered / total) * 100}%` }}
        />
        <div className="bg-danger" style={{ width: `${(returned / total) * 100}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-4 text-[12px]">
        <PipelinePair color="bg-ink" label="In Transit" count={inTransit} />
        <PipelinePair color="bg-petrol-500" label="Delivered" count={delivered} />
        <PipelinePair
          color="bg-danger"
          label="Returned"
          count={returned}
          warn={returned > 0}
        />
      </div>
    </section>
  );
}

function PipelinePair({
  color,
  label,
  count,
  warn,
}: {
  color: string;
  label: string;
  count: number;
  warn?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </span>
      <span
        className={cn(
          "ml-auto text-[16px] font-semibold tabular-nums",
          warn ? "text-danger" : "text-ink"
        )}
      >
        {count}
      </span>
    </div>
  );
}

function ListSection({
  eyebrow,
  trailing,
  tone,
  children,
}: {
  eyebrow: string;
  trailing?: React.ReactNode;
  tone?: "danger";
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "mt-5 overflow-hidden rounded-2xl border bg-white shadow-card",
        tone === "danger" ? "border-danger/20" : "border-gray-200"
      )}
    >
      <header className="flex items-baseline justify-between border-b border-gray-100 px-6 py-3.5">
        <div
          className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.14em]",
            tone === "danger" ? "text-danger" : "text-gray-500"
          )}
        >
          {eyebrow}
        </div>
        {trailing}
      </header>
      <div className="divide-y divide-gray-100">{children}</div>
    </section>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="px-6 py-6 text-center text-[12px] text-gray-500">
      {text}
    </div>
  );
}

function PieceRow({
  piece,
  section,
  isBatchChild,
}: {
  piece: MailJobListRow;
  section: Section;
  isBatchChild?: boolean;
}) {
  // Three distinct pill styles, anchored on the Settings Members role-tab
  // family: ink (solid black-filled) for In Transit since it's the
  // neutral/default state; outlined petrol for Delivered; outlined red
  // for Returned. The black option is used because In Transit doesn't
  // share a color with any action button, so no informational vs
  // clickable conflict.
  const pillClass =
    section === "delivered"
      ? "border-petrol-500/40 bg-white text-petrol-700"
      : section === "returned"
        ? "border-danger/40 bg-white text-danger"
        : "border-ink bg-ink text-white";
  const pillLabel =
    section === "delivered"
      ? "Delivered"
      : section === "returned"
        ? "Returned"
        : "In Transit";

  const href = piece.lead_id ? `/leads/${piece.lead_id}?tab=mail` : "#";

  return (
    <Link
      href={href}
      className={cn(
        "group grid grid-cols-[1fr_auto] items-start gap-5 px-6 py-4 transition-colors hover:bg-gray-50",
        isBatchChild && "pl-12 bg-gray-50/40"
      )}
    >
      {/* Left column — strict order: name + pill, address, meta */}
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold text-ink">
            {displayRecipientName(piece.recipient_name)}
          </span>
          <span
            className={cn(
              "inline-flex min-w-[76px] items-center justify-center rounded-[4px] border bg-white px-[10px] py-[5px] text-[9.5px] font-semibold uppercase leading-none tracking-[0.12em]",
              pillClass
            )}
          >
            {pillLabel}
          </span>
        </div>

        <div className="mt-1 text-[12.5px] text-gray-600">
          {piece.recipient_address_line1}
          {piece.recipient_address_line2 ? `, ${piece.recipient_address_line2}` : ""}
          {`, ${piece.recipient_city}, ${piece.recipient_state} ${piece.recipient_postal_code}`}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <IconMail size={13} stroke={1.75} className="text-gray-400" />
            {mailClassLabel(piece.mail_class)}
          </span>
          <span className="text-gray-300">·</span>
          <span>Sent {fmtDateLong(piece.sent_at) || daysAgoLabel(piece.sent_at)}</span>
          {section === "delivered" && piece.delivered_at && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-petrol-700">
                Delivered {fmtDateLong(piece.delivered_at)}
              </span>
            </>
          )}
          {section === "returned" && piece.returned_at && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-danger">
                Returned {fmtDateLong(piece.returned_at)}
                {piece.error_message ? ` (${piece.error_message})` : ""}
              </span>
            </>
          )}
          {piece.include_check && piece.check_amount_cents != null && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-petrol-700">
                Check ${(piece.check_amount_cents / 100).toFixed(2)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right column — actions. Solid buttons (clickable affordance);
          same hue as the status pill but different weight. */}
      <div className="flex shrink-0 items-center gap-2">
        {section === "returned" ? (
          <button
            type="button"
            className="inline-flex h-[30px] min-w-[110px] cursor-pointer items-center justify-center rounded-md bg-danger px-3 text-[11.5px] font-semibold text-white"
          >
            Fix &amp; Resend
          </button>
        ) : (
          <>
            {/* All three action buttons (View Letter, Track, Fix &
                Resend) share min-w-[110px] so they read as a consistent
                button family regardless of label length. Width set to
                fit the longest phrase ("Fix & Resend"). */}
            <button
              type="button"
              className="inline-flex h-[30px] min-w-[110px] cursor-pointer items-center justify-center rounded-md bg-petrol-500 px-3 text-[11.5px] font-medium text-white shadow-[0_1px_2px_rgba(13,75,58,0.25)] hover:bg-petrol-600"
            >
              View Letter
            </button>
            {piece.tracking_url ? (
              <a
                href={piece.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex h-[30px] min-w-[110px] cursor-pointer items-center justify-center rounded-md border border-petrol-500/25 bg-white px-3 text-[11.5px] font-medium text-petrol-700 hover:bg-petrol-50"
              >
                Track
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex h-[30px] min-w-[110px] cursor-not-allowed items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-[11.5px] font-medium text-gray-400"
              >
                Track
              </button>
            )}
          </>
        )}
      </div>
    </Link>
  );
}

function BatchRow({
  batch,
  batchId,
}: {
  batch: MailJobListRow[];
  batchId: string;
}) {
  void batchId;
  const first = batch[0];
  const names = batch.map((p) => displayRecipientName(p.recipient_name)).join(", ");
  return (
    <details className="group">
      <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-start gap-5 px-6 py-4 transition-colors hover:bg-gray-50">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-semibold text-ink">
              Batch of {batch.length}
            </span>
            <span className="inline-flex min-w-[76px] items-center justify-center rounded-[4px] border border-ink bg-ink px-[10px] py-[5px] text-[9.5px] font-semibold uppercase leading-none tracking-[0.12em] text-white">
              In Transit
            </span>
          </div>
          <div className="mt-1 text-[12.5px] text-gray-600">{names}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-600">
            <span className="inline-flex items-center gap-1.5">
              <IconMail size={13} stroke={1.75} className="text-gray-400" />
              {mailClassLabel(first.mail_class)}
            </span>
            <span className="text-gray-300">·</span>
            <span>Sent {fmtDateLong(first.sent_at)}</span>
          </div>
        </div>
        {/* Batch affordance spans View Letter + gap + Track exactly:
            110 + 8 + 110 = 228px. Solid petrol fill, same h-[30px]. */}
        <div className="flex shrink-0 items-center">
          <span
            className="inline-flex h-[30px] cursor-pointer items-center justify-center gap-2 rounded-md bg-petrol-500 px-3 text-[11.5px] font-medium text-white shadow-[0_1px_2px_rgba(13,75,58,0.25)] hover:bg-petrol-600"
            style={{ minWidth: "228px" }}
          >
            Expand Batch
            <IconChevronDown
              size={14}
              stroke={2}
              className="transition-transform group-open:rotate-180"
            />
          </span>
        </div>
      </summary>
      <div className="border-t border-gray-100">
        {batch.map((p) => (
          <PieceRow piece={p} section="in_transit" isBatchChild key={p.id} />
        ))}
      </div>
    </details>
  );
}

function mailClassLabel(mc: MailJobListRow["mail_class"]): string {
  if (mc === "standard") return "Standard";
  if (mc === "certified") return "Certified";
  return "First Class";
}
