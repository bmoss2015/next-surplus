import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";

export default async function V36Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="flex h-screen flex-col bg-[#f4f6f8] text-ink">
      <TopBar />
      <main className="grid flex-1 grid-cols-[260px_minmax(0,1fr)_340px] gap-5 overflow-hidden px-5 py-5">
        <QueueRail />
        <CallStage />
        <RightRail lead={lead} />
      </main>
    </div>
  );
}

const CARD = "rounded-2xl border border-black/[0.05] bg-white shadow-[0_18px_38px_-22px_rgba(15,23,41,0.22),0_2px_8px_-2px_rgba(15,23,41,0.05)]";

function TopBar() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-black/[0.06] bg-white px-7 py-3 text-[12px]">
      <div className="flex items-center gap-3">
        <Link href="/admin/dialer-mockup" className="text-ink/55 hover:text-ink">
          ← Back
        </Link>
        <span className="text-ink/20">|</span>
        <span className="font-semibold text-ink">Power Dial Session</span>
      </div>
      <div className="flex items-center gap-2.5">
        <StatChip label="Dials" value="42" />
        <StatChip label="Connects" value="6" />
        <StatChip label="Rate" value="14%" />
        <StatChip label="Avg Talk" value="3:48" />
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[11.5px] text-ink hover:border-black/20">
          Pause Dial Mode
        </button>
        <button className="rounded-full bg-ink px-3 py-1.5 text-[11.5px] font-medium text-white">
          End Session
        </button>
      </div>
    </header>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5 rounded-full border border-black/[0.05] bg-white px-3 py-1 shadow-[0_2px_6px_-2px_rgba(15,23,41,0.08)]">
      <span className="text-[10px] uppercase tracking-[0.5px] text-ink/55">{label}</span>
      <span className="text-[14px] font-semibold tabular-nums text-ink">{value}</span>
    </div>
  );
}

function QueueRail() {
  return (
    <aside className={`flex flex-col overflow-hidden p-4 ${CARD}`}>
      <div className="flex items-baseline justify-between pb-3">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Session Queue
        </div>
        <span className="rounded-full bg-petrol-100 px-2 py-0.5 text-[10.5px] font-semibold text-petrol-700 tabular-nums">
          3 / 10
        </span>
      </div>
      <ol className="m-0 flex-1 list-none space-y-1 overflow-y-auto pl-0">
        {QUEUE.map((q) => {
          const isActive = q.status === "active";
          const isDone = q.status === "done";
          return (
            <li
              key={q.id}
              className={
                isActive
                  ? "rounded-xl border border-petrol-500/40 bg-petrol-100/60 px-3 py-2"
                  : isDone
                  ? "rounded-xl px-3 py-2 opacity-50"
                  : "rounded-xl px-3 py-2 hover:bg-black/[0.025]"
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
                    ? "mt-0.5 truncate text-[12.5px] text-ink line-through"
                    : isActive
                    ? "mt-0.5 truncate text-[12.5px] font-semibold text-ink"
                    : "mt-0.5 truncate text-[12.5px] font-medium text-ink"
                }
              >
                {q.ownerName}
              </div>
              <div className="mt-0.5 flex items-baseline justify-between text-[10.5px] text-ink/55">
                <span>
                  {q.city}, {q.state}
                </span>
                <span className="tabular-nums font-semibold text-ink/85">
                  {fmtMoney(q.surplus)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function CallStage() {
  return (
    <section className="flex flex-col gap-4 overflow-hidden">
      <JustEndedCard />
      <OutcomeRow />
      <NextCallCard />
    </section>
  );
}

function JustEndedCard() {
  return (
    <article
      className="relative flex flex-col overflow-hidden rounded-2xl p-7 text-white"
      style={{
        background: "linear-gradient(140deg, #04261c 0%, #0d4b3a 60%, #14644e 100%)",
        boxShadow: "0 24px 50px -22px rgba(13,75,58,0.45), 0 4px 14px -4px rgba(15,23,41,0.08)",
      }}
    >
      <header className="flex items-baseline justify-between">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.6px] backdrop-blur">
          <span className="inline-block h-2 w-2 rounded-full bg-white" />
          Call Just Ended
        </div>
        <div className="text-[11px] uppercase tracking-[0.5px] text-petrol-300">
          Lead 3 of 10 · Attempt 1 of 4
        </div>
      </header>

      <div className="mt-6 flex items-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-[22px] font-semibold text-petrol-700 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.5)]">
          CH
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] uppercase tracking-[0.6px] text-petrol-300">
            Last Call · Heir to Estate
          </div>
          <h1 className="m-0 mt-1 text-[34px] font-semibold leading-[1.05] tracking-[-0.025em] text-white">
            Cornelius J. Hayes Jr.
          </h1>
          <div className="mt-1 flex items-baseline gap-2 text-[13px] text-white/85">
            <span className="rounded-sm bg-white/15 px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-[0.4px]">
              Mobile
            </span>
            <span className="tabular-nums">(216) 555-0147</span>
            <span className="text-white/55">·</span>
            <span>Connected, 7 min 12 sec</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <textarea
          rows={2}
          placeholder="Quick note about this call. Saves when next call dials."
          className="w-full resize-none rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-2.5 text-[13px] text-white placeholder:text-white/55 outline-none focus:border-white/30"
        />
      </div>
    </article>
  );
}

function OutcomeRow() {
  const items = [
    { label: "Interested", sub: "Move to Contract", primary: true },
    { label: "Callback", sub: "Schedule a time" },
    { label: "Not Interested", sub: "Stay in stage" },
    { label: "Wrong Number", sub: "Mark this number" },
    { label: "Do Not Contact", sub: "Suppress this lead" },
  ];
  return (
    <div className={`flex items-center gap-2.5 p-4 ${CARD}`}>
      <div className="px-1">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Outcome
        </div>
        <div className="mt-0.5 text-[11.5px] text-ink/65">Press 1–5</div>
      </div>
      <div className="grid flex-1 grid-cols-5 gap-2">
        {items.map((d) => (
          <OutcomeBtn key={d.label} {...d} />
        ))}
      </div>
    </div>
  );
}

function OutcomeBtn({
  label,
  sub,
  primary,
}: {
  label: string;
  sub: string;
  primary?: boolean;
}) {
  return (
    <button
      className={
        primary
          ? "flex flex-col items-start gap-0.5 rounded-xl bg-petrol-700 px-3 py-2.5 text-left text-white shadow-[0_8px_22px_-10px_rgba(13,75,58,0.55)] hover:brightness-110"
          : "flex flex-col items-start gap-0.5 rounded-xl border border-black/[0.06] bg-white px-3 py-2.5 text-left text-ink shadow-[0_2px_8px_-2px_rgba(15,23,41,0.06)] hover:border-black/20"
      }
    >
      <span className="text-[12.5px] font-semibold">{label}</span>
      <span
        className={
          primary ? "text-[10.5px] text-white/75" : "text-[10.5px] text-ink/55"
        }
      >
        {sub}
      </span>
    </button>
  );
}

function NextCallCard() {
  return (
    <article className={`flex items-center gap-4 p-5 ${CARD}`}>
      <div className="flex flex-col">
        <span className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-700">
          Next call dials in
        </span>
        <span className="mt-0.5 text-[24px] font-semibold tabular-nums leading-none text-ink">
          0:03
        </span>
      </div>
      <div className="ml-3 h-10 w-px bg-black/[0.06]" />
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-petrol-700 text-[11px] font-semibold text-white">
          OC
        </div>
        <div className="min-w-0">
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
            Lead 4 of 10 · Primary Owner
          </div>
          <div className="text-[13.5px] font-semibold text-ink">Otis Crockett</div>
          <div className="text-[11.5px] text-ink/65">
            <span className="rounded-sm bg-ink/[0.06] px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.4px] text-ink/65">
              Mobile
            </span>{" "}
            <span className="tabular-nums">(865) 555-0148</span> · Knoxville, TN ·{" "}
            {fmtMoney(76300)}
          </div>
        </div>
      </div>
      <button className="ml-auto rounded-full bg-petrol-500 px-4 py-2 text-[12.5px] font-semibold text-white shadow-[0_8px_22px_-10px_rgba(13,75,58,0.55)] hover:brightness-110">
        Dial Now →
      </button>
    </article>
  );
}

function RightRail({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <aside className="flex flex-col gap-4 overflow-hidden">
      <DealFacts lead={lead} />
      <ContactsCard lead={lead} />
      <NotesCard lead={lead} />
    </aside>
  );
}

function DealFacts({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <section className={`p-5 ${CARD}`}>
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Hayes Estate
        </div>
        <span className="rounded-full bg-petrol-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.4px] text-petrol-700">
          {lead.stageLabel}
        </span>
      </div>
      <div className="mt-1 text-[12.5px] text-ink/65">
        {lead.propertyAddress}, {lead.city}, {lead.state}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-y border-black/[0.06] py-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.5px] text-ink/55">
            Surplus
          </div>
          <div className="text-[22px] font-semibold tabular-nums tracking-[-0.02em] leading-tight text-ink">
            {fmtMoney(lead.estimatedSurplus)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.5px] text-petrol-700">
            Net To Firm
          </div>
          <div className="text-[22px] font-semibold tabular-nums tracking-[-0.02em] leading-tight text-petrol-500">
            {fmtMoney(lead.estimatedNet)}
          </div>
          <div className="mt-0.5 text-[10px] text-ink/55">
            {lead.recoveryFeePercent}% recovery
          </div>
        </div>
      </div>

      <dl className="m-0 mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[11.5px]">
        <Fact label="County" value={lead.county} />
        <Fact label="Sale Type" value={lead.saleProcess} />
        <Fact label="Sale Date" value={lead.saleDate} />
        <Fact label="Owner Status" value={lead.ownerStatus} />
      </dl>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.5px] text-ink/55">{label}</dt>
      <dd className="m-0 mt-0.5 text-[12.5px] font-medium text-ink">{value}</dd>
    </div>
  );
}

function ContactsCard({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
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
      <ul className="m-0 mt-3 list-none space-y-1 pl-0">
        {lead.contacts.map((c, ci) => (
          <li key={c.id}>
            <ContactRow contact={c} expanded={ci === 0} justCalled={ci === 0} />
          </li>
        ))}
      </ul>
    </section>
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
          ? "overflow-hidden rounded-xl border border-petrol-500/40 bg-petrol-100/40"
          : "overflow-hidden rounded-xl border border-black/[0.06] bg-white"
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
                    ? "Just called"
                    : isDead
                    ? n.state === "wrong"
                      ? "Wrong"
                      : "Disc."
                    : n.lastAttempt
                    ? `Last ${n.lastAttempt}`
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

function NotesCard({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <section className={`p-5 ${CARD}`}>
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Recent Notes
        </div>
        <span className="text-[10.5px] text-ink/55">
          {lead.notes.length} total · newest first
        </span>
      </div>
      <div className="mt-3 space-y-3">
        {lead.notes.slice(0, 2).map((n) => (
          <div key={n.id} className="border-l-2 border-petrol-500 pl-3">
            <div className="text-[10.5px] text-ink/55">
              <span className="font-semibold text-ink">{n.author}</span> ·{" "}
              {n.createdAt}
            </div>
            <p className="m-0 mt-0.5 text-[11.5px] leading-snug text-ink/85">
              {n.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
