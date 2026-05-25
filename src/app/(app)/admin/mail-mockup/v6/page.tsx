import { notFound } from "next/navigation";
import Link from "next/link";
import {
  IconMail,
  IconCalendar,
  IconHash,
  IconCash,
  IconFileText,
  IconExternalLink,
  IconChevronRight,
  IconChevronDown,
  IconBarcode,
  IconArrowBackUp,
} from "@tabler/icons-react";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Variant 6 (next iteration).
// Bree's pass:
//   - KPI tile subtext lines removed.
//   - Send Mail button removed from /mail dashboard (action is per-lead).
//   - Added Returned section (third list block).
//   - Batch grouping back — multi-recipient sends collapse to a
//     parent row you can expand.
//   - Rows restructured for legibility: name + address on the top,
//     icon-led meta strip below, status pill + actions on the right.
//     Whole row is a Link to the lead.
//   - View Letter promoted to a solid-green primary, Track stays
//     outlined-green, both icon-led.

type Piece = {
  id: string;
  name: string;
  line1: string;
  city: string;
  state: string;
  postal: string;
  classLabel: string;
  sentAt: string;
  arrivedAt?: string;
  daysAgo?: string;
  lead: string;
  surplus: string;
  trackingTail: string;
  check?: string;
  returnReason?: string;
};

type Batch = {
  id: string;
  pieces: Piece[];
};

// In Transit — one batch + a solo to demo the grouping
const IN_TRANSIT: Array<Piece | Batch> = [
  { id: "m3", name: "Patricia Williams", line1: "1023 Heritage Lane", city: "Dallas", state: "TX", postal: "75204", classLabel: "First Class", sentAt: "Jan 24", daysAgo: "3d ago", lead: "L-2026-0046", surplus: "$61K", trackingTail: "5568" },
  {
    id: "b1",
    pieces: [
      { id: "m5", name: "Linda Foster", line1: "5511 Westbrook Way", city: "Fort Worth", state: "TX", postal: "76107", classLabel: "First Class", sentAt: "Jan 26", daysAgo: "1d ago", lead: "L-2026-0048", surplus: "$33K", trackingTail: "5570" },
      { id: "m6", name: "Robert Foster", line1: "5511 Westbrook Way", city: "Fort Worth", state: "TX", postal: "76107", classLabel: "First Class", sentAt: "Jan 26", daysAgo: "1d ago", lead: "L-2026-0048", surplus: "$33K", trackingTail: "5571" },
    ],
  },
  { id: "m7", name: "Susan Park", line1: "918 Cedar Springs Rd", city: "Austin", state: "TX", postal: "78704", classLabel: "First Class", sentAt: "Jan 22", daysAgo: "5d ago", lead: "L-2026-0050", surplus: "$14K", trackingTail: "5572", check: "$4,825" },
];

const DELIVERED: Piece[] = [
  { id: "m1", name: "Margaret Chen", line1: "412 Oakwood Drive", city: "Austin", state: "TX", postal: "78745", classLabel: "First Class", sentAt: "Jan 14", arrivedAt: "Jan 18", lead: "L-2026-0042", surplus: "$42K", trackingTail: "5566" },
  { id: "m2", name: "David Rodriguez", line1: "78 Pinecrest Avenue", city: "Houston", state: "TX", postal: "77019", classLabel: "Certified", sentAt: "Jan 16", arrivedAt: "Jan 20", lead: "L-2026-0044", surplus: "$28K", trackingTail: "5567" },
  { id: "m8", name: "Carlos Mendez", line1: "2200 Border Avenue", city: "El Paso", state: "TX", postal: "79912", classLabel: "First Class", sentAt: "Jan 13", arrivedAt: "Jan 17", lead: "L-2026-0058", surplus: "$22K", trackingTail: "5573" },
];

const RETURNED: Piece[] = [
  { id: "m4", name: "James O'Brien", line1: "245 Magnolia Court", city: "San Antonio", state: "TX", postal: "78216", classLabel: "First Class", sentAt: "Jan 09", arrivedAt: "Jan 22", lead: "L-2026-0051", surplus: "$19K", trackingTail: "5569", returnReason: "Forward expired" },
  { id: "m10", name: "George Wu", line1: "6111 Llano Estacado", city: "Lubbock", state: "TX", postal: "79407", classLabel: "First Class", sentAt: "Jan 12", arrivedAt: "Jan 19", lead: "L-2026-0062", surplus: "$31K", trackingTail: "5577", returnReason: "Vacant" },
  { id: "m11", name: "Helen Reyes", line1: "3402 W Slaughter Ln", city: "Austin", state: "TX", postal: "78748", classLabel: "First Class", sentAt: "Jan 06", arrivedAt: "Jan 17", lead: "L-2026-0067", surplus: "$8K", trackingTail: "5580", returnReason: "No such number" },
];

function isBatch(x: Piece | Batch): x is Batch {
  return "pieces" in x;
}

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
          V6 · Iteration
        </span>
      </div>

      {/* Header — no Send Mail button (per Bree, send happens per-lead) */}
      <header className="mb-6">
        <h1 className="m-0 text-[28px] font-semibold tracking-tight text-ink">
          Sent Mail
        </h1>
      </header>

      {/* KPI tiles — no subtext lines */}
      <div className="grid grid-cols-4 gap-4">
        <Tile label="In Transit" value="3" />
        <Tile label="Sent Today" value="2" />
        <Tile label="Delivered This Week" value="6" />
        <Tile label="Returned This Month" value="3" warn />
      </div>

      {/* Pipeline bar */}
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

      {/* Lists — each their own section. In Transit + batch grouping. */}
      <Section eyebrow="In Transit">
        {IN_TRANSIT.map((item) =>
          isBatch(item) ? (
            <BatchRow batch={item} key={item.id} />
          ) : (
            <PieceRow piece={item} key={item.id} />
          )
        )}
      </Section>

      <Section eyebrow="Delivered (Recent)" trailing={<Link href="#" className="cursor-pointer text-[11px] font-medium text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-ink">Show all 18</Link>}>
        {DELIVERED.map((p) => (
          <PieceRow piece={p} key={p.id} status="delivered" />
        ))}
      </Section>

      <Section eyebrow="Returned" tone="danger">
        {RETURNED.map((p) => (
          <PieceRow piece={p} key={p.id} status="returned" />
        ))}
      </Section>
    </div>
  );
}

function Tile({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${warn ? "text-[#c4253c]" : "text-gray-500"}`}>
        {label}
      </div>
      <div className={`mt-3 text-[42px] font-semibold leading-none tracking-tight ${warn ? "text-[#c4253c]" : "text-ink"}`}>
        {value}
      </div>
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

function Section({
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
      className={`mt-5 overflow-hidden rounded-2xl border bg-white ${
        tone === "danger" ? "border-[#c4253c]/20" : "border-gray-200"
      }`}
    >
      <header className="flex items-baseline justify-between border-b border-gray-100 px-6 py-3.5">
        <div className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${tone === "danger" ? "text-[#c4253c]" : "text-gray-500"}`}>
          {eyebrow}
        </div>
        {trailing}
      </header>
      <div className="divide-y divide-gray-100">{children}</div>
    </section>
  );
}

function PieceRow({
  piece,
  status = "in_transit",
  isBatchChild,
}: {
  piece: Piece;
  status?: "in_transit" | "delivered" | "returned";
  isBatchChild?: boolean;
}) {
  // Status pill — OUTLINED. Conveys informational state. Same hue as
  // the action button below but different visual weight (border-only
  // vs solid-fill) so the user reads "this is what happened" vs
  // "this is what you can do" without confusion.
  const pillClass =
    status === "delivered"
      ? "border-[#0d4b3a]/40 text-[#0d4b3a]"
      : status === "returned"
        ? "border-[#c4253c]/40 text-[#c4253c]"
        : "border-gray-300 text-ink";
  const pillLabel =
    status === "delivered" ? "Delivered" : status === "returned" ? "Returned" : "In Transit";

  return (
    <Link
      href="#"
      className={`group grid grid-cols-[1fr_auto] items-start gap-5 px-6 py-4 transition-colors hover:bg-gray-50 ${
        isBatchChild ? "pl-12" : ""
      }`}
    >
      {/* Left column — strict info order: name, address, meta. */}
      <div className="min-w-0">
        {/* Row 1: name + outlined status pill */}
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold text-ink">
            {piece.name}
          </span>
          <span
            className={`inline-flex items-center justify-center rounded-[4px] border bg-white px-[8px] py-[3px] text-[9.5px] font-semibold uppercase leading-none tracking-[0.12em] ${pillClass}`}
          >
            {pillLabel}
          </span>
        </div>

        {/* Row 2: full street address */}
        <div className="mt-1 text-[12.5px] text-gray-600">
          {piece.line1}, {piece.city}, {piece.state} {piece.postal}
        </div>

        {/* Row 3: class · sent · delivered/returned · tracking */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-600">
          <span>{piece.classLabel}</span>
          <span className="text-gray-300">·</span>
          <span>Sent {piece.sentAt}</span>
          {status === "delivered" && piece.arrivedAt && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-[#0d4b3a]">Delivered {piece.arrivedAt}</span>
            </>
          )}
          {status === "returned" && piece.arrivedAt && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-[#c4253c]">
                Returned {piece.arrivedAt} ({piece.returnReason})
              </span>
            </>
          )}
          {piece.check && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-[#0d4b3a]">check {piece.check}</span>
            </>
          )}
          <span className="text-gray-300">·</span>
          <span className="font-mono text-[11.5px] tabular-nums text-gray-500">
            #{piece.trackingTail}
          </span>
        </div>
      </div>

      {/* Right column — actions. Solid fills (clickable affordance);
          same hue as the matching status pill (semantic link) but
          different weight (outlined pill / solid button). */}
      <div className="flex shrink-0 items-center gap-2">
        {status === "returned" ? (
          <button
            type="button"
className="cursor-pointer rounded-md bg-[#c4253c] px-3 py-1.5 text-[11.5px] font-semibold text-white"
          >
            Fix &amp; Resend
          </button>
        ) : (
          <>
            <button
              type="button"
    className="cursor-pointer rounded-md bg-[#0d4b3a] px-3 py-1.5 text-[11.5px] font-medium text-white shadow-[0_1px_2px_rgba(13,75,58,0.25)] hover:bg-[#0d6c4d]"
            >
              View Letter
            </button>
            <button
              type="button"
    className="cursor-pointer rounded-md border border-[#0d4b3a]/25 bg-white px-3 py-1.5 text-[11.5px] font-medium text-[#0d4b3a] hover:bg-[#0d4b3a]/[0.04]"
            >
              Track
            </button>
          </>
        )}
        <IconChevronRight size={16} stroke={1.75} className="text-gray-300 group-hover:text-gray-500" />
      </div>
    </Link>
  );
}

function BatchRow({ batch }: { batch: Batch }) {
  const lead = batch.pieces[0]?.lead ?? "";
  const surplus = batch.pieces[0]?.surplus ?? "";
  const sentAt = batch.pieces[0]?.sentAt ?? "";
  const classLabel = batch.pieces[0]?.classLabel ?? "";
  return (
    <details className="group">
      <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-5 px-6 py-4 transition-colors hover:bg-gray-50">
        <div className="min-w-0">
          <div className="flex items-baseline gap-3">
            <span className="text-[15px] font-semibold text-ink">
              Batch of {batch.pieces.length}{" "}
              <span className="text-gray-500">to the Foster family</span>
            </span>
            <span className="text-[11px] text-gray-500">
              Sent {sentAt}
            </span>
          </div>
          <div className="mt-[2px] text-[12.5px] text-gray-600">
            {batch.pieces.map((p) => p.name).join(", ")}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink">
            <span className="inline-flex items-center gap-1.5">
              <IconMail size={13} stroke={1.75} className="text-gray-400" />
              {classLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconHash size={13} stroke={1.75} className="text-gray-400" />
              <span className="text-[#0d4b3a]">{lead}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconCash size={13} stroke={1.75} className="text-gray-400" />
              {surplus} surplus
            </span>
          </div>
        </div>
        {/* Single wide affordance that spans the same visual footprint
            as the solo-row's View Letter + Track buttons (~188px) so
            batch and solo rows line up across the right edge. Same
            button height too. */}
        <div className="flex shrink-0 items-center">
          <span
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-ink/30 bg-white px-4 py-1.5 text-[11.5px] font-medium text-ink hover:bg-gray-50"
            style={{ minWidth: "188px" }}
          >
            Show {batch.pieces.length} Pieces
            <IconChevronDown
              size={14}
              stroke={2}
              className="text-gray-500 transition-transform group-open:rotate-180"
            />
          </span>
        </div>
      </summary>
      <div className="border-t border-gray-100 bg-gray-50/40">
        {batch.pieces.map((p) => (
          <PieceRow piece={p} key={p.id} isBatchChild />
        ))}
      </div>
    </details>
  );
}
