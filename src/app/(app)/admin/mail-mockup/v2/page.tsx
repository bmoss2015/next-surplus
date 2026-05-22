import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Variant 2 — Editorial card layout, info-driven pass.
// Bree feedback: keep the editorial card layout + letter thumbnail +
// View / Track / tracking-number, but kill the paragraph descriptions,
// the "Piece 01" labels, and the magazine-headline top section. Make
// the content information-driven (key/value pairs), not sentence-
// driven. Tracking number sits on a single line, not wrapped.

const SAMPLE = [
  { id: "m1", recipient: "Margaret Chen", role: "Sister, Smith estate", line1: "412 Oakwood Drive", city: "Austin", state: "TX", postal: "78745", lead: "L-2026-0042", surplus: "$42K", status: "Delivered", deliveredAt: "Jan 18, 2026", sentAt: "Jan 14, 2026", tracking: "9400111899223344556677", letter: "Estate Notification", mailClass: "First Class" },
  { id: "m2", recipient: "David Rodriguez", role: "Court-appointed administrator", line1: "78 Pinecrest Avenue", city: "Houston", state: "TX", postal: "77019", lead: "L-2026-0044", surplus: "$28K", status: "Delivered", deliveredAt: "Jan 20, 2026", sentAt: "Jan 16, 2026", tracking: "9400111899223344556712", letter: "Surplus Claim Notice", mailClass: "Certified" },
  { id: "m3", recipient: "Patricia Williams", role: "Owner of record", line1: "1023 Heritage Lane", city: "Dallas", state: "TX", postal: "75204", lead: "L-2026-0046", surplus: "$61K", status: "In Transit", sentAt: "Jan 24, 2026", tracking: "9400111899223344556728", letter: "Initial Outreach", mailClass: "First Class" },
  { id: "m4", recipient: "James O'Brien", role: "Heir, listed on deed", line1: "245 Magnolia Court", city: "San Antonio", state: "TX", postal: "78216", lead: "L-2026-0051", surplus: "$19K", status: "Returned", returnedAt: "Jan 22, 2026", sentAt: "Jan 09, 2026", tracking: "9400111899223344556735", letter: "Estate Notification", mailClass: "First Class", returnReason: "Forward expired" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Delivered: { bg: "bg-[#0d4b3a]", text: "text-white" },
  "In Transit": { bg: "bg-ink", text: "text-white" },
  Returned: { bg: "bg-[#c4253c]", text: "text-white" },
};

export default async function MockupV2() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/admin/mail-mockup"
            className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 hover:text-ink"
          >
            ← All Mockups
          </Link>
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">
            V2 · Revised
          </span>
        </div>

        {/* MAIN /mail */}
        <section className="mb-14">
          {/* Top — info-driven, no paragraph headline */}
          <div className="mb-7 border-b border-gray-200 pb-6">
            <h1 className="m-0 text-[28px] font-semibold tracking-tight text-ink">
              Sent Mail
            </h1>
            <div className="mt-1 text-[13px] text-gray-500">
              Last 30 days across all leads.
            </div>
            <dl className="mt-5 grid grid-cols-4 gap-x-6 gap-y-2">
              <StatPair label="Total Sent" value="24" />
              <StatPair label="In Transit" value="3" />
              <StatPair label="Delivered" value="18" />
              <StatPair label="Returned" value="3" emphasized />
            </dl>
          </div>

          {/* Cards — info-driven */}
          <div className="space-y-4">
            {SAMPLE.map((p) => (
              <Card key={p.id} p={p} />
            ))}
          </div>
        </section>

        {/* LEAD MAIL TAB */}
        <section>
          <div className="mb-6 border-b border-gray-200 pb-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0d4b3a]">
                  L-2026-0042 · Smith Surplus Case
                </div>
                <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-ink">
                  Sent Mail
                </h2>
              </div>
              {/* Send Mail action lives inline with the header — no
                  separate compose box anymore. Address-count is a quiet
                  hint above the button. */}
              <div className="text-right">
                <div className="mb-2 text-[11px] text-gray-500">
                  3 mailing addresses on file
                </div>
                <button className="cursor-pointer rounded-md bg-[#0d4b3a] px-4 py-2 text-[12px] font-semibold text-white">
                  Send Mail
                </button>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-4 gap-x-6 gap-y-2">
              <StatPair label="Total Sent" value="3" />
              <StatPair label="In Transit" value="0" />
              <StatPair label="Delivered" value="2" />
              <StatPair label="Returned" value="1" emphasized />
            </dl>
          </div>

          {/* Cards, scoped to this lead */}
          <div className="space-y-4">
            <Card p={SAMPLE[0]} />
            <Card p={SAMPLE[1]} />
            <Card p={SAMPLE[3]} />
          </div>
        </section>
      </div>
    </div>
  );
}

function StatPair({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </dt>
      <dd
        className={`mt-1 text-[28px] font-semibold leading-none tracking-tight ${
          emphasized ? "text-[#c4253c]" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Card({ p }: { p: (typeof SAMPLE)[number] }) {
  const sc = STATUS_COLORS[p.status];
  return (
    <article className="grid grid-cols-[110px_1fr] gap-5 rounded-lg border border-gray-200 bg-white p-4">
      {/* Letter thumbnail — smaller (was 200px tall, now 130px) */}
      <div className="relative h-[130px] overflow-hidden rounded-sm border border-gray-200 bg-white">
        <div className="absolute inset-0 p-2 text-[5.5px] leading-[1.4] text-ink">
          <div className="mb-[3px] text-right text-gray-500">{p.sentAt}</div>
          <div className="mb-[3px]">{p.recipient}</div>
          <div className="mb-[3px] text-gray-500">
            {p.line1}<br />{p.city}, {p.state}
          </div>
          <div className="mt-2 mb-[2px]">Dear {p.recipient.split(" ")[0]},</div>
          <div className="mb-[2px] text-gray-700">
            Our records indicate you may be entitled to surplus funds
            being held by the county following...
          </div>
          <div className="mb-[2px] text-gray-700">
            Moss Equity Partners specializes in helping rightful owners
            recover these funds...
          </div>
        </div>
      </div>

      {/* Info block — tightened */}
      <div className="flex min-w-0 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[15.5px] font-semibold tracking-tight text-ink">
              {p.recipient}
            </div>
            <div className="mt-[1px] truncate text-[11.5px] text-gray-500">
              {p.role}
            </div>
          </div>
          <span
            className={`inline-flex items-center justify-center rounded-[4px] px-[8px] py-[4px] text-[9px] font-semibold uppercase leading-none tracking-[0.12em] ${sc.bg} ${sc.text}`}
          >
            {p.status}
          </span>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-[11.5px]">
          <KV label="Class">{p.mailClass}</KV>
          <KV label="Sent">{p.sentAt}</KV>
          <KV label="Lead">
            <Link href="#" className="cursor-pointer text-[#0d4b3a] underline decoration-[#0d4b3a]/30 underline-offset-2 hover:decoration-[#0d4b3a]">
              {p.lead}
            </Link>{" "}
            <span className="text-gray-400">·</span>{" "}
            <span className="text-ink">{p.surplus} surplus</span>
          </KV>
          {p.status === "Delivered" && p.deliveredAt && (
            <KV label="Delivered">{p.deliveredAt}</KV>
          )}
          {p.status === "Returned" && p.returnedAt && (
            <KV label="Returned">
              {p.returnedAt}
              <span className="ml-1 text-[#c4253c]">({p.returnReason})</span>
            </KV>
          )}
          {p.status === "In Transit" && <KV label="ETA">2-4 business days</KV>}
          <div className="col-span-2">
            <KV label="Tracking">
              <a
                href="#"
                className="cursor-pointer whitespace-nowrap font-mono text-[11px] text-[#0d4b3a] underline decoration-[#0d4b3a]/30 underline-offset-2 hover:decoration-[#0d4b3a]"
              >
                {p.tracking}
              </a>
            </KV>
          </div>
        </dl>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] font-medium">
          <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-2.5 py-1 text-ink hover:bg-gray-50">
            View Letter
          </button>
          <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-2.5 py-1 text-ink hover:bg-gray-50">
            Track
          </button>
          {p.status === "Returned" && (
            <button className="cursor-pointer rounded-md bg-[#c4253c] px-2.5 py-1 text-white">
              Fix Address &amp; Resend
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function KV({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </dt>
      <dd className="mt-[1px] text-ink">{children}</dd>
    </div>
  );
}
