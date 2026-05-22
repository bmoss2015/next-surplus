import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Variant 8 — Inbox Zero / minimal (main /mail only).
// Reverses the usual "show everything, filter to less" dashboard. By
// default this view shows only what needs human attention. Everything
// else is collapsed behind quiet section headers the user can expand
// when they want detail. Most days, the operator sees a clean page
// with their action items and a one-line summary of pipeline health.
// Inspired by Linear's "Inbox" and Things 3's "Today" view — these
// trade density for clarity, on the bet that operators value
// "what should I do next" over "show me everything."

export default async function MockupV8() {
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
          V8 · Inbox Zero (main /mail only)
        </span>
      </div>

      <header className="mb-8">
        <h1 className="m-0 text-[28px] font-semibold tracking-tight text-ink">
          Sent Mail
        </h1>
        <div className="mt-1 text-[13px] text-gray-500">
          3 pieces need a new address. 21 others are doing fine.
        </div>
      </header>

      {/* The only loud section: things needing attention */}
      <section className="rounded-2xl bg-white p-7 shadow-card ring-1 ring-[#c4253c]/15">
        <div className="mb-5 flex items-baseline justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c4253c]">
              Needs Your Attention
            </div>
            <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-ink">
              Three pieces couldn&apos;t reach their recipient
            </h2>
          </div>
        </div>

        <div className="divide-y divide-gray-150">
          <ReturnedPiece
            name="James O'Brien"
            address="245 Magnolia Court, San Antonio, TX 78216"
            reason="Forward expired"
            lead="L-2026-0051"
            surplus="$19K"
            returnedDate="Jan 22"
            firstReturn
          />
          <ReturnedPiece
            name="George Wu"
            address="6111 Llano Estacado, Lubbock, TX 79407"
            reason="Vacant"
            lead="L-2026-0062"
            surplus="$31K"
            returnedDate="Jan 19"
          />
          <ReturnedPiece
            name="Helen Reyes"
            address="3402 W Slaughter Ln, Austin, TX 78748"
            reason="No such number"
            lead="L-2026-0067"
            surplus="$8K"
            returnedDate="Jan 17"
          />
        </div>
      </section>

      {/* Collapsed: in transit */}
      <section className="mt-4 overflow-hidden rounded-2xl bg-white">
        <CollapsedRow
          eyebrow="In Transit"
          count="3"
          headline="moving toward delivery"
          sub="Patricia Williams (Dallas), Linda + Robert Foster (Fort Worth), Susan Park (Austin)"
        />
      </section>

      {/* Collapsed: delivered */}
      <section className="mt-3 overflow-hidden rounded-2xl bg-white">
        <CollapsedRow
          eyebrow="Delivered"
          count="18"
          headline="reached recipients"
          sub="Margaret Chen, David Rodriguez, Carlos Mendez + 15 more. Last 30 days."
          variant="ok"
        />
      </section>

      <div className="mt-6 flex items-center justify-between text-[11.5px] text-gray-500">
        <span>This view shows only mail that needs a human. To see every piece, expand the sections above or use search.</span>
        <Link
          href="#"
          className="cursor-pointer text-[#0d4b3a] underline decoration-[#0d4b3a]/30 underline-offset-2 hover:decoration-[#0d4b3a]"
        >
          Search All Mail →
        </Link>
      </div>
    </div>
  );
}

function ReturnedPiece({
  name,
  address,
  reason,
  lead,
  surplus,
  returnedDate,
  firstReturn,
}: {
  name: string;
  address: string;
  reason: string;
  lead: string;
  surplus: string;
  returnedDate: string;
  firstReturn?: boolean;
}) {
  return (
    <div className={`grid grid-cols-[1fr_auto] gap-6 ${firstReturn ? "pb-5" : "py-5"}`}>
      <div className="min-w-0">
        <div className="text-[16px] font-semibold tracking-tight text-ink">
          {name}
        </div>
        <div className="mt-[2px] text-[12.5px] text-gray-600">{address}</div>
        <div className="mt-2 text-[12px]">
          <span className="font-medium text-[#c4253c]">USPS: {reason}</span>
          <span className="text-gray-400"> · returned {returnedDate}</span>
        </div>
        <div className="mt-[2px] text-[11.5px] text-gray-500">
          <Link href="#" className="cursor-pointer text-[#0d4b3a] underline decoration-[#0d4b3a]/30 underline-offset-2">
            {lead}
          </Link>{" "}
          <span className="text-gray-400">·</span>{" "}
          <span className="text-ink">{surplus} surplus</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        <button className="cursor-pointer rounded-md bg-[#0d4b3a] px-3 py-1.5 text-[12px] font-semibold text-white">
          Fix Address &amp; Resend
        </button>
        <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[11.5px] font-medium text-gray-600 hover:bg-gray-50">
          View Letter
        </button>
      </div>
    </div>
  );
}

function CollapsedRow({
  eyebrow,
  count,
  headline,
  sub,
  variant,
}: {
  eyebrow: string;
  count: string;
  headline: string;
  sub: string;
  variant?: "ok";
}) {
  return (
    <button
      type="button"
      className="grid w-full cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-5 px-7 py-5 text-left hover:bg-gray-50"
    >
      <span
        className={`text-[40px] font-semibold leading-none tracking-tight ${
          variant === "ok" ? "text-[#0d4b3a]" : "text-ink"
        }`}
      >
        {count}
      </span>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
          {eyebrow}
        </div>
        <div className="mt-[1px] text-[14px] font-medium text-ink">
          {count} pieces {headline}
        </div>
        <div className="mt-[1px] text-[11.5px] text-gray-500">{sub}</div>
      </div>
      <span className="text-[18px] text-gray-400">+</span>
    </button>
  );
}
