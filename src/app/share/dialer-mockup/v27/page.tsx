import { notFound } from "next/navigation";
import Link from "next/link";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";

export default async function V27Page() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="flex h-screen flex-col bg-[#f4f6f8] text-ink">
      <TopBar />
      <main className="grid flex-1 grid-cols-[280px_minmax(0,1fr)_400px] gap-4 overflow-hidden px-5 py-5">
        <SessionRail />
        <CenterCallCard lead={lead} />
        <WrapUpDrawer lead={lead} />
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

function SessionRail() {
  return (
    <aside className="overflow-y-auto rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_8px_28px_-18px_rgba(15,23,41,0.12)]">
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Session Queue
        </div>
        <div className="rounded-full bg-petrol-100 px-2 py-0.5 text-[10.5px] font-semibold text-petrol-700 tabular-nums">
          3 / 10
        </div>
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
                  ? "flex items-center gap-2.5 rounded-lg bg-petrol-100/60 px-2.5 py-2"
                  : isDone
                  ? "flex items-center gap-2.5 rounded-lg px-2.5 py-2 opacity-50"
                  : "flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-black/[0.025]"
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
                  {q.state} · {fmtMoney(q.surplus)}
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
    </aside>
  );
}

function CenterCallCard({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <section
      className="relative flex flex-col overflow-hidden rounded-3xl p-9 text-white"
      style={{
        background: "linear-gradient(135deg, #04261c 0%, #0d4b3a 55%, #13644e 100%)",
      }}
    >
      <span
        className="pointer-events-none absolute -right-16 -top-10 text-[18rem] font-bold leading-none text-white/[0.04]"
        style={{ letterSpacing: "-0.04em" }}
      >
        CH
      </span>

      <div className="relative flex items-baseline justify-between">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.6px] backdrop-blur">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#5db98a]" />
          Just Ended · Wrap-Up
        </div>
        <div className="text-right text-[11.5px]">
          <div className="uppercase tracking-[0.5px] text-petrol-300">
            Lead 3 of 10 · Attempt 1 of 4 on this lead
          </div>
        </div>
      </div>

      <div className="relative mt-6 flex items-center gap-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-[28px] font-semibold text-petrol-700 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)]">
          CH
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] uppercase tracking-[0.6px] text-petrol-300">
            Last call · Heir
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

      <div className="relative mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/15">
        <Pillar label="Surplus" value={fmtMoney(lead.estimatedSurplus)} />
        <Pillar
          label="Net To Firm"
          value={fmtMoney(lead.estimatedNet)}
          accent
          sub={`${lead.recoveryFeePercent}% recovery`}
        />
        <Pillar label="Property" value={`${lead.city}, ${lead.state}`} sub={lead.propertyAddress} />
      </div>

      <div className="relative mt-auto pt-7">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-300">
          Contact Tree · 4 contacts, 5 phones
        </div>
        <div className="mt-2 space-y-1.5 text-[12.5px]">
          {lead.contacts.slice(0, 3).map((c, ci) => (
            <ContactTreeRow key={c.id} contact={c} isActive={ci === 0} />
          ))}
          <button className="text-[11px] font-semibold text-petrol-300 hover:text-white">
            + Show 1 more contact
          </button>
        </div>
      </div>
    </section>
  );
}

function Pillar({
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
    <div className="bg-petrol-900/80 px-5 py-3.5 backdrop-blur">
      <div className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-300">
        {label}
      </div>
      <div
        className={
          (accent ? "text-petrol-300 " : "text-white ") +
          "mt-1 text-[22px] font-semibold tabular-nums tracking-[-0.02em] leading-none"
        }
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-[10.5px] text-white/65">{sub}</div>}
    </div>
  );
}

function ContactTreeRow({
  contact,
  isActive,
}: {
  contact: typeof ACTIVE_LEAD["contacts"][number];
  isActive: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-white/95">
        <div className="flex items-center gap-2">
          <span className="text-[10px]">{isActive ? "▾" : "▸"}</span>
          <span className="font-semibold">{contact.name}</span>
          <span className="text-[10.5px] uppercase tracking-[0.4px] text-petrol-300">
            {contact.role}
          </span>
        </div>
        <span className="text-[10.5px] text-white/55">
          {contact.numbers.length} number{contact.numbers.length !== 1 ? "s" : ""}
        </span>
      </div>
      {isActive && (
        <div className="ml-5 mt-1 space-y-0.5">
          {contact.numbers.map((n, ni) => {
            const isCur = ni === 0;
            const isDead = n.state === "wrong" || n.state === "disconnected";
            return (
              <div key={n.id} className="flex items-center gap-2.5 text-[11.5px]">
                <span className="w-[42px] text-[9.5px] uppercase tracking-[0.5px] text-petrol-300">
                  {n.label}
                </span>
                <span
                  className={
                    isDead
                      ? "tabular-nums text-white/45 line-through"
                      : isCur
                      ? "tabular-nums font-semibold text-white"
                      : "tabular-nums text-white/90"
                  }
                >
                  {n.formatted}
                </span>
                <span className="text-[10px] text-white/55">
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

function WrapUpDrawer({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <aside className="overflow-y-auto rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_18px_44px_-22px_rgba(15,23,41,0.18)]">
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-700">
          Wrap Up This Call
        </div>
        <div className="text-[11px] text-ink/55">Step 3 of 4</div>
      </div>

      <div className="mt-3 rounded-2xl bg-petrol-100 px-4 py-3">
        <div className="flex items-baseline justify-between text-[11px] text-petrol-700">
          <span className="font-semibold uppercase tracking-[0.5px]">
            Next call in 3 seconds
          </span>
          <button className="text-[11px] font-semibold text-petrol-700 underline hover:text-petrol-900">
            Skip Wait →
          </button>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-petrol-500"
            style={{ width: "62%" }}
          />
        </div>
        <div className="mt-2 text-[11px] text-petrol-700/85">
          Then dialing <span className="font-semibold">Otis Crockett (Mobile)</span> in Knoxville, TN
        </div>
      </div>

      <div className="mt-5 text-[11px] uppercase tracking-[0.6px] text-ink/55">
        How Did The Call Go?
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <BigBtn label="Interested" tone="primary" />
        <BigBtn label="Callback" />
        <BigBtn label="Not Interested" />
        <BigBtn label="Wrong Number" />
        <BigBtn label="Do Not Contact" className="col-span-2" tone="danger" />
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.4px] text-ink/45">
        Voicemail · No Answer · Busy · Disconnected — auto-detected
      </div>

      <div className="mt-5 text-[11px] uppercase tracking-[0.6px] text-ink/55">
        Quick Note
      </div>
      <textarea
        rows={3}
        placeholder="Capture what was said. Saves on outcome."
        className="mt-1.5 block w-full resize-none rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-[12.5px] text-ink outline-none focus:border-petrol-500"
      />

      <div className="mt-5 border-t border-black/[0.06] pt-4">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Recent Notes On This Lead
        </div>
        <div className="mt-2 space-y-2">
          {lead.notes.slice(0, 2).map((n) => (
            <div key={n.id}>
              <div className="text-[10.5px] text-ink/55">
                <span className="font-semibold text-ink">{n.author}</span> · {n.createdAt}
              </div>
              <p className="m-0 mt-0.5 text-[11.5px] leading-snug text-ink/85">{n.body}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function BigBtn({
  label,
  tone,
  className,
}: {
  label: string;
  tone?: "primary" | "danger";
  className?: string;
}) {
  return (
    <button
      className={
        (tone === "primary"
          ? "bg-petrol-500 text-white shadow-[0_8px_22px_-10px_rgba(13,75,58,0.5)] hover:brightness-110 "
          : tone === "danger"
          ? "border border-danger/30 bg-danger-bg text-danger hover:border-danger "
          : "border border-black/[0.08] bg-white text-ink hover:border-black/20 ") +
        "rounded-xl px-3 py-2.5 text-left text-[12.5px] font-medium " +
        (className ?? "")
      }
    >
      {label}
    </button>
  );
}
