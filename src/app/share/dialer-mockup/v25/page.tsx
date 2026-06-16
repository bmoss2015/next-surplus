import { notFound } from "next/navigation";
import Link from "next/link";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";

export default async function V25Page() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="flex h-screen flex-col bg-white text-ink">
      <TopBar />
      <main className="grid flex-1 grid-cols-12 gap-px overflow-hidden bg-black/[0.06]">
        <Hero className="col-span-8" />
        <Sidebar className="col-span-4" />
        <Contacts className="col-span-8" lead={lead} />
        <Outcome className="col-span-4" />
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-black/[0.08] bg-white px-7 py-3 text-[12px]">
      <div className="flex items-center gap-4">
        <Link href="/share/dialer-mockup" className="text-ink/55 hover:text-ink">
          ← Back
        </Link>
        <span className="text-ink/20">|</span>
        <span className="font-semibold text-ink">Power Dial Session</span>
        <span className="text-ink/20">|</span>
        <span className="text-ink/65">Lead 3 of 10</span>
      </div>
      <div className="flex items-center gap-5 text-[11.5px]">
        <Inline label="Dials" value="42" />
        <Inline label="Connects" value="6" />
        <Inline label="Rate" value="14%" />
        <Inline label="Avg Talk" value="3:48" />
        <button className="rounded-md border border-black/[0.08] bg-white px-3 py-1 text-[11px] font-medium text-ink hover:border-black/20">
          Pause Auto-Dial
        </button>
        <button className="rounded-md bg-ink px-3 py-1 text-[11px] font-medium text-white hover:brightness-110">
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

function Hero({ className }: { className?: string }) {
  return (
    <section className={`flex flex-col bg-white p-9 ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ background: "#5db98a", boxShadow: "0 0 0 4px rgba(93,185,138,0.18)" }}
        />
        <span className="text-[11px] uppercase tracking-[0.7px] text-petrol-700">
          Live · Connected
        </span>
        <span className="ml-auto text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
          {ACTIVE_LEAD.leadId}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-[110px_minmax(0,1fr)_auto] items-center gap-6">
        <div className="flex h-[110px] w-[110px] items-center justify-center rounded-2xl bg-gradient-to-br from-petrol-500 to-petrol-700 text-[32px] font-semibold text-white shadow-[0_18px_36px_-14px_rgba(13,75,58,0.55)]">
          CH
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.6px] text-ink/55">
            Calling Heir · Son of Estate
          </div>
          <h1 className="m-0 mt-1 text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] text-ink">
            Cornelius J. Hayes Jr.
          </h1>
          <div className="mt-1.5 flex items-baseline gap-2 text-[14px] text-ink/80">
            <span className="rounded-sm bg-petrol-100 px-1.5 py-[1px] text-[10.5px] font-semibold uppercase tracking-[0.4px] text-petrol-700">
              Mobile
            </span>
            <span className="tabular-nums">(216) 555-0147</span>
            <span className="text-ink/30">·</span>
            <span>Cleveland, OH</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
            Talk Time
          </div>
          <div className="mt-1 text-[52px] font-semibold tabular-nums tracking-[-0.025em] leading-none text-ink">
            02:14
          </div>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-black/[0.08] bg-black/[0.06]">
        <Pillar label="Estimated Surplus" value={fmtMoney(ACTIVE_LEAD.estimatedSurplus)} />
        <Pillar
          label="Net To Firm"
          value={fmtMoney(ACTIVE_LEAD.estimatedNet)}
          accent
          sub={`${ACTIVE_LEAD.recoveryFeePercent}% recovery fee`}
        />
        <Pillar
          label="Property"
          value={ACTIVE_LEAD.propertyAddress}
          small
          sub={`${ACTIVE_LEAD.city}, ${ACTIVE_LEAD.state}`}
        />
      </div>

      <div className="mt-auto flex items-center gap-2 pt-7">
        <CtrlBtn label="Mute" k="M" />
        <CtrlBtn label="Hold" k="H" />
        <CtrlBtn label="Voicemail" k="V" />
        <CtrlBtn label="Add Note" k="N" />
        <button className="ml-auto rounded-md bg-danger px-5 py-2.5 text-[12.5px] font-medium text-white">
          End Call
          <kbd className="ml-2 rounded-sm border border-white/40 px-1 font-mono text-[9.5px] text-white/85">
            E
          </kbd>
        </button>
      </div>
    </section>
  );
}

function Pillar({
  label,
  value,
  accent,
  small,
  sub,
}: {
  label: string;
  value: string;
  accent?: boolean;
  small?: boolean;
  sub?: string;
}) {
  return (
    <div className="bg-white px-4 py-3">
      <div className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
        {label}
      </div>
      <div
        className={
          (small ? "text-[16px] leading-tight " : "text-[22px] leading-none ") +
          (accent ? "text-petrol-500 " : "text-ink ") +
          "mt-1 font-semibold tabular-nums tracking-[-0.02em]"
        }
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-[10.5px] text-ink/55">{sub}</div>}
    </div>
  );
}

function CtrlBtn({ label, k }: { label: string; k: string }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-md border border-black/[0.08] bg-white px-3.5 py-2 text-[12.5px] text-ink hover:border-black/20">
      {label}
      <kbd className="rounded-sm border border-ink/15 px-1 font-mono text-[9.5px] text-ink/55">{k}</kbd>
    </button>
  );
}

function Sidebar({ className }: { className?: string }) {
  return (
    <aside className={`overflow-y-auto bg-white p-7 ${className ?? ""}`}>
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Session Queue
        </div>
        <div className="rounded-sm bg-petrol-100 px-2 py-0.5 text-[10.5px] font-semibold text-petrol-700">
          3 / 10
        </div>
      </div>

      <ol className="m-0 mt-4 list-none space-y-px pl-0">
        {QUEUE.slice(0, 10).map((q) => {
          const isActive = q.status === "active";
          const isDone = q.status === "done";
          return (
            <li
              key={q.id}
              className={
                isActive
                  ? "grid grid-cols-[18px_minmax(0,1fr)_auto] items-baseline gap-3 border-l-2 border-petrol-500 bg-petrol-100/35 py-2 pl-2.5"
                  : isDone
                  ? "grid grid-cols-[18px_minmax(0,1fr)_auto] items-baseline gap-3 py-2 pl-2.5 opacity-50"
                  : "grid grid-cols-[18px_minmax(0,1fr)_auto] items-baseline gap-3 py-2 pl-2.5 hover:bg-black/[0.025]"
              }
            >
              <span className="text-[11px] tabular-nums text-ink/55">{q.position}</span>
              <div className="min-w-0">
                <div
                  className={
                    isDone
                      ? "truncate text-[12px] text-ink/85 line-through"
                      : "truncate text-[12.5px] font-medium text-ink"
                  }
                >
                  {q.ownerName}
                </div>
                <div className="truncate text-[10.5px] text-ink/55">
                  {q.city}, {q.state} · {q.stageLabel}
                </div>
              </div>
              <span className="tabular-nums text-[11.5px] font-semibold text-ink">
                {fmtMoney(q.surplus)}
              </span>
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
    <section className={`overflow-y-auto bg-white p-7 ${className ?? ""}`}>
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Contacts and Phone Numbers
        </div>
        <div className="text-[11px] text-ink/55">
          {lead.contacts.length} contacts ·{" "}
          {lead.contacts.reduce((acc, c) => acc + c.numbers.length, 0)} numbers ·{" "}
          {lead.contacts.reduce(
            (acc, c) =>
              acc +
              c.numbers.filter((n) => n.state === "wrong" || n.state === "disconnected").length,
            0
          )}{" "}
          dead
        </div>
      </div>
      <table className="mt-3 w-full text-[12px]">
        <thead className="text-[10px] uppercase tracking-[0.5px] text-ink/55">
          <tr className="border-b border-black/[0.08]">
            <th className="py-2 text-left font-semibold">Contact</th>
            <th className="py-2 text-left font-semibold">Role</th>
            <th className="py-2 text-left font-semibold">Number</th>
            <th className="py-2 text-left font-semibold">Last Attempt</th>
            <th className="py-2 text-right font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {lead.contacts.flatMap((c, ci) =>
            c.numbers.map((n, ni) => {
              const isCur = ci === 0 && ni === 0;
              const isDead = n.state === "wrong" || n.state === "disconnected";
              return (
                <tr
                  key={n.id}
                  className={
                    isCur
                      ? "border-b border-petrol-500/30 bg-petrol-100/35"
                      : "border-b border-black/[0.05]"
                  }
                >
                  <td className="py-2.5">
                    {ni === 0 ? (
                      <div className="flex items-center gap-2">
                        <div
                          className={
                            isCur
                              ? "flex h-7 w-7 items-center justify-center rounded-full bg-petrol-700 text-[10px] font-semibold text-white"
                              : "flex h-7 w-7 items-center justify-center rounded-full bg-ink/[0.08] text-[10px] font-semibold text-ink"
                          }
                        >
                          {c.initials}
                        </div>
                        <span className="text-[12.5px] font-semibold text-ink">
                          {c.name}
                        </span>
                      </div>
                    ) : (
                      <span className="pl-9 text-ink/55">↳</span>
                    )}
                  </td>
                  <td className="py-2.5">
                    {ni === 0 ? (
                      <span className="text-[10.5px] uppercase tracking-[0.4px] text-ink/55">
                        {c.role}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2.5">
                    <span
                      className={
                        isDead
                          ? "rounded-sm bg-danger-bg px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.4px] text-danger"
                          : "rounded-sm bg-ink/[0.06] px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.4px] text-ink/65"
                      }
                    >
                      {n.label}
                    </span>
                    <span
                      className={
                        isDead
                          ? "ml-2 tabular-nums text-ink/45 line-through"
                          : isCur
                          ? "ml-2 tabular-nums font-semibold text-petrol-700"
                          : "ml-2 tabular-nums text-ink"
                      }
                    >
                      {n.formatted}
                    </span>
                  </td>
                  <td className="py-2.5 text-ink/65">
                    {n.lastAttempt ?? "Never"}
                  </td>
                  <td className="py-2.5 text-right">
                    {isCur ? (
                      <span className="rounded-full bg-petrol-500 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.4px] text-white">
                        On Call
                      </span>
                    ) : isDead ? (
                      <span className="text-[10.5px] uppercase tracking-[0.4px] text-danger">
                        {n.state === "wrong" ? "Wrong" : "Disconnected"}
                      </span>
                    ) : (
                      <button className="rounded-md border border-black/[0.08] bg-white px-2 py-0.5 text-[10.5px] font-semibold text-petrol-700 hover:border-petrol-500">
                        Dial
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </section>
  );
}

function Outcome({ className }: { className?: string }) {
  return (
    <section className={`overflow-y-auto bg-white p-7 ${className ?? ""}`}>
      <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
        How Did The Call Go?
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <Out label="Interested" k="1" primary />
        <Out label="Not Interested" k="2" />
        <Out label="Callback" k="3" />
        <Out label="Wrong Number" k="4" />
        <Out label="Do Not Contact" k="5" className="col-span-2" />
      </div>
      <div className="mt-3 text-[10px] uppercase tracking-[0.4px] text-ink/45">
        Voicemail · No Answer · Busy · Disconnected — all detected automatically.
      </div>

      <div className="mt-7 text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
        Quick Note
      </div>
      <textarea
        rows={4}
        placeholder="Capture what was said. Saves on outcome."
        className="mt-2 block w-full resize-none rounded-md border border-black/[0.08] bg-white px-3 py-2 text-[12px] text-ink outline-none focus:border-petrol-500"
      />
    </section>
  );
}

function Out({
  label,
  k,
  primary,
  className,
}: {
  label: string;
  k: string;
  primary?: boolean;
  className?: string;
}) {
  return (
    <button
      className={
        (primary
          ? "bg-petrol-500 text-white shadow-[0_4px_10px_-4px_rgba(13,75,58,0.55)] "
          : "border border-black/[0.08] bg-white text-ink hover:border-black/20 ") +
        "flex items-center justify-between rounded-md px-2.5 py-1.5 text-[11.5px] " +
        (className ?? "")
      }
    >
      <span>{label}</span>
      <kbd
        className={
          primary
            ? "rounded-sm border border-white/40 px-1 font-mono text-[9.5px] text-white/85"
            : "rounded-sm border border-ink/15 px-1 font-mono text-[9.5px] text-ink/55"
        }
      >
        {k}
      </kbd>
    </button>
  );
}
