"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  IconMail,
  IconChevronDown,
} from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import { displayRecipientName } from "@/components/mail/displayName";
import type { MailJobListRow, MailStats } from "@/lib/mail/fetch";

// V6 main /mail tab. KPI strip + pipeline bar + three status sections
// (In Transit with batch grouping, Delivered Recent, Returned). Row
// hierarchy: name + outlined status pill on top, full address on
// line 2, class · sent · delivered/returned · tracking on line 3.
// Status pill outlined, action buttons solid-filled — same hue,
// different weight (informational vs clickable).

type Section = "in_transit" | "delivered" | "returned";

type BatchOrPiece =
  | { kind: "piece"; piece: MailJobListRow }
  | { kind: "batch"; batchId: string; pieces: MailJobListRow[] };

function groupByBatch(rows: MailJobListRow[]): BatchOrPiece[] {
  // Pieces with shared batch_id where the batch has >1 piece collapse
  // into a single expandable parent row. Solo pieces (1 in the batch)
  // render directly.
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

export function MailDashboardV6({
  rows,
  stats,
}: {
  rows: MailJobListRow[];
  stats: MailStats;
}) {
  // Derived operational KPIs (computed from the 30-day rows array
  // already fetched; avoids extra queries).
  const sentToday = useMemo(
    () => rows.filter((r) => isWithinDays(r.sent_at, 1)).length,
    [rows]
  );
  const deliveredThisWeek = useMemo(
    () =>
      rows.filter(
        (r) => r.status === "delivered" && isWithinDays(r.delivered_at, 7)
      ).length,
    [rows]
  );

  const inTransitRows = rows.filter(
    (r) => r.status === "queued" || r.status === "in_transit"
  );
  const deliveredRows = rows.filter((r) => r.status === "delivered");
  const returnedRows = rows.filter(
    (r) => r.status === "returned" || r.status === "failed"
  );

  const inTransitGrouped = groupByBatch(inTransitRows);

  return (
    <div>
      {/* KPI strip — no subtext, four operational counts */}
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="In Transit" value={stats.in_flight} />
        <Kpi label="Sent Today" value={sentToday} />
        <Kpi label="Delivered This Week" value={deliveredThisWeek} />
        <Kpi label="Returned This Month" value={stats.returned} warn={stats.returned > 0} />
      </div>

      {/* Pipeline bar */}
      <PipelineSection
        inTransit={stats.in_flight}
        delivered={stats.delivered}
        returned={stats.returned}
      />

      {/* Three status sections — In Transit first (with batch grouping),
          then Delivered Recent, then Returned. */}
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

      <ListSection
        eyebrow="Delivered (Recent)"
        trailing={
          deliveredRows.length > 3 ? (
            <span className="text-[11px] text-gray-500">
              Showing {Math.min(3, deliveredRows.length)} of {deliveredRows.length}
            </span>
          ) : null
        }
      >
        {deliveredRows.length === 0 ? (
          <EmptyRow text="No deliveries in the last 30 days." />
        ) : (
          deliveredRows
            .slice(0, 3)
            .map((p) => <PieceRow piece={p} section="delivered" key={p.id} />)
        )}
      </ListSection>

      <ListSection eyebrow="Returned" tone="danger">
        {returnedRows.length === 0 ? (
          <EmptyRow text="No returned pieces." />
        ) : (
          returnedRows.map((p) => (
            <PieceRow piece={p} section="returned" key={p.id} />
          ))
        )}
      </ListSection>
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
            <span className="inline-flex min-w-[76px] items-center justify-center rounded-[4px] border border-gray-300 bg-white px-[10px] py-[5px] text-[9.5px] font-semibold uppercase leading-none tracking-[0.12em] text-ink">
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
