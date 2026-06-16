import { notFound } from "next/navigation";
import Link from "next/link";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";

export default async function V28Page() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="flex h-screen flex-col bg-[#f4f6f8] text-ink">
      <TopBar />
      <main className="grid flex-1 grid-cols-12 gap-4 overflow-hidden px-6 py-5">
        <HeroWrapUp className="col-span-8" />
        <RightStack className="col-span-4" lead={lead} />
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-black/[0.06] bg-white px-7 py-3 text-[12px]">
      <div className="flex items-center gap-3">
        <Link href="/share/dialer-mockup" className="text-ink/55 hover:text-ink">
          ← Back
        </Link>
        <span className="text-ink/20">|</span>
        <span className="font-semibold text-ink">Power Dial Session</span>
      </div>
      <div className="flex items-center gap-6 text-[12px]">
        <StatPill label="Dials" value="42" />
        <StatPill label="Connects" value="6" />
        <StatPill label="Rate" value="14%" />
        <StatPill label="Avg Talk" value="3:48" />
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

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">{label}</span>
      <span className="text-[14px] font-semibold tabular-nums text-ink">{value}</span>
    </div>
  );
}

function HeroWrapUp({
  className,
}: {
  className?: string;
}) {
  return (
    <section
      className={`relative flex flex-col overflow-hidden rounded-3xl p-9 text-white ${className ?? ""}`}
      style={{
        background: "linear-gradient(135deg, #04261c 0%, #0d4b3a 55%, #13644e 100%)",
      }}
    >
      <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-white/15">
        <div className="h-full bg-[#5db98a]" style={{ width: "62%" }} />
      </div>

      <div className="flex items-baseline justify-between">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.6px] backdrop-blur">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
          Call Just Ended · Wrap-Up
        </div>
        <div className="text-right">
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-300">
            Lead 3 of 10
          </div>
          <div className="text-[11px] text-white/85">
            Attempt 1 of 4 on this lead
          </div>
        </div>
      </div>

      <div className="mt-7 flex items-center gap-7">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white text-[30px] font-semibold text-petrol-700 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)]">
          CH
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] uppercase tracking-[0.6px] text-petrol-300">
            Last Call · Heir
          </div>
          <h1 className="m-0 mt-1 text-[44px] font-semibold leading-[1.02] tracking-[-0.025em] text-white">
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

      <div className="mt-7 rounded-2xl bg-white/[0.08] px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.6px] text-petrol-300">
              Next call dialing in
            </div>
            <div className="mt-0.5 text-[28px] font-semibold tabular-nums leading-none text-white">
              0:03
            </div>
            <div className="mt-1 text-[11px] text-white/75">
              Then dialing <span className="font-semibold">Otis Crockett (Mobile)</span> in Knoxville, TN
            </div>
          </div>
          <button className="rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-petrol-700 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.35)] hover:brightness-105">
            Skip Wait →
          </button>
        </div>
      </div>

      <div className="mt-7">
        <div className="text-[11px] uppercase tracking-[0.6px] text-petrol-300">
          How Did The Call Go? · Press 1 through 5
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          <Outcome label="Interested" tone="primary" />
          <Outcome label="Callback" />
          <Outcome label="Not Interested" />
          <Outcome label="Wrong Number" />
          <Outcome label="Do Not Contact" tone="muted" />
        </div>
        <div className="mt-2 text-[10.5px] uppercase tracking-[0.4px] text-petrol-300">
          Voicemail / No Answer / Busy / Disconnected — auto-detected, no action needed
        </div>
      </div>

      <div className="mt-auto pt-7">
        <textarea
          rows={2}
          placeholder="Quick note about this call. Saves automatically when next call starts."
          className="w-full resize-none rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-[13px] text-white placeholder:text-white/55 outline-none focus:border-white/30"
        />
      </div>
    </section>
  );
}

function Outcome({
  label,
  tone,
}: {
  label: string;
  tone?: "primary" | "muted";
}) {
  return (
    <button
      className={
        tone === "primary"
          ? "rounded-xl bg-white px-4 py-3 text-[12.5px] font-semibold text-petrol-700 shadow-[0_8px_18px_-8px_rgba(0,0,0,0.35)] hover:brightness-105"
          : tone === "muted"
          ? "rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-[12.5px] font-medium text-white/65 hover:bg-white/10"
          : "rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 text-[12.5px] font-medium text-white hover:bg-white/15"
      }
    >
      {label}
    </button>
  );
}

function RightStack({
  className,
  lead,
}: {
  className?: string;
  lead: typeof ACTIVE_LEAD;
}) {
  return (
    <div className={`flex flex-col gap-4 overflow-hidden ${className ?? ""}`}>
      <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_8px_28px_-18px_rgba(15,23,41,0.12)]">
        <div className="flex items-baseline justify-between">
          <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
            This Deal
          </div>
          <span className="rounded-full bg-petrol-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.4px] text-petrol-700">
            {lead.stageLabel}
          </span>
        </div>
        <div className="mt-2 text-[18px] font-semibold leading-tight tracking-tight text-ink">
          Hayes Estate
        </div>
        <div className="text-[11.5px] text-ink/65">
          {lead.propertyAddress}, {lead.city}, {lead.state}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.5px] text-ink/55">Surplus</div>
            <div className="text-[20px] font-semibold tabular-nums tracking-[-0.02em] text-ink leading-tight">
              {fmtMoney(lead.estimatedSurplus)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.5px] text-petrol-700">Net To Firm</div>
            <div className="text-[20px] font-semibold tabular-nums tracking-[-0.02em] text-petrol-500 leading-tight">
              {fmtMoney(lead.estimatedNet)}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-y-auto rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_8px_28px_-18px_rgba(15,23,41,0.12)]">
        <div className="flex items-baseline justify-between">
          <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
            Contacts on this Lead
          </div>
          <span className="text-[10.5px] text-ink/55">
            {lead.contacts.length} · {lead.contacts.reduce((acc, c) => acc + c.numbers.length, 0)} phones
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {lead.contacts.map((c, ci) => (
            <ContactTree key={c.id} contact={c} expanded={ci === 0} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_8px_28px_-18px_rgba(15,23,41,0.12)]">
        <div className="flex items-baseline justify-between">
          <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
            Up Next (3 of 7)
          </div>
        </div>
        <ol className="m-0 mt-2 list-none space-y-0.5 pl-0">
          {QUEUE.slice(3, 6).map((q) => (
            <li
              key={q.id}
              className="flex items-baseline justify-between text-[12px]"
            >
              <span className="text-ink/55 tabular-nums">#{q.position}</span>
              <span className="ml-2 flex-1 truncate font-medium text-ink">
                {q.ownerName}
              </span>
              <span className="tabular-nums text-ink">{fmtMoney(q.surplus)}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function ContactTree({
  contact,
  expanded,
}: {
  contact: typeof ACTIVE_LEAD["contacts"][number];
  expanded: boolean;
}) {
  return (
    <div className="rounded-xl border border-black/[0.05] bg-white">
      <button className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[10px] text-ink/55">{expanded ? "▾" : "▸"}</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/[0.06] text-[10px] font-semibold text-ink">
            {contact.initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-semibold text-ink">{contact.name}</div>
            <div className="text-[10px] uppercase tracking-[0.4px] text-ink/55">
              {contact.role}
            </div>
          </div>
        </div>
        <span className="rounded-full bg-ink/[0.05] px-2 py-0.5 text-[10px] font-semibold text-ink/65 tabular-nums">
          {contact.numbers.length}
        </span>
      </button>
      {expanded && (
        <div className="space-y-0.5 border-t border-black/[0.05] px-3 py-2">
          {contact.numbers.map((n, ni) => {
            const isCur = ni === 0;
            const isDead = n.state === "wrong" || n.state === "disconnected";
            return (
              <div key={n.id} className="flex items-center gap-2 text-[11.5px]">
                <span className="w-[42px] text-[9.5px] uppercase tracking-[0.5px] text-ink/55">
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
                <span className="ml-auto text-[10px] text-ink/55">
                  {isCur
                    ? "Just called"
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
