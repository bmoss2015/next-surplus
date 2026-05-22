import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Variant 6 (locked-in baseline).
// Same report-look aesthetic Bree liked (big KPI tiles with sub-
// captions + horizontal pipeline bar) but with operational data
// only. No Action Required block here — per our agreement, returned
// pieces surface on the LEAD Mail tab, not the global /mail dashboard.
// Lists below are status-grouped (In Transit, Delivered Recent), the
// table-equivalent the user uses to scan everything.

export default async function MockupV6() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  const inTransit = 3;
  const delivered = 18;
  const returned = 3;
  const total = inTransit + delivered + returned;

  return (
    <div className="min-h-screen bg-gray-50 px-7 py-7">
      <div className="mb-7 flex items-center justify-between">
        <Link
          href="/admin/mail-mockup"
          className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 hover:text-ink"
        >
          ← All Mockups
        </Link>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">
          V6 · KPI Dashboard
        </span>
      </div>

      <header className="mb-6 flex items-end justify-between gap-4">
        <h1 className="m-0 text-[28px] font-semibold tracking-tight text-ink">
          Sent Mail
        </h1>
        <button className="cursor-pointer rounded-md bg-[#0d4b3a] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_1px_2px_rgba(13,75,58,0.25)]">
          Send Mail
        </button>
      </header>

      <KpiStrip
        tiles={[
          { label: "In Transit", value: inTransit, sub: "moving toward delivery" },
          { label: "Sent Today", value: 2, sub: "went out in this morning's run" },
          { label: "Delivered This Week", value: 6, sub: "confirmed by USPS" },
          { label: "Returned This Month", value: returned, sub: "awaiting new address", warn: true },
        ]}
      />

      <PipelineBar inTransit={inTransit} delivered={delivered} returned={returned} total={total} />

      {/* Lists below — status-grouped, the working surface */}
      <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
          In Transit
        </div>
        <div className="mt-4 divide-y divide-gray-150">
          <PieceRow name="Patricia Williams" lead="L-2026-0046" surplus="$61K" city="Dallas, TX" classLabel="First Class" since="3d ago" />
          <PieceRow name="Linda Foster" lead="L-2026-0048" surplus="$33K" city="Fort Worth, TX" classLabel="First Class · Batch" since="1d ago" />
          <PieceRow name="Robert Foster" lead="L-2026-0048" surplus="$33K" city="Fort Worth, TX" classLabel="First Class · Batch" since="1d ago" />
          <PieceRow name="Susan Park" lead="L-2026-0050" surplus="$14K" city="Austin, TX" classLabel="First Class · Check $4,825" since="5d ago" />
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-baseline justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Delivered (Recent)
          </div>
          <Link href="#" className="cursor-pointer text-[11px] font-medium text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-ink">
            Show all 18
          </Link>
        </div>
        <div className="mt-4 divide-y divide-gray-150">
          <PieceRow name="Margaret Chen" lead="L-2026-0042" surplus="$42K" city="Austin, TX" classLabel="First Class" since="Delivered Jan 18" tone="ok" />
          <PieceRow name="David Rodriguez" lead="L-2026-0044" surplus="$28K" city="Houston, TX" classLabel="Certified" since="Delivered Jan 20" tone="ok" />
          <PieceRow name="Carlos Mendez" lead="L-2026-0058" surplus="$22K" city="El Paso, TX" classLabel="First Class" since="Delivered Jan 17" tone="ok" />
        </div>
      </section>
    </div>
  );
}

export function KpiStrip({
  tiles,
}: {
  tiles: Array<{ label: string; value: number | string; sub: string; warn?: boolean }>;
}) {
  return (
    <div className={`grid grid-cols-${tiles.length} gap-4`} style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))` }}>
      {tiles.map((t) => (
        <div key={t.label} className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${t.warn ? "text-[#c4253c]" : "text-gray-500"}`}>
            {t.label}
          </div>
          <div className={`mt-2 text-[42px] font-semibold leading-none tracking-tight ${t.warn ? "text-[#c4253c]" : "text-ink"}`}>
            {t.value}
          </div>
          <div className="mt-3 text-[11px] text-gray-500">{t.sub}</div>
        </div>
      ))}
    </div>
  );
}

export function PipelineBar({
  inTransit,
  delivered,
  returned,
  total,
}: {
  inTransit: number;
  delivered: number;
  returned: number;
  total: number;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-baseline justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
          Pipeline
        </div>
        <div className="text-[11px] text-gray-500">{total} pieces total</div>
      </div>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-gray-100">
        <div className="bg-ink" style={{ width: `${(inTransit / total) * 100}%` }} />
        <div className="bg-[#0d4b3a]" style={{ width: `${(delivered / total) * 100}%` }} />
        <div className="bg-[#c4253c]" style={{ width: `${(returned / total) * 100}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-4 text-[12px]">
        <BreakdownPair color="bg-ink" label="In Transit" count={inTransit} />
        <BreakdownPair color="bg-[#0d4b3a]" label="Delivered" count={delivered} />
        <BreakdownPair color="bg-[#c4253c]" label="Returned" count={returned} warn />
      </div>
    </section>
  );
}

export function BreakdownPair({
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
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </span>
      <span
        className={`ml-auto text-[16px] font-semibold tabular-nums ${
          warn ? "text-[#c4253c]" : "text-ink"
        }`}
      >
        {count}
      </span>
    </div>
  );
}

export function PieceRow({
  name,
  lead,
  surplus,
  city,
  classLabel,
  since,
  tone,
}: {
  name: string;
  lead: string;
  surplus: string;
  city: string;
  classLabel: string;
  since: string;
  tone?: "ok";
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[13.5px] font-semibold text-ink">{name}</span>
          <span className="text-[11.5px] text-gray-500">{city}</span>
        </div>
        <div className="mt-[1px] text-[11px] text-gray-500">
          <Link href="#" className="cursor-pointer text-[#0d4b3a] underline decoration-[#0d4b3a]/30 underline-offset-2">
            {lead}
          </Link>
          <span className="text-gray-400"> · </span>
          <span className="text-ink">{surplus} surplus</span>
          <span className="text-gray-400"> · </span>
          <span>{classLabel}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <span className={`text-[11px] ${tone === "ok" ? "text-[#0d4b3a]" : "text-gray-500"}`}>
          {since}
        </span>
        {/* Always-visible action buttons (no hover-only) */}
        <div className="flex gap-1">
          <button className="cursor-pointer rounded-md border border-[#0d4b3a]/25 bg-white px-2.5 py-1 text-[10.5px] font-medium text-[#0d4b3a] hover:bg-[#0d4b3a]/[0.04]">
            View
          </button>
          <button className="cursor-pointer rounded-md border border-[#0d4b3a]/25 bg-white px-2.5 py-1 text-[10.5px] font-medium text-[#0d4b3a] hover:bg-[#0d4b3a]/[0.04]">
            Track
          </button>
        </div>
      </div>
    </div>
  );
}
