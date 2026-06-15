import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";
import { aiBriefFor } from "../_brief";

export default async function V13Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const lead = ACTIVE_LEAD;
  const brief = aiBriefFor(lead);

  return (
    <div className="flex h-screen flex-col bg-[#04140d] text-white">
      <SessionHeader />
      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_360px_260px] overflow-hidden">
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

const PANEL = "bg-[#0a2018] border border-white/10";
const SUNK = "bg-[#0e2b21] border border-white/10";

function SessionHeader() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#04140d] px-7 py-3">
      <div className="flex items-center gap-4 text-[12px]">
        <Link href="/admin/dialer-mockup" className="text-white/55 hover:text-white">
          ← Back to mockups
        </Link>
        <span className="text-white/20">|</span>
        <span className="font-medium text-white">Power Dial Session</span>
      </div>
      <div className="flex items-center gap-2">
        <Stat label="Dials Today" value="42" hint="Calls placed since session start" />
        <Stat label="Connects" value="6" hint="Calls that reached a person" />
        <Stat label="Connect Rate" value="14%" hint="Connects divided by Dials" />
        <Stat label="Avg Talk Time" value="3:48" hint="Average length of connected calls" />
        <button className={`ml-2 rounded-md px-3 py-1.5 text-[12px] text-white hover:bg-white/5 ${PANEL}`}>
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
    <div className={`flex items-baseline gap-2 rounded-md px-3 py-1.5 ${PANEL}`} title={hint}>
      <span className="text-[10.5px] uppercase tracking-[0.4px] text-white/55">{label}</span>
      <span className="font-mono text-[14px] font-medium tabular-nums text-white">{value}</span>
    </div>
  );
}

function ActiveCall({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <section className={`rounded-lg px-7 py-6 ${PANEL}`} style={{ boxShadow: "0 14px 40px -20px rgba(0,0,0,0.55)" }}>
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-300">On Call · Connected</div>
        <div className="text-[11px] text-white/55">Lead {lead.leadId} · {lead.stageLabel}</div>
      </div>

      <div className="mt-4 flex items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-petrol-500 text-[20px] font-semibold text-white ring-4 ring-petrol-300/30">
          CH
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-3">
            <h1 className="m-0 text-[28px] font-medium tracking-tight text-white">Cornelius J. Hayes Jr.</h1>
            <span className="rounded-sm border border-petrol-300 px-2 py-[2px] text-[10.5px] font-semibold uppercase tracking-[0.5px] text-petrol-300">
              Heir
            </span>
          </div>
          <div className="mt-1 font-mono text-[15px] text-white/85">(216) 555-0147 · Mobile</div>
          <div className="mt-0.5 text-[12px] text-white/55">
            Son of {lead.ownerName}. Lives in Cuyahoga.
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[42px] font-medium tabular-nums leading-none text-white">02:14</div>
          <div className="mt-1 text-[10.5px] uppercase tracking-[0.4px] text-white/55">Talk Time</div>
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

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
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
      <div className="text-[10.5px] uppercase tracking-[0.4px] text-white/55">{label}</div>
      <div className={accent ? "mt-1 font-mono text-[15px] font-medium tabular-nums text-petrol-300" : "mt-1 text-[13px] text-white"}>
        {value}
      </div>
    </div>
  );
}

function CtrlBtn({ label, k }: { label: string; k: string }) {
  return (
    <button className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-[12.5px] text-white hover:bg-white/5 ${PANEL}`}>
      {label}
      <kbd className="rounded-sm border border-white/30 px-1 font-mono text-[10px] text-white/65">{k}</kbd>
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
    <section className={`mt-5 rounded-lg px-5 py-4 ${PANEL}`}>
      <div className="flex items-baseline justify-between">
        <h2 className="m-0 text-[13px] font-medium tracking-tight text-white">
          End the Call With A Disposition
        </h2>
        <span className="text-[11px] text-white/55">Pick one. The next lead loads in 3 seconds.</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 lg:grid-cols-6">
        {items.map((d) => (
          <button key={d.label} className={`flex flex-col items-start gap-1 rounded-md px-3 py-2.5 text-left hover:bg-white/5 ${SUNK}`}>
            <span className="text-[12px] font-medium text-white">{d.label}</span>
            <kbd className="rounded-sm border border-white/30 px-1 font-mono text-[10px] text-white/55">Press {d.k}</kbd>
          </button>
        ))}
      </div>
    </section>
  );
}

function BriefPanel({ lead, brief }: { lead: typeof ACTIVE_LEAD; brief: ReturnType<typeof aiBriefFor> }) {
  return (
    <aside className="overflow-y-auto border-l border-white/10 bg-[#061a13] px-5 py-5">
      <div className={`rounded-lg px-4 py-4 ${PANEL}`} style={{ borderColor: "#0d4b3a" }}>
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
        {brief.watchOuts.length > 0 && (
          <div className="mt-3 border-t border-white/10 pt-2.5">
            <div className="text-[10.5px] uppercase tracking-[0.4px] text-[#fda4a4]">Watch Out For</div>
            <ul className="m-0 mt-1 list-none space-y-1 pl-0">
              {brief.watchOuts.map((w, i) => (
                <li key={i} className="flex gap-2 text-[12px] leading-snug text-white/90">
                  <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-[#fda4a4]" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="text-[10.5px] uppercase tracking-[0.5px] text-white/55">Other Contacts On This Lead</div>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {lead.contacts.slice(1).map((c) => (
            <div key={c.id} className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-[12px] font-semibold text-white">
                {c.initials}
              </div>
              <div className="mt-1.5 text-[11.5px] font-medium leading-tight text-white">
                {c.name.split(" ").slice(0, 2).join(" ")}
              </div>
              <div className="text-[10px] uppercase tracking-[0.3px] text-white/55">{c.role}</div>
              <button className="mt-1 text-[10.5px] text-petrol-300 hover:underline">Dial Next</button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function QueueRail() {
  return (
    <aside className="overflow-y-auto border-l border-white/10 bg-[#04140d] px-4 py-5">
      <div className="text-[10.5px] uppercase tracking-[0.5px] text-white/55">Up Next In Queue</div>
      <div className="mt-3 space-y-2">
        {QUEUE.slice(3, 9).map((q) => (
          <div key={q.id} className={`rounded-md px-3 py-2 ${PANEL}`}>
            <div className="flex items-center justify-between text-[10.5px] text-white/55">
              <span>#{q.position}</span>
              <span>{q.estReady}</span>
            </div>
            <div className="mt-0.5 truncate text-[12.5px] font-medium text-white">{q.ownerName}</div>
            <div className="text-[10.5px] text-white/55">{q.city}, {q.state} · {fmtMoney(q.surplus)}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}
