import { notFound } from "next/navigation";
import Link from "next/link";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";

export default async function V24Page() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="flex h-screen flex-col bg-[#f3f6f8] text-ink">
      <TopBar />
      <main className="grid flex-1 grid-cols-12 gap-4 overflow-hidden px-6 py-5">
        <Caller className="col-span-8" />
        <Surplus className="col-span-4" lead={lead} />
        <Contacts className="col-span-8" lead={lead} />
        <RightSide className="col-span-4" lead={lead} />
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-black/[0.05] bg-white px-7 py-3 text-[12px]">
      <div className="flex items-center gap-3">
        <Link href="/share/dialer-mockup" className="text-ink/55 hover:text-ink">
          ← Back
        </Link>
        <span className="text-ink/20">|</span>
        <span className="font-semibold text-ink">Power Dial Session</span>
        <span className="rounded-full bg-[#e0eaf5] px-2 py-0.5 text-[10.5px] font-semibold text-[#2c4d7a]">
          Lead 3 / 10
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Pill bg="#e6f1ec" fg="#1a5d3f" label="Dials" value="42" />
        <Pill bg="#e0eaf5" fg="#2c4d7a" label="Connects" value="6" />
        <Pill bg="#ede5f8" fg="#4a3589" label="Rate" value="14%" />
        <Pill bg="#fde8e8" fg="#9b2c2c" label="Avg Talk" value="3:48" />
        <button className="ml-2 rounded-full bg-ink px-3 py-1 text-[11px] font-medium text-white">
          End Session
        </button>
      </div>
    </header>
  );
}

function Pill({
  bg,
  fg,
  label,
  value,
}: {
  bg: string;
  fg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline gap-1.5 rounded-full px-2.5 py-1" style={{ background: bg }}>
      <span className="text-[10px] uppercase tracking-[0.5px]" style={{ color: fg, opacity: 0.75 }}>
        {label}
      </span>
      <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: fg }}>
        {value}
      </span>
    </div>
  );
}

const CARD = "rounded-[24px] border border-black/[0.05]";

function Caller({ className }: { className?: string }) {
  return (
    <section
      className={`relative flex flex-col overflow-hidden p-7 text-white ${CARD} ${className ?? ""}`}
      style={{
        background: "linear-gradient(135deg, #0d4b3a 0%, #14644e 50%, #1a8a9c 100%)",
      }}
    >
      <div className="flex items-baseline justify-between">
        <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.6px] text-petrol-300">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#5db98a]" />
          Live · Connected
        </span>
        <span className="rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.5px] text-white">
          In Conversation
        </span>
      </div>

      <div className="mt-5 flex items-center gap-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-[28px] font-semibold text-petrol-700 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)]">
          CH
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] uppercase tracking-[0.6px] text-petrol-300">
            Calling Heir
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
            <span>Son of estate</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-300">
            Talk Time
          </div>
          <div className="mt-1 text-[54px] font-semibold tabular-nums tracking-[-0.025em] leading-none text-white">
            02:14
          </div>
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between border-t border-white/15 pt-5">
        <div className="flex items-center gap-2">
          <DarkBtn label="Mute" k="M" />
          <DarkBtn label="Hold" k="H" />
          <DarkBtn label="Voicemail" k="V" />
          <DarkBtn label="Note" k="N" />
        </div>
        <button className="rounded-full bg-danger px-5 py-2.5 text-[13px] font-medium text-white shadow-[0_8px_24px_-8px_rgba(185,28,28,0.6)]">
          End Call
          <kbd className="ml-2 rounded-sm border border-white/40 px-1 font-mono text-[9.5px] text-white/85">
            E
          </kbd>
        </button>
      </div>
    </section>
  );
}

function DarkBtn({ label, k }: { label: string; k: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[12px] text-white hover:bg-white/20">
      {label}
      <kbd className="rounded-sm border border-white/30 px-1 font-mono text-[9.5px] text-white/85">{k}</kbd>
    </button>
  );
}

function Surplus({
  className,
  lead,
}: {
  className?: string;
  lead: typeof ACTIVE_LEAD;
}) {
  return (
    <section
      className={`flex flex-col gap-4 bg-white p-6 ${CARD} ${className ?? ""}`}
    >
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Estimated Surplus
        </div>
        <div className="mt-1 text-[34px] font-semibold tabular-nums tracking-[-0.025em] leading-none text-ink">
          {fmtMoney(lead.estimatedSurplus)}
        </div>
        <div className="mt-1 text-[11.5px] text-ink/65">
          {lead.propertyAddress}, {lead.city}, {lead.state}
        </div>
      </div>

      <div
        className="rounded-2xl px-5 py-4"
        style={{ background: "#e6f1ec" }}
      >
        <div className="text-[10.5px] uppercase tracking-[0.5px] text-[#1a5d3f]">
          Estimated Net To Firm
        </div>
        <div className="mt-0.5 text-[28px] font-semibold tabular-nums tracking-[-0.02em] leading-none text-[#0d4b3a]">
          {fmtMoney(lead.estimatedNet)}
        </div>
        <div className="mt-0.5 text-[10.5px] text-[#1a5d3f]/85">
          {lead.recoveryFeePercent}% recovery fee
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 text-[12px]">
        <Mini label="Sale" value={lead.saleProcess} />
        <Mini label="Date" value={lead.saleDate} />
        <Mini label="County" value={lead.county} />
        <Mini label="Owner" value={lead.ownerStatus} />
      </div>
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f3f6f8] px-2.5 py-1.5">
      <div className="text-[9.5px] uppercase tracking-[0.5px] text-ink/55">{label}</div>
      <div className="mt-0.5 text-[12.5px] text-ink">{value}</div>
    </div>
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
      className={`overflow-y-auto bg-white p-6 ${CARD} ${className ?? ""}`}
    >
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Contacts and Phone Numbers
        </div>
        <div className="text-[11px] text-ink/55">
          {lead.contacts.length} contacts ·{" "}
          {lead.contacts.reduce((acc, c) => acc + c.numbers.length, 0)} numbers
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
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
  const bg = isActive
    ? "#e6f1ec"
    : contact.role === "Heir"
    ? "#e0eaf5"
    : contact.role === "Co Owner"
    ? "#ede5f8"
    : "#f3f6f8";
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{ background: bg, border: isActive ? "1px solid #0d4b3a" : "1px solid transparent" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={
              isActive
                ? "flex h-8 w-8 items-center justify-center rounded-full bg-petrol-700 text-[10px] font-semibold text-white"
                : "flex h-8 w-8 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-ink ring-1 ring-black/[0.08]"
            }
          >
            {contact.initials}
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-ink">{contact.name}</div>
            <div className="text-[10px] uppercase tracking-[0.4px] text-ink/55">
              {contact.role}
            </div>
          </div>
        </div>
        {isActive && (
          <span className="rounded-full bg-petrol-700 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.4px] text-white">
            On Call
          </span>
        )}
      </div>
      <div className="mt-2 space-y-0.5">
        {contact.numbers.map((n, ni) => {
          const isCur = isActive && ni === 0;
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
              {isCur && (
                <span className="ml-auto text-[9px] font-semibold uppercase tracking-[0.4px] text-petrol-700">
                  Dialing
                </span>
              )}
              {isDead && (
                <span className="ml-auto text-[9px] font-semibold uppercase tracking-[0.4px] text-danger">
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

function RightSide({
  className,
  lead,
}: {
  className?: string;
  lead: typeof ACTIVE_LEAD;
}) {
  return (
    <div className={`flex flex-col gap-4 overflow-hidden ${className ?? ""}`}>
      <section
        className={`bg-white p-5 ${CARD}`}
      >
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          How Did The Call Go?
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <OutBtn label="Interested" k="1" primary />
          <OutBtn label="Not Interested" k="2" />
          <OutBtn label="Callback" k="3" />
          <OutBtn label="Wrong Number" k="4" />
          <OutBtn label="Do Not Contact" k="5" className="col-span-2" />
        </div>
        <div className="mt-2 text-[10px] uppercase tracking-[0.4px] text-ink/45">
          Voicemail / No Answer / Busy detected automatically
        </div>
      </section>

      <section className={`flex-1 overflow-y-auto bg-white p-5 ${CARD}`}>
        <div className="flex items-baseline justify-between">
          <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
            Up Next
          </div>
          <span className="text-[10.5px] text-ink/55">7 left · ~21 min</span>
        </div>
        <ol className="m-0 mt-3 list-none space-y-1.5 pl-0">
          {QUEUE.slice(3, 7).map((q) => (
            <li
              key={q.id}
              className="flex items-baseline justify-between rounded-lg bg-[#f3f6f8] px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <div className="truncate text-[12px] font-medium text-ink">
                  {q.ownerName}
                </div>
                <div className="text-[10px] text-ink/55">
                  {q.city}, {q.state}
                </div>
              </div>
              <span className="tabular-nums text-[11.5px] font-semibold text-ink">
                {fmtMoney(q.surplus)}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-4 text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Recent Note
        </div>
        <p className="m-0 mt-1 text-[11.5px] leading-snug text-ink/85">
          {lead.notes[0].body}
        </p>
        <div className="mt-1 text-[10px] text-ink/55">
          <span className="font-semibold text-ink">{lead.notes[0].author}</span> ·{" "}
          {lead.notes[0].createdAt}
        </div>
      </section>
    </div>
  );
}

function OutBtn({
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
          ? "bg-petrol-700 text-white shadow-[0_4px_10px_-4px_rgba(13,75,58,0.5)] "
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
