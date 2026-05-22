import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Variant 1 — Constellation.
// Mail pieces visualized as a canvas of nodes positioned by date
// (older left, newer right) and grouped vertically by status.
// Color, size, and ring convey state + class. Detail rail on the
// right anchors whichever node is hovered/clicked. No table, no
// stat tiles, no chips — the canvas IS the data.

type SampleStatus = "in_transit" | "delivered" | "returned";
type SamplePiece = {
  id: string;
  recipient: string;
  city: string;
  state: string;
  status: SampleStatus;
  daysAgo: number;
  mail_class: "first_class" | "certified" | "standard";
  has_check: boolean;
  amount?: string;
};

const SAMPLE: SamplePiece[] = [
  { id: "m1", recipient: "Margaret Chen", city: "Austin", state: "TX", status: "delivered", daysAgo: 9, mail_class: "first_class", has_check: false },
  { id: "m2", recipient: "David Rodriguez", city: "Houston", state: "TX", status: "delivered", daysAgo: 7, mail_class: "certified", has_check: false },
  { id: "m3", recipient: "Patricia Williams", city: "Dallas", state: "TX", status: "in_transit", daysAgo: 3, mail_class: "first_class", has_check: false },
  { id: "m4", recipient: "James O'Brien", city: "San Antonio", state: "TX", status: "returned", daysAgo: 5, mail_class: "first_class", has_check: false },
  { id: "m5", recipient: "Linda Foster", city: "Fort Worth", state: "TX", status: "in_transit", daysAgo: 1, mail_class: "first_class", has_check: false },
  { id: "m6", recipient: "Robert Foster", city: "Fort Worth", state: "TX", status: "in_transit", daysAgo: 1, mail_class: "first_class", has_check: false },
  { id: "m7", recipient: "Susan Park", city: "Austin", state: "TX", status: "in_transit", daysAgo: 5, mail_class: "first_class", has_check: true, amount: "$4,825" },
  { id: "m8", recipient: "Carlos Mendez", city: "El Paso", state: "TX", status: "delivered", daysAgo: 14, mail_class: "first_class", has_check: false },
  { id: "m9", recipient: "Anna Park", city: "Plano", state: "TX", status: "in_transit", daysAgo: 2, mail_class: "certified", has_check: false },
  { id: "m10", recipient: "George Wu", city: "Lubbock", state: "TX", status: "returned", daysAgo: 11, mail_class: "first_class", has_check: false },
];

const STATUS_BAND: Record<SampleStatus, { label: string; y: number }> = {
  in_transit: { label: "In Transit", y: 32 },
  delivered: { label: "Delivered", y: 50 },
  returned: { label: "Returned", y: 75 },
};

const STATUS_COLOR: Record<SampleStatus, string> = {
  in_transit: "#0f1729",
  delivered: "#0d4b3a",
  returned: "#c4253c",
};

export default async function MockupV1() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  // Position each node — x by daysAgo (older left, newer right), y by status band.
  const maxDays = Math.max(...SAMPLE.map((s) => s.daysAgo)) + 1;
  const nodes = SAMPLE.map((p) => ({
    ...p,
    x: 100 - (p.daysAgo / maxDays) * 90 - 5, // 5-95% horizontal
    y: STATUS_BAND[p.status].y,
    size: p.mail_class === "certified" ? 22 : p.has_check ? 20 : 16,
  }));

  return (
    <div className="min-h-screen bg-[#fafbfc] px-7 py-7">
      <MockupHeader title="V1 · Constellation" />

      {/* MAIN /mail DASHBOARD */}
      <Section eyebrow="Main · Sent Mail" headline="Last 30 days">
        <div className="grid grid-cols-[1fr_280px] gap-5">
          {/* Canvas */}
          <div className="relative h-[380px] overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {/* Vertical bands as status zones */}
            {Object.entries(STATUS_BAND).map(([key, b]) => (
              <div
                key={key}
                className="absolute left-0 right-0"
                style={{
                  top: `${b.y - 9}%`,
                  height: "18%",
                  background: "linear-gradient(to right, rgba(13,75,58,0) 0%, rgba(13,75,58,0.025) 50%, rgba(13,75,58,0) 100%)",
                  borderTop: "1px dashed #eef0f3",
                }}
              >
                <span
                  className="absolute left-4 top-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400"
                >
                  {b.label}
                </span>
              </div>
            ))}
            {/* Axis label */}
            <div className="absolute bottom-2 left-4 text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              older →                                              ← newer
            </div>
            {/* Nodes */}
            {nodes.map((n) => (
              <div
                key={n.id}
                title={`${n.recipient} · ${n.city}, ${n.state} · ${n.daysAgo}d ago`}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110"
                style={{ left: `${n.x}%`, top: `${n.y}%` }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: n.size,
                    height: n.size,
                    background: STATUS_COLOR[n.status],
                    boxShadow:
                      n.mail_class === "certified"
                        ? "0 0 0 3px rgba(13, 75, 58, 0.18)"
                        : n.has_check
                          ? "0 0 0 3px rgba(26, 138, 156, 0.25)"
                          : "0 1px 4px rgba(15, 23, 41, 0.18)",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Detail rail (would track hovered node) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Highlighted
            </div>
            <div className="mt-2 text-[17px] font-semibold text-ink">
              Susan Park
            </div>
            <div className="mt-[1px] text-[12px] text-gray-600">
              918 Cedar Springs Rd · Austin, TX 78704
            </div>
            <div className="mt-4 flex flex-col gap-2 text-[11.5px]">
              <Row label="Sent">5 days ago</Row>
              <Row label="Class">First Class</Row>
              <Row label="Check">$4,825</Row>
              <Row label="Status">In Transit</Row>
              <Row label="Tracking">9400 1118 9922 3344</Row>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <button className="cursor-pointer rounded-md bg-[#0d4b3a] px-3 py-2 text-[12px] font-medium text-white">
                Open Lead
              </button>
              <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-ink hover:bg-gray-50">
                Track Package
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-gray-600">
          <LegendDot color="#0f1729" label="In Transit" />
          <LegendDot color="#0d4b3a" label="Delivered" />
          <LegendDot color="#c4253c" label="Returned" />
          <span className="ml-4 text-gray-400">|</span>
          <span>Larger node = certified · Ring = check enclosed</span>
        </div>
      </Section>

      {/* LEAD MAIL TAB */}
      <Section
        eyebrow="Lead · Smith Surplus Case"
        headline="Mail history"
        sub="L-2026-0042 · $42K surplus"
      >
        <div className="grid grid-cols-[260px_1fr] gap-5">
          {/* Compose */}
          <div className="rounded-2xl border border-[#0d4b3a]/15 bg-[#0d4b3a] p-5 text-white">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
              Compose
            </div>
            <div className="mt-2 text-[17px] font-semibold">
              Send Mail
            </div>
            <div className="mt-1 text-[11.5px] text-white/80">
              3 mailing addresses on file
            </div>
            <button className="mt-4 w-full cursor-pointer rounded-md bg-white px-3 py-2 text-[12px] font-semibold text-[#0d4b3a]">
              + New Mail Piece
            </button>
          </div>

          {/* Constellation scoped to this lead */}
          <div className="relative h-[280px] overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {nodes.slice(0, 5).map((n, i) => (
              <div
                key={n.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${15 + i * 18}%`, top: `${STATUS_BAND[n.status].y}%` }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: n.size,
                    height: n.size,
                    background: STATUS_COLOR[n.status],
                    boxShadow: "0 1px 4px rgba(15, 23, 41, 0.18)",
                  }}
                />
                <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-[10px] text-gray-600">
                  {n.recipient.split(" ")[0]}
                </div>
              </div>
            ))}
            {Object.entries(STATUS_BAND).map(([key, b]) => (
              <span
                key={key}
                className="absolute left-4 text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400"
                style={{ top: `calc(${b.y}% - 6px)` }}
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}

function MockupHeader({ title }: { title: string }) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <Link
          href="/admin/mail-mockup"
          className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 hover:text-ink"
        >
          ← All Mockups
        </Link>
        <h1 className="m-0 mt-2 text-[28px] font-semibold tracking-tight text-ink">
          {title}
        </h1>
      </div>
    </div>
  );
}

function Section({
  eyebrow,
  headline,
  sub,
  children,
}: {
  eyebrow: string;
  headline: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
          {eyebrow}
        </div>
        <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-ink">
          {headline}
        </h2>
        {sub && <div className="mt-[1px] text-[12px] text-gray-500">{sub}</div>}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
        {label}
      </span>
      <span className="text-ink">{children}</span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
