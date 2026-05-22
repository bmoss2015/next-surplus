import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Variant 5 — Timeline / Gantt flow view.
// Each piece is a horizontal bar that shows its journey across a
// time axis: sent date on the left, expected/actual delivery on
// the right. Color of the bar = status. You can see at a glance
// which pieces are stuck in transit longer than expected, which
// returned and when, and the chronological distribution of sends.
// Different metaphor: time as the primary axis, with status as
// secondary. No table, no kanban, no list of cards. Operators with
// in-flight pieces use this to see the pipeline.

type SamplePiece = {
  id: string;
  recipient: string;
  lead: string;
  surplus: string;
  city: string;
  state: string;
  status: "in_transit" | "delivered" | "returned";
  sentDayOffset: number; // days from "today"
  deliveredDayOffset?: number;
  returnedDayOffset?: number;
  expectedEta?: number; // estimated business days from send for in-flight pieces
  mailClass: string;
  tracking: string;
  hasCheck?: string;
};

// "Today" = day 0. Negative = earlier, positive = later.
// Axis spans -20 (3 weeks ago) to +7 (1 week ahead).
const SAMPLE: SamplePiece[] = [
  { id: "m1", recipient: "Margaret Chen", lead: "L-2026-0042", surplus: "$42K", city: "Austin", state: "TX", status: "delivered", sentDayOffset: -14, deliveredDayOffset: -9, mailClass: "First Class", tracking: "9400111899223344556677" },
  { id: "m2", recipient: "David Rodriguez", lead: "L-2026-0044", surplus: "$28K", city: "Houston", state: "TX", status: "delivered", sentDayOffset: -11, deliveredDayOffset: -7, mailClass: "Certified", tracking: "9400111899223344556712" },
  { id: "m3", recipient: "Patricia Williams", lead: "L-2026-0046", surplus: "$61K", city: "Dallas", state: "TX", status: "in_transit", sentDayOffset: -3, expectedEta: 4, mailClass: "First Class", tracking: "9400111899223344556728" },
  { id: "m4", recipient: "James O'Brien", lead: "L-2026-0051", surplus: "$19K", city: "San Antonio", state: "TX", status: "returned", sentDayOffset: -18, returnedDayOffset: -5, mailClass: "First Class", tracking: "9400111899223344556735" },
  { id: "m5", recipient: "Linda Foster", lead: "L-2026-0048", surplus: "$33K", city: "Fort Worth", state: "TX", status: "in_transit", sentDayOffset: -1, expectedEta: 4, mailClass: "First Class", tracking: "9400111899223344556742" },
  { id: "m6", recipient: "Susan Park", lead: "L-2026-0050", surplus: "$14K", city: "Austin", state: "TX", status: "in_transit", sentDayOffset: -5, expectedEta: 4, mailClass: "First Class", tracking: "9400111899223344556766", hasCheck: "$4,825" },
  { id: "m7", recipient: "Carlos Mendez", lead: "L-2026-0058", surplus: "$22K", city: "El Paso", state: "TX", status: "delivered", sentDayOffset: -18, deliveredDayOffset: -13, mailClass: "First Class", tracking: "9400111899223344556773" },
];

// Time axis: -20 to +7 = 27 day range
const AXIS_MIN = -20;
const AXIS_MAX = 7;
const AXIS_SPAN = AXIS_MAX - AXIS_MIN;
function pct(dayOffset: number): number {
  return ((dayOffset - AXIS_MIN) / AXIS_SPAN) * 100;
}

const STATUS_COLORS: Record<SamplePiece["status"], string> = {
  delivered: "#0d4b3a",
  in_transit: "#0f1729",
  returned: "#c4253c",
};

const STATUS_LABEL: Record<SamplePiece["status"], string> = {
  delivered: "Delivered",
  in_transit: "In Transit",
  returned: "Returned",
};

const DAY_TICKS = [-21, -14, -7, 0, 7];

export default async function MockupV5() {
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
          V5 · Timeline / Flow
        </span>
      </div>

      {/* MAIN /mail */}
      <header className="mb-6">
        <h1 className="m-0 text-[24px] font-semibold tracking-tight text-ink">
          Sent Mail
        </h1>
        <div className="mt-1 text-[13px] text-gray-500">
          Each piece traced across its journey. Bars start at the send
          date and end at delivery, return, or expected arrival.
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {/* Time axis header */}
        <div className="grid grid-cols-[280px_1fr] border-b border-gray-200 bg-gray-50/60">
          <div className="border-r border-gray-200 px-5 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              Recipient
            </div>
          </div>
          <div className="relative px-5 py-3">
            <div className="relative h-4">
              {DAY_TICKS.map((d) => (
                <span
                  key={d}
                  className="absolute -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500"
                  style={{ left: `${pct(d)}%` }}
                >
                  {d === 0 ? "Today" : d < 0 ? `${-d}d ago` : `+${d}d`}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-150">
          {SAMPLE.map((p) => (
            <Row p={p} key={p.id} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-gray-600">
        <LegendDot color="#0f1729" label="In Transit" />
        <LegendDot color="#0d4b3a" label="Delivered" />
        <LegendDot color="#c4253c" label="Returned" />
        <span className="ml-4 text-gray-400">|</span>
        <span>Striped tail = expected arrival window for in-flight pieces</span>
      </div>

      {/* LEAD MAIL TAB — same timeline scoped to one lead, with compose */}
      <section className="mt-12">
        <div className="mb-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0d4b3a]">
            L-2026-0042 · Smith Surplus Case
          </div>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-ink">
            Mail Timeline For This Lead
          </h2>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-lg border border-[#0d4b3a]/15 bg-[#0d4b3a]/[0.03] px-4 py-3">
          <div>
            <div className="text-[13px] font-medium text-ink">
              Compose New Mail
            </div>
            <div className="mt-[1px] text-[11.5px] text-gray-500">
              3 mailing addresses on file. New pieces appear on the
              timeline at the current day mark.
            </div>
          </div>
          <button className="cursor-pointer rounded-md bg-[#0d4b3a] px-3 py-2 text-[12px] font-semibold text-white">
            + New Mail Piece
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="grid grid-cols-[280px_1fr] border-b border-gray-200 bg-gray-50/60">
            <div className="border-r border-gray-200 px-5 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                Recipient
              </div>
            </div>
            <div className="relative px-5 py-3">
              <div className="relative h-4">
                {DAY_TICKS.map((d) => (
                  <span
                    key={d}
                    className="absolute -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500"
                    style={{ left: `${pct(d)}%` }}
                  >
                    {d === 0 ? "Today" : d < 0 ? `${-d}d ago` : `+${d}d`}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-150">
            <Row p={SAMPLE[0]} />
            <Row p={SAMPLE[1]} />
            <Row p={SAMPLE[3]} />
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ p }: { p: SamplePiece }) {
  const sentX = pct(p.sentDayOffset);
  const endX =
    p.status === "delivered" && p.deliveredDayOffset != null
      ? pct(p.deliveredDayOffset)
      : p.status === "returned" && p.returnedDayOffset != null
        ? pct(p.returnedDayOffset)
        : p.expectedEta != null
          ? pct(p.sentDayOffset + p.expectedEta)
          : pct(0);
  const width = Math.max(endX - sentX, 1.5);
  const color = STATUS_COLORS[p.status];
  const todayX = pct(0);

  return (
    <div className="grid grid-cols-[280px_1fr] hover:bg-gray-50/40">
      {/* Recipient col */}
      <div className="border-r border-gray-200 px-5 py-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13.5px] font-semibold text-ink">
            {p.recipient}
          </span>
          <span
            className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em]"
            style={{ color }}
          >
            {STATUS_LABEL[p.status]}
          </span>
        </div>
        <div className="mt-[1px] truncate text-[11.5px] text-gray-500">
          {p.city}, {p.state} · {p.mailClass}
          {p.hasCheck ? ` · check ${p.hasCheck}` : ""}
        </div>
        <div className="mt-[1px] truncate text-[11px] text-gray-400">
          <Link href="#" className="cursor-pointer text-[#0d4b3a] underline decoration-[#0d4b3a]/30 underline-offset-2">
            {p.lead}
          </Link>{" "}
          · {p.surplus} surplus
        </div>
      </div>

      {/* Bar col */}
      <div className="relative px-5 py-4">
        <div className="relative h-9">
          {/* Today vertical line */}
          <div
            aria-hidden
            className="absolute top-0 h-full border-l border-dashed border-gray-300"
            style={{ left: `${todayX}%` }}
          />
          {/* Sent → end bar */}
          <div
            className="absolute top-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: `${sentX}%`,
              width: `${width}%`,
              height: "10px",
              background:
                p.status === "in_transit"
                  ? // Solid sent-to-today portion + striped expected tail
                    `linear-gradient(to right, ${color} 0%, ${color} ${
                      ((todayX - sentX) / width) * 100
                    }%, transparent ${((todayX - sentX) / width) * 100}%)`
                  : color,
              boxShadow: `0 1px 3px ${color}40`,
            }}
          />
          {/* Striped expected tail for in-transit */}
          {p.status === "in_transit" && (
            <div
              aria-hidden
              className="absolute top-1/2 -translate-y-1/2 rounded-r-full"
              style={{
                left: `${todayX}%`,
                width: `${endX - todayX}%`,
                height: "10px",
                background: `repeating-linear-gradient(45deg, ${color}40 0 4px, transparent 4px 8px)`,
                border: `1px dashed ${color}80`,
              }}
            />
          )}
          {/* Sent dot */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{
              left: `${sentX}%`,
              width: "8px",
              height: "8px",
              border: `2px solid ${color}`,
            }}
          />
          {/* End dot */}
          {p.status !== "in_transit" && (
            <div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${endX}%`,
                width: "10px",
                height: "10px",
                background: color,
                boxShadow: `0 0 0 3px ${color}25`,
              }}
            />
          )}
        </div>
        <div className="mt-1 flex items-center justify-between text-[10.5px] text-gray-500">
          <span>
            Sent {Math.abs(p.sentDayOffset)}d ago
          </span>
          <a
            href="#"
            className="font-mono text-[10.5px] text-[#0d4b3a] hover:underline"
          >
            {p.tracking.slice(-8)}
          </a>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
