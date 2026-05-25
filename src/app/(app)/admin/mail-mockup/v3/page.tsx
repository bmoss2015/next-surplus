import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Variant 3 — Workspace board.
// Three columns: In Transit, Delivered, Needs Attention. Each piece
// is a card you scan vertically by column. Compose action floats at
// the top of the In Transit column (where new pieces will land).
// Reads like a project board, not a database. Cards are dense but
// breathable — initials avatar, recipient, address, days-since,
// inline action row on hover.

type SamplePiece = {
  id: string;
  recipient: string;
  initials: string;
  initialBg: string;
  line1: string;
  city: string;
  state: string;
  sentDays: number;
  classLabel: string;
  hasCheck?: string;
  lead: string;
  surplus: string;
  trackingTail: string;
  returnReason?: string;
};

const SAMPLE: { in_transit: SamplePiece[]; delivered: SamplePiece[]; returned: SamplePiece[] } = {
  in_transit: [
    { id: "m3", recipient: "Patricia Williams", initials: "PW", initialBg: "bg-petrol-100 text-petrol-700", line1: "1023 Heritage Lane", city: "Dallas", state: "TX", sentDays: 3, classLabel: "First Class", lead: "L-2026-0046", surplus: "$61K", trackingTail: "5568" },
    { id: "m5", recipient: "Linda Foster", initials: "LF", initialBg: "bg-sky-100 text-sky-700", line1: "5511 Westbrook Way", city: "Fort Worth", state: "TX", sentDays: 1, classLabel: "First Class · Batch", lead: "L-2026-0048", surplus: "$33K", trackingTail: "5570" },
    { id: "m6", recipient: "Robert Foster", initials: "RF", initialBg: "bg-sky-100 text-sky-700", line1: "5511 Westbrook Way", city: "Fort Worth", state: "TX", sentDays: 1, classLabel: "First Class · Batch", lead: "L-2026-0048", surplus: "$33K", trackingTail: "5571" },
    { id: "m7", recipient: "Susan Park", initials: "SP", initialBg: "bg-emerald-100 text-emerald-700", line1: "918 Cedar Springs Rd", city: "Austin", state: "TX", sentDays: 5, classLabel: "First Class", hasCheck: "$4,825.00", lead: "L-2026-0050", surplus: "$14K", trackingTail: "5572" },
  ],
  delivered: [
    { id: "m1", recipient: "Margaret Chen", initials: "MC", initialBg: "bg-rose-100 text-rose-700", line1: "412 Oakwood Drive", city: "Austin", state: "TX", sentDays: 14, classLabel: "First Class", lead: "L-2026-0042", surplus: "$42K", trackingTail: "5566" },
    { id: "m2", recipient: "David Rodriguez", initials: "DR", initialBg: "bg-indigo-100 text-indigo-700", line1: "78 Pinecrest Avenue", city: "Houston", state: "TX", sentDays: 11, classLabel: "Certified", lead: "L-2026-0044", surplus: "$28K", trackingTail: "5567" },
    { id: "m8", recipient: "Carlos Mendez", initials: "CM", initialBg: "bg-teal-100 text-teal-700", line1: "2200 Border Avenue", city: "El Paso", state: "TX", sentDays: 18, classLabel: "First Class", lead: "L-2026-0058", surplus: "$22K", trackingTail: "5573" },
  ],
  returned: [
    { id: "m4", recipient: "James O'Brien", initials: "JO", initialBg: "bg-petrol-100 text-petrol-700", line1: "245 Magnolia Court", city: "San Antonio", state: "TX", sentDays: 18, classLabel: "First Class", lead: "L-2026-0051", surplus: "$19K", trackingTail: "5569", returnReason: "Forward expired" },
  ],
};

export default async function MockupV3() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-7 py-7">
        <div className="mb-7 flex items-center justify-between">
          <Link
            href="/admin/mail-mockup"
            className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 hover:text-ink"
          >
            ← All Mockups
          </Link>
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">
            V3 · Workspace
          </span>
        </div>

        {/* MAIN /mail */}
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="m-0 text-[28px] font-semibold tracking-tight text-ink">
              Sent Mail
            </h1>
            <p className="mt-1 text-[13px] text-gray-600">
              Every physical piece moving through the portal. Cards group
              by status. New pieces land in the In Transit column.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search recipient, city, or state"
              className="w-[280px] rounded-md border border-gray-200 bg-white px-3 py-2 text-[12.5px] text-ink placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-petrol-300"
            />
          </div>
        </header>

        <div className="grid grid-cols-3 gap-4">
          <Column
            title="In Transit"
            count={SAMPLE.in_transit.length}
            accent="bg-ink"
            withCompose
          >
            {SAMPLE.in_transit.map((p) => (
              <PieceCard key={p.id} piece={p} status="in_transit" />
            ))}
          </Column>
          <Column
            title="Delivered"
            count={SAMPLE.delivered.length}
            accent="bg-[#0d4b3a]"
          >
            {SAMPLE.delivered.map((p) => (
              <PieceCard key={p.id} piece={p} status="delivered" />
            ))}
          </Column>
          <Column
            title="Needs Attention"
            count={SAMPLE.returned.length}
            accent="bg-[#c4253c]"
          >
            {SAMPLE.returned.map((p) => (
              <PieceCard key={p.id} piece={p} status="returned" />
            ))}
          </Column>
        </div>

        {/* LEAD MAIL TAB — compact embed of the board scoped to one lead */}
        <section className="mt-12">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0d4b3a]">
            Lead · L-2026-0042 · Smith Surplus Case
          </div>
          <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-ink">
            Mail on this lead
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <Column title="In Transit" count={0} accent="bg-ink" withCompose compact />
            <Column title="Delivered" count={2} accent="bg-[#0d4b3a]" compact>
              <PieceCard piece={SAMPLE.delivered[0]} status="delivered" compact />
              <PieceCard piece={SAMPLE.delivered[1]} status="delivered" compact />
            </Column>
            <Column title="Needs Attention" count={1} accent="bg-[#c4253c]" compact>
              <PieceCard piece={SAMPLE.returned[0]} status="returned" compact />
            </Column>
          </div>
        </section>
      </div>
    </div>
  );
}

function Column({
  title,
  count,
  accent,
  withCompose,
  compact,
  children,
}: {
  title: string;
  count: number;
  accent: string;
  withCompose?: boolean;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-gray-50 ${compact ? "p-3" : "p-4"}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${accent}`} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
          {title}
        </span>
        <span className="ml-auto text-[10.5px] font-semibold text-gray-400">
          {count}
        </span>
      </div>
      {withCompose && (
        <button className="mb-3 w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-white px-3 py-3 text-[12px] font-medium text-gray-600 hover:border-petrol-400 hover:text-petrol-700">
          + Compose New Mail
        </button>
      )}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function PieceCard({
  piece,
  status,
  compact,
}: {
  piece: SamplePiece;
  status: "in_transit" | "delivered" | "returned";
  compact?: boolean;
}) {
  return (
    <div className={`group rounded-xl border border-gray-200 bg-white ${compact ? "p-3" : "p-4"} transition-shadow hover:shadow-card`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${piece.initialBg}`}>
          {piece.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold text-ink">
            {piece.recipient}
          </div>
          <div className="truncate text-[11.5px] text-gray-500">
            {piece.city}, {piece.state}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-gray-400">
            {piece.sentDays === 0 ? "Today" : `${piece.sentDays}d`}
          </div>
        </div>
      </div>
      {!compact && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px]">
          <span className="text-gray-500">{piece.classLabel}</span>
          {piece.hasCheck && (
            <span className="rounded-[4px] bg-[#0d4b3a]/8 px-1.5 py-[1px] font-semibold text-[#0d4b3a]">
              Check {piece.hasCheck}
            </span>
          )}
          <span className="text-gray-400">·</span>
          <span className="font-mono text-gray-500">…{piece.trackingTail}</span>
        </div>
      )}
      {!compact && (
        <div className="mt-2.5 flex items-baseline justify-between text-[10.5px]">
          <span className="text-gray-500">
            {piece.lead} <span className="text-gray-400">·</span>{" "}
            <span className="text-ink">{piece.surplus} surplus</span>
          </span>
        </div>
      )}
      {status === "returned" && piece.returnReason && !compact && (
        <div className="mt-3 rounded-md bg-[#c4253c]/8 px-2.5 py-1.5 text-[11px] text-[#c4253c]">
          <span className="font-semibold uppercase tracking-[0.1em] text-[9.5px]">USPS:</span>{" "}
          {piece.returnReason}
          <div className="mt-1 font-semibold underline cursor-pointer">
            Fix Address & Resend →
          </div>
        </div>
      )}
      <div className={`${compact ? "mt-2" : "mt-3"} flex gap-2 opacity-0 transition-opacity group-hover:opacity-100`}>
        <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1 text-[10.5px] font-medium text-ink hover:bg-gray-50">
          View
        </button>
        <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1 text-[10.5px] font-medium text-ink hover:bg-gray-50">
          Track
        </button>
      </div>
    </div>
  );
}
