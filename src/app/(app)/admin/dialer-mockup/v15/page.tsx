import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";
import { aiBriefFor } from "../_brief";

export default async function V15Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const lead = ACTIVE_LEAD;
  const brief = aiBriefFor(lead);

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <Header />
      <div className="grid flex-1 grid-cols-12 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden px-5 py-4">
        <StatsStrip />

        <CallCard className="col-span-5 row-span-1" lead={lead} />
        <BriefCard className="col-span-4 row-span-1" brief={brief} />
        <ContactsCard className="col-span-3 row-span-1" lead={lead} />

        <DispoStrip className="col-span-9" />
        <QueueStrip className="col-span-3" />
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-surface px-7 py-3 text-[12px]">
      <div className="flex items-center gap-4">
        <Link href="/admin/dialer-mockup" className="text-gray-500 hover:text-ink">
          ← Back to mockups
        </Link>
        <span className="text-gray-300">|</span>
        <span className="font-medium text-ink">Power Dial Session</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-md border border-gray-200 bg-surface px-3 py-1.5 text-[12px] text-ink hover:border-gray-300">
          Pause
        </button>
        <button className="rounded-md bg-danger px-3 py-1.5 text-[12px] font-medium text-white">
          End Session
        </button>
      </div>
    </header>
  );
}

function StatsStrip() {
  const stats = [
    { label: "Dials Today", value: "42", hint: "Calls placed since session start" },
    { label: "Connects", value: "6", hint: "Calls that reached a person" },
    { label: "Connect Rate", value: "14%", hint: "Connects ÷ Dials" },
    { label: "Avg Talk Time", value: "3:48", hint: "Average length of connected calls" },
    { label: "Pipeline Reached", value: fmtMoney(1284000), hint: "Sum of surplus across connected leads" },
    { label: "Time In Session", value: "1:42", hint: "Hours:Minutes since session start" },
  ];
  return (
    <div className="col-span-12 grid grid-cols-6 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-md border border-gray-200 bg-surface px-3 py-2.5 shadow-card"
          title={s.hint}
        >
          <div className="text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
            {s.label}
          </div>
          <div className="mt-1 font-mono text-[20px] font-medium tabular-nums text-ink">
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function CallCard({ className, lead }: { className?: string; lead: typeof ACTIVE_LEAD }) {
  return (
    <section className={`flex flex-col rounded-lg border border-gray-200 bg-surface px-6 py-5 shadow-card ${className ?? ""}`}>
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-700">
          On Call · Connected
        </div>
        <div className="text-[11px] text-gray-500">
          Lead {lead.leadId} · {lead.stageLabel}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-petrol-700 text-[16px] font-semibold text-white ring-4 ring-petrol-300/40">
          CH
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
              Cornelius J. Hayes Jr.
            </h1>
            <span className="rounded-sm border border-petrol-500 px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-[0.4px] text-petrol-700">
              Heir
            </span>
          </div>
          <div className="font-mono text-[14px] text-gray-700">(216) 555-0147 · Mobile</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[32px] font-medium tabular-nums leading-none text-ink">
            02:14
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.4px] text-gray-500">
            Talk Time
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-1.5 pt-4">
        <CtrlBtn label="Mute" k="M" />
        <CtrlBtn label="Hold" k="H" />
        <CtrlBtn label="VM Drop" k="V" />
        <CtrlBtn label="Note" k="N" />
        <button className="ml-auto rounded-md bg-danger px-4 py-2 text-[12px] font-medium text-white">
          End Call
          <kbd className="ml-1.5 rounded-sm border border-white/40 px-1 font-mono text-[9.5px] text-white/85">E</kbd>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-200 pt-3 text-[11.5px]">
        <Fact label="Property" value={`${lead.propertyAddress}, ${lead.city}, ${lead.state}`} />
        <Fact label="Surplus" value={fmtMoney(lead.estimatedSurplus)} mono />
        <Fact label="Est. Net" value={fmtMoney(lead.estimatedNet)} mono accent />
      </div>
    </section>
  );
}

function Fact({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.4px] text-gray-500">{label}</div>
      <div
        className={
          (mono ? "font-mono " : "") +
          (accent ? "text-petrol-500 " : "text-ink ") +
          "mt-0.5 text-[12.5px] font-medium tabular-nums"
        }
      >
        {value}
      </div>
    </div>
  );
}

function CtrlBtn({ label, k }: { label: string; k: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-surface px-2.5 py-1.5 text-[11.5px] text-ink hover:border-gray-300">
      {label}
      <kbd className="rounded-sm border border-gray-300 px-1 font-mono text-[9.5px] text-gray-500">{k}</kbd>
    </button>
  );
}

function BriefCard({
  className,
  brief,
}: {
  className?: string;
  brief: ReturnType<typeof aiBriefFor>;
}) {
  return (
    <section
      className={`flex flex-col rounded-lg border border-petrol-500 bg-surface px-5 py-4 shadow-card ${className ?? ""}`}
    >
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-700">
          What You Already Know
        </div>
        <span className="text-[10px] text-gray-500">AI Brief</span>
      </div>
      <h3 className="m-0 mt-1.5 text-[14px] font-semibold leading-tight text-ink">
        {brief.headline}
      </h3>
      <p className="m-0 mt-1.5 text-[12px] leading-relaxed text-gray-700">
        {brief.tldr}
      </p>
      <ul className="m-0 mt-2.5 list-none space-y-1 pl-0">
        {brief.bullets.slice(0, 3).map((b, i) => (
          <li key={i} className="flex gap-2 text-[11.5px] leading-snug text-ink">
            <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-petrol-500" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto border-t border-gray-200 pt-2 text-[10.5px] uppercase tracking-[0.4px] text-danger">
        Watch Out: {brief.watchOuts[0]}
      </div>
    </section>
  );
}

function ContactsCard({
  className,
  lead,
}: {
  className?: string;
  lead: typeof ACTIVE_LEAD;
}) {
  return (
    <section
      className={`rounded-lg border border-gray-200 bg-surface px-4 py-4 shadow-card ${className ?? ""}`}
    >
      <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
        Contacts On This Lead
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {lead.contacts.map((c, i) => {
          const isActive = i === 0;
          return (
            <div
              key={c.id}
              className={
                isActive
                  ? "flex items-center gap-2 rounded-md border border-petrol-500 bg-surface px-2 py-1.5"
                  : "flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5"
              }
            >
              <div
                className={
                  isActive
                    ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-petrol-700 text-[9.5px] font-semibold text-white"
                    : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[9.5px] font-semibold text-gray-700"
                }
              >
                {c.initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[11.5px] font-medium text-ink">
                  {c.name.split(" ").slice(0, 2).join(" ")}
                </div>
                <div className="text-[10px] uppercase tracking-[0.3px] text-gray-500">
                  {c.role}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DispoStrip({ className }: { className?: string }) {
  const items = [
    { label: "Interested", k: "1", tone: "good" as const },
    { label: "Not Interested", k: "2", tone: "neutral" as const },
    { label: "Callback Requested", k: "3", tone: "info" as const },
    { label: "Left Voicemail", k: "4", tone: "muted" as const },
    { label: "Wrong Number", k: "5", tone: "bad" as const },
    { label: "Do Not Contact", k: "6", tone: "stop" as const },
  ];
  return (
    <section
      className={`rounded-lg border border-gray-200 bg-surface px-4 py-3 shadow-card ${className ?? ""}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
          Disposition
        </span>
        <div className="flex flex-1 items-center gap-1.5">
          {items.map((d) => (
            <button
              key={d.label}
              className={
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-surface px-2 py-2 text-[11.5px] text-ink transition-colors " +
                (d.tone === "good"
                  ? "hover:border-petrol-500 hover:text-petrol-500"
                  : d.tone === "info"
                  ? "hover:border-info-violet hover:text-info-violet-deep"
                  : d.tone === "bad"
                  ? "hover:border-danger hover:text-danger"
                  : d.tone === "stop"
                  ? "hover:border-ink"
                  : "hover:border-gray-300")
              }
            >
              <span className="font-medium">{d.label}</span>
              <kbd className="rounded-sm border border-gray-300 px-1 font-mono text-[9.5px] text-gray-500">
                {d.k}
              </kbd>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function QueueStrip({ className }: { className?: string }) {
  return (
    <section
      className={`rounded-lg border border-gray-200 bg-surface px-3 py-2 shadow-card ${className ?? ""}`}
    >
      <div className="flex items-center justify-between text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
        <span>Up Next</span>
        <span>{QUEUE.filter((q) => q.status !== "done").length} Left</span>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 overflow-x-auto">
        {QUEUE.slice(3, 9).map((q) => (
          <div
            key={q.id}
            className="shrink-0 rounded-md border border-gray-200 bg-surface px-2 py-1.5"
            style={{ minWidth: 130 }}
          >
            <div className="flex items-center justify-between text-[10px] text-gray-500">
              <span>#{q.position}</span>
              <span>{q.estReady}</span>
            </div>
            <div className="truncate text-[11px] font-medium text-ink">
              {q.ownerName.split(" of ").slice(-1)[0]}
            </div>
            <div className="truncate text-[10px] text-gray-500">
              {q.state} · {fmtMoney(q.surplus)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
