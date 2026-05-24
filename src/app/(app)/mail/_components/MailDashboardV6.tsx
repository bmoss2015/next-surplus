"use client";

import { useCallback, useMemo, useState, createContext, useContext } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  IconMail,
  IconChevronDown,
  IconCalendarTime,
  IconCheck,
  IconArrowBack,
  IconCash,
  IconMailbox,
} from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import { displayRecipientName } from "@/components/mail/displayName";
import { LetterPreviewModal } from "@/components/mail/LetterPreviewModal";
import { fetchMailJobAction } from "@/app/(app)/mail/_fetchers";
import type { MailJobListRow, MailStats } from "@/lib/mail/fetch";
import {
  MailToolbar,
  type MailFilterState,
  DEFAULT_MAIL_FILTERS,
  filtersAreActive,
  readFiltersFromParams,
  writeFiltersToParams,
} from "./MailToolbar";

// Context lets nested PieceRow components trigger the dashboard-level
// LetterPreviewModal without prop-drilling through ListSection / BatchRow.
type LetterOpener = (piece: MailJobListRow) => void;
const ViewLetterContext = createContext<LetterOpener>(() => {});

// V6 main /mail tab. Filter toolbar + KPI strip + pipeline bar + three
// status sections (In Transit with batch grouping, Delivered, Returned).
//
// Filters apply client-side over the 200-row / 30-day fetch. Group
// headers stay; filters narrow contents. Empty groups hide when filters
// are active (so you don't read "No deliveries" as a real-state signal
// when it's actually filter-state). With no filters, empty groups show
// the friendly empty row so the page never looks broken.

type Section = "processing" | "in_transit" | "delivered" | "returned";

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
  // Status — four UI buckets (processing, in_transit, delivered,
  // returned). 'queued' is the legacy pre-migration status that maps
  // to 'processing'; 'failed' rolls into 'returned' (terminal bad).
  if (f.status.length > 0) {
    const bucket =
      r.status === "processing" || r.status === "queued"
        ? "processing"
        : r.status === "in_transit"
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

  // Status buckets. 'queued' is legacy (pre-migration 0130) and rolls
  // into 'processing'. 'failed' rolls into 'returned' for display.
  const processingRows = filteredRows.filter(
    (r) => r.status === "processing" || r.status === "queued"
  );
  const inTransitRows = filteredRows.filter((r) => r.status === "in_transit");
  const deliveredRows = filteredRows.filter((r) => r.status === "delivered");
  const returnedRows = filteredRows.filter(
    (r) => r.status === "returned" || r.status === "failed"
  );

  const processingGrouped = groupByBatch(processingRows);
  const inTransitGrouped = groupByBatch(inTransitRows);

  // Stats source — when filters are active, recompute from filtered
  // rows so KPIs reflect what's visible. With no filters, use the
  // server-side stats (which are accurate even past the 200-row fetch
  // cap). Processing + In Transit are reported separately; the
  // "in_flight" stat from the server covers both (pre-delivered).
  const displayStats = hasActiveFilters
    ? {
        processing: processingRows.length,
        in_flight: inTransitRows.length,
        delivered: deliveredRows.length,
        returned: returnedRows.length,
        spent_cents: 0,
      }
    : { ...stats, processing: processingRows.length };

  // Dashboard-level letter preview modal — opened inline when the user
  // clicks View Letter on any row. Avoids round-tripping to the lead
  // page just to see the letter. body_html is lazy-fetched on open
  // (the list row only carries enough fields for the row itself).
  const [openLetter, setOpenLetter] = useState<{
    jobId: string;
    recipientName: string;
    bodyHtml: string | null;
    trackingUrl: string | null;
  } | null>(null);
  const onViewLetter = useCallback<LetterOpener>(async (piece) => {
    // Optimistic open with the row's data (body_html isn't on the row).
    setOpenLetter({
      jobId: piece.id,
      recipientName: displayRecipientName(piece.recipient_name),
      bodyHtml: null,
      trackingUrl: piece.tracking_url ?? null,
    });
    // Fetch the full body and merge it in so LetterPreviewModal's
    // bodyHtml short-circuit fires for HTML-body sends.
    const detail = await fetchMailJobAction(piece.id);
    setOpenLetter((cur) =>
      cur && cur.jobId === piece.id
        ? { ...cur, bodyHtml: detail?.body_html ?? null }
        : cur
    );
  }, []);

  return (
    <ViewLetterContext.Provider value={onViewLetter}>
    <div>
      <LetterPreviewModal
        data={openLetter}
        onClose={() => setOpenLetter(null)}
      />
      <MailToolbar filters={filters} onChange={setFilters} />

      {/* KPI strip — five operational counts now that Processing is
          a first-class status. Processing pieces are at Lob being
          printed; In Transit have a tracking_number and are with USPS. */}
      <div className="grid grid-cols-5 gap-4">
        <Kpi label="Processing" value={displayStats.processing} />
        <Kpi label="In Transit" value={displayStats.in_flight} />
        <Kpi label="Sent Today" value={sentToday} />
        <Kpi label="Delivered This Week" value={deliveredThisWeek} />
        <Kpi
          label={hasActiveFilters ? "Returned" : "Returned This Month"}
          value={displayStats.returned}
          warn={displayStats.returned > 0}
        />
      </div>

      {/* Pipeline bar removed — the four-tile KPI strip above already
          surfaces in-transit / delivered / returned counts. The bar
          added visual noise without decision-relevant signal. */}

      {/* Four status sections (Processing, In Transit, Delivered,
          Returned). With filters active, empty sections hide so the
          page doesn't claim "no deliveries" when it really means
          "none match". With no filters, empty sections show the
          empty state row. */}
      {(processingGrouped.length > 0 ||
        (!hasActiveFilters && processingRows.length > 0)) && (
        <ListSection eyebrow="Processing" count={processingRows.length}>
          {processingGrouped.map((item) =>
            item.kind === "batch" ? (
              <BatchRow batch={item.pieces} batchId={item.batchId} key={item.batchId} />
            ) : (
              <PieceRow piece={item.piece} section="processing" key={item.piece.id} />
            )
          )}
        </ListSection>
      )}

      {(inTransitGrouped.length > 0 || !hasActiveFilters) && (
        <ListSection eyebrow="In Transit" count={inTransitRows.length}>
          {inTransitGrouped.length === 0 ? (
            <EmptyRow text="Nothing in transit right now. Send a letter from any lead to get started." />
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
        <ListSection eyebrow="Delivered" count={deliveredRows.length}>
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
        <ListSection
          eyebrow="Returned"
          count={returnedRows.length}
          tone="danger"
        >
          {returnedRows.length === 0 ? (
            <EmptyRow text="No returned pieces. Keep it that way." />
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
    </ViewLetterContext.Provider>
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

function ListSection({
  eyebrow,
  count,
  trailing,
  tone,
  children,
}: {
  eyebrow: string;
  count?: number;
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
        <div className="flex items-baseline gap-2.5">
          <div
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.14em]",
              tone === "danger" ? "text-danger" : "text-gray-500"
            )}
          >
            {eyebrow}
          </div>
          {typeof count === "number" && (
            <span
              className={cn(
                "inline-flex h-[18px] min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-semibold tabular-nums",
                tone === "danger"
                  ? "bg-danger/10 text-danger"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {count}
            </span>
          )}
        </div>
        {trailing}
      </header>
      <div className="divide-y divide-gray-100">{children}</div>
    </section>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <IconMailbox
        size={28}
        stroke={1.5}
        className="text-gray-300"
      />
      <div className="text-[12.5px] text-gray-500">{text}</div>
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
  const onViewLetter = useContext(ViewLetterContext);
  // Section is sourced from the real mail_jobs.status (post-migration
  // 0130). Four pill styles: solid ink for In Transit (default with
  // USPS), neutral gray outline for Processing (still at Lob), petrol
  // outline for Delivered, red outline for Returned.
  const pillClass =
    section === "delivered"
      ? "border-petrol-500/40 bg-white text-petrol-700"
      : section === "returned"
        ? "border-danger/40 bg-white text-danger"
        : section === "processing"
          ? "border-gray-300 bg-white text-gray-600"
          : "border-ink bg-ink text-white";
  const pillLabel =
    section === "delivered"
      ? "Delivered"
      : section === "returned"
        ? "Returned"
        : section === "processing"
          ? "Processing"
          : "In Transit";

  const href = piece.lead_id ? `/leads/${piece.lead_id}?tab=mail` : "#";

  return (
    <Link
      href={href}
      className={cn(
        // Flex row, NOT grid. Recipient is capped at max-w-[440px] so
        // it doesn't expand on wide screens and push the pill to the
        // right edge. Pill sits immediately after recipient. Actions
        // are pushed to the right with ml-auto. This is the only way
        // to anchor the pill at a consistent x-position; with grid
        // 1fr the pill always slides with the viewport width.
        "group relative flex items-start gap-4 px-6 py-4 transition-colors hover:bg-gray-50",
        isBatchChild && "bg-gray-50/60"
      )}
    >
      {isBatchChild && (
        <span
          aria-hidden
          className="absolute left-0 top-0 bottom-0"
          style={{ width: 3, background: "#0d4b3a" }}
        />
      )}
      {/* Left content column — name, address, meta. Capped at 440px
          so the pill doesn't drift right on wide screens. flex-1 so
          short-content rows still fill toward the cap. */}
      <div className="min-w-0 flex-1" style={{ maxWidth: 440 }}>
        <div className="truncate text-[15px] font-semibold text-ink">
          {displayRecipientName(piece.recipient_name)}
        </div>

        <div className="mt-1 text-[12.5px] text-gray-600">
          {piece.recipient_address_line1}
          {piece.recipient_address_line2 ? `, ${piece.recipient_address_line2}` : ""}
          {`, ${piece.recipient_city}, ${piece.recipient_state} ${piece.recipient_postal_code}`}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
          {/* Class — petrol icon, uppercase tracked label */}
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-petrol-700">
            <IconMail size={12} stroke={2} />
            {mailClassLabel(piece.mail_class)}
          </span>
          <span className="text-gray-300">·</span>
          {/* Sent date — gray, calendar icon */}
          <span className="inline-flex items-center gap-1 text-gray-600">
            <IconCalendarTime size={12} stroke={1.75} className="text-gray-400" />
            Sent {fmtDateLong(piece.sent_at) || daysAgoLabel(piece.sent_at)}
          </span>
          {section === "delivered" && piece.delivered_at && (
            <>
              <span className="text-gray-300">·</span>
              {/* Delivered — petrol with single-check icon. The previous
                  double-check (IconChecks) read as visually busy/blurry
                  at 12px. Single check reads cleaner at this scale. */}
              <span className="inline-flex items-center gap-1 font-medium text-petrol-700">
                <IconCheck size={12} stroke={2} />
                Delivered {fmtDateLong(piece.delivered_at)}
              </span>
            </>
          )}
          {section === "returned" && piece.returned_at && (
            <>
              <span className="text-gray-300">·</span>
              {/* Returned — danger with arrow-back icon */}
              <span className="inline-flex items-center gap-1 font-medium text-danger">
                <IconArrowBack size={12} stroke={2} />
                Returned {fmtDateLong(piece.returned_at)}
                {piece.error_message ? ` (${piece.error_message})` : ""}
              </span>
            </>
          )}
          {piece.include_check && piece.check_amount_cents != null && (
            <>
              <span className="text-gray-300">·</span>
              {/* Check — petrol with $ icon */}
              <span className="inline-flex items-center gap-1 font-medium text-petrol-700">
                <IconCash size={12} stroke={2} />
                Check ${(piece.check_amount_cents / 100).toFixed(2)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Pill — sits immediately to the right of the recipient block. */}
      <div
        className="flex shrink-0 items-start pt-[2px]"
        style={{ width: 140 }}
      >
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-[4px] border bg-white px-[10px] py-[5px] text-[9.5px] font-semibold uppercase leading-none tracking-[0.12em] whitespace-nowrap",
            pillClass
          )}
        >
          {pillLabel}
        </span>
      </div>

      {/* Actions — pushed to the right edge with ml-auto. Same hue
          family as the status pill, different weight. */}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {section === "returned" ? (
          piece.lead_id ? (
            <Link
              href={`/leads/${piece.lead_id}?tab=mail&resend=${piece.id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex h-[30px] min-w-[110px] cursor-pointer items-center justify-center rounded-md bg-danger px-3 text-[11.5px] font-semibold text-white hover:opacity-90"
            >
              Fix &amp; Resend
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex h-[30px] min-w-[110px] cursor-not-allowed items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-[11.5px] font-semibold text-gray-400"
              title="This piece isn't tied to a lead, open it via the lead it belongs to."
            >
              Fix &amp; Resend
            </button>
          )
        ) : (
          <>
            {/* View Letter opens the dashboard-level LetterPreviewModal
                via context. preventDefault stops the row Link from
                hijacking the click (the row navigates to the lead). */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onViewLetter(piece);
              }}
              className="inline-flex h-[30px] min-w-[110px] cursor-pointer items-center justify-center rounded-md bg-petrol-500 px-3 text-[11.5px] font-medium text-white shadow-[0_1px_2px_rgba(13,75,58,0.25)] hover:bg-petrol-600"
            >
              View Letter
            </button>
            {/* Track button hits USPS using the tracking_number that
                Lob attaches once the piece is .mailed. Used to gate on
                piece.tracking_url, but that's actually Lob's rendered
                PDF URL — wrong link, also nullable until .mailed
                fires. Tracking_number presence is the right signal. */}
            {piece.tracking_number ? (
              <a
                href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${piece.tracking_number}`}
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
                title="USPS tracking number isn't assigned yet, check back once the piece is mailed."
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
      <summary
        className="flex cursor-pointer list-none items-start gap-4 px-6 py-4 transition-colors hover:bg-gray-50"
      >
        <div className="min-w-0 flex-1" style={{ maxWidth: 440 }}>
          <div className="truncate text-[15px] font-semibold text-ink">
            Batch of {batch.length}
          </div>
          <div className="mt-1 text-[12.5px] text-gray-600">{names}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-600">
            <span className="inline-flex items-center gap-1.5">
              <IconMail size={13} stroke={1.75} className="text-petrol-500" />
              {mailClassLabel(first.mail_class)}
            </span>
            <span className="text-gray-300">·</span>
            <span>Sent {fmtDateLong(first.sent_at)}</span>
          </div>
        </div>
        {/* Same 140px placeholder slot as PieceRow's pill column so
            the batch row's Expand button vertically aligns with the
            child rows' action column. */}
        <div className="shrink-0" style={{ width: 140 }} />
        {/* Expand affordance pushed to the right edge. Width matches
            View Letter + gap + Track on the child rows (228px). */}
        <div className="ml-auto flex shrink-0 items-center">
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
