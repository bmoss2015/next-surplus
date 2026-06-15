import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";
import { aiBriefFor } from "../_brief";

export default async function V14Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const lead = ACTIVE_LEAD;
  const brief = aiBriefFor(lead);

  return (
    <div className="flex h-screen flex-col bg-[#04140d] text-white">
      <SessionHeader />
      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_360px] overflow-hidden">
        <main className="overflow-hidden px-7 py-6">
          <ModeRow />
          <LineGrid />
          <Dispositions />
        </main>
        <BriefPanel brief={brief} lead={lead} />
      </div>
    </div>
  );
}

const PANEL_LIVE = "bg-[#0e2b21] border border-petrol-300";
const PANEL_RING = "bg-[#0a2018] border border-white/10";
const PANEL_DEAD = "bg-[#08160f] border border-white/[0.06]";

function SessionHeader() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#04140d] px-7 py-3">
      <div className="flex items-center gap-4 text-[12px]">
        <Link href="/admin/dialer-mockup" className="text-white/55 hover:text-white">
          ← Back to mockups
        </Link>
        <span className="text-white/20">|</span>
        <span className="font-medium text-white">Parallel Dial Session</span>
        <span className="rounded-sm bg-petrol-500/20 px-1.5 py-[1px] text-[10.5px] font-medium text-petrol-300">
          4 Lines
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Stat label="Dials Today" value="68" hint="Dials placed across all lines" />
        <Stat label="Connects" value="9" hint="Lines that reached a person" />
        <Stat label="Connect Rate" value="13%" hint="Connects divided by Dials" />
        <Stat label="Avg Talk Time" value="4:02" hint="Average length of connected calls" />
        <button className="rounded-md bg-danger px-3 py-1.5 text-[12px] font-medium text-white">
          End Session
        </button>
      </div>
    </header>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex items-baseline gap-2 rounded-md border border-white/10 bg-[#0a2018] px-3 py-1.5" title={hint}>
      <span className="text-[10.5px] uppercase tracking-[0.4px] text-white/55">{label}</span>
      <span className="font-mono text-[14px] font-medium tabular-nums text-white">{value}</span>
    </div>
  );
}

function ModeRow() {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-[#0a2018] px-4 py-2 text-[11.5px]">
      <div className="flex items-center gap-2">
        <span className="text-white/55">Dial Mode</span>
        <ModeBtn label="1 Line" />
        <ModeBtn label="2 Lines" />
        <ModeBtn label="4 Lines" active />
      </div>
      <div className="flex items-center gap-3 text-white/55">
        <span>Auto Connect On</span>
        <span className="text-white/20">|</span>
        <span>Between-Call Delay 3 sec</span>
      </div>
    </div>
  );
}

function ModeBtn({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={
        active
          ? "rounded-md bg-petrol-500 px-2.5 py-1 text-[11px] font-medium text-white"
          : "rounded-md px-2.5 py-1 text-[11px] text-white/65 hover:bg-white/5"
      }
    >
      {label}
    </button>
  );
}

function LineGrid() {
  return (
    <div className="mt-4 grid h-[calc(100%-130px)] grid-cols-2 grid-rows-2 gap-3">
      <LineCard
        line="Line 1"
        state="connected"
        contact="Cornelius J. Hayes Jr."
        role="Heir"
        number="(216) 555-0147"
        lead="Cornelius J. Hayes estate · OH"
      />
      <LineCard
        line="Line 2"
        state="ringing"
        contact="Otis Crockett"
        role="Primary Owner"
        number="(865) 555-0148"
        lead="Otis & Marlene Crockett · TN"
      />
      <LineCard
        line="Line 3"
        state="ringing"
        contact="Roosevelt Bell"
        role="Primary Owner"
        number="(845) 555-0136"
        lead="Roosevelt Bell · NY"
      />
      <LineCard
        line="Line 4"
        state="voicemail"
        contact="Patricia Donnelly"
        role="Primary Owner"
        number="(610) 555-0111"
        lead="Patricia A. Donnelly · PA"
      />
    </div>
  );
}

function LineCard({
  line,
  state,
  contact,
  role,
  number,
  lead,
}: {
  line: string;
  state: "connected" | "ringing" | "voicemail";
  contact: string;
  role: string;
  number: string;
  lead: string;
}) {
  const cls = state === "connected" ? PANEL_LIVE : state === "ringing" ? PANEL_RING : PANEL_DEAD;
  const dot = state === "connected" ? "#5db98a" : state === "ringing" ? "#9ca3af" : "#6b7280";
  const stateLabel = state === "connected" ? "Connected" : state === "ringing" ? "Ringing" : "Voicemail Detected";
  const isLive = state === "connected";
  return (
    <article className={`rounded-lg p-4 ${cls}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: dot }} />
          <span className="text-[10.5px] uppercase tracking-[0.5px] text-white/55">
            {line} · {stateLabel}
          </span>
        </div>
        {isLive ? (
          <span className="font-mono text-[14px] tabular-nums text-white">02:14</span>
        ) : (
          <button className="text-[10.5px] text-white/55 hover:text-white">Cancel</button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div
          className={
            isLive
              ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-petrol-500 text-[13px] font-semibold text-white"
              : "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-[13px] font-semibold text-white"
          }
        >
          {contact.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </div>
        <div className="min-w-0">
          <div className={isLive ? "text-[16px] font-semibold text-white" : "text-[14px] font-medium text-white"}>
            Calling {role}
          </div>
          <div className="truncate text-[12.5px] text-white/85">{contact}</div>
          <div className="font-mono text-[11.5px] text-white/65">{number}</div>
        </div>
      </div>

      <div className="mt-2 text-[11px] text-white/55">{lead}</div>

      {isLive ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <MiniBtn label="Mute" k="M" />
          <MiniBtn label="Hold" k="H" />
          <MiniBtn label="VM Drop" k="V" />
          <button className="ml-auto rounded-md bg-danger px-3 py-1.5 text-[11.5px] font-medium text-white">
            End Call
          </button>
        </div>
      ) : null}
    </article>
  );
}

function MiniBtn({ label, k }: { label: string; k: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-white hover:bg-white/10">
      {label}
      <kbd className="rounded-sm border border-white/30 px-1 font-mono text-[9.5px] text-white/65">{k}</kbd>
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
    <section className="mt-3 rounded-md border border-white/10 bg-[#0a2018] px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span className="text-[10.5px] uppercase tracking-[0.5px] text-white/55">
          Disposition (Line 1)
        </span>
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {items.map((d) => (
            <button key={d.label} className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11.5px] text-white hover:bg-white/10">
              {d.label}
              <kbd className="rounded-sm border border-white/30 px-1 font-mono text-[9.5px] text-white/55">{d.k}</kbd>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function BriefPanel({ brief, lead }: { brief: ReturnType<typeof aiBriefFor>; lead: typeof ACTIVE_LEAD }) {
  return (
    <aside className="overflow-y-auto border-l border-white/10 bg-[#061a13] px-5 py-5">
      <div className="text-[10.5px] uppercase tracking-[0.5px] text-white/55">
        Active Line · 1
      </div>
      <div className={`mt-2 rounded-lg px-4 py-4 ${PANEL_LIVE}`}>
        <div className="flex items-baseline justify-between">
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-300">What You Already Know</div>
          <span className="text-[10px] text-white/55">AI Brief</span>
        </div>
        <h3 className="m-0 mt-1.5 text-[14.5px] font-semibold text-white leading-tight">{brief.headline}</h3>
        <p className="m-0 mt-2 text-[12.5px] leading-relaxed text-white/85">{brief.tldr}</p>
        <ul className="m-0 mt-3 list-none space-y-1.5 pl-0">
          {brief.bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-[12px] leading-snug text-white/90">
              <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-petrol-300" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <div className="text-[10.5px] uppercase tracking-[0.5px] text-white/55">
          Surplus
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <KV label="Estimated Surplus" value={fmtMoney(lead.estimatedSurplus)} />
          <KV label="Est. Net To Firm" value={fmtMoney(lead.estimatedNet)} accent />
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[10.5px] uppercase tracking-[0.5px] text-white/55">
          Up Next After This Wave
        </div>
        <div className="mt-2 space-y-2">
          {QUEUE.slice(6, 10).map((q) => (
            <div key={q.id} className={`rounded-md px-3 py-2 ${PANEL_RING}`}>
              <div className="flex items-center justify-between text-[10.5px] text-white/55">
                <span>#{q.position}</span>
                <span>{q.estReady}</span>
              </div>
              <div className="mt-0.5 truncate text-[12px] text-white">{q.ownerName}</div>
              <div className="text-[10.5px] text-white/55">{q.city}, {q.state} · {fmtMoney(q.surplus)}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function KV({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-md px-2.5 py-1.5 ${PANEL_RING}`}>
      <div className="text-[10px] uppercase tracking-[0.4px] text-white/55">{label}</div>
      <div className={accent ? "mt-0.5 font-mono text-[13px] font-medium tabular-nums text-petrol-300" : "mt-0.5 font-mono text-[13px] font-medium tabular-nums text-white"}>
        {value}
      </div>
    </div>
  );
}
