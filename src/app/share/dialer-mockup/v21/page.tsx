import { notFound } from "next/navigation";
import Link from "next/link";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";

export default async function V21Page() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="flex h-screen flex-col bg-white text-ink">
      <TopBar />
      <main className="grid flex-1 grid-cols-12 grid-rows-[auto_minmax(0,1fr)] gap-5 overflow-hidden px-8 py-6">
        <HeroCaller className="col-span-8 row-span-1" />
        <SurplusCard className="col-span-4 row-span-1" lead={lead} />
        <ContactsCard className="col-span-7 row-span-1" lead={lead} />
        <SidePanel className="col-span-5 row-span-1" lead={lead} />
      </main>
    </div>
  );
}

const FLOAT_HARD = "shadow-[0_30px_60px_-30px_rgba(15,23,41,0.18),0_8px_20px_-8px_rgba(15,23,41,0.06)]";
const FLOAT_SOFT = "shadow-[0_18px_40px_-20px_rgba(15,23,41,0.12),0_4px_10px_-4px_rgba(15,23,41,0.04)]";

function TopBar() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-black/[0.06] bg-white px-8 py-3.5 text-[12px]">
      <div className="flex items-center gap-3">
        <Link href="/share/dialer-mockup" className="text-ink/55 hover:text-ink">
          ← Back to mockups
        </Link>
        <span className="text-ink/20">|</span>
        <span className="rounded-full bg-petrol-100 px-2.5 py-0.5 text-[11px] font-semibold text-petrol-700">
          Lead 3 of 10
        </span>
      </div>
      <div className="flex items-center gap-5 text-[11.5px] text-ink/65">
        <Stat label="Dials" value="42" />
        <Stat label="Connects" value="6" />
        <Stat label="Rate" value="14%" />
        <Stat label="Avg Talk" value="3:48" />
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-md border border-black/[0.08] bg-white px-3 py-1.5 text-[11.5px] text-ink hover:border-black/20">
          Pause Auto-Dial
        </button>
        <button className="rounded-md bg-danger px-3 py-1.5 text-[11.5px] font-medium text-white">
          End Session
        </button>
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.5px] text-ink/55">{label}</span>
      <span className="text-[13px] font-semibold tabular-nums text-ink">{value}</span>
    </div>
  );
}

function HeroCaller({ className }: { className?: string }) {
  return (
    <section className={`relative rounded-[28px] bg-white px-9 py-7 ${FLOAT_HARD} ${className ?? ""}`}>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.6px] text-petrol-700">
          On Call · Connected
        </span>
        <span className="rounded-full border border-ink/10 bg-white px-2.5 py-[2px] text-[10.5px] font-semibold uppercase tracking-[0.5px] text-ink/85">
          In Conversation
        </span>
      </div>

      <div className="mt-5 flex items-center gap-7">
        <div className="relative">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-petrol-500 to-petrol-700 text-[32px] font-semibold text-white shadow-[0_18px_40px_-12px_rgba(13,75,58,0.5)]">
            CH
          </div>
          <span className="absolute -bottom-1 -right-1 inline-block h-5 w-5 rounded-full border-[3px] border-white bg-[#5db98a]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] uppercase tracking-[0.6px] text-ink/55">
            Calling Heir
          </div>
          <h1 className="m-0 mt-1 text-[42px] font-semibold leading-[1.02] tracking-[-0.025em] text-ink">
            Cornelius J. Hayes Jr.
          </h1>
          <div className="mt-1.5 flex items-center gap-2 text-[14px] text-ink/75">
            <span className="rounded-full bg-petrol-100 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.4px] text-petrol-700">
              Mobile
            </span>
            <span className="tabular-nums">(216) 555-0147</span>
            <span className="text-ink/30">·</span>
            <span>Son of estate, lives in Cuyahoga</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">Talk Time</div>
          <div className="mt-1 text-[56px] font-semibold tabular-nums tracking-[-0.025em] leading-none text-ink">
            02:14
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-black/[0.06] pt-5">
        <div className="flex items-center gap-2">
          <CallBtn label="Mute" k="M" />
          <CallBtn label="Hold" k="H" />
          <CallBtn label="Voicemail Drop" k="V" />
          <CallBtn label="Add Note" k="N" />
        </div>
        <div className="flex items-center gap-2">
          <OutcomeBtn label="Interested" k="1" tone="primary" />
          <OutcomeBtn label="Not Interested" k="2" />
          <OutcomeBtn label="Callback" k="3" />
          <OutcomeBtn label="More" tone="ghost" />
          <button className="rounded-2xl bg-danger px-5 py-3 text-[13px] font-medium text-white">
            End Call
            <kbd className="ml-2 rounded-sm border border-white/40 px-1 font-mono text-[9.5px] text-white/85">E</kbd>
          </button>
        </div>
      </div>
    </section>
  );
}

function CallBtn({ label, k }: { label: string; k: string }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-2xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-[12.5px] text-ink hover:border-black/20">
      {label}
      <kbd className="rounded-sm border border-ink/15 px-1 font-mono text-[9.5px] text-ink/55">
        {k}
      </kbd>
    </button>
  );
}

function OutcomeBtn({
  label,
  k,
  tone,
}: {
  label: string;
  k?: string;
  tone?: "primary" | "ghost";
}) {
  if (tone === "primary") {
    return (
      <button className="inline-flex items-center gap-2 rounded-2xl bg-petrol-500 px-4 py-2.5 text-[12.5px] font-medium text-white shadow-[0_10px_24px_-10px_rgba(13,75,58,0.55)]">
        {label}
        {k && (
          <kbd className="rounded-sm border border-white/30 px-1 font-mono text-[9.5px] text-white/85">{k}</kbd>
        )}
      </button>
    );
  }
  if (tone === "ghost") {
    return (
      <button className="inline-flex items-center gap-1 rounded-2xl px-3.5 py-2.5 text-[12.5px] text-ink/65 hover:text-ink">
        {label}
      </button>
    );
  }
  return (
    <button className="inline-flex items-center gap-2 rounded-2xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-[12.5px] text-ink hover:border-black/20">
      {label}
      {k && (
        <kbd className="rounded-sm border border-ink/15 px-1 font-mono text-[9.5px] text-ink/55">{k}</kbd>
      )}
    </button>
  );
}

function SurplusCard({
  className,
  lead,
}: {
  className?: string;
  lead: typeof ACTIVE_LEAD;
}) {
  return (
    <section className={`rounded-[28px] bg-white px-7 py-6 ${FLOAT_SOFT} ${className ?? ""}`}>
      <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">Surplus</div>
      <div className="mt-1.5 text-[36px] font-semibold tabular-nums tracking-[-0.025em] leading-none text-ink">
        {fmtMoney(lead.estimatedSurplus)}
      </div>
      <div className="mt-1 text-[11.5px] text-ink/65">
        {lead.propertyAddress}, {lead.city}, {lead.state}
      </div>

      <div className="mt-5 rounded-2xl bg-petrol-100 px-4 py-3">
        <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-700">
          Estimated Net To Firm
        </div>
        <div className="mt-0.5 text-[28px] font-semibold tabular-nums tracking-[-0.02em] leading-none text-petrol-700">
          {fmtMoney(lead.estimatedNet)}
        </div>
        <div className="mt-0.5 text-[11px] text-petrol-700/75">
          {lead.recoveryFeePercent}% recovery fee
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-[12px]">
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
    <div>
      <div className="text-[10px] uppercase tracking-[0.4px] text-ink/55">{label}</div>
      <div className="mt-0.5 text-[12.5px] text-ink">{value}</div>
    </div>
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
    <section className={`overflow-y-auto rounded-[28px] bg-white px-7 py-6 ${FLOAT_SOFT} ${className ?? ""}`}>
      <div className="flex items-baseline justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Contacts and Phone Numbers
        </div>
        <div className="text-[11px] text-ink/55">
          {lead.contacts.length} contacts · {lead.contacts.reduce((acc, c) => acc + c.numbers.length, 0)} numbers
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {lead.contacts.map((c, ci) => (
          <ContactRow key={c.id} contact={c} isLeadContact={ci === 0} />
        ))}
      </div>
    </section>
  );
}

function ContactRow({
  contact,
  isLeadContact,
}: {
  contact: typeof ACTIVE_LEAD["contacts"][number];
  isLeadContact: boolean;
}) {
  return (
    <div
      className={
        isLeadContact
          ? "rounded-2xl border border-petrol-500/40 bg-petrol-100/40 px-4 py-3"
          : "rounded-2xl border border-black/[0.06] bg-white px-4 py-3"
      }
    >
      <div className="flex items-center gap-3">
        <div
          className={
            isLeadContact
              ? "flex h-10 w-10 items-center justify-center rounded-full bg-petrol-700 text-[12px] font-semibold text-white"
              : "flex h-10 w-10 items-center justify-center rounded-full bg-ink/[0.06] text-[12px] font-semibold text-ink"
          }
        >
          {contact.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-ink">{contact.name}</span>
            <span className="text-[10.5px] uppercase tracking-[0.4px] text-ink/55">
              {contact.role}
            </span>
          </div>
        </div>
        {isLeadContact ? (
          <span className="rounded-full bg-petrol-500 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.4px] text-white">
            On Call
          </span>
        ) : (
          <button className="rounded-full border border-ink/15 bg-white px-2.5 py-1 text-[10.5px] font-medium text-ink hover:border-petrol-500 hover:text-petrol-700">
            Dial Next
          </button>
        )}
      </div>
      <div className="mt-2.5 space-y-1 pl-13">
        {contact.numbers.map((n, ni) => {
          const isActive = isLeadContact && ni === 0;
          const isDead = n.state === "wrong" || n.state === "disconnected";
          return (
            <div
              key={n.id}
              className={
                isActive
                  ? "flex items-center justify-between rounded-lg bg-white px-3 py-1.5 ring-1 ring-petrol-500"
                  : "flex items-center justify-between rounded-lg px-3 py-1.5 hover:bg-black/[0.025]"
              }
            >
              <div className="flex items-center gap-3">
                {isActive && (
                  <span className="inline-block h-2 w-2 rounded-full bg-[#5db98a]" />
                )}
                <span
                  className={
                    isDead
                      ? "rounded-full bg-danger-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.4px] text-danger"
                      : "rounded-full bg-ink/[0.05] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.4px] text-ink/65"
                  }
                >
                  {n.label}
                </span>
                <span
                  className={
                    isDead
                      ? "tabular-nums text-[13px] text-ink/45 line-through"
                      : "tabular-nums text-[13px] text-ink"
                  }
                >
                  {n.formatted}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10.5px] text-ink/55">
                {n.lastAttempt && <span>Last tried {n.lastAttempt}</span>}
                {n.state === "disconnected" && <span className="text-danger">Disconnected</span>}
                {n.state === "wrong" && <span className="text-danger">Wrong Number</span>}
                {!isDead && !isActive && (
                  <button className="text-petrol-700 hover:underline">Dial</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SidePanel({
  className,
  lead,
}: {
  className?: string;
  lead: typeof ACTIVE_LEAD;
}) {
  return (
    <div className={`flex flex-col gap-5 overflow-hidden ${className ?? ""}`}>
      <section className={`rounded-[28px] bg-white px-7 py-5 ${FLOAT_SOFT}`}>
        <div className="flex items-baseline justify-between">
          <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
            Up Next In Queue
          </div>
          <span className="text-[11px] text-ink/55">
            7 left · ~21 min
          </span>
        </div>
        <div className="mt-3 space-y-1">
          {QUEUE.slice(3, 6).map((q) => (
            <div
              key={q.id}
              className="flex items-baseline justify-between rounded-lg border border-black/[0.05] bg-white px-3 py-1.5"
            >
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-medium text-ink">
                  {q.ownerName}
                </div>
                <div className="text-[10.5px] text-ink/55">
                  {q.city}, {q.state} · {q.estReady}
                </div>
              </div>
              <span className="tabular-nums text-[12px] font-semibold text-ink">
                {fmtMoney(q.surplus)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className={`flex-1 overflow-y-auto rounded-[28px] bg-white px-7 py-5 ${FLOAT_SOFT}`}>
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Recent Notes
        </div>
        <div className="mt-3 space-y-3">
          {lead.notes.slice(0, 3).map((n) => (
            <div key={n.id}>
              <div className="text-[10.5px] text-ink/55">
                <span className="font-semibold text-ink">{n.author}</span> · {n.createdAt}
              </div>
              <p className="m-0 mt-0.5 text-[12.5px] leading-snug text-ink/85">
                {n.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
