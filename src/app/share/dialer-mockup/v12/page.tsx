import { notFound } from "next/navigation";
import Link from "next/link";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";
import { aiBriefFor } from "../_brief";

export default async function V12Page() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const lead = ACTIVE_LEAD;
  const brief = aiBriefFor(lead);

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <SessionHeader />
      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_400px_260px] overflow-hidden">
        <main className="overflow-y-auto px-7 py-6">
          <ActiveCall lead={lead} />
          <Dispositions />
        </main>
        <BriefPanel lead={lead} brief={brief} />
        <QueueRail />
      </div>
    </div>
  );
}

function SessionHeader() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-surface px-7 py-3">
      <div className="flex items-center gap-4 text-[12px]">
        <Link href="/share/dialer-mockup" className="text-gray-500 hover:text-ink">
          ← Back to mockups
        </Link>
        <span className="text-gray-300">|</span>
        <span className="font-medium text-ink">Power Dial Session</span>
      </div>
      <div className="flex items-center gap-2">
        <Stat label="Dials Today" value="42" hint="Calls placed since session start" />
        <Stat label="Connects" value="6" hint="Calls that reached a person" />
        <Stat label="Connect Rate" value="14%" hint="Connects divided by Dials" />
        <Stat label="Avg Talk Time" value="3:48" hint="Average length of connected calls" />
        <button className="ml-2 rounded-md border border-gray-200 bg-surface px-3 py-1.5 text-[12px] text-ink hover:border-gray-300">
          Pause
        </button>
        <button className="rounded-md bg-danger px-3 py-1.5 text-[12px] font-medium text-white">
          End Session
        </button>
      </div>
    </header>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex items-baseline gap-2 rounded-md border border-gray-200 bg-surface px-3 py-1.5" title={hint}>
      <span className="text-[10.5px] uppercase tracking-[0.4px] text-gray-500">{label}</span>
      <span className="font-mono text-[14px] font-medium tabular-nums text-ink">{value}</span>
    </div>
  );
}

function ActiveCall({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-surface px-7 py-6 shadow-card">
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-700">On Call · Connected</div>
        <div className="text-[11px] text-gray-500">Lead {lead.leadId} · {lead.stageLabel}</div>
      </div>

      <div className="mt-4 flex items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-petrol-700 text-[20px] font-semibold text-white ring-4 ring-petrol-300/40">
          CH
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-3">
            <h1 className="m-0 text-[28px] font-medium tracking-tight text-ink">Cornelius J. Hayes Jr.</h1>
            <span className="rounded-sm border border-petrol-500 bg-surface px-2 py-[2px] text-[10.5px] font-semibold uppercase tracking-[0.5px] text-petrol-700">Heir</span>
          </div>
          <div className="mt-1 font-mono text-[15px] text-gray-700">(216) 555-0147 · Mobile</div>
          <div className="mt-0.5 text-[12px] text-gray-500">Son of {lead.ownerName}. Lives in Cuyahoga.</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[42px] font-medium tabular-nums leading-none text-ink">02:14</div>
          <div className="mt-1 text-[10.5px] uppercase tracking-[0.4px] text-gray-500">Talk Time</div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <CtrlBtn label="Mute" k="M" />
        <CtrlBtn label="Hold" k="H" />
        <CtrlBtn label="Voicemail Drop" k="V" />
        <CtrlBtn label="Add Note" k="N" />
        <button className="ml-auto rounded-md bg-danger px-5 py-2.5 text-[13px] font-medium text-white">
          End Call <kbd className="ml-2 rounded-sm border border-white/40 px-1 font-mono text-[10px] text-white/85">E</kbd>
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-gray-200 pt-5">
        <Fact label="Property" value={`${lead.propertyAddress}, ${lead.city}, ${lead.state}`} />
        <Fact label="Estimated Surplus" value={fmtMoney(lead.estimatedSurplus)} />
        <Fact label="Estimated Net To Firm" value={fmtMoney(lead.estimatedNet)} accent />
      </div>
    </section>
  );
}

function Fact({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.4px] text-gray-500">{label}</div>
      <div className={accent ? "mt-1 font-mono text-[15px] font-medium tabular-nums text-petrol-500" : "mt-1 text-[13px] text-ink"}>
        {value}
      </div>
    </div>
  );
}

function CtrlBtn({ label, k }: { label: string; k: string }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-surface px-3 py-2 text-[12.5px] text-ink hover:border-gray-300">
      {label}
      <kbd className="rounded-sm border border-gray-300 px-1 font-mono text-[10px] text-gray-500">{k}</kbd>
    </button>
  );
}

function Dispositions() {
  const items = [
    { label: "Interested", k: "1" },
    { label: "Not Interested", k: "2" },
    { label: "Callback Requested", k: "3" },
    { label: "Left Voicemail", k: "4" },
    { label: "Wrong Number", k: "5" },
    { label: "Do Not Contact", k: "6" },
  ];
  return (
    <section className="mt-5 rounded-lg border border-gray-200 bg-surface px-5 py-4">
      <div className="flex items-baseline justify-between">
        <h2 className="m-0 text-[13px] font-medium tracking-tight text-ink">End the Call With A Disposition</h2>
        <span className="text-[11px] text-gray-500">Pick one. The next lead loads in 3 seconds.</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 lg:grid-cols-6">
        {items.map((d) => (
          <button key={d.label} className="flex flex-col items-start gap-1 rounded-md border border-gray-200 bg-surface px-3 py-2.5 text-left hover:border-gray-300">
            <span className="text-[12px] font-medium text-ink">{d.label}</span>
            <kbd className="rounded-sm border border-gray-300 px-1 font-mono text-[10px] text-gray-500">Press {d.k}</kbd>
          </button>
        ))}
      </div>
    </section>
  );
}

function BriefPanel({ lead, brief }: { lead: typeof ACTIVE_LEAD; brief: ReturnType<typeof aiBriefFor> }) {
  return (
    <aside className="overflow-y-auto border-l border-gray-200 bg-surface-muted px-5 py-5">
      <div className="rounded-lg border border-petrol-500 bg-surface px-4 py-4">
        <div className="flex items-baseline justify-between">
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-700">What You Already Know</div>
          <span className="text-[10px] text-gray-500">AI Brief</span>
        </div>
        <h3 className="m-0 mt-1.5 text-[14.5px] font-semibold text-ink leading-tight">{brief.headline}</h3>
        <p className="m-0 mt-2 text-[12.5px] leading-relaxed text-gray-700">{brief.tldr}</p>
        <ul className="m-0 mt-3 list-none space-y-1.5 pl-0">
          {brief.bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-[12px] leading-snug text-ink">
              <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-petrol-500" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 rounded-lg border border-gray-200 bg-surface px-4 py-4">
        <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
          People Tied To This Lead
        </div>
        <Constellation lead={lead} />
      </div>
    </aside>
  );
}

function Constellation({ lead }: { lead: typeof ACTIVE_LEAD }) {
  const center = { x: 175, y: 140 };
  const radius = 95;
  const placed = lead.contacts.map((c, i) => {
    const angle = (i / lead.contacts.length) * 2 * Math.PI - Math.PI / 2;
    return {
      ...c,
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
      isActive: i === 0,
    };
  });
  return (
    <svg viewBox="0 0 350 280" className="mt-2 block w-full">
      {placed.map((p, i) => (
        <line
          key={`l-${i}`}
          x1={center.x}
          y1={center.y}
          x2={p.x}
          y2={p.y}
          stroke={p.isActive ? "#0d4b3a" : "#d1d5db"}
          strokeWidth={p.isActive ? 1.5 : 1}
          strokeDasharray={p.isActive ? undefined : "3 3"}
        />
      ))}
      <circle cx={center.x} cy={center.y} r={26} fill="#04261c" />
      <text x={center.x} y={center.y - 2} textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#5db98a" letterSpacing="0.5">
        ESTATE
      </text>
      <text x={center.x} y={center.y + 9} textAnchor="middle" fontSize="8" fill="white">
        C. J. Hayes Sr.
      </text>
      {placed.map((p, i) => (
        <g key={`n-${i}`}>
          {p.isActive && <circle cx={p.x} cy={p.y} r={26} fill="#5db98a" opacity={0.18} />}
          <circle
            cx={p.x}
            cy={p.y}
            r={p.isActive ? 22 : 18}
            fill={p.isActive ? "#0d4b3a" : "#ffffff"}
            stroke={p.isActive ? "#5db98a" : "#d1d5db"}
            strokeWidth={p.isActive ? 2 : 1}
          />
          <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize="9.5" fontWeight="600" fill={p.isActive ? "white" : "#374151"}>
            {p.initials}
          </text>
          <text x={p.x} y={p.y + (p.isActive ? 36 : 32)} textAnchor="middle" fontSize="9.5" fontWeight={p.isActive ? "600" : "500"} fill="#0f1729">
            {p.name.split(" ").slice(0, 2).join(" ")}
          </text>
          <text x={p.x} y={p.y + (p.isActive ? 47 : 43)} textAnchor="middle" fontSize="8" fill="#6b7280" letterSpacing="0.5">
            {p.role.toUpperCase()}
          </text>
        </g>
      ))}
    </svg>
  );
}

function QueueRail() {
  return (
    <aside className="overflow-y-auto border-l border-gray-200 bg-surface px-4 py-5">
      <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">Up Next In Queue</div>
      <div className="mt-3 space-y-2">
        {QUEUE.slice(3, 9).map((q) => (
          <div key={q.id} className="rounded-md border border-gray-200 bg-surface px-3 py-2">
            <div className="flex items-center justify-between text-[10.5px] text-gray-500">
              <span>#{q.position}</span>
              <span>{q.estReady}</span>
            </div>
            <div className="mt-0.5 truncate text-[12.5px] font-medium text-ink">{q.ownerName}</div>
            <div className="text-[10.5px] text-gray-500">
              {q.city}, {q.state} · {fmtMoney(q.surplus)}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
