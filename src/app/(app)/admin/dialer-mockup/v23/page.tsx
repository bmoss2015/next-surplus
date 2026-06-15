import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";

export default async function V23Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="flex h-screen flex-col bg-white text-ink">
      <TopBar />
      <main className="grid flex-1 grid-cols-[minmax(0,1fr)_360px] overflow-hidden">
        <Center lead={lead} />
        <SideRail lead={lead} />
      </main>
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-black/[0.06] px-8 py-3.5 text-[12px]">
      <div className="flex items-center gap-4">
        <Link href="/admin/dialer-mockup" className="text-ink/55 hover:text-ink">
          ← Back
        </Link>
        <span className="text-ink/20">|</span>
        <span className="font-semibold text-ink">Power Dial Session</span>
        <span className="text-ink/20">|</span>
        <span className="text-ink/65">Lead 3 of 10</span>
      </div>
      <div className="flex items-center gap-7 text-[11.5px]">
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
        <button className="rounded-md bg-ink px-3 py-1 text-[11px] font-medium text-white hover:brightness-110">
          End Session
        </button>
      </div>
    </header>
  );
}

function Center({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <main className="overflow-y-auto px-12 py-10">
      <div className="mx-auto max-w-[800px]">
        <div className="flex items-baseline gap-3">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#5db98a]" />
          <span className="text-[11px] uppercase tracking-[0.7px] text-petrol-700">
            Live · Connected · 02:14
          </span>
          <span className="ml-auto text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
            {lead.leadId} · {lead.stageLabel}
          </span>
        </div>

        <div className="mt-5 text-[12px] uppercase tracking-[0.6px] text-ink/55">
          Calling Heir
        </div>
        <h1 className="m-0 mt-1 text-[64px] font-semibold leading-[0.96] tracking-[-0.03em] text-ink">
          Cornelius J. Hayes Jr.
        </h1>
        <div className="mt-3 flex items-baseline gap-3 text-[15px] text-ink/75">
          <span className="rounded-sm bg-petrol-100 px-1.5 py-[1px] text-[10.5px] font-semibold uppercase tracking-[0.4px] text-petrol-700">
            Mobile
          </span>
          <span className="tabular-nums">(216) 555-0147</span>
          <span className="text-ink/30">·</span>
          <span>Son of the estate · Lives in Cuyahoga</span>
        </div>

        <section className="mt-10 grid grid-cols-3 border-y border-black/[0.08] py-5">
          <Stat label="Talk Time" value="02:14" big />
          <Stat label="Estimated Surplus" value={fmtMoney(lead.estimatedSurplus)} />
          <Stat
            label="Estimated Net To Firm"
            value={fmtMoney(lead.estimatedNet)}
            accent
            hint={`${lead.recoveryFeePercent}% recovery fee`}
          />
        </section>

        <section className="mt-9">
          <div className="flex items-baseline justify-between">
            <h2 className="m-0 text-[15px] font-semibold tracking-tight text-ink">
              Contacts and phone numbers
            </h2>
            <span className="text-[11px] text-ink/55">
              {lead.contacts.length} contacts ·{" "}
              {lead.contacts.reduce((acc, c) => acc + c.numbers.length, 0)} numbers
            </span>
          </div>
          <div className="mt-3">
            {lead.contacts.map((c, ci) => (
              <ContactRow key={c.id} contact={c} isActive={ci === 0} />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="m-0 text-[15px] font-semibold tracking-tight text-ink">
            What was said
          </h2>
          <div className="mt-3 space-y-4">
            {lead.notes.slice(0, 4).map((n) => (
              <div
                key={n.id}
                className="grid grid-cols-[180px_minmax(0,1fr)] items-baseline gap-4 border-b border-black/[0.05] pb-3"
              >
                <div>
                  <div className="text-[12px] font-semibold text-ink">{n.author}</div>
                  <div className="text-[10.5px] text-ink/55">{n.createdAt}</div>
                </div>
                <p className="m-0 text-[13px] leading-relaxed text-ink/85">{n.body}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="h-16" />
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  big,
  accent,
  hint,
}: {
  label: string;
  value: string;
  big?: boolean;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <div className="border-r border-black/[0.06] px-5 last:border-r-0 first:pl-0">
      <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">{label}</div>
      <div
        className={
          (big ? "text-[40px] " : "text-[26px] ") +
          (accent ? "text-petrol-500 " : "text-ink ") +
          "mt-1 font-semibold tabular-nums tracking-[-0.025em] leading-none"
        }
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-[10.5px] text-ink/55">{hint}</div>}
    </div>
  );
}

function ContactRow({
  contact,
  isActive,
}: {
  contact: typeof ACTIVE_LEAD["contacts"][number];
  isActive: boolean;
}) {
  return (
    <div className="border-b border-black/[0.06] py-3 last:border-b-0">
      <div className="grid grid-cols-[36px_minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center gap-4">
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
          <div className="text-[14px] font-semibold text-ink">{contact.name}</div>
          <div className="text-[10.5px] uppercase tracking-[0.4px] text-ink/55">
            {contact.role}
          </div>
        </div>
        <div className="space-y-0.5">
          {contact.numbers.map((n, ni) => {
            const isCur = isActive && ni === 0;
            const isDead = n.state === "wrong" || n.state === "disconnected";
            return (
              <div
                key={n.id}
                className="flex items-center gap-2 text-[12px]"
              >
                <span className="w-[44px] text-[10px] uppercase tracking-[0.5px] text-ink/55">
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
                  <span className="rounded-sm bg-petrol-100 px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.4px] text-petrol-700">
                    Dialing
                  </span>
                )}
                {isDead && (
                  <span className="rounded-sm bg-danger-bg px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.4px] text-danger">
                    {n.state === "wrong" ? "Wrong" : "Disconnected"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div>
          {isActive ? (
            <span className="rounded-full bg-petrol-500 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.4px] text-white">
              On Call
            </span>
          ) : (
            <button className="text-[11.5px] font-semibold text-petrol-700 hover:underline">
              Dial Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SideRail({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <aside className="flex flex-col gap-0 overflow-hidden border-l border-black/[0.06] bg-[#fafbfc]">
      <div className="border-b border-black/[0.06] px-7 py-6">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Call Controls
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn label="Mute" k="M" />
          <Btn label="Hold" k="H" />
          <Btn label="Voicemail" k="V" />
          <Btn label="Note" k="N" />
          <button className="ml-auto rounded-full bg-danger px-4 py-2 text-[12.5px] font-medium text-white">
            End Call
            <kbd className="ml-1.5 rounded-sm border border-white/40 px-1 font-mono text-[9.5px] text-white/85">
              E
            </kbd>
          </button>
        </div>

        <div className="mt-5 text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
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
          Voicemail · No Answer · Busy are detected automatically.
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-6">
        <div className="flex items-baseline justify-between">
          <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
            Up Next
          </div>
          <div className="text-[10.5px] text-ink/55">7 left · ~21 min</div>
        </div>
        <ol className="m-0 mt-3 list-none space-y-1.5 pl-0">
          {QUEUE.slice(3, 9).map((q) => (
            <li
              key={q.id}
              className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-black/[0.05] pb-1.5 last:border-b-0"
            >
              <span className="text-[11px] tabular-nums text-ink/55">{q.position}</span>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-medium text-ink">
                  {q.ownerName}
                </div>
                <div className="text-[10px] uppercase tracking-[0.4px] text-ink/55">
                  {q.city}, {q.state}
                </div>
              </div>
              <span className="tabular-nums text-[11.5px] font-semibold text-ink">
                {fmtMoney(q.surplus)}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-7 text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Property Quick Facts
        </div>
        <dl className="m-0 mt-2 grid grid-cols-[80px_minmax(0,1fr)] gap-y-1 text-[11.5px]">
          <dt className="text-ink/55">Property</dt>
          <dd className="m-0 text-ink">{lead.propertyAddress}</dd>
          <dt className="text-ink/55">County</dt>
          <dd className="m-0 text-ink">{lead.county}</dd>
          <dt className="text-ink/55">Sale</dt>
          <dd className="m-0 text-ink">
            {lead.saleProcess} · {lead.saleDate}
          </dd>
          <dt className="text-ink/55">Owner</dt>
          <dd className="m-0 text-ink">{lead.ownerStatus}</dd>
        </dl>
      </div>
    </aside>
  );
}

function Btn({ label, k }: { label: string; k: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-md border border-black/[0.08] bg-white px-3 py-1.5 text-[12px] text-ink hover:border-black/20">
      {label}
      <kbd className="rounded-sm border border-ink/15 px-1 font-mono text-[9.5px] text-ink/55">{k}</kbd>
    </button>
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
          ? "rounded-md bg-petrol-500 text-white shadow-[0_4px_10px_-4px_rgba(13,75,58,0.5)] "
          : "rounded-md border border-black/[0.08] bg-white text-ink hover:border-black/20 ") +
        "flex items-center justify-between px-2.5 py-1.5 text-[11.5px] " +
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
