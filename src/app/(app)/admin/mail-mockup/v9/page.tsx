import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Variant 9 — Same KPI dashboard aesthetic Bree liked, but the
// content under the strip + pipeline is a chronological activity
// stream of mail events instead of status-grouped lists. Each row
// is an event ("Patricia Williams' letter shipped", "Margaret Chen
// confirmed delivery") rather than a piece. Reads more like an
// audit log / Stripe events page. Same design language as V6, just
// a different way of arranging the data below the hero.
// No Action Required block (lead-only per agreement).

type Event = {
  id: string;
  kind: "sent" | "delivered" | "returned" | "in_transit_update";
  name: string;
  city: string;
  state: string;
  lead: string;
  surplus: string;
  classLabel: string;
  whenLabel: string;
  detail?: string;
};

const EVENTS: Event[] = [
  { id: "e1", kind: "delivered", name: "Margaret Chen", city: "Austin", state: "TX", lead: "L-2026-0042", surplus: "$42K", classLabel: "First Class", whenLabel: "20 min ago", detail: "Recipient signed at front door" },
  { id: "e2", kind: "in_transit_update", name: "Patricia Williams", city: "Dallas", state: "TX", lead: "L-2026-0046", surplus: "$61K", classLabel: "First Class", whenLabel: "2 hr ago", detail: "Out for delivery" },
  { id: "e3", kind: "sent", name: "Linda Foster + Robert Foster", city: "Fort Worth", state: "TX", lead: "L-2026-0048", surplus: "$33K", classLabel: "First Class · Batch of 2", whenLabel: "Today, 8:14 AM" },
  { id: "e4", kind: "returned", name: "James O'Brien", city: "San Antonio", state: "TX", lead: "L-2026-0051", surplus: "$19K", classLabel: "First Class", whenLabel: "5d ago", detail: "Forward expired" },
  { id: "e5", kind: "delivered", name: "David Rodriguez", city: "Houston", state: "TX", lead: "L-2026-0044", surplus: "$28K", classLabel: "Certified", whenLabel: "5d ago", detail: "Signature confirmed (court-required)" },
  { id: "e6", kind: "sent", name: "Susan Park", city: "Austin", state: "TX", lead: "L-2026-0050", surplus: "$14K", classLabel: "First Class · Check $4,825", whenLabel: "5d ago" },
  { id: "e7", kind: "delivered", name: "Carlos Mendez", city: "El Paso", state: "TX", lead: "L-2026-0058", surplus: "$22K", classLabel: "First Class", whenLabel: "8d ago" },
];

const EVENT_LABELS: Record<Event["kind"], { label: string; verb: string; tone: "ink" | "ok" | "danger" | "muted" }> = {
  sent: { label: "Sent", verb: "shipped to", tone: "ink" },
  in_transit_update: { label: "In Transit", verb: "out for delivery to", tone: "muted" },
  delivered: { label: "Delivered", verb: "reached", tone: "ok" },
  returned: { label: "Returned", verb: "came back from", tone: "danger" },
};

export default async function MockupV9() {
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
          V9 · KPI + Activity Stream
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

      {/* Same KPI tiles + pipeline as V6 */}
      <div className="grid grid-cols-4 gap-4">
        <Tile label="In Transit" value={3} sub="moving toward delivery" />
        <Tile label="Sent Today" value={2} sub="went out this morning" />
        <Tile label="Delivered This Week" value={6} sub="confirmed by USPS" />
        <Tile label="Returned This Month" value={3} sub="awaiting new address" warn />
      </div>

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

      {/* Activity Stream — chronological events, not status lists */}
      <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-baseline justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Recent Activity
          </div>
          <Link href="#" className="cursor-pointer text-[11px] font-medium text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-ink">
            View Full Log
          </Link>
        </div>
        <div className="relative mt-5">
          <div aria-hidden className="absolute left-[7px] top-1 bottom-1 w-px bg-gray-200" />
          <div className="space-y-5">
            {EVENTS.map((e) => (
              <EventRow key={e.id} e={e} />
            ))}
          </div>
        </div>
      </section>
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

function EventRow({ e }: { e: Event }) {
  const meta = EVENT_LABELS[e.kind];
  const dotColor =
    meta.tone === "ok"
      ? "bg-[#0d4b3a]"
      : meta.tone === "danger"
        ? "bg-[#c4253c]"
        : meta.tone === "ink"
          ? "bg-ink"
          : "bg-gray-400";
  return (
    <div className="relative flex items-start gap-4 pl-0">
      <div className="relative z-10 mt-1 flex h-[14px] w-[14px] shrink-0 items-center justify-center">
        <span className={`h-2 w-2 rounded-full ${dotColor} ring-2 ring-white`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[13.5px] text-ink">
            <span className="font-semibold">{e.name}</span>{" "}
            <span className="text-gray-500">in {e.city}, {e.state}</span>
          </span>
          <span className="shrink-0 text-[10.5px] text-gray-500">
            {e.whenLabel}
          </span>
        </div>
        <div className="mt-[2px] flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[11.5px]">
          <span
            className={`inline-flex items-center rounded-[4px] px-[8px] py-[3px] text-[9px] font-semibold uppercase leading-none tracking-[0.12em] ${
              meta.tone === "ok"
                ? "bg-[#0d4b3a] text-white"
                : meta.tone === "danger"
                  ? "bg-[#c4253c] text-white"
                  : meta.tone === "ink"
                    ? "bg-ink text-white"
                    : "bg-gray-200 text-gray-700"
            }`}
          >
            {meta.label}
          </span>
          <span className="text-gray-600">{e.classLabel}</span>
          <Link href="#" className="cursor-pointer text-[#0d4b3a] underline decoration-[#0d4b3a]/30 underline-offset-2">
            {e.lead}
          </Link>
          <span className="text-ink">{e.surplus} surplus</span>
          {e.detail && <span className="text-gray-500">{e.detail}</span>}
        </div>
        <div className="mt-2 flex gap-2 text-[10.5px] font-medium">
          <button className="cursor-pointer rounded-md border border-[#0d4b3a]/25 bg-white px-2 py-1 text-[#0d4b3a] hover:bg-[#0d4b3a]/[0.04]">
            View Letter
          </button>
          <button className="cursor-pointer rounded-md border border-[#0d4b3a]/25 bg-white px-2 py-1 text-[#0d4b3a] hover:bg-[#0d4b3a]/[0.04]">
            Track
          </button>
        </div>
      </div>
    </div>
  );
}
