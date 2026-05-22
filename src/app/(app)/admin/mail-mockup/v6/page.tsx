import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Variant 6 — Operations dashboard.
// Main /mail tab only. Reads as an ops control room, not a mail list.
// Top half is performance KPIs with comparison to last period.
// Middle is a single horizontal "in flight" bar showing the
// distribution of every piece by status (proportional). Below that,
// an "Action Required" section surfaces only pieces that need a
// human (returned, failed). Everything else collapses behind quiet
// section dividers the user can expand. Not a list-of-everything;
// it's a dashboard that hides what's working.

export default async function MockupV6() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  // Sample mail stats
  const total = 24;
  const inTransit = 3;
  const delivered = 18;
  const returned = 3;
  const deliveryRate = Math.round((delivered / total) * 100);
  const returnRate = Math.round((returned / total) * 100);

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
          V6 · Operations Dashboard (main /mail only)
        </span>
      </div>

      <header className="mb-7">
        <h1 className="m-0 text-[28px] font-semibold tracking-tight text-ink">
          Sent Mail
        </h1>
        <div className="mt-1 text-[13px] text-gray-500">
          Performance across all leads, last 30 days.
        </div>
      </header>

      {/* Big KPI strip */}
      <div className="grid grid-cols-3 gap-5">
        <Kpi
          label="Delivery Rate"
          value={`${deliveryRate}%`}
          delta="+4 pts vs prev 30d"
          deltaPositive
        />
        <Kpi
          label="Avg Time to Delivered"
          value="4.2"
          unit="days"
          delta="0.3d faster"
          deltaPositive
        />
        <Kpi
          label="Return Rate"
          value={`${returnRate}%`}
          delta="+2 pts vs prev 30d"
          warn
        />
      </div>

      {/* In-flight distribution bar */}
      <section className="mt-7 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              Pipeline
            </div>
            <h2 className="mt-1 text-[17px] font-semibold text-ink">
              {total} pieces moved through the system this month
            </h2>
          </div>
          <Link
            href="#"
            className="cursor-pointer text-[12px] font-medium text-[#0d4b3a] underline decoration-[#0d4b3a]/30 underline-offset-2"
          >
            View All Pieces
          </Link>
        </div>

        {/* Horizontal proportional bar */}
        <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="bg-ink"
            style={{ width: `${(inTransit / total) * 100}%` }}
          />
          <div
            className="bg-[#0d4b3a]"
            style={{ width: `${(delivered / total) * 100}%` }}
          />
          <div
            className="bg-[#c4253c]"
            style={{ width: `${(returned / total) * 100}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-4 text-[12px]">
          <BreakdownPair
            color="bg-ink"
            label="In Transit"
            count={inTransit}
          />
          <BreakdownPair
            color="bg-[#0d4b3a]"
            label="Delivered"
            count={delivered}
          />
          <BreakdownPair
            color="bg-[#c4253c]"
            label="Returned"
            count={returned}
            warn
          />
        </div>
      </section>

      {/* Action required — only what needs human attention */}
      <section className="mt-5 rounded-2xl border border-[#c4253c]/20 bg-white p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c4253c]">
              Action Required
            </div>
            <h2 className="mt-1 text-[17px] font-semibold text-ink">
              3 pieces need a different address before resending
            </h2>
          </div>
        </div>
        <div className="mt-4 divide-y divide-gray-150">
          <ActionRow
            name="James O'Brien"
            lead="L-2026-0051"
            surplus="$19K"
            address="245 Magnolia Court, San Antonio, TX"
            returnReason="Forward expired"
            daysAgo={5}
          />
          <ActionRow
            name="George Wu"
            lead="L-2026-0062"
            surplus="$31K"
            address="6111 Llano Estacado, Lubbock, TX"
            returnReason="Vacant"
            daysAgo={11}
          />
          <ActionRow
            name="Helen Reyes"
            lead="L-2026-0067"
            surplus="$8K"
            address="3402 W Slaughter Ln, Austin, TX"
            returnReason="No such number"
            daysAgo={14}
          />
        </div>
      </section>

      {/* In transit & delivered — collapsed by default */}
      <section className="mt-5 rounded-2xl border border-gray-200 bg-white">
        <CollapsedSection
          eyebrow="In Transit"
          headline={`${inTransit} pieces moving`}
          sub="Average 4.2 days from send to delivered. None overdue."
        />
        <div className="border-t border-gray-150" />
        <CollapsedSection
          eyebrow="Delivered"
          headline={`${delivered} pieces reached recipients`}
          sub="Last delivery: Carlos Mendez · El Paso · 18 hrs ago"
        />
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  unit,
  delta,
  deltaPositive,
  warn,
}: {
  label: string;
  value: string;
  unit?: string;
  delta: string;
  deltaPositive?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={`text-[42px] font-semibold leading-none tracking-tight ${
            warn ? "text-[#c4253c]" : "text-ink"
          }`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[16px] font-medium text-gray-500">{unit}</span>
        )}
      </div>
      <div
        className={`mt-3 text-[11px] font-medium ${
          warn ? "text-[#c4253c]" : deltaPositive ? "text-[#0d4b3a]" : "text-gray-500"
        }`}
      >
        {deltaPositive && !warn ? "↑ " : warn ? "↑ " : ""}
        {delta}
      </div>
    </div>
  );
}

function BreakdownPair({
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
        <div className="mt-[1px] text-[11.5px] text-gray-500">
          {address}
        </div>
        <div className="mt-[2px] text-[11px]">
          <span className="text-[#c4253c] font-medium">{returnReason}</span>
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

function CollapsedSection({
  eyebrow,
  headline,
  sub,
}: {
  eyebrow: string;
  headline: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center justify-between px-6 py-4 text-left hover:bg-gray-50"
    >
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
          {eyebrow}
        </div>
        <div className="mt-[2px] text-[14px] font-semibold text-ink">
          {headline}
        </div>
        <div className="mt-[1px] text-[11.5px] text-gray-500">{sub}</div>
      </div>
      <span className="text-[18px] text-gray-400">+</span>
    </button>
  );
}
