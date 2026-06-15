import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";

export default async function V22Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="flex h-screen flex-col bg-[#f6f7f9] text-ink">
      <TopBar />
      <main className="grid flex-1 grid-cols-12 grid-rows-12 gap-4 overflow-hidden px-7 py-5">
        <Hero className="col-span-8 row-span-7" />
        <QueueRail className="col-span-4 row-span-12" />
        <Contacts className="col-span-5 row-span-5" lead={lead} />
        <NotesBlock className="col-span-3 row-span-5" lead={lead} />
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-black/[0.06] bg-white px-7 py-3 text-[12px]">
      <div className="flex items-center gap-3">
        <Link href="/admin/dialer-mockup" className="text-ink/55 hover:text-ink">
          ← Back to mockups
        </Link>
        <span className="text-ink/20">|</span>
        <span className="font-semibold text-ink">Power Dial Session</span>
      </div>
      <div className="flex items-center gap-6 text-[11.5px]">
        <span className="text-ink/55">
          <span className="font-semibold text-ink tabular-nums">42</span> Dials
        </span>
        <span className="text-ink/55">
          <span className="font-semibold text-ink tabular-nums">6</span> Connects
        </span>
        <span className="text-ink/55">
          <span className="font-semibold text-ink tabular-nums">14%</span> Rate
        </span>
        <span className="text-ink/55">
          <span className="font-semibold text-ink tabular-nums">3:48</span> Avg Talk
        </span>
        <button className="rounded-md bg-danger px-3 py-1 text-[11px] font-medium text-white">
          End Session
        </button>
      </div>
    </header>
  );
}

function Hero({ className }: { className?: string }) {
  return (
    <section
      className={`relative overflow-hidden rounded-3xl bg-white ${className ?? ""}`}
      style={{
        boxShadow: "0 24px 50px -28px rgba(15,23,41,0.18), 0 4px 12px -4px rgba(15,23,41,0.05)",
      }}
    >
      <div className="grid h-full grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden p-9">
          <div className="flex items-baseline justify-between">
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.7px] text-petrol-700">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#5db98a]" />
              Live · Connected
            </span>
            <span className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
              Lead 3 of 10
            </span>
          </div>

          <div className="mt-4 text-[11.5px] uppercase tracking-[0.6px] text-ink/55">
            Calling Heir
          </div>
          <h1
            className="m-0 mt-2 text-[60px] font-semibold leading-[0.96] tracking-[-0.03em] text-ink"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Cornelius J.
            <br />
            Hayes Jr.
          </h1>
          <div className="mt-3 flex items-baseline gap-2 text-[14.5px] text-ink/80">
            <span className="rounded-sm bg-petrol-100 px-1.5 py-[1px] text-[10.5px] font-semibold uppercase tracking-[0.4px] text-petrol-700">
              Mobile
            </span>
            <span className="tabular-nums">(216) 555-0147</span>
            <span className="text-ink/30">·</span>
            <span>Son of the estate</span>
          </div>

          <div className="mt-6 inline-flex items-baseline gap-3 border-t-2 border-ink/85 pt-3">
            <span className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
              Talk Time
            </span>
            <span className="text-[48px] font-semibold tabular-nums tracking-[-0.025em] leading-none text-ink">
              02:14
            </span>
          </div>

          <div className="mt-7 flex items-center gap-2">
            <Btn label="Mute" k="M" />
            <Btn label="Hold" k="H" />
            <Btn label="Voicemail" k="V" />
            <Btn label="Note" k="N" />
            <button className="ml-2 rounded-full bg-danger px-5 py-2.5 text-[13px] font-medium text-white">
              End Call <kbd className="ml-2 rounded-sm border border-white/40 px-1 font-mono text-[9.5px] text-white/85">E</kbd>
            </button>
          </div>
        </div>

        <aside className="flex flex-col gap-4 border-l border-black/[0.05] bg-[#fafbfc] p-7">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
              Estimated Surplus
            </div>
            <div className="mt-1 text-[34px] font-semibold tabular-nums tracking-[-0.025em] leading-none text-ink">
              $521,900
            </div>
            <div className="mt-1 text-[11.5px] text-ink/65">
              1818 Erie Crossing, Cleveland, OH
            </div>
          </div>

          <div className="rounded-2xl bg-ink px-4 py-3 text-white">
            <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-300">
              Estimated Net To Firm
            </div>
            <div className="mt-0.5 text-[28px] font-semibold tabular-nums tracking-[-0.02em] leading-none">
              $146,132
            </div>
            <div className="mt-0.5 text-[10.5px] text-white/65">28% recovery fee</div>
          </div>

          <div className="mt-auto rounded-2xl bg-white px-4 py-3 ring-1 ring-black/[0.06]">
            <div className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
              How Did The Call Go?
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <OutcomeBtn label="Interested" k="1" primary />
              <OutcomeBtn label="Not Interested" k="2" />
              <OutcomeBtn label="Callback" k="3" />
              <OutcomeBtn label="Wrong Number" k="4" />
              <OutcomeBtn label="Do Not Contact" k="5" />
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.4px] text-ink/45">
              Voicemail / No answer / Busy are detected automatically
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Btn({ label, k }: { label: string; k: string }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3.5 py-2 text-[12px] text-ink hover:border-black/20">
      {label}
      <kbd className="rounded-sm border border-ink/15 px-1 font-mono text-[9.5px] text-ink/55">{k}</kbd>
    </button>
  );
}

function OutcomeBtn({
  label,
  k,
  primary,
}: {
  label: string;
  k: string;
  primary?: boolean;
}) {
  return (
    <button
      className={
        primary
          ? "rounded-full bg-petrol-500 px-2.5 py-1 text-[11px] font-medium text-white"
          : "rounded-full border border-black/[0.08] bg-white px-2.5 py-1 text-[11px] text-ink hover:border-black/20"
      }
    >
      {label}
      <kbd
        className={
          primary
            ? "ml-1 rounded-sm border border-white/40 px-1 font-mono text-[9px] text-white/85"
            : "ml-1 rounded-sm border border-ink/15 px-1 font-mono text-[9px] text-ink/55"
        }
      >
        {k}
      </kbd>
    </button>
  );
}

function QueueRail({ className }: { className?: string }) {
  return (
    <aside
      className={`overflow-y-auto rounded-3xl bg-white p-6 ${className ?? ""}`}
      style={{
        boxShadow: "0 24px 50px -28px rgba(15,23,41,0.15), 0 4px 12px -4px rgba(15,23,41,0.04)",
      }}
    >
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">Session Queue</div>
        <div className="rounded-full bg-petrol-100 px-2 py-0.5 text-[10.5px] font-semibold text-petrol-700">
          3 / 10
        </div>
      </div>

      <ol className="m-0 mt-4 list-none space-y-1.5 pl-0">
        {QUEUE.slice(0, 10).map((q) => {
          const isActive = q.status === "active";
          const isDone = q.status === "done";
          return (
            <li
              key={q.id}
              className={
                isActive
                  ? "flex items-center gap-3 rounded-xl bg-petrol-100 px-3 py-2.5"
                  : isDone
                  ? "flex items-center gap-3 rounded-xl px-3 py-2 opacity-55"
                  : "flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-black/[0.025]"
              }
            >
              <span
                className={
                  isActive
                    ? "flex h-7 w-7 items-center justify-center rounded-full bg-petrol-500 text-[11px] font-semibold text-white"
                    : isDone
                    ? "flex h-7 w-7 items-center justify-center rounded-full bg-ink/[0.08] text-[11px] font-semibold text-ink"
                    : "flex h-7 w-7 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-ink ring-1 ring-black/[0.08]"
                }
              >
                {q.position}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className={
                    isDone
                      ? "truncate text-[12px] text-ink line-through"
                      : "truncate text-[12.5px] font-medium text-ink"
                  }
                >
                  {q.ownerName}
                </div>
                <div className="text-[10.5px] text-ink/55">
                  {q.city}, {q.state} · {q.stageLabel}
                </div>
              </div>
              <div className="text-right">
                <div className="tabular-nums text-[11.5px] font-semibold text-ink">
                  {fmtMoney(q.surplus)}
                </div>
                <div className="text-[10px] text-ink/55">{q.estReady}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function Contacts({
  className,
  lead,
}: {
  className?: string;
  lead: typeof ACTIVE_LEAD;
}) {
  return (
    <section
      className={`overflow-y-auto rounded-3xl bg-white p-6 ${className ?? ""}`}
      style={{
        boxShadow: "0 24px 50px -28px rgba(15,23,41,0.15), 0 4px 12px -4px rgba(15,23,41,0.04)",
      }}
    >
      <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
        Contacts and Phone Numbers
      </div>
      <div className="mt-3 space-y-3">
        {lead.contacts.map((c, ci) => (
          <ContactBlock key={c.id} contact={c} isActive={ci === 0} />
        ))}
      </div>
    </section>
  );
}

function ContactBlock({
  contact,
  isActive,
}: {
  contact: typeof ACTIVE_LEAD["contacts"][number];
  isActive: boolean;
}) {
  return (
    <div className="border-b border-black/[0.06] pb-3 last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={
              isActive
                ? "flex h-9 w-9 items-center justify-center rounded-full bg-petrol-700 text-[11px] font-semibold text-white"
                : "flex h-9 w-9 items-center justify-center rounded-full bg-ink/[0.06] text-[11px] font-semibold text-ink"
            }
          >
            {contact.initials}
          </div>
          <div>
            <div className="text-[13.5px] font-semibold text-ink">{contact.name}</div>
            <div className="text-[10.5px] uppercase tracking-[0.4px] text-ink/55">
              {contact.role}
            </div>
          </div>
        </div>
        {isActive && (
          <span className="rounded-full bg-petrol-500 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.4px] text-white">
            On Call
          </span>
        )}
      </div>
      <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {contact.numbers.map((n, ni) => {
          const isCur = isActive && ni === 0;
          const isDead = n.state === "wrong" || n.state === "disconnected";
          return (
            <div
              key={n.id}
              className={
                isCur
                  ? "flex items-center gap-2 rounded-md bg-white px-2 py-1 ring-1 ring-petrol-500"
                  : "flex items-center gap-2 rounded-md px-2 py-1 hover:bg-black/[0.02]"
              }
            >
              <span
                className={
                  isDead
                    ? "rounded-sm bg-danger-bg px-1.5 py-[1px] text-[9.5px] font-semibold uppercase text-danger"
                    : "rounded-sm bg-ink/[0.05] px-1.5 py-[1px] text-[9.5px] font-semibold uppercase text-ink/65"
                }
              >
                {n.label}
              </span>
              <span
                className={
                  isDead
                    ? "tabular-nums text-[12px] text-ink/45 line-through"
                    : "tabular-nums text-[12px] text-ink"
                }
              >
                {n.formatted}
              </span>
              {isCur && (
                <span className="ml-auto text-[9.5px] font-semibold uppercase tracking-[0.4px] text-petrol-700">
                  Dialing
                </span>
              )}
              {isDead && (
                <span className="ml-auto text-[9.5px] font-semibold uppercase tracking-[0.4px] text-danger">
                  {n.state === "wrong" ? "Wrong" : "Disc."}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NotesBlock({
  className,
  lead,
}: {
  className?: string;
  lead: typeof ACTIVE_LEAD;
}) {
  return (
    <section
      className={`overflow-y-auto rounded-3xl bg-white p-6 ${className ?? ""}`}
      style={{
        boxShadow: "0 24px 50px -28px rgba(15,23,41,0.15), 0 4px 12px -4px rgba(15,23,41,0.04)",
      }}
    >
      <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
        Recent Notes
      </div>
      <div className="mt-3 space-y-3">
        {lead.notes.slice(0, 4).map((n) => (
          <div key={n.id} className="border-b border-black/[0.05] pb-3 last:border-b-0">
            <div className="text-[10.5px] text-ink/55">
              <span className="font-semibold text-ink">{n.author}</span> · {n.createdAt}
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
