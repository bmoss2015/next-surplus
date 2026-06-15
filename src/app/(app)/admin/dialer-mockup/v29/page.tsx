import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";

export default async function V29Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="flex h-screen flex-col bg-[#f4f6f8] text-ink">
      <TopBar />
      <main className="grid flex-1 grid-cols-12 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden px-6 py-5">
        <NowCard className="col-span-7 row-span-1" />
        <NextCard className="col-span-5 row-span-1" />
        <DealCard className="col-span-7 row-span-1" lead={lead} />
        <QueueCard className="col-span-5 row-span-1" lead={lead} />
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

function NowCard({ className }: { className?: string }) {
  return (
    <section
      className={`relative flex flex-col overflow-hidden rounded-3xl p-7 text-white ${className ?? ""}`}
      style={{
        background: "linear-gradient(135deg, #04261c 0%, #0d4b3a 55%, #13644e 100%)",
      }}
    >
      <div className="flex items-baseline justify-between">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.6px] backdrop-blur">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#fda4a4]" />
          Just Ended · Wrap-Up
        </div>
        <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-300">
          Lead 3 of 10 · Attempt 1 of 4
        </div>
      </div>

      <div className="mt-5 flex items-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-[22px] font-semibold text-petrol-700 shadow-[0_14px_30px_-12px_rgba(0,0,0,0.45)]">
          CH
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] uppercase tracking-[0.6px] text-petrol-300">
            Last Call · Heir
          </div>
          <h1 className="m-0 mt-0.5 text-[32px] font-semibold leading-[1.05] tracking-[-0.025em] text-white">
            Cornelius J. Hayes Jr.
          </h1>
          <div className="mt-1 text-[13px] text-white/85">
            <span className="rounded-sm bg-white/15 px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-[0.4px]">
              Mobile
            </span>{" "}
            <span className="tabular-nums">(216) 555-0147</span> · Connected,{" "}
            <span className="tabular-nums">7:12</span>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-300">
          How Did The Call Go?
        </div>
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          <Pill label="Interested" primary />
          <Pill label="Callback" />
          <Pill label="Not Interested" />
          <Pill label="Wrong Number" />
          <Pill label="Do Not Contact" muted />
        </div>
      </div>
    </section>
  );
}

function Pill({
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
          ? "rounded-xl bg-white px-3 py-2.5 text-[12px] font-semibold text-petrol-700 shadow-[0_8px_18px_-8px_rgba(0,0,0,0.35)]"
          : muted
          ? "rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 text-[12px] font-medium text-white/65"
          : "rounded-xl border border-white/15 bg-white/[0.1] px-3 py-2.5 text-[12px] font-medium text-white"
      }
    >
      {label}
    </button>
  );
}

function NextCard({ className }: { className?: string }) {
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-3xl border border-petrol-500 bg-white p-7 shadow-[0_18px_44px_-22px_rgba(13,75,58,0.35)] ${className ?? ""}`}
    >
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-700">
          Next Call · Auto-Dialing In
        </div>
        <button className="rounded-full bg-petrol-500 px-3 py-1 text-[11px] font-semibold text-white shadow-[0_4px_12px_-4px_rgba(13,75,58,0.4)]">
          Skip Wait →
        </button>
      </div>

      <div className="mt-3 flex items-baseline gap-3">
        <div className="text-[44px] font-semibold tabular-nums tracking-[-0.025em] leading-none text-ink">
          0:03
        </div>
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-petrol-100">
            <div
              className="h-full rounded-full bg-petrol-500"
              style={{ width: "62%" }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-petrol-100/50 px-4 py-3.5">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-700">
          Then Dialing
        </div>
        <div className="mt-1 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-petrol-700 text-[12px] font-semibold text-white">
            OC
          </div>
          <div className="min-w-0">
            <div className="text-[14.5px] font-semibold text-ink">Otis Crockett</div>
            <div className="text-[11.5px] text-ink/65">
              <span className="rounded-sm bg-petrol-100 px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-[0.4px] text-petrol-700">
                Mobile
              </span>{" "}
              <span className="tabular-nums">(865) 555-0148</span> · Primary Owner
            </div>
          </div>
        </div>
        <div className="mt-1.5 text-[11.5px] text-ink/65">
          Lead 4 of 10 · Knoxville, TN · {fmtMoney(76300)}
        </div>
      </div>

      <div className="mt-auto pt-5">
        <button className="w-full rounded-xl border border-black/[0.08] bg-white py-2.5 text-[12.5px] font-medium text-ink hover:border-black/20">
          Skip This Lead Entirely
        </button>
      </div>
    </section>
  );
}

function DealCard({
  className,
  lead,
}: {
  className?: string;
  lead: typeof ACTIVE_LEAD;
}) {
  return (
    <section
      className={`overflow-y-auto rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_28px_-18px_rgba(15,23,41,0.12)] ${className ?? ""}`}
    >
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">This Deal</div>
          <h2 className="m-0 mt-0.5 text-[20px] font-semibold tracking-tight text-ink">
            Hayes Estate · {lead.city}, {lead.state}
          </h2>
          <div className="text-[11.5px] text-ink/65">{lead.propertyAddress}</div>
        </div>
        <div className="text-right">
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-700">
            Net To Firm
          </div>
          <div className="text-[24px] font-semibold tabular-nums tracking-[-0.02em] text-petrol-500 leading-none">
            {fmtMoney(lead.estimatedNet)}
          </div>
          <div className="mt-0.5 text-[10.5px] text-ink/55">
            on {fmtMoney(lead.estimatedSurplus)} surplus
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
            Contacts and Phone Numbers
          </div>
          <span className="text-[10.5px] text-ink/55">
            {lead.contacts.length} contacts ·{" "}
            {lead.contacts.reduce((acc, c) => acc + c.numbers.length, 0)} phones
          </span>
        </div>
        <div className="mt-3 space-y-1.5">
          {lead.contacts.map((c, ci) => (
            <ContactTree key={c.id} contact={c} expanded={ci === 0} />
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Activity Log
        </div>
        <ul className="m-0 mt-2 list-none space-y-1 pl-0">
          {lead.activity.slice(0, 5).map((a) => (
            <li
              key={a.id}
              className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 border-b border-black/[0.05] pb-1.5 text-[12px] last:border-b-0"
            >
              <span className="text-[10.5px] text-ink/55">{a.at}</span>
              <span className="text-ink">
                <span className="font-medium">{a.label}</span>
                {a.detail && <span className="text-ink/65"> · {a.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
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
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/[0.06] text-[10.5px] font-semibold text-ink">
            {contact.initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-ink">{contact.name}</div>
            <div className="text-[10px] uppercase tracking-[0.4px] text-ink/55">
              {contact.role}
            </div>
          </div>
        </div>
        <span className="text-[10.5px] text-ink/55">
          {contact.numbers.length} number{contact.numbers.length !== 1 ? "s" : ""}
        </span>
      </button>
      {expanded && (
        <div className="space-y-0.5 border-t border-black/[0.05] px-3 py-2.5">
          {contact.numbers.map((n, ni) => {
            const isCur = ni === 0;
            const isDead = n.state === "wrong" || n.state === "disconnected";
            return (
              <div key={n.id} className="flex items-center gap-2 text-[11.5px]">
                <span className="w-[44px] text-[9.5px] uppercase tracking-[0.5px] text-ink/55">
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
                    ? "Just called · 7:12"
                    : isDead
                    ? n.state === "wrong"
                      ? "Wrong number"
                      : "Disconnected"
                    : n.lastAttempt
                    ? `Last tried ${n.lastAttempt}`
                    : "Never called"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QueueCard({
  className,
}: {
  className?: string;
  lead?: typeof ACTIVE_LEAD;
}) {
  return (
    <section
      className={`overflow-y-auto rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_28px_-18px_rgba(15,23,41,0.12)] ${className ?? ""}`}
    >
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Session Queue · Distinct Leads
        </div>
        <span className="rounded-full bg-petrol-100 px-2 py-0.5 text-[10.5px] font-semibold text-petrol-700 tabular-nums">
          3 / 10
        </span>
      </div>

      <ol className="m-0 mt-3 list-none space-y-1 pl-0">
        {QUEUE.map((q) => {
          const isActive = q.status === "active";
          const isDone = q.status === "done";
          return (
            <li
              key={q.id}
              className={
                isActive
                  ? "flex items-baseline gap-3 rounded-lg bg-petrol-100/60 px-2.5 py-2"
                  : isDone
                  ? "flex items-baseline gap-3 rounded-lg px-2.5 py-2 opacity-50"
                  : "flex items-baseline gap-3 rounded-lg px-2.5 py-2 hover:bg-black/[0.025]"
              }
            >
              <span
                className={
                  isActive
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-petrol-500 text-[10px] font-semibold text-white"
                    : isDone
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-ink/[0.08] text-[10px] font-semibold text-ink"
                    : "flex h-6 w-6 items-center justify-center rounded-full border border-black/[0.1] text-[10px] font-semibold text-ink"
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
                  {q.contactCount} contact{q.contactCount !== 1 ? "s" : ""} ·{" "}
                  {fmtMoney(q.surplus)}
                </div>
              </div>
              {isActive && (
                <span className="text-[10px] font-semibold uppercase tracking-[0.4px] text-petrol-700">
                  Now
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
