import { notFound } from "next/navigation";
import Link from "next/link";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";

export default async function V30Page() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="flex h-screen flex-col bg-[#f4f6f8] text-ink">
      <TopBar />
      <StepIndicator />
      <main className="grid flex-1 grid-cols-12 gap-4 overflow-hidden px-6 py-5">
        <CallSummary className="col-span-8" />
        <WrapPanel className="col-span-4" />
        <DealPanel className="col-span-8" lead={lead} />
        <NextQueue className="col-span-4" />
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

function StepIndicator() {
  const steps = [
    { key: "dial", label: "Dialing", state: "done" },
    { key: "live", label: "Connected", state: "done" },
    { key: "wrap", label: "Wrap-Up", state: "active" },
    { key: "next", label: "Next Lead", state: "queued" },
  ];
  return (
    <div className="flex shrink-0 items-center gap-4 border-b border-black/[0.06] bg-white px-7 py-3">
      <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
        Lead 3 of 10 · Attempt 1 of 4 on this lead
      </div>
      <div className="flex flex-1 items-center gap-3">
        {steps.map((s, i) => (
          <div key={s.key} className="flex flex-1 items-center gap-3">
            <div className="flex flex-1 items-center gap-2">
              <span
                className={
                  s.state === "active"
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-petrol-500 text-[11px] font-semibold text-white shadow-[0_4px_10px_-2px_rgba(13,75,58,0.5)]"
                    : s.state === "done"
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-petrol-100 text-[11px] font-semibold text-petrol-700"
                    : "flex h-6 w-6 items-center justify-center rounded-full border border-black/[0.1] text-[11px] font-semibold text-ink/55"
                }
              >
                {s.state === "done" ? "✓" : i + 1}
              </span>
              <span
                className={
                  s.state === "active"
                    ? "text-[13px] font-semibold text-petrol-700"
                    : s.state === "done"
                    ? "text-[13px] text-ink/65"
                    : "text-[13px] text-ink/45"
                }
              >
                {s.label}
              </span>
              {s.state === "active" && (
                <span className="ml-2 rounded-full bg-petrol-100 px-2 py-0.5 text-[10.5px] font-semibold text-petrol-700 tabular-nums">
                  0:03 left
                </span>
              )}
            </div>
            {i < steps.length - 1 && (
              <span className="h-px flex-1 bg-black/[0.06]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CallSummary({ className }: { className?: string }) {
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-7 shadow-[0_8px_28px_-18px_rgba(15,23,41,0.12)] ${className ?? ""}`}
    >
      <div className="flex items-baseline justify-between">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.6px] text-petrol-700">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-petrol-500" />
          Call Just Ended
        </div>
        <div className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
          Connected · 7 min 12 sec · Last attempt {ACTIVE_LEAD.daysSinceContact} day ago
        </div>
      </div>

      <div className="mt-5 flex items-center gap-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-petrol-500 to-petrol-700 text-[26px] font-semibold text-white shadow-[0_18px_36px_-14px_rgba(13,75,58,0.55)]">
          CH
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] uppercase tracking-[0.6px] text-ink/55">
            Last Call · Heir
          </div>
          <h1 className="m-0 mt-1 text-[40px] font-semibold leading-[1.02] tracking-[-0.025em] text-ink">
            Cornelius J. Hayes Jr.
          </h1>
          <div className="mt-1.5 flex items-baseline gap-2 text-[14px] text-ink/75">
            <span className="rounded-sm bg-petrol-100 px-1.5 py-[1px] text-[10.5px] font-semibold uppercase tracking-[0.4px] text-petrol-700">
              Mobile
            </span>
            <span className="tabular-nums">(216) 555-0147</span>
            <span className="text-ink/30">·</span>
            <span>Son of estate, lives in Cuyahoga</span>
          </div>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-black/[0.06] bg-black/[0.06]">
        <Cell label="Surplus" value={fmtMoney(ACTIVE_LEAD.estimatedSurplus)} />
        <Cell label="Net To Firm" value={fmtMoney(ACTIVE_LEAD.estimatedNet)} accent />
        <Cell
          label="Property"
          value={`${ACTIVE_LEAD.city}, ${ACTIVE_LEAD.state}`}
          sub={ACTIVE_LEAD.propertyAddress}
        />
      </div>

      <div className="mt-auto pt-6">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Quick Note (saves on outcome)
        </div>
        <textarea
          rows={2}
          placeholder="Capture what was said before the next call dials."
          className="mt-2 block w-full resize-none rounded-2xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-[12.5px] text-ink outline-none focus:border-petrol-500"
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
    <div className="bg-white px-4 py-3">
      <div className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">{label}</div>
      <div
        className={
          (accent ? "text-petrol-500 " : "text-ink ") +
          "mt-1 text-[20px] font-semibold tabular-nums tracking-[-0.02em] leading-none"
        }
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-[10.5px] text-ink/55">{sub}</div>}
    </div>
  );
}

function WrapPanel({ className }: { className?: string }) {
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-3xl border-2 border-petrol-500 bg-white p-6 shadow-[0_18px_44px_-22px_rgba(13,75,58,0.4)] ${className ?? ""}`}
    >
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-700">
          What&apos;s Next
        </div>
        <span className="text-[10.5px] text-ink/55">Step 3 of 4</span>
      </div>

      <div className="mt-3 rounded-2xl bg-petrol-100/60 px-4 py-3">
        <div className="text-[11px] uppercase tracking-[0.6px] text-petrol-700">
          Auto-Dial Next Call In
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="text-[36px] font-semibold tabular-nums tracking-[-0.025em] leading-none text-ink">
            0:03
          </span>
          <button className="ml-auto rounded-full bg-petrol-500 px-4 py-2 text-[12px] font-semibold text-white shadow-[0_8px_18px_-8px_rgba(13,75,58,0.5)]">
            Skip Wait →
          </button>
        </div>
        <div className="mt-2 text-[11px] text-petrol-700/85">
          Then dialing <span className="font-semibold">Otis Crockett (Mobile)</span>
        </div>
      </div>

      <div className="mt-5 text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
        How Did The Call Go?
      </div>
      <div className="mt-2 grid grid-cols-1 gap-1.5">
        <PickBtn label="Interested" primary />
        <PickBtn label="Callback Requested" />
        <PickBtn label="Not Interested" />
        <PickBtn label="Wrong Number" />
        <PickBtn label="Do Not Contact" danger />
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.4px] text-ink/45">
        Voicemail / No Answer / Busy auto-detected
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
        <button className="rounded-xl border border-black/[0.08] bg-white py-2.5 text-[12px] font-medium text-ink hover:border-black/20">
          Skip Lead
        </button>
        <button className="rounded-xl border border-black/[0.08] bg-white py-2.5 text-[12px] font-medium text-ink hover:border-black/20">
          Snooze Lead
        </button>
      </div>
    </section>
  );
}

function PickBtn({
  label,
  primary,
  danger,
}: {
  label: string;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      className={
        primary
          ? "rounded-xl bg-petrol-500 px-3.5 py-2.5 text-left text-[12.5px] font-semibold text-white shadow-[0_8px_18px_-8px_rgba(13,75,58,0.5)]"
          : danger
          ? "rounded-xl border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-left text-[12.5px] font-medium text-danger hover:border-danger"
          : "rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-left text-[12.5px] font-medium text-ink hover:border-black/20"
      }
    >
      {label}
    </button>
  );
}

function DealPanel({
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
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Contacts and Phone Numbers
        </div>
        <span className="text-[10.5px] text-ink/55">
          {lead.contacts.length} contacts ·{" "}
          {lead.contacts.reduce((acc, c) => acc + c.numbers.length, 0)} phones
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {lead.contacts.map((c, ci) => (
          <ContactCard key={c.id} contact={c} expanded={ci === 0} />
        ))}
      </div>
    </section>
  );
}

function ContactCard({
  contact,
  expanded,
}: {
  contact: typeof ACTIVE_LEAD["contacts"][number];
  expanded: boolean;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.05] bg-white">
      <button className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[10px] text-ink/55">{expanded ? "▾" : "▸"}</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/[0.06] text-[11px] font-semibold text-ink">
            {contact.initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-ink">{contact.name}</div>
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

function NextQueue({ className }: { className?: string }) {
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
                  ? "flex items-baseline gap-2.5 rounded-lg bg-petrol-100/60 px-2.5 py-2"
                  : isDone
                  ? "flex items-baseline gap-2.5 rounded-lg px-2.5 py-2 opacity-50"
                  : "flex items-baseline gap-2.5 rounded-lg px-2.5 py-2 hover:bg-black/[0.025]"
              }
            >
              <span
                className={
                  isActive
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-petrol-500 text-[10px] font-semibold text-white"
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
                  {q.contactCount} contact{q.contactCount !== 1 ? "s" : ""}
                </div>
              </div>
              <span className="tabular-nums text-[11.5px] font-semibold text-ink">
                {fmtMoney(q.surplus)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
