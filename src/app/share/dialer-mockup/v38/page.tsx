import { notFound } from "next/navigation";
import Link from "next/link";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";

export default async function V38Page() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="flex h-screen flex-col bg-[#f4f6f8] text-ink">
      <TopBar />
      <main className="flex flex-1 flex-col gap-4 overflow-hidden px-5 py-4">
        <HeroPair lead={lead} />
        <div className="grid flex-1 grid-cols-[280px_minmax(0,1fr)_320px] gap-4 overflow-hidden">
          <Queue />
          <DealAndContacts lead={lead} />
          <NotesPanel lead={lead} />
        </div>
      </main>
    </div>
  );
}

const CARD = "rounded-2xl border border-black/[0.05] bg-white shadow-[0_18px_38px_-22px_rgba(15,23,41,0.22),0_2px_8px_-2px_rgba(15,23,41,0.05)]";

function TopBar() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-black/[0.06] bg-white px-7 py-2.5 text-[12px]">
      <div className="flex items-center gap-3">
        <Link href="/share/dialer-mockup" className="text-ink/55 hover:text-ink">
          ← Back
        </Link>
        <span className="text-ink/20">|</span>
        <span className="font-semibold text-ink">Power Dial Session</span>
      </div>
      <div className="flex items-center gap-6">
        <BigStat label="Dials" value="42" />
        <BigStat label="Connects" value="6" />
        <BigStat label="Rate" value="14%" />
        <BigStat label="Avg Talk" value="3:48" />
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-md border border-black/[0.08] bg-white px-3 py-1.5 text-[11.5px] text-ink hover:border-black/20">
          Pause
        </button>
        <button className="rounded-md bg-ink px-3 py-1.5 text-[11.5px] font-medium text-white">
          End Session
        </button>
      </div>
    </header>
  );
}

function BigStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
        {label}
      </span>
      <span className="text-[24px] font-semibold tabular-nums leading-none text-ink">
        {value}
      </span>
    </div>
  );
}

function HeroPair(_props: { lead: typeof ACTIVE_LEAD }) {
  return (
    <div className="grid grid-cols-[1.6fr_1fr] gap-4">
      <article
        className="relative flex flex-col overflow-hidden rounded-2xl p-6 text-white"
        style={{
          background: "linear-gradient(140deg, #04261c 0%, #0d4b3a 60%, #14644e 100%)",
          boxShadow:
            "0 24px 50px -22px rgba(13,75,58,0.45), 0 4px 14px -4px rgba(15,23,41,0.08)",
        }}
      >
        <header className="flex items-baseline justify-between">
          <div className="inline-flex items-center gap-2 rounded-md bg-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.6px] backdrop-blur">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5db98a] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5db98a]" />
            </span>
            Live · Connected
          </div>
          <div className="text-[11px] uppercase tracking-[0.5px] text-petrol-300">
            Lead 3 of 10 · Attempt 1 of 4
          </div>
        </header>

        <div className="mt-5 flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-[22px] font-semibold text-petrol-700 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.5)]">
            CH
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] uppercase tracking-[0.6px] text-petrol-300">
              Calling Heir to Estate
            </div>
            <h1 className="m-0 mt-1 text-[36px] font-semibold leading-[1.02] tracking-[-0.025em] text-white">
              Cornelius J. Hayes Jr.
            </h1>
            <div className="mt-1 flex items-baseline gap-2 text-[13.5px] text-white/85">
              <span className="rounded-sm bg-white/15 px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-[0.4px]">
                Mobile
              </span>
              <span className="tabular-nums">(216) 555-0147</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-300">
              Talk Time
            </div>
            <div className="mt-1 text-[44px] font-semibold tabular-nums tracking-[-0.025em] leading-none text-white">
              02:14
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <div className="grid grid-cols-5 gap-1.5 rounded-xl bg-white/[0.08] p-1 backdrop-blur">
            <SquareControl label="Mute" />
            <SquareControl label="Hold" />
            <SquareControl label="VM Drop" />
            <SquareControl label="Note" />
            <button className="rounded-lg bg-danger px-3 py-2 text-[12px] font-semibold text-white hover:brightness-110">
              End Call
            </button>
          </div>
        </div>
      </article>

      <article className={`flex flex-col p-5 ${CARD}`}>
        <header className="flex items-baseline justify-between">
          <span className="text-[11px] uppercase tracking-[0.6px] text-petrol-700">
            Next Call
          </span>
          <span className="text-[10.5px] text-ink/55">
            Lead 4 of 10 · {fmtMoney(76300)}
          </span>
        </header>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-petrol-700 text-[15px] font-semibold text-white">
            OC
          </div>
          <div className="min-w-0">
            <div className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
              Primary Owner
            </div>
            <div className="text-[18px] font-semibold leading-tight text-ink">
              Otis Crockett
            </div>
            <div className="text-[12px] text-ink/65">
              <span className="rounded-sm bg-ink/[0.06] px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-[0.4px] text-ink/65">
                Mobile
              </span>{" "}
              <span className="tabular-nums">(865) 555-0148</span> · Knoxville, TN
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-end gap-4 pt-6">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
              Dialing In
            </div>
            <div className="text-[36px] font-semibold tabular-nums tracking-[-0.025em] leading-none text-ink">
              0:03
            </div>
          </div>
          <button className="ml-auto rounded-md bg-petrol-500 px-5 py-3 text-[13px] font-semibold text-white shadow-[0_8px_22px_-10px_rgba(13,75,58,0.55)] hover:brightness-110">
            Dial Now →
          </button>
        </div>
      </article>
    </div>
  );
}

function SquareControl({ label }: { label: string }) {
  return (
    <button className="rounded-lg bg-transparent px-3 py-2 text-[12px] font-medium text-white hover:bg-white/10">
      {label}
    </button>
  );
}

function Queue() {
  return (
    <aside className={`flex flex-col overflow-hidden p-4 ${CARD}`}>
      <header className="flex items-baseline justify-between pb-3">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Session Queue
        </div>
        <span className="text-[11.5px] font-semibold text-ink tabular-nums">
          3 / 10
        </span>
      </header>
      <ol className="m-0 flex-1 list-none space-y-1 overflow-y-auto pl-0">
        {QUEUE.map((q) => {
          const isActive = q.status === "active";
          const isDone = q.status === "done";
          return (
            <li
              key={q.id}
              className={
                isActive
                  ? "rounded-lg border border-petrol-500/40 bg-petrol-100/60 px-3 py-2"
                  : isDone
                  ? "rounded-lg px-3 py-2 opacity-50"
                  : "rounded-lg px-3 py-2 hover:bg-black/[0.025]"
              }
            >
              <div className="flex items-baseline justify-between text-[10.5px] text-ink/55">
                <span className="font-semibold tabular-nums text-ink">
                  #{q.position}
                </span>
                <span>{q.estReady}</span>
              </div>
              <div
                className={
                  isDone
                    ? "mt-0.5 truncate text-[12px] text-ink line-through"
                    : "mt-0.5 truncate text-[12.5px] font-medium text-ink"
                }
              >
                {q.ownerName}
              </div>
              <div className="text-[10.5px] text-ink/55">
                {q.city}, {q.state} · {fmtMoney(q.surplus)}
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function DealAndContacts({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <section className={`p-5 ${CARD}`}>
        <div className="flex items-baseline justify-between">
          <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
            Hayes Estate
          </div>
          <span className="rounded-md bg-petrol-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.4px] text-petrol-700">
            {lead.stageLabel}
          </span>
        </div>
        <div className="mt-1 text-[12.5px] text-ink/65">
          {lead.propertyAddress}, {lead.city}, {lead.state}
        </div>
        <div className="mt-4 grid grid-cols-[1fr_1fr_1fr_1fr] gap-3 border-y border-black/[0.06] py-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.5px] text-ink/55">
              Surplus
            </div>
            <div className="text-[18px] font-semibold tabular-nums leading-tight text-ink">
              {fmtMoney(lead.estimatedSurplus)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.5px] text-petrol-700">
              Net To Firm
            </div>
            <div className="text-[18px] font-semibold tabular-nums leading-tight text-petrol-500">
              {fmtMoney(lead.estimatedNet)}
            </div>
            <div className="mt-0.5 text-[9.5px] text-ink/55">
              {lead.recoveryFeePercent}% recovery
            </div>
          </div>
          <Fact label="County" value={lead.county} />
          <Fact label="Sale Date" value={lead.saleDate} />
          <Fact label="Sale Type" value={lead.saleProcess} />
          <Fact label="Owner" value={lead.ownerStatus} />
        </div>
      </section>

      <section className={`overflow-y-auto p-5 ${CARD}`}>
        <div className="flex items-baseline justify-between">
          <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
            Contacts and Phones
          </div>
          <span className="text-[10.5px] text-ink/55">
            {lead.contacts.length} contacts ·{" "}
            {lead.contacts.reduce((acc, c) => acc + c.numbers.length, 0)} phones
          </span>
        </div>
        <ul className="m-0 mt-3 list-none space-y-1.5 pl-0">
          {lead.contacts.map((c, ci) => (
            <li key={c.id}>
              <ContactRow contact={c} expanded={ci === 0} justCalled={ci === 0} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.5px] text-ink/55">
        {label}
      </div>
      <div className="mt-0.5 text-[12px] font-medium text-ink">{value}</div>
    </div>
  );
}

function ContactRow({
  contact,
  expanded,
  justCalled,
}: {
  contact: typeof ACTIVE_LEAD["contacts"][number];
  expanded: boolean;
  justCalled: boolean;
}) {
  const activeNumbers = contact.numbers.filter(
    (n) => n.state !== "wrong" && n.state !== "disconnected"
  ).length;
  return (
    <div
      className={
        justCalled
          ? "overflow-hidden rounded-lg border border-petrol-500/40 bg-petrol-100/40"
          : "overflow-hidden rounded-lg border border-black/[0.06] bg-white"
      }
    >
      <button className="grid w-full grid-cols-[18px_28px_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-2 text-left">
        <span className="text-[10px] text-ink/55">{expanded ? "▾" : "▸"}</span>
        <div
          className={
            justCalled
              ? "flex h-7 w-7 items-center justify-center rounded-full bg-petrol-700 text-[10px] font-semibold text-white"
              : "flex h-7 w-7 items-center justify-center rounded-full bg-ink/[0.06] text-[10px] font-semibold text-ink"
          }
        >
          {contact.initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[12.5px] font-semibold text-ink">
            {contact.name}
          </div>
          <div className="text-[10px] uppercase tracking-[0.4px] text-ink/55">
            {contact.role}
          </div>
        </div>
        <span className="text-[10.5px] text-ink/55 tabular-nums">
          {activeNumbers}/{contact.numbers.length}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-black/[0.06] bg-white">
          {contact.numbers.map((n, ni) => {
            const isCur = justCalled && ni === 0;
            const isDead = n.state === "wrong" || n.state === "disconnected";
            return (
              <div
                key={n.id}
                className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-2 px-3 py-1.5 text-[11.5px]"
              >
                <span className="text-[10px] uppercase tracking-[0.5px] text-ink/55">
                  {n.label}
                </span>
                <span
                  className={
                    isDead
                      ? "tabular-nums text-ink/45 line-through"
                      : isCur
                      ? "tabular-nums font-semibold text-petrol-700"
                      : "tabular-nums text-ink"
                  }
                >
                  {n.formatted}
                </span>
                <span className="text-[9.5px] uppercase tracking-[0.4px] text-ink/55">
                  {isCur
                    ? "On Call"
                    : isDead
                    ? n.state === "wrong"
                      ? "Wrong"
                      : "Disc."
                    : "Never"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NotesPanel({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <section className={`overflow-y-auto p-5 ${CARD}`}>
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Recent Notes
        </div>
        <span className="text-[10.5px] text-ink/55">
          {lead.notes.length} · newest first
        </span>
      </div>
      <div className="mt-3 space-y-3">
        {lead.notes.slice(0, 4).map((n) => (
          <div key={n.id} className="border-l-2 border-petrol-500 pl-3">
            <div className="text-[10.5px] text-ink/55">
              <span className="font-semibold text-ink">{n.author}</span> ·{" "}
              {n.createdAt}
            </div>
            <p className="m-0 mt-0.5 text-[12px] leading-snug text-ink/85">
              {n.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
