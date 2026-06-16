import { notFound } from "next/navigation";
import Link from "next/link";
import { ACTIVE_LEAD, fmtMoney } from "../_sample";

export default async function V8Page() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="flex h-screen flex-col bg-[#0a1722] text-white">
      <TopRibbon />

      <div className="relative flex-1 overflow-hidden">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-[0.5px] text-white/40">
          <div>Card 3</div>
          <div className="mt-1">of 10</div>
          <div className="mt-6 font-mono text-white">J ← →</div>
          <div className="mt-1 text-white/50">Cycle</div>
        </div>

        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-right text-[11px] uppercase tracking-[0.5px] text-white/40">
          <div>Decide</div>
          <div className="mt-1 font-mono text-white">C  D  S  X</div>
          <div className="mt-1 text-white/50">Call · Dispo · Snooze · Skip</div>
        </div>

        <CardStack lead={lead} />
      </div>

      <BottomBar />
    </div>
  );
}

function TopRibbon() {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#04140d] px-7 py-3 text-[12px]">
      <div className="flex items-center gap-4">
        <Link href="/share/dialer-mockup" className="text-white/55 hover:text-white">
          ← Back to mockups
        </Link>
        <span className="text-white/20">|</span>
        <span className="text-white/55">Focus Mode · Card Deck</span>
      </div>
      <div className="flex items-center gap-4 text-white/55">
        <span>12 Today · 5 Connects · 14% Rate</span>
        <span className="text-white/20">|</span>
        <button className="rounded-md border border-white/10 px-2 py-1 text-[11px] hover:bg-white/5">
          Exit Focus
        </button>
      </div>
    </div>
  );
}

function CardStack({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-24">
      <div className="absolute top-1/2 z-0 h-[78%] w-[58%] -translate-y-[calc(50%+18px)] rounded-2xl border border-white/10 bg-[#0c1f2a]" />
      <div className="absolute top-1/2 z-10 h-[78%] w-[58%] -translate-y-[calc(50%+10px)] rounded-2xl border border-white/15 bg-[#0e2532]" />

      <article className="relative z-20 flex h-[78%] w-[58%] max-w-[820px] flex-col rounded-2xl border border-petrol-300 bg-[#0f2a37] shadow-elevated">
        <header className="border-b border-white/10 px-9 py-6">
          <div className="flex items-baseline justify-between">
            <div className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-300">
              {lead.leadId} · {lead.stageLabel}
            </div>
            <div className="text-[10.5px] uppercase tracking-[0.6px] text-white/55">
              {lead.daysSinceContact} day since last contact
            </div>
          </div>
          <h1 className="m-0 mt-2 text-[44px] font-medium tracking-[-0.022em] leading-[1.02] text-white">
            {lead.ownerName}
          </h1>
          <div className="mt-2 text-[14px] text-white/75">
            {lead.propertyAddress}, {lead.city}, {lead.state} ·{" "}
            {lead.county}
          </div>
        </header>

        <div className="grid flex-1 grid-cols-[minmax(0,1fr)_280px] gap-0 overflow-hidden">
          <div className="overflow-y-auto px-9 py-7">
            <Section title="The Call You're About To Make">
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-petrol-700 text-[14px] font-semibold text-white ring-4 ring-petrol-300/40">
                  CH
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold text-white">
                    Cornelius J. Hayes Jr.
                  </div>
                  <div className="text-[12px] text-white/65">
                    Heir · Son of decedent · Lives in Cuyahoga
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[14px] text-white">
                    (216) 555-0147
                  </div>
                  <div className="text-[10.5px] uppercase tracking-[0.4px] text-white/55">
                    Mobile
                  </div>
                </div>
              </div>
            </Section>

            <Section title="What You Already Know">
              <ul className="m-0 mt-2 list-none space-y-2 pl-0 text-[13.5px] leading-relaxed text-white/85">
                <li>
                  Estate is in probate. Cuyahoga case{" "}
                  <span className="font-mono text-white">2026-PR-0488</span>,
                  filed March.
                </li>
                <li>
                  Last call (June 14): Cornelius Jr. wants to talk Tuesday AM
                  after speaking with his sister Yvette.
                </li>
                <li>
                  Sister Yvette asked for the 12:30 to 1:30 PM ET window. Both
                  reachable on mobile.
                </li>
              </ul>
            </Section>

            <Section title="Why It's Worth The Call">
              <p className="m-0 mt-2 text-[14px] leading-relaxed text-white/85">
                {lead.saleProcess.toLowerCase()} held{" "}
                <strong className="text-white">{lead.saleDate}</strong> in{" "}
                {lead.county}. Estimated surplus{" "}
                <strong className="text-white">
                  {fmtMoney(lead.estimatedSurplus)}
                </strong>{" "}
                against a {lead.recoveryFeePercent}% recovery fee. Estimated net
                to the firm{" "}
                <strong className="text-petrol-300">
                  {fmtMoney(lead.estimatedNet)}
                </strong>
                .
              </p>
            </Section>
          </div>

          <aside className="border-l border-white/10 bg-[#0a2231] px-5 py-7">
            <Section title="Stats">
              <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                <Stat label="Surplus" value={fmtMoney(lead.estimatedSurplus)} mono />
                <Stat label="Net" value={fmtMoney(lead.estimatedNet)} accent mono />
                <Stat label="Owner" value={lead.ownerStatus} />
                <Stat label="Contacts" value="4" />
              </div>
            </Section>

            <Section title="Tags">
              <div className="mt-2 flex flex-col gap-1.5">
                {lead.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-sm border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white/85"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Section>

            <Section title="Last Note">
              <p className="m-0 mt-2 text-[12px] leading-relaxed text-white/80">
                {lead.notes[0].body}
              </p>
              <div className="mt-1 text-[10.5px] text-white/55">
                {lead.notes[0].author} · {lead.notes[0].createdAt}
              </div>
            </Section>
          </aside>
        </div>
      </article>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-7 last:mb-0">
      <div className="text-[10.5px] uppercase tracking-[0.6px] text-white/55">
        {title}
      </div>
      {children}
    </section>
  );
}

function Stat({
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
    <div className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-[0.4px] text-white/55">
        {label}
      </div>
      <div
        className={
          (mono ? "font-mono " : "") +
          (accent ? "text-petrol-300 " : "text-white ") +
          "mt-0.5 text-[13px] font-medium tabular-nums"
        }
      >
        {value}
      </div>
    </div>
  );
}

function BottomBar() {
  return (
    <div className="flex shrink-0 items-center justify-center gap-3 border-t border-white/10 bg-[#04140d] px-7 py-3.5">
      <BigKey k="C" label="Call Now" primary />
      <BigKey k="D" label="Skip to Dispo" />
      <BigKey k="S" label="Snooze" />
      <BigKey k="X" label="Skip Lead" />
    </div>
  );
}

function BigKey({
  k,
  label,
  primary,
}: {
  k: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      className={
        primary
          ? "flex items-center gap-3 rounded-md bg-petrol-500 px-5 py-2.5 text-[13px] font-medium text-white hover:brightness-110"
          : "flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-5 py-2.5 text-[13px] text-white hover:bg-white/10"
      }
    >
      <span
        className={
          primary
            ? "rounded-sm border border-white/30 px-1.5 font-mono text-[11px] font-semibold text-white"
            : "rounded-sm border border-white/30 px-1.5 font-mono text-[11px] font-semibold text-white/85"
        }
      >
        {k}
      </span>
      <span>{label}</span>
    </button>
  );
}
