import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, fmtMoney } from "../_sample";
import { aiBriefFor } from "../_brief";

export default async function V20Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const lead = ACTIVE_LEAD;
  const brief = aiBriefFor(lead);

  return (
    <div className="flex h-screen flex-col bg-canvas text-ink">
      <TopThin />
      <div className="grid flex-1 grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] overflow-hidden">
        <FamilyTree lead={lead} />
        <SideRail lead={lead} brief={brief} />
      </div>
      <BottomDispo />
    </div>
  );
}

function TopThin() {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-surface px-7 py-3 text-[11.5px] text-gray-500">
      <Link href="/admin/dialer-mockup" className="hover:text-ink">
        ← Back to mockups
      </Link>
      <div className="flex items-center gap-4 text-ink/85">
        <span>Lead 3 of 10</span>
        <span className="text-gray-300">·</span>
        <span>42 Dials</span>
        <span className="text-gray-300">·</span>
        <span>6 Connects</span>
        <span className="text-gray-300">·</span>
        <span>14% Rate</span>
        <span className="text-gray-300">·</span>
        <span>3:48 Avg Talk</span>
      </div>
      <button className="rounded-md bg-danger px-3 py-1 text-[11px] font-medium text-white">
        End Session
      </button>
    </div>
  );
}

function FamilyTree(_props: { lead: typeof ACTIVE_LEAD }) {
  return (
    <main className="relative overflow-hidden bg-[#fbfaf7] px-9 py-9">
      <div className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-700">
        Family Tree · Hayes Estate
      </div>
      <div className="mt-1 text-[15px] text-gray-700">
        Showing two generations. Currently calling{" "}
        <span className="font-semibold text-ink">Cornelius Jr.</span>, son of the
        decedent.
      </div>

      <svg viewBox="0 0 760 540" className="mt-5 block w-full">
        <line x1="380" y1="100" x2="380" y2="200" stroke="#d6d3cc" strokeWidth="1.5" />

        <line x1="380" y1="200" x2="190" y2="320" stroke="#d6d3cc" strokeWidth="1.5" />
        <line x1="380" y1="200" x2="380" y2="320" stroke="#0d4b3a" strokeWidth="2.5" />
        <line x1="380" y1="200" x2="570" y2="320" stroke="#d6d3cc" strokeWidth="1.5" />

        <line x1="190" y1="380" x2="190" y2="440" stroke="#d6d3cc" strokeWidth="1" strokeDasharray="3 3" />
        <text x="190" y="455" textAnchor="middle" fontSize="9" fill="#9b8e6b" letterSpacing="0.4">
          MARKED WRONG NUMBER
        </text>

        <NodeRect x={300} y={50} w={160} h={60} kind="decedent" title="Cornelius J. Hayes Sr." sub="Decedent · Estate" />
        <NodeRect x={300} y={140} w={160} h={50} kind="estate" title="Estate" sub={`Case 2026-PR-0488`} />

        <NodeOval x={120} y={300} title="Karen Hayes" sub="Cousin" initials="KH" muted />
        <NodeOval x={310} y={300} title="Cornelius Jr." sub="Heir · On Call" initials="CH" active />
        <NodeOval x={500} y={300} title="Yvette Hayes-Brown" sub="Heir" initials="YH" />

        <NodeOval x={310} y={400} title="" sub="" initials="" hide />
        <NodeOval x={500} y={400} title="" sub="" initials="" hide />
      </svg>

      <div className="mt-6 flex items-center gap-3 rounded-lg border border-petrol-700/20 bg-white px-5 py-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-petrol-500 to-petrol-700 text-[15px] font-semibold text-white">
          CH
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-700">
            On Call · Connected · 02:14
          </div>
          <div className="mt-0.5 text-[20px] font-semibold leading-tight tracking-tight text-ink">
            Cornelius J. Hayes Jr.
          </div>
          <div className="text-[12.5px] text-gray-700">
            Heir · <span className="tabular-nums">(216) 555-0147</span> · Mobile
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Ctrl label="Mute" k="M" />
          <Ctrl label="Hold" k="H" />
          <Ctrl label="Voicemail" k="V" />
          <button className="rounded-md bg-danger px-3.5 py-2 text-[12.5px] font-medium text-white">
            End Call
          </button>
        </div>
      </div>
    </main>
  );
}

function NodeRect({
  x,
  y,
  w,
  h,
  kind,
  title,
  sub,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "decedent" | "estate";
  title: string;
  sub: string;
}) {
  const fill = kind === "decedent" ? "#0f1729" : "#ffffff";
  const stroke = kind === "decedent" ? "#0f1729" : "#d6d3cc";
  const textColor = kind === "decedent" ? "#ffffff" : "#0f1729";
  const subColor = kind === "decedent" ? "#9ca3af" : "#6b7280";
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="6" fill={fill} stroke={stroke} strokeWidth="1" />
      <text
        x={x + w / 2}
        y={y + 25}
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        fill={textColor}
      >
        {title}
      </text>
      <text
        x={x + w / 2}
        y={y + 42}
        textAnchor="middle"
        fontSize="10"
        fill={subColor}
        letterSpacing="0.5"
      >
        {sub.toUpperCase()}
      </text>
    </g>
  );
}

function NodeOval({
  x,
  y,
  title,
  sub,
  initials,
  active,
  muted,
  hide,
}: {
  x: number;
  y: number;
  title: string;
  sub: string;
  initials: string;
  active?: boolean;
  muted?: boolean;
  hide?: boolean;
}) {
  if (hide) return null;
  const cx = x + 70;
  const cy = y + 40;
  const ringFill = active ? "#0d4b3a" : "#ffffff";
  const ringStroke = active ? "#5db98a" : muted ? "#c8c3b3" : "#d6d3cc";
  const textColor = active ? "#ffffff" : muted ? "#9b8e6b" : "#0f1729";
  return (
    <g opacity={muted ? 0.7 : 1}>
      {active && <circle cx={cx} cy={cy} r={44} fill="#5db98a" opacity={0.18} />}
      <circle cx={cx} cy={cy} r={32} fill={ringFill} stroke={ringStroke} strokeWidth={active ? "2.5" : "1.5"} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="13" fontWeight="600" fill={textColor}>
        {initials}
      </text>
      <text x={cx} y={cy + 56} textAnchor="middle" fontSize="13" fontWeight="600" fill="#0f1729">
        {title}
      </text>
      <text
        x={cx}
        y={cy + 71}
        textAnchor="middle"
        fontSize="9.5"
        fill={muted ? "#9b8e6b" : "#6b7280"}
        letterSpacing="0.4"
      >
        {sub.toUpperCase()}
      </text>
    </g>
  );
}

function SideRail({
  lead,
  brief,
}: {
  lead: typeof ACTIVE_LEAD;
  brief: ReturnType<typeof aiBriefFor>;
}) {
  return (
    <aside className="flex flex-col overflow-y-auto border-l border-gray-200 bg-surface px-6 py-7">
      <div className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-700">
        Estate
      </div>
      <h2 className="m-0 mt-1 text-[28px] font-semibold leading-tight tracking-tight text-ink">
        Hayes
      </h2>
      <div className="mt-1 text-[12.5px] text-gray-700">
        {lead.propertyAddress}, {lead.city}, {lead.state} · {lead.county}
      </div>

      <div className="mt-5 flex items-baseline justify-between border-y border-gray-200 py-4">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
            Estimated Surplus
          </div>
          <div className="mt-0.5 text-[26px] font-semibold tabular-nums tracking-tight text-ink">
            {fmtMoney(lead.estimatedSurplus)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-700">
            Net To Firm
          </div>
          <div className="mt-0.5 text-[26px] font-semibold tabular-nums tracking-tight text-petrol-500">
            {fmtMoney(lead.estimatedNet)}
          </div>
        </div>
      </div>

      <div className="mt-5 text-[10.5px] uppercase tracking-[0.6px] text-petrol-700">
        AI Brief · What You Already Know
      </div>
      <h3 className="m-0 mt-1.5 text-[15px] font-semibold leading-tight text-ink">
        {brief.headline}
      </h3>
      <p className="m-0 mt-2 text-[13px] leading-relaxed text-gray-700">
        {brief.tldr}
      </p>
      <ul className="m-0 mt-3 list-none space-y-1.5 pl-0">
        {brief.bullets.slice(0, 3).map((b, i) => (
          <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-ink">
            <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-petrol-500" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-l-2 border-danger pl-3">
        <div className="text-[10.5px] uppercase tracking-[0.4px] text-danger">
          Watch Out
        </div>
        <p className="m-0 mt-0.5 text-[12.5px] leading-snug text-ink/85">
          {brief.watchOuts[0]}
        </p>
      </div>
    </aside>
  );
}

function BottomDispo() {
  const items = [
    "Interested · 1",
    "Not Interested · 2",
    "Callback · 3",
    "Voicemail · 4",
    "Wrong Number · 5",
    "Do Not Contact · 6",
  ];
  return (
    <footer className="shrink-0 border-t border-gray-200 bg-surface px-7 py-3">
      <div className="flex items-center gap-3">
        <span className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
          End With A Disposition
        </span>
        <div className="flex flex-1 items-center gap-1.5">
          {items.map((it) => (
            <button
              key={it}
              className="flex-1 rounded-md border border-gray-200 bg-surface px-3 py-2 text-[12px] font-medium text-ink hover:border-petrol-500 hover:text-petrol-500"
            >
              {it}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}

function Ctrl({ label, k }: { label: string; k: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-surface px-2.5 py-1.5 text-[11.5px] text-ink hover:border-gray-300">
      {label}
      <kbd className="rounded-sm border border-gray-300 px-1 font-mono text-[9.5px] text-gray-500">
        {k}
      </kbd>
    </button>
  );
}
