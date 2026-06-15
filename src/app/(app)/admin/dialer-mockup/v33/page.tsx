import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";

export default async function V33Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="flex h-screen flex-col bg-[#f4f6f8] text-ink">
      <TopBar />
      <main className="grid flex-1 grid-cols-12 grid-rows-[auto_minmax(0,1fr)] gap-5 overflow-hidden px-6 py-5">
        <DealHero className="col-span-4 row-span-1" lead={lead} />
        <Hero className="col-span-8 row-span-1" />
        <ContactsPanel className="col-span-5 row-span-1" lead={lead} />
        <QueuePanel className="col-span-4 row-span-1" />
        <NotesPanel className="col-span-3 row-span-1" lead={lead} />
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-black/[0.06] bg-white px-7 py-3 text-[12px]">
      <div className="flex items-center gap-3">
        <Link href="/admin/dialer-mockup" className="text-ink/55 hover:text-ink">
          ← Back
        </Link>
        <span className="text-ink/20">|</span>
        <span className="font-semibold text-ink">Power Dial Session</span>
        <span className="rounded-full bg-petrol-100 px-2 py-0.5 text-[10.5px] font-semibold text-petrol-700 tabular-nums">
          Lead 3 of 10
        </span>
      </div>
      <div className="flex items-center gap-6 text-[12px]">
        <Stat label="Dials" value="42" />
        <Stat label="Connects" value="6" />
        <Stat label="Rate" value="14%" />
        <Stat label="Avg Talk" value="3:48" />
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">{label}</span>
      <span className="text-[14px] font-semibold tabular-nums text-ink">{value}</span>
    </div>
  );
}

const CARD = "rounded-[24px] border border-black/[0.06] bg-white shadow-[0_8px_28px_-18px_rgba(15,23,41,0.12)]";

function DealHero({
  className,
  lead,
}: {
  className?: string;
  lead: typeof ACTIVE_LEAD;
}) {
  return (
    <section className={`flex flex-col overflow-hidden p-6 ${CARD} ${className ?? ""}`}>
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          This Deal
        </div>
        <span className="rounded-full bg-petrol-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.4px] text-petrol-700">
          {lead.stageLabel}
        </span>
      </div>

      <h2 className="m-0 mt-2 text-[26px] font-semibold leading-tight tracking-tight text-ink">
        Hayes Estate
      </h2>
      <div className="mt-1 text-[12.5px] text-ink/65">
        {lead.propertyAddress}
        <br />
        {lead.city}, {lead.state} · {lead.county}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-y border-black/[0.06] py-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.5px] text-ink/55">Surplus</div>
          <div className="text-[24px] font-semibold tabular-nums tracking-[-0.02em] leading-none text-ink">
            {fmtMoney(lead.estimatedSurplus)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.5px] text-petrol-700">
            Net To Firm
          </div>
          <div className="text-[24px] font-semibold tabular-nums tracking-[-0.02em] leading-none text-petrol-500">
            {fmtMoney(lead.estimatedNet)}
          </div>
          <div className="mt-0.5 text-[10.5px] text-ink/55">
            {lead.recoveryFeePercent}% recovery
          </div>
        </div>
      </div>

      <div className="mt-3 text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
        Lead History
      </div>
      <ul className="m-0 mt-2 list-none space-y-1.5 pl-0 text-[12px]">
        {lead.activity.slice(0, 4).map((a) => (
          <li key={a.id} className="grid grid-cols-[60px_minmax(0,1fr)] gap-2">
            <span className="text-[10.5px] text-ink/55 tabular-nums">
              {a.at.split(",")[0]}
            </span>
            <span className="text-ink">{a.label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[10.5px]">
        {lead.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-ink/[0.05] px-2 py-0.5 font-medium text-ink/75"
          >
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}

function Hero({ className }: { className?: string }) {
  return (
    <section
      className={`relative flex flex-col overflow-hidden rounded-[28px] p-9 text-white ${className ?? ""}`}
      style={{
        background: "linear-gradient(135deg, #04261c 0%, #0d4b3a 55%, #13644e 100%)",
        boxShadow: "0 30px 60px -28px rgba(13,75,58,0.45), 0 6px 18px -6px rgba(15,23,41,0.08)",
      }}
    >
      <span
        className="pointer-events-none absolute -right-12 -top-12 select-none text-[16rem] font-bold leading-none text-white/[0.04]"
        style={{ letterSpacing: "-0.04em" }}
      >
        CH
      </span>
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]">
        <span className="block h-full bg-white" style={{ width: "62%" }} />
      </span>

      <header className="relative flex items-baseline justify-between">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.6px] backdrop-blur">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
          Call Just Ended · Wrap-Up
        </div>
        <div className="text-right text-[11px] uppercase tracking-[0.5px] text-petrol-300">
          Attempt 1 of 4 on this lead
        </div>
      </header>

      <div className="relative mt-6 flex items-center gap-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-[28px] font-semibold text-petrol-700 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)]">
          CH
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] uppercase tracking-[0.6px] text-petrol-300">
            Last Call · Heir to Estate
          </div>
          <h1 className="m-0 mt-1 text-[40px] font-semibold leading-[1.02] tracking-[-0.025em] text-white">
            Cornelius J. Hayes Jr.
          </h1>
          <div className="mt-1.5 flex items-baseline gap-2 text-[14px] text-white/85">
            <span className="rounded-sm bg-white/15 px-1.5 py-[1px] text-[10.5px] font-semibold uppercase tracking-[0.4px]">
              Mobile
            </span>
            <span className="tabular-nums">(216) 555-0147</span>
            <span className="text-white/55">·</span>
            <span>Connected, 7 min 12 sec</span>
          </div>
        </div>
      </div>

      <NextCallStrip />

      <div className="relative mt-6">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-300">
          How Did The Call Go? · Press 1 through 5
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          <Outcome label="Interested" sub="Move to Contract" tone="primary" />
          <Outcome label="Callback" sub="Schedule a time" />
          <Outcome label="Not Interested" sub="Stay in stage" />
          <Outcome label="Wrong Number" sub="Mark this number" />
          <Outcome label="Do Not Contact" sub="Suppress this lead" tone="muted" />
        </div>
        <div className="mt-2 text-[10px] uppercase tracking-[0.4px] text-petrol-300">
          Voicemail / No Answer / Busy / Disconnected — auto-detected, no action needed
        </div>
      </div>

      <div className="relative mt-auto pt-5">
        <textarea
          rows={2}
          placeholder="Quick note about this call. Saves when next call dials."
          className="w-full resize-none rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-2.5 text-[13px] text-white placeholder:text-white/55 outline-none focus:border-white/30"
        />
      </div>
    </section>
  );
}

function NextCallStrip() {
  return (
    <div className="relative mt-6 flex items-center gap-4 rounded-2xl border border-white/15 bg-white/[0.08] px-5 py-3.5 backdrop-blur">
      <div className="flex flex-col">
        <span className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-300">
          Next call dialing in
        </span>
        <span className="mt-0.5 text-[26px] font-semibold tabular-nums leading-none">
          0:03
        </span>
      </div>
      <div className="ml-2 hidden h-12 w-px bg-white/15 sm:block" />
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-[12px] font-semibold text-petrol-700">
          OC
        </div>
        <div className="min-w-0">
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-300">
            Lead 4 of 10 · Primary Owner
          </div>
          <div className="text-[14px] font-semibold text-white">Otis Crockett</div>
          <div className="text-[11.5px] text-white/75">
            <span className="rounded-sm bg-white/15 px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.4px]">
              Mobile
            </span>{" "}
            <span className="tabular-nums">(865) 555-0148</span> · Knoxville, TN
          </div>
        </div>
      </div>
      <button className="ml-auto rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-petrol-700 shadow-[0_8px_22px_-10px_rgba(0,0,0,0.4)] hover:brightness-105">
        Skip Wait →
      </button>
    </div>
  );
}

function Outcome({
  label,
  sub,
  tone,
}: {
  label: string;
  sub: string;
  tone?: "primary" | "muted";
}) {
  return (
    <button
      className={
        tone === "primary"
          ? "flex flex-col items-start gap-0.5 rounded-2xl bg-white px-3.5 py-3 text-left shadow-[0_10px_24px_-10px_rgba(0,0,0,0.4)] transition hover:brightness-105"
          : tone === "muted"
          ? "flex flex-col items-start gap-0.5 rounded-2xl border border-white/15 bg-white/[0.04] px-3.5 py-3 text-left text-white/65 transition hover:bg-white/10 hover:text-white"
          : "flex flex-col items-start gap-0.5 rounded-2xl border border-white/15 bg-white/[0.08] px-3.5 py-3 text-left text-white transition hover:bg-white/15"
      }
    >
      <span
        className={
          tone === "primary"
            ? "text-[13px] font-semibold text-petrol-700"
            : "text-[13px] font-semibold"
        }
      >
        {label}
      </span>
      <span
        className={
          tone === "primary"
            ? "text-[10.5px] text-petrol-700/65"
            : "text-[10.5px] text-white/65"
        }
      >
        {sub}
      </span>
    </button>
  );
}

function ContactsPanel({
  className,
  lead,
}: {
  className?: string;
  lead: typeof ACTIVE_LEAD;
}) {
  return (
    <section className={`overflow-y-auto p-5 ${CARD} ${className ?? ""}`}>
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
      <button className="grid w-full grid-cols-[20px_28px_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-2 text-left">
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
          <div className="truncate text-[13px] font-semibold text-ink">
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

function QueuePanel({ className }: { className?: string }) {
  return (
    <section className={`overflow-y-auto p-5 ${CARD} ${className ?? ""}`}>
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Session Queue · Distinct Leads
        </div>
        <span className="rounded-full bg-petrol-100 px-2 py-0.5 text-[10.5px] font-semibold text-petrol-700 tabular-nums">
          3 / 10
        </span>
      </div>
      <ol className="m-0 mt-3 list-none space-y-0.5 pl-0">
        {QUEUE.map((q) => {
          const isActive = q.status === "active";
          const isDone = q.status === "done";
          return (
            <li
              key={q.id}
              className={
                isActive
                  ? "flex items-baseline gap-2.5 rounded-lg bg-petrol-100/60 px-2 py-1.5"
                  : isDone
                  ? "flex items-baseline gap-2.5 rounded-lg px-2 py-1.5 opacity-50"
                  : "flex items-baseline gap-2.5 rounded-lg px-2 py-1.5 hover:bg-black/[0.025]"
              }
            >
              <span
                className={
                  isActive
                    ? "flex h-5 w-5 items-center justify-center rounded-full bg-petrol-500 text-[10px] font-semibold text-white tabular-nums"
                    : "flex h-5 w-5 items-center justify-center rounded-full border border-black/[0.1] text-[10px] font-semibold text-ink tabular-nums"
                }
              >
                {q.position}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className={
                    isDone
                      ? "truncate text-[11.5px] text-ink line-through"
                      : "truncate text-[11.5px] font-medium text-ink"
                  }
                >
                  {q.ownerName}
                </div>
                <div className="text-[10.5px] text-ink/55">
                  {q.contactCount} contact{q.contactCount !== 1 ? "s" : ""}
                </div>
              </div>
              <span className="tabular-nums text-[11px] font-semibold text-ink">
                {fmtMoney(q.surplus)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function NotesPanel({
  className,
  lead,
}: {
  className?: string;
  lead: typeof ACTIVE_LEAD;
}) {
  return (
    <section className={`overflow-y-auto p-5 ${CARD} ${className ?? ""}`}>
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Recent Notes
        </div>
        <span className="text-[10.5px] text-ink/55">
          {lead.notes.length} total
        </span>
      </div>
      <div className="mt-3 space-y-3">
        {lead.notes.slice(0, 3).map((n) => (
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
