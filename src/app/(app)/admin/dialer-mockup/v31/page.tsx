import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";

export default async function V31Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="flex h-screen flex-col bg-[#f4f6f8] text-ink">
      <TopBar />
      <main className="grid flex-1 grid-cols-12 gap-4 overflow-hidden px-6 pb-[112px] pt-5">
        <Hero className="col-span-8" />
        <SideStack className="col-span-4" lead={lead} />
      </main>
      <ActionBarWrapUp />
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
          Lead 3 / 10
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

function Hero({ className }: { className?: string }) {
  return (
    <section
      className={`relative flex flex-col overflow-hidden rounded-3xl p-9 text-white ${className ?? ""}`}
      style={{
        background: "linear-gradient(135deg, #04261c 0%, #0d4b3a 55%, #13644e 100%)",
      }}
    >
      <span
        className="pointer-events-none absolute -right-12 -top-12 text-[18rem] font-bold leading-none text-white/[0.04]"
        style={{ letterSpacing: "-0.04em" }}
      >
        CH
      </span>

      <div className="relative flex items-baseline justify-between">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.6px] backdrop-blur">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
          Call Just Ended
        </div>
        <div className="text-[11.5px] uppercase tracking-[0.5px] text-petrol-300">
          Attempt 1 of 4 on this lead
        </div>
      </div>

      <div className="relative mt-7 flex items-center gap-7">
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

      <div className="relative mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/15">
        <Cell label="Surplus" value={fmtMoney(ACTIVE_LEAD.estimatedSurplus)} />
        <Cell
          label="Net To Firm"
          value={fmtMoney(ACTIVE_LEAD.estimatedNet)}
          accent
        />
        <Cell
          label="Property"
          value={`${ACTIVE_LEAD.city}, ${ACTIVE_LEAD.state}`}
          sub={ACTIVE_LEAD.propertyAddress}
        />
      </div>

      <div className="relative mt-auto pt-6">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-300">
          Quick Note
        </div>
        <textarea
          rows={2}
          placeholder="Capture what was said. Saves automatically when next call starts."
          className="mt-2 w-full resize-none rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-2.5 text-[13px] text-white placeholder:text-white/55 outline-none focus:border-white/30"
        />
      </div>
    </section>
  );
}

function Cell({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: string;
  accent?: boolean;
  sub?: string;
}) {
  return (
    <div className="bg-petrol-900/80 px-5 py-4 backdrop-blur">
      <div className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-300">{label}</div>
      <div
        className={
          (accent ? "text-petrol-300 " : "text-white ") +
          "mt-1 text-[22px] font-semibold tabular-nums tracking-[-0.02em] leading-none"
        }
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-white/65">{sub}</div>}
    </div>
  );
}

function SideStack({
  className,
  lead,
}: {
  className?: string;
  lead: typeof ACTIVE_LEAD;
}) {
  return (
    <div className={`flex flex-col gap-4 overflow-hidden ${className ?? ""}`}>
      <section className="overflow-y-auto rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_8px_28px_-18px_rgba(15,23,41,0.12)]">
        <div className="flex items-baseline justify-between">
          <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
            Contacts and Phone Numbers
          </div>
          <span className="text-[10.5px] text-ink/55">
            {lead.contacts.length} · {lead.contacts.reduce((acc, c) => acc + c.numbers.length, 0)} phones
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {lead.contacts.map((c, ci) => (
            <ContactRow key={c.id} contact={c} expanded={ci === 0} />
          ))}
        </div>
      </section>

      <section className="overflow-y-auto rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_8px_28px_-18px_rgba(15,23,41,0.12)]">
        <div className="flex items-baseline justify-between">
          <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
            Session Queue · Distinct Leads
          </div>
          <span className="rounded-full bg-petrol-100 px-2 py-0.5 text-[10px] font-semibold text-petrol-700 tabular-nums">
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
                    ? "flex items-baseline gap-2 rounded-lg bg-petrol-100/60 px-2 py-1.5"
                    : isDone
                    ? "flex items-baseline gap-2 rounded-lg px-2 py-1.5 opacity-50"
                    : "flex items-baseline gap-2 rounded-lg px-2 py-1.5"
                }
              >
                <span
                  className={
                    isActive
                      ? "flex h-5 w-5 items-center justify-center rounded-full bg-petrol-500 text-[10px] font-semibold text-white"
                      : "flex h-5 w-5 items-center justify-center rounded-full border border-black/[0.1] text-[10px] font-semibold text-ink"
                  }
                >
                  {q.position}
                </span>
                <span
                  className={
                    isDone
                      ? "flex-1 truncate text-[11.5px] text-ink line-through"
                      : "flex-1 truncate text-[11.5px] font-medium text-ink"
                  }
                >
                  {q.ownerName}
                </span>
                <span className="text-[10.5px] text-ink/55 tabular-nums">
                  {fmtMoney(q.surplus)}
                </span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function ContactRow({
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
        <span className="text-[10.5px] text-ink/55">
          {contact.numbers.length} #
        </span>
      </button>
      {expanded && (
        <div className="space-y-0.5 border-t border-black/[0.05] px-3 py-2">
          {contact.numbers.map((n, ni) => {
            const isCur = ni === 0;
            const isDead = n.state === "wrong" || n.state === "disconnected";
            return (
              <div key={n.id} className="flex items-center gap-2 text-[11px]">
                <span className="w-[40px] text-[9.5px] uppercase tracking-[0.5px] text-ink/55">
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
                <span className="ml-auto text-[9.5px] text-ink/55">
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

function ActionBarWrapUp() {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.08] bg-white shadow-[0_-12px_30px_-12px_rgba(15,23,41,0.12)]">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(0,1.2fr)] items-center gap-6 px-7 py-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-700">
              Auto-Dial Next In
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-[28px] font-semibold tabular-nums tracking-[-0.025em] leading-none text-ink">
                0:03
              </span>
              <button className="rounded-full bg-petrol-500 px-3.5 py-1.5 text-[11px] font-semibold text-white">
                Skip Wait →
              </button>
            </div>
          </div>
          <div className="ml-2 hidden lg:block">
            <div className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
              Then Dialing
            </div>
            <div className="text-[12.5px] font-semibold text-ink">
              Otis Crockett (Mobile)
            </div>
            <div className="text-[10.5px] text-ink/55">
              Knoxville, TN · {fmtMoney(76300)}
            </div>
          </div>
        </div>

        <div>
          <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
            How Did The Call Go?
          </div>
          <div className="mt-1.5 grid grid-cols-5 gap-1.5">
            <BarBtn label="Interested" primary />
            <BarBtn label="Callback" />
            <BarBtn label="Not Interested" />
            <BarBtn label="Wrong Number" />
            <BarBtn label="Do Not Contact" muted />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <button className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[11.5px] font-medium text-ink hover:border-black/20">
            Skip This Lead
          </button>
          <button className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[11.5px] font-medium text-ink hover:border-black/20">
            Snooze Lead 3 Days
          </button>
        </div>
      </div>
    </footer>
  );
}

function BarBtn({
  label,
  primary,
  muted,
}: {
  label: string;
  primary?: boolean;
  muted?: boolean;
}) {
  return (
    <button
      className={
        primary
          ? "rounded-xl bg-petrol-500 px-2 py-1.5 text-[11.5px] font-semibold text-white shadow-[0_6px_14px_-6px_rgba(13,75,58,0.5)]"
          : muted
          ? "rounded-xl border border-black/[0.08] bg-white px-2 py-1.5 text-[11.5px] font-medium text-ink/65 hover:text-ink"
          : "rounded-xl border border-black/[0.08] bg-white px-2 py-1.5 text-[11.5px] font-medium text-ink hover:border-black/20"
      }
    >
      {label}
    </button>
  );
}
