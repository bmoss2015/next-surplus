import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Variant 10 — Same KPI dashboard aesthetic, but the body below the
// hero is three horizontal swimlanes (one per status). Each lane
// shows 3-5 pieces as horizontally-scrolling cards, density-balanced
// against the big KPI tiles above. Different from V3's vertical
// kanban columns; this scans left-to-right per lane. Different from
// V6's vertical lists; this gives each piece a small visual card
// so the page is more gallery + dashboard than dashboard + list.

type Piece = {
  id: string;
  name: string;
  city: string;
  state: string;
  lead: string;
  surplus: string;
  classLabel: string;
  daysAgo: string;
  trackingTail: string;
  check?: string;
};

const IN_TRANSIT: Piece[] = [
  { id: "m3", name: "Patricia Williams", city: "Dallas", state: "TX", lead: "L-2026-0046", surplus: "$61K", classLabel: "First Class", daysAgo: "3d", trackingTail: "5568" },
  { id: "m5", name: "Linda Foster", city: "Fort Worth", state: "TX", lead: "L-2026-0048", surplus: "$33K", classLabel: "First Class", daysAgo: "1d", trackingTail: "5570" },
  { id: "m6", name: "Robert Foster", city: "Fort Worth", state: "TX", lead: "L-2026-0048", surplus: "$33K", classLabel: "First Class", daysAgo: "1d", trackingTail: "5571" },
  { id: "m7", name: "Susan Park", city: "Austin", state: "TX", lead: "L-2026-0050", surplus: "$14K", classLabel: "First Class", daysAgo: "5d", trackingTail: "5572", check: "$4,825" },
];

const DELIVERED: Piece[] = [
  { id: "m1", name: "Margaret Chen", city: "Austin", state: "TX", lead: "L-2026-0042", surplus: "$42K", classLabel: "First Class", daysAgo: "Jan 18", trackingTail: "5566" },
  { id: "m2", name: "David Rodriguez", city: "Houston", state: "TX", lead: "L-2026-0044", surplus: "$28K", classLabel: "Certified", daysAgo: "Jan 20", trackingTail: "5567" },
  { id: "m8", name: "Carlos Mendez", city: "El Paso", state: "TX", lead: "L-2026-0058", surplus: "$22K", classLabel: "First Class", daysAgo: "Jan 17", trackingTail: "5573" },
  { id: "m9", name: "Anna Park", city: "Plano", state: "TX", lead: "L-2026-0070", surplus: "$45K", classLabel: "Certified", daysAgo: "Jan 21", trackingTail: "5574" },
];

const RETURNED: Piece[] = [
  { id: "m4", name: "James O'Brien", city: "San Antonio", state: "TX", lead: "L-2026-0051", surplus: "$19K", classLabel: "First Class", daysAgo: "Jan 22", trackingTail: "5569" },
  { id: "m10", name: "George Wu", city: "Lubbock", state: "TX", lead: "L-2026-0062", surplus: "$31K", classLabel: "First Class", daysAgo: "Jan 19", trackingTail: "5577" },
  { id: "m11", name: "Helen Reyes", city: "Austin", state: "TX", lead: "L-2026-0067", surplus: "$8K", classLabel: "First Class", daysAgo: "Jan 17", trackingTail: "5580" },
];

export default async function MockupV10() {
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
          V10 · KPI + Horizontal Swimlanes
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

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        <Tile label="In Transit" value={3} sub="moving toward delivery" />
        <Tile label="Sent Today" value={2} sub="went out this morning" />
        <Tile label="Delivered This Week" value={6} sub="confirmed by USPS" />
        <Tile label="Returned This Month" value={3} sub="awaiting new address" warn />
      </div>

      {/* Pipeline */}
      <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-baseline justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Pipeline
          </div>
          <div className="text-[11px] text-gray-500">24 pieces total</div>
        </div>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-gray-100">
          <div className="bg-ink" style={{ width: "12.5%" }} />
          <div className="bg-[#0d4b3a]" style={{ width: "75%" }} />
          <div className="bg-[#c4253c]" style={{ width: "12.5%" }} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-4 text-[12px]">
          <Pair color="bg-ink" label="In Transit" count={3} />
          <Pair color="bg-[#0d4b3a]" label="Delivered" count={18} />
          <Pair color="bg-[#c4253c]" label="Returned" count={3} warn />
        </div>
      </section>

      {/* Horizontal swimlanes — one per status */}
      <Lane title="In Transit" accent="bg-ink" pieces={IN_TRANSIT} sinceLabel="Sent" />
      <Lane title="Delivered (Recent)" accent="bg-[#0d4b3a]" pieces={DELIVERED} sinceLabel="Delivered" tone="ok" />
      <Lane title="Returned" accent="bg-[#c4253c]" pieces={RETURNED} sinceLabel="Returned" tone="danger" />
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
  warn,
}: {
  label: string;
  value: number;
  sub: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${warn ? "text-[#c4253c]" : "text-gray-500"}`}>
        {label}
      </div>
      <div className={`mt-2 text-[42px] font-semibold leading-none tracking-tight ${warn ? "text-[#c4253c]" : "text-ink"}`}>
        {value}
      </div>
      <div className="mt-3 text-[11px] text-gray-500">{sub}</div>
    </div>
  );
}

function Pair({
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

function Lane({
  title,
  accent,
  pieces,
  sinceLabel,
  tone,
}: {
  title: string;
  accent: string;
  pieces: Piece[];
  sinceLabel: string;
  tone?: "ok" | "danger";
}) {
  return (
    <section className="mt-5">
      <div className="mb-3 flex items-baseline gap-2">
        <span className={`h-2 w-2 rounded-full ${accent}`} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
          {title}
        </span>
        <span className="ml-1 text-[11px] text-gray-400">
          {pieces.length}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {pieces.map((p) => (
          <PieceCard p={p} key={p.id} sinceLabel={sinceLabel} tone={tone} />
        ))}
      </div>
    </section>
  );
}

function PieceCard({
  p,
  sinceLabel,
  tone,
}: {
  p: Piece;
  sinceLabel: string;
  tone?: "ok" | "danger";
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[13.5px] font-semibold text-ink">
          {p.name}
        </span>
        <span
          className={`shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] ${
            tone === "ok"
              ? "text-[#0d4b3a]"
              : tone === "danger"
                ? "text-[#c4253c]"
                : "text-gray-500"
          }`}
        >
          {p.daysAgo}
        </span>
      </div>
      <div className="mt-[1px] truncate text-[11.5px] text-gray-500">
        {p.city}, {p.state}
      </div>
      <div className="mt-2 truncate text-[11px] text-gray-600">
        {p.classLabel}
        {p.check && (
          <>
            {" · "}
            <span className="font-medium text-[#0d4b3a]">{p.check}</span>
          </>
        )}
      </div>
      <div className="mt-2 truncate text-[11px] text-gray-500">
        <Link
          href="#"
          className="cursor-pointer text-[#0d4b3a] underline decoration-[#0d4b3a]/30 underline-offset-2"
        >
          {p.lead}
        </Link>{" "}
        <span className="text-gray-400">·</span>{" "}
        <span className="text-ink">{p.surplus}</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[10.5px] text-gray-400">…{p.trackingTail}</span>
        <div className="flex gap-1">
          <button className="cursor-pointer rounded-md border border-[#0d4b3a]/25 bg-white px-2 py-1 text-[10.5px] font-medium text-[#0d4b3a] hover:bg-[#0d4b3a]/[0.04]">
            View
          </button>
          <button className="cursor-pointer rounded-md border border-[#0d4b3a]/25 bg-white px-2 py-1 text-[10.5px] font-medium text-[#0d4b3a] hover:bg-[#0d4b3a]/[0.04]">
            Track
          </button>
        </div>
      </div>
      <div className="mt-2 text-[10px] text-gray-400">
        {sinceLabel} {p.daysAgo}
      </div>
    </div>
  );
}
