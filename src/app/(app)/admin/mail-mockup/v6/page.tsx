import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Variant 6 (revised) — Operations Dashboard.
// Bree loved the layout; pulled out the report-y content (delivery
// rate %, period-over-period deltas, "view all pieces" link, paragraph
// headline). This is the main /mail tab itself, not a click-through
// preview of one. Content swapped to active operational state:
//   - Active counts of in-flight pieces, delivered this week, sent
//     today, needs attention. No rates or comparisons (those live
//     in /reports/mail).
//   - Action Required surfaces returned pieces with inline Fix &
//     Resend buttons.
//   - In Transit + Delivered are visible-but-quiet sections beneath,
//     each a clean list (no collapse).

export default async function MockupV6() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

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
          V6 · Operations Dashboard (revised)
        </span>
      </div>

      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[28px] font-semibold tracking-tight text-ink">
            Sent Mail
          </h1>
        </div>
        <button className="cursor-pointer rounded-md bg-[#0d4b3a] px-4 py-2 text-[12px] font-semibold text-white">
          Send Mail
        </button>
      </header>

      {/* Active operational KPIs — no rates, no period comparisons */}
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="In Transit" value="3" sub="moving toward delivery" />
        <Kpi label="Sent Today" value="2" sub="went out in this morning's print run" />
        <Kpi label="Delivered This Week" value="6" sub="confirmed by USPS" />
        <Kpi label="Needs Attention" value="3" sub="returned, awaiting new address" warn />
      </div>

      {/* Action Required — only renders when returned pieces exist */}
      <section className="mt-5 rounded-2xl border border-[#c4253c]/20 bg-white p-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c4253c]">
          Action Required
        </div>
        <div className="mt-4 divide-y divide-gray-150">
          <ActionRow
            name="James O'Brien"
            lead="L-2026-0051"
            surplus="$19K"
            address="245 Magnolia Court, San Antonio, TX 78216"
            returnReason="Forward expired"
            daysAgo={5}
          />
          <ActionRow
            name="George Wu"
            lead="L-2026-0062"
            surplus="$31K"
            address="6111 Llano Estacado, Lubbock, TX 79407"
            returnReason="Vacant"
            daysAgo={11}
          />
          <ActionRow
            name="Helen Reyes"
            lead="L-2026-0067"
            surplus="$8K"
            address="3402 W Slaughter Ln, Austin, TX 78748"
            returnReason="No such number"
            daysAgo={14}
          />
        </div>
      </section>

      {/* In Transit — quiet but visible */}
      <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
          In Transit
        </div>
        <div className="mt-4 divide-y divide-gray-150">
          <PieceRow name="Patricia Williams" lead="L-2026-0046" surplus="$61K" city="Dallas, TX" status="In Transit" classLabel="First Class" since="3d ago" />
          <PieceRow name="Linda Foster" lead="L-2026-0048" surplus="$33K" city="Fort Worth, TX" status="In Transit" classLabel="First Class · Batch" since="1d ago" />
          <PieceRow name="Robert Foster" lead="L-2026-0048" surplus="$33K" city="Fort Worth, TX" status="In Transit" classLabel="First Class · Batch" since="1d ago" />
          <PieceRow name="Susan Park" lead="L-2026-0050" surplus="$14K" city="Austin, TX" status="In Transit" classLabel="First Class · Check $4,825" since="5d ago" />
        </div>
      </section>

      {/* Delivered — quiet, recent only */}
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
          <PieceRow name="Margaret Chen" lead="L-2026-0042" surplus="$42K" city="Austin, TX" status="Delivered" classLabel="First Class" since="Delivered Jan 18" tone="ok" />
          <PieceRow name="David Rodriguez" lead="L-2026-0044" surplus="$28K" city="Houston, TX" status="Delivered" classLabel="Certified" since="Delivered Jan 20" tone="ok" />
          <PieceRow name="Carlos Mendez" lead="L-2026-0058" surplus="$22K" city="El Paso, TX" status="Delivered" classLabel="First Class" since="Delivered Jan 17" tone="ok" />
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  warn,
}: {
  label: string;
  value: string;
  sub: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${warn ? "text-[#c4253c]" : "text-gray-500"}`}>
        {label}
      </div>
      <div
        className={`mt-2 text-[42px] font-semibold leading-none tracking-tight ${
          warn ? "text-[#c4253c]" : "text-ink"
        }`}
      >
        {value}
      </div>
      <div className="mt-3 text-[11px] text-gray-500">{sub}</div>
    </div>
  );
}

function ActionRow({
  name,
  lead,
  surplus,
  address,
  returnReason,
  daysAgo,
}: {
  name: string;
  lead: string;
  surplus: string;
  address: string;
  returnReason: string;
  daysAgo: number;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <div className="text-[14px] font-semibold text-ink">{name}</div>
        <div className="mt-[1px] text-[11.5px] text-gray-500">{address}</div>
        <div className="mt-[2px] text-[11px]">
          <span className="font-medium text-[#c4253c]">{returnReason}</span>
          <span className="text-gray-400"> · returned {daysAgo}d ago</span>
          <span className="text-gray-400"> · </span>
          <Link href="#" className="cursor-pointer text-[#0d4b3a] underline decoration-[#0d4b3a]/30 underline-offset-2">
            {lead}
          </Link>
          <span className="text-gray-400"> · </span>
          <span className="text-ink">{surplus} surplus</span>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[11.5px] font-medium text-ink hover:bg-gray-50">
          View Letter
        </button>
        <button className="cursor-pointer rounded-md bg-[#c4253c] px-3 py-1.5 text-[11.5px] font-medium text-white">
          Fix &amp; Resend
        </button>
      </div>
    </div>
  );
}

function PieceRow({
  name,
  lead,
  surplus,
  city,
  status,
  classLabel,
  since,
  tone,
}: {
  name: string;
  lead: string;
  surplus: string;
  city: string;
  status: string;
  classLabel: string;
  since: string;
  tone?: "ok";
}) {
  return (
    <div className="group flex items-center justify-between gap-4 py-3">
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
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1 text-[10.5px] font-medium text-ink hover:bg-gray-50">
            View
          </button>
          <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1 text-[10.5px] font-medium text-ink hover:bg-gray-50">
            Track
          </button>
        </div>
      </div>
    </div>
  );
}
