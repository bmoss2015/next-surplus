import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Variant 7 — Stripe-style transaction list (main /mail only).
// Dense, refined, well-typed list. Borrowed from Stripe Payments
// and Linear's issue list. The Excel feeling Bree pushed back on
// comes from harsh borders, equal column weights, and dead status
// pills. This view fixes that with: no harsh borders (hairlines
// only between rows), unequal column weights (recipient is bigger),
// status as a small inline indicator (dot + label, not a pill block),
// monetary/tracking numbers in tabular-nums for vertical alignment.
// Filter bar at the top, hover row reveals quick actions. Designed
// to scan 100+ pieces fast without losing density.

type StatusKey = "in_transit" | "delivered" | "returned";

const SAMPLE: Array<{
  id: string;
  recipient: string;
  city: string;
  state: string;
  lead: string;
  surplus: string;
  status: StatusKey;
  sentAt: string;
  arrivedAt?: string;
  daysInTransit?: number;
  classLabel: string;
  trackingLast: string;
  check?: string;
}> = [
  { id: "m4", recipient: "James O'Brien", city: "San Antonio", state: "TX", lead: "L-2026-0051", surplus: "$19,400", status: "returned", sentAt: "Jan 09", arrivedAt: "Jan 22", classLabel: "First Class", trackingLast: "5569" },
  { id: "m10", recipient: "George Wu", city: "Lubbock", state: "TX", lead: "L-2026-0062", surplus: "$31,200", status: "returned", sentAt: "Jan 12", arrivedAt: "Jan 19", classLabel: "First Class", trackingLast: "5577" },
  { id: "m11", recipient: "Helen Reyes", city: "Austin", state: "TX", lead: "L-2026-0067", surplus: "$8,100", status: "returned", sentAt: "Jan 06", arrivedAt: "Jan 17", classLabel: "First Class", trackingLast: "5580" },
  { id: "m5", recipient: "Linda Foster", city: "Fort Worth", state: "TX", lead: "L-2026-0048", surplus: "$33,000", status: "in_transit", sentAt: "Jan 26", daysInTransit: 1, classLabel: "First Class", trackingLast: "5570" },
  { id: "m6", recipient: "Robert Foster", city: "Fort Worth", state: "TX", lead: "L-2026-0048", surplus: "$33,000", status: "in_transit", sentAt: "Jan 26", daysInTransit: 1, classLabel: "First Class", trackingLast: "5571" },
  { id: "m3", recipient: "Patricia Williams", city: "Dallas", state: "TX", lead: "L-2026-0046", surplus: "$61,000", status: "in_transit", sentAt: "Jan 24", daysInTransit: 3, classLabel: "First Class", trackingLast: "5568" },
  { id: "m7", recipient: "Susan Park", city: "Austin", state: "TX", lead: "L-2026-0050", surplus: "$14,000", status: "in_transit", sentAt: "Jan 22", daysInTransit: 5, classLabel: "First Class", trackingLast: "5572", check: "$4,825" },
  { id: "m1", recipient: "Margaret Chen", city: "Austin", state: "TX", lead: "L-2026-0042", surplus: "$42,000", status: "delivered", sentAt: "Jan 14", arrivedAt: "Jan 18", classLabel: "First Class", trackingLast: "5566" },
  { id: "m2", recipient: "David Rodriguez", city: "Houston", state: "TX", lead: "L-2026-0044", surplus: "$28,000", status: "delivered", sentAt: "Jan 16", arrivedAt: "Jan 20", classLabel: "Certified", trackingLast: "5567" },
  { id: "m8", recipient: "Carlos Mendez", city: "El Paso", state: "TX", lead: "L-2026-0058", surplus: "$22,000", status: "delivered", sentAt: "Jan 13", arrivedAt: "Jan 17", classLabel: "First Class", trackingLast: "5573" },
  { id: "m9", recipient: "Anna Park", city: "Plano", state: "TX", lead: "L-2026-0070", surplus: "$45,000", status: "delivered", sentAt: "Jan 18", arrivedAt: "Jan 21", classLabel: "Certified", trackingLast: "5574" },
];

const STATUS_LABEL: Record<StatusKey, string> = {
  in_transit: "In Transit",
  delivered: "Delivered",
  returned: "Returned",
};

const STATUS_DOT: Record<StatusKey, string> = {
  in_transit: "bg-gray-400",
  delivered: "bg-[#0d4b3a]",
  returned: "bg-[#c4253c]",
};

const STATUS_TEXT: Record<StatusKey, string> = {
  in_transit: "text-ink",
  delivered: "text-[#0d4b3a]",
  returned: "text-[#c4253c]",
};

export default async function MockupV7() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  return (
    <div className="min-h-screen bg-white px-7 py-7">
      <div className="mb-7 flex items-center justify-between">
        <Link
          href="/admin/mail-mockup"
          className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 hover:text-ink"
        >
          ← All Mockups
        </Link>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">
          V7 · Stripe-style List (main /mail only)
        </span>
      </div>

      <header className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="m-0 text-[24px] font-semibold tracking-tight text-ink">
            Sent Mail
          </h1>
          <div className="mt-1 text-[12.5px] text-gray-500">
            24 pieces · 18 delivered · 3 in transit · 3 returned · last 30 days
          </div>
        </div>
        <button className="cursor-pointer rounded-md bg-[#0d4b3a] px-3 py-2 text-[12px] font-semibold text-white">
          Export CSV
        </button>
      </header>

      {/* Filter / search bar */}
      <div className="mb-1 flex items-center gap-2 border-b border-gray-150 pb-3">
        <input
          type="text"
          placeholder="Search recipient, city, lead, or tracking"
          className="w-[340px] rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12.5px] text-ink placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-petrol-300"
        />
        <div className="flex gap-1">
          {["All", "In Transit", "Delivered", "Returned"].map((f, i) => (
            <button
              key={f}
              className={`cursor-pointer rounded-[4px] border px-[10px] py-[5px] text-[9.5px] font-semibold uppercase leading-none tracking-[0.12em] transition-colors ${
                i === 0
                  ? "border-ink bg-ink text-white"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="ml-auto text-[11.5px] text-gray-500">
          Showing 1–{SAMPLE.length} of 24
        </div>
      </div>

      {/* List — no harsh borders, hairlines between rows only */}
      <div>
        {SAMPLE.map((p) => (
          <div
            key={p.id}
            className="group grid grid-cols-[1fr_120px_140px_120px_80px] items-center gap-6 border-b border-gray-150 py-3 transition-colors hover:bg-gray-50/50"
          >
            {/* Recipient + lead context */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[p.status]}`} />
                <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${STATUS_TEXT[p.status]}`}>
                  {STATUS_LABEL[p.status]}
                </span>
              </div>
              <div className="mt-[3px] flex items-baseline gap-2">
                <span className="text-[14px] font-semibold text-ink">
                  {p.recipient}
                </span>
                <span className="text-[12px] text-gray-500">
                  {p.city}, {p.state}
                </span>
              </div>
              <div className="mt-[1px] text-[11.5px] text-gray-500">
                <Link href="#" className="cursor-pointer text-[#0d4b3a] underline decoration-[#0d4b3a]/30 underline-offset-2">
                  {p.lead}
                </Link>{" "}
                <span className="text-gray-400">·</span>{" "}
                <span className="text-ink">{p.surplus}</span> surplus
                {p.check && (
                  <>
                    <span className="text-gray-400"> · </span>
                    <span className="font-medium text-[#0d4b3a]">check {p.check}</span>
                  </>
                )}
              </div>
            </div>

            {/* Class */}
            <div className="text-[11.5px] text-gray-600">
              {p.classLabel}
            </div>

            {/* Date(s) — tabular */}
            <div className="text-[11.5px] tabular-nums text-gray-600">
              <div>Sent {p.sentAt}</div>
              {p.status === "delivered" && p.arrivedAt && (
                <div className="text-[#0d4b3a]">Delivered {p.arrivedAt}</div>
              )}
              {p.status === "returned" && p.arrivedAt && (
                <div className="text-[#c4253c]">Returned {p.arrivedAt}</div>
              )}
              {p.status === "in_transit" && p.daysInTransit != null && (
                <div className="text-gray-500">{p.daysInTransit}d in transit</div>
              )}
            </div>

            {/* Tracking */}
            <div className="font-mono text-[11.5px] tabular-nums text-gray-500">
              …{p.trackingLast}
            </div>

            {/* Quick actions — hidden until hover */}
            <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1 text-[10.5px] font-medium text-ink hover:bg-gray-50">
                View
              </button>
              <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1 text-[10.5px] font-medium text-ink hover:bg-gray-50">
                Track
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between text-[11.5px] text-gray-500">
        <span>Showing all returned + in transit + delivered pieces</span>
        <button className="cursor-pointer text-[#0d4b3a] underline decoration-[#0d4b3a]/30 underline-offset-2 hover:decoration-[#0d4b3a]">
          Load Older Pieces
        </button>
      </div>
    </div>
  );
}
