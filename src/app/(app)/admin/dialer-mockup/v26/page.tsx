import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";

export default async function V26Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="flex h-screen flex-col bg-[#f6f7fb] text-ink">
      <TopBar />
      <main className="flex-1 overflow-y-auto">
        <HeroBand lead={lead} />
        <ContactsStrip lead={lead} />
        <QueueStrip />
        <NotesStrip lead={lead} />
        <div className="h-8" />
      </main>
      <DockBar />
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-black/[0.06] bg-white/85 px-7 py-3 text-[12px] backdrop-blur">
      <div className="flex items-center gap-3">
        <Link href="/admin/dialer-mockup" className="text-ink/55 hover:text-ink">
          ← Back
        </Link>
        <span className="text-ink/20">|</span>
        <span className="font-semibold text-ink">Power Dial Session</span>
      </div>
      <div className="flex items-center gap-5 text-[11.5px]">
        <Inline label="Dials" value="42" />
        <Inline label="Connects" value="6" />
        <Inline label="Rate" value="14%" />
        <Inline label="Avg Talk" value="3:48" />
        <button className="rounded-full bg-ink px-3 py-1 text-[11px] font-medium text-white">
          End Session
        </button>
      </div>
    </header>
  );
}

function Inline({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-ink/55">
      {label}{" "}
      <span className="font-semibold tabular-nums text-ink">{value}</span>
    </span>
  );
}

function HeroBand({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <section className="relative px-8 pt-9">
      <div
        className="relative overflow-hidden rounded-[32px] p-9 text-white"
        style={{
          background:
            "linear-gradient(115deg, #04261c 0%, #0d4b3a 35%, #1a8a9c 100%)",
        }}
      >
        <span
          className="pointer-events-none absolute -right-12 -top-12 text-[20rem] font-bold leading-none text-white/[0.05]"
          style={{ letterSpacing: "-0.04em" }}
        >
          CH
        </span>
        <div className="relative flex items-baseline justify-between">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.5px] backdrop-blur">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#5db98a]" />
            Live · Connected
          </span>
          <span className="text-[11.5px] uppercase tracking-[0.5px] text-white/75">
            Lead 3 of 10 · {lead.stageLabel}
          </span>
        </div>

        <div className="relative mt-7 grid grid-cols-[110px_minmax(0,1fr)_auto] items-end gap-6">
          <div className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-white text-[34px] font-semibold text-petrol-700 shadow-[0_18px_36px_-12px_rgba(0,0,0,0.45)]">
            CH
          </div>
          <div>
            <div className="text-[11.5px] uppercase tracking-[0.6px] text-petrol-300">
              Calling Heir
            </div>
            <h1 className="m-0 mt-1 text-[52px] font-semibold leading-[1] tracking-[-0.03em] text-white">
              Cornelius J. Hayes Jr.
            </h1>
            <div className="mt-2 flex items-baseline gap-2 text-[15px] text-white/85">
              <span className="rounded-sm bg-white/15 px-1.5 py-[1px] text-[10.5px] font-semibold uppercase tracking-[0.4px]">
                Mobile
              </span>
              <span className="tabular-nums">(216) 555-0147</span>
              <span className="text-white/55">·</span>
              <span>Son of estate · Cleveland OH</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-300">
              Talk Time
            </div>
            <div className="mt-1 text-[68px] font-semibold tabular-nums tracking-[-0.025em] leading-none text-white">
              02:14
            </div>
          </div>
        </div>

        <div className="relative mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/15">
          <Stat
            label="Surplus"
            value={fmtMoney(lead.estimatedSurplus)}
          />
          <Stat
            label="Net To Firm"
            value={fmtMoney(lead.estimatedNet)}
            accent
            sub={`${lead.recoveryFeePercent}% fee`}
          />
          <Stat
            label="Property"
            value={`${lead.city}, ${lead.state}`}
            sub={lead.propertyAddress}
          />
        </div>
      </div>
    </section>
  );
}

function Stat({
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
    <div className="bg-petrol-900/85 px-5 py-4 backdrop-blur">
      <div className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-300">
        {label}
      </div>
      <div
        className={
          (accent ? "text-petrol-300 " : "text-white ") +
          "mt-1 text-[26px] font-semibold tabular-nums tracking-[-0.02em] leading-none"
        }
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-white/65">{sub}</div>}
    </div>
  );
}

function ContactsStrip({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <section className="mt-6 px-8">
      <div className="flex items-baseline justify-between">
        <h2 className="m-0 text-[15px] font-semibold tracking-tight text-ink">
          Contacts and Phone Numbers
        </h2>
        <div className="text-[11px] text-ink/55">
          {lead.contacts.length} contacts ·{" "}
          {lead.contacts.reduce((acc, c) => acc + c.numbers.length, 0)} numbers
        </div>
      </div>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
        {lead.contacts.map((c, ci) => (
          <ContactCard key={c.id} contact={c} isActive={ci === 0} />
        ))}
      </div>
    </section>
  );
}

function ContactCard({
  contact,
  isActive,
}: {
  contact: typeof ACTIVE_LEAD["contacts"][number];
  isActive: boolean;
}) {
  return (
    <article
      className={
        isActive
          ? "min-w-[280px] rounded-2xl border border-petrol-500 bg-white p-4 shadow-[0_18px_36px_-18px_rgba(13,75,58,0.4)]"
          : "min-w-[260px] rounded-2xl border border-black/[0.05] bg-white p-4 shadow-[0_8px_24px_-12px_rgba(15,23,41,0.08)]"
      }
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={
              isActive
                ? "flex h-10 w-10 items-center justify-center rounded-full bg-petrol-700 text-[12px] font-semibold text-white"
                : "flex h-10 w-10 items-center justify-center rounded-full bg-ink/[0.06] text-[12px] font-semibold text-ink"
            }
          >
            {contact.initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-ink">
              {contact.name}
            </div>
            <div className="text-[10.5px] uppercase tracking-[0.4px] text-ink/55">
              {contact.role}
            </div>
          </div>
        </div>
        {isActive && (
          <span className="rounded-full bg-petrol-500 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.4px] text-white">
            On Call
          </span>
        )}
      </div>
      <div className="mt-3 space-y-0.5">
        {contact.numbers.map((n, ni) => {
          const isCur = isActive && ni === 0;
          const isDead = n.state === "wrong" || n.state === "disconnected";
          return (
            <div
              key={n.id}
              className={
                isCur
                  ? "flex items-center gap-2 rounded-md bg-petrol-100/50 px-2 py-1"
                  : "flex items-center gap-2 rounded-md px-2 py-1 hover:bg-black/[0.025]"
              }
            >
              <span
                className={
                  isDead
                    ? "rounded-sm bg-danger-bg px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.4px] text-danger"
                    : "rounded-sm bg-ink/[0.05] px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.4px] text-ink/65"
                }
              >
                {n.label}
              </span>
              <span
                className={
                  isDead
                    ? "tabular-nums text-[12px] text-ink/45 line-through"
                    : isCur
                    ? "tabular-nums text-[12px] font-semibold text-petrol-700"
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
              {!isCur && !isDead && (
                <button className="ml-auto rounded-sm px-1.5 py-[1px] text-[10.5px] font-semibold text-petrol-700 hover:underline">
                  Dial
                </button>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}

function QueueStrip() {
  return (
    <section className="mt-6 px-8">
      <div className="flex items-baseline justify-between">
        <h2 className="m-0 text-[15px] font-semibold tracking-tight text-ink">
          Up Next in Queue
        </h2>
        <div className="text-[11px] text-ink/55">
          7 left · ~21 min
        </div>
      </div>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
        {QUEUE.slice(3, 10).map((q) => (
          <article
            key={q.id}
            className="min-w-[200px] rounded-2xl border border-black/[0.05] bg-white p-3 shadow-[0_6px_20px_-12px_rgba(15,23,41,0.08)]"
          >
            <div className="flex items-center justify-between text-[10.5px] text-ink/55">
              <span className="font-semibold text-ink tabular-nums">#{q.position}</span>
              <span>{q.estReady}</span>
            </div>
            <div className="mt-1 truncate text-[13px] font-semibold text-ink">
              {q.ownerName}
            </div>
            <div className="truncate text-[10.5px] text-ink/55">
              {q.stageLabel} · {q.city}, {q.state}
            </div>
            <div className="mt-2 text-[14px] font-semibold tabular-nums text-petrol-700">
              {fmtMoney(q.surplus)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function NotesStrip({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <section className="mt-6 px-8">
      <div className="flex items-baseline justify-between">
        <h2 className="m-0 text-[15px] font-semibold tracking-tight text-ink">
          Recent Notes On This Lead
        </h2>
        <span className="text-[11px] text-ink/55">{lead.notes.length} total</span>
      </div>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
        {lead.notes.slice(0, 4).map((n) => (
          <article
            key={n.id}
            className="min-w-[280px] max-w-[320px] rounded-2xl border border-black/[0.05] bg-white p-4 shadow-[0_6px_20px_-12px_rgba(15,23,41,0.08)]"
          >
            <div className="text-[10.5px] text-ink/55">
              <span className="font-semibold text-ink">{n.author}</span> · {n.createdAt}
            </div>
            <p className="m-0 mt-1.5 text-[12.5px] leading-snug text-ink/85">
              {n.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function DockBar() {
  return (
    <footer className="shrink-0 border-t border-black/[0.06] bg-white px-7 py-3">
      <div className="flex items-center gap-2">
        <DockBtn label="Mute" k="M" />
        <DockBtn label="Hold" k="H" />
        <DockBtn label="Voicemail Drop" k="V" />
        <DockBtn label="Add Note" k="N" />
        <button className="rounded-full bg-danger px-4 py-2 text-[12.5px] font-medium text-white">
          End Call
          <kbd className="ml-2 rounded-sm border border-white/40 px-1 font-mono text-[9.5px] text-white/85">
            E
          </kbd>
        </button>

        <span className="ml-6 text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
          Outcome
        </span>
        <Out label="Interested" k="1" primary />
        <Out label="Not Interested" k="2" />
        <Out label="Callback" k="3" />
        <Out label="Wrong Number" k="4" />
        <Out label="Do Not Contact" k="5" />
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.4px] text-ink/45">
        Voicemail · No Answer · Busy detected automatically · 3 sec delay between calls
      </div>
    </footer>
  );
}

function DockBtn({ label, k }: { label: string; k: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[12px] text-ink hover:border-black/20">
      {label}
      <kbd className="rounded-sm border border-ink/15 px-1 font-mono text-[9.5px] text-ink/55">{k}</kbd>
    </button>
  );
}

function Out({
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
          ? "rounded-full bg-petrol-500 px-3 py-1.5 text-[11.5px] font-medium text-white shadow-[0_4px_10px_-4px_rgba(13,75,58,0.55)]"
          : "rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[11.5px] text-ink hover:border-black/20"
      }
    >
      {label}
      <kbd
        className={
          primary
            ? "ml-1 rounded-sm border border-white/40 px-1 font-mono text-[9.5px] text-white/85"
            : "ml-1 rounded-sm border border-ink/15 px-1 font-mono text-[9.5px] text-ink/55"
        }
      >
        {k}
      </kbd>
    </button>
  );
}
