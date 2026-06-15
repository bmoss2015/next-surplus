import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";
import { aiBriefFor } from "../_brief";

export default async function V16Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const lead = ACTIVE_LEAD;
  const brief = aiBriefFor(lead);

  return (
    <div className="flex h-screen flex-col bg-[#faf7f2] text-ink">
      <TopThin />
      <div className="grid flex-1 grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-0 overflow-hidden">
        <HeroStage lead={lead} />
        <DetailColumn lead={lead} brief={brief} />
      </div>
      <Dock />
    </div>
  );
}

function TopThin() {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-black/[0.07] px-7 py-3 text-[11.5px] text-ink/65">
      <Link href="/admin/dialer-mockup" className="hover:text-ink">
        ← Back to mockups
      </Link>
      <div className="flex items-center gap-4">
        <span>Lead 3 of 10</span>
        <span className="text-ink/25">·</span>
        <span>42 Dials / 6 Connects / 14% Rate / 3:48 Avg</span>
        <span className="text-ink/25">·</span>
        <button className="rounded-md bg-danger/95 px-3 py-1 text-[11px] font-medium text-white">
          End Session
        </button>
      </div>
    </div>
  );
}

function HeroStage({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 30% 30%, #cfdfd8 0%, #f0eae0 55%, #faf7f2 100%)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -left-10 select-none text-[28rem] font-bold leading-none text-ink/[0.04]"
        style={{ letterSpacing: "-0.04em" }}
      >
        CH
      </span>

      <div className="relative flex h-full flex-col px-12 py-10">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] uppercase tracking-[0.5px] text-petrol-700">
            On Call · Connected
          </span>
          <span className="rounded-full border border-petrol-700/40 bg-white/70 px-2.5 py-[2px] text-[10.5px] font-semibold uppercase tracking-[0.6px] text-petrol-700 backdrop-blur">
            {lead.stageLabel}
          </span>
        </div>

        <div className="mt-auto">
          <div className="text-[12px] uppercase tracking-[0.5px] text-ink/55">
            Calling Heir
          </div>
          <h1
            className="m-0 mt-2 text-[80px] font-semibold leading-[0.94] tracking-[-0.035em] text-[#0c1a16]"
            style={{ fontFeatureSettings: "'ss01'" }}
          >
            Cornelius J.
            <br />
            Hayes Jr.
          </h1>
          <div className="mt-5 flex items-center gap-5 text-[13px] text-ink/75">
            <span>Son of the estate</span>
            <span className="h-1 w-1 rounded-full bg-ink/30" />
            <span>Cuyahoga, OH</span>
            <span className="h-1 w-1 rounded-full bg-ink/30" />
            <span className="tabular-nums">(216) 555-0147</span>
          </div>

          <div className="mt-9 flex items-end gap-6">
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
                Talk Time
              </div>
              <div className="mt-1 text-[64px] font-semibold tracking-[-0.03em] tabular-nums leading-none">
                02:14
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <PortraitChip initials="YH" name="Yvette" role="Heir" />
              <PortraitChip initials="KH" name="Karen" role="Cousin" muted />
              <PortraitChip initials="EH" name="Estate" role="Owner" muted />
              <button className="ml-1 rounded-full border border-ink/15 bg-white/70 px-3 py-1.5 text-[11.5px] text-ink/85 hover:bg-white">
                Dial Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PortraitChip({
  initials,
  name,
  role,
  muted,
}: {
  initials: string;
  name: string;
  role: string;
  muted?: boolean;
}) {
  return (
    <button
      className={
        muted
          ? "flex flex-col items-center text-center opacity-65 hover:opacity-100"
          : "flex flex-col items-center text-center"
      }
    >
      <div
        className={
          muted
            ? "flex h-12 w-12 items-center justify-center rounded-full bg-white/65 text-[12px] font-semibold text-ink/85 ring-1 ring-ink/10"
            : "flex h-12 w-12 items-center justify-center rounded-full bg-white text-[12px] font-semibold text-ink ring-1 ring-ink/15"
        }
      >
        {initials}
      </div>
      <span className="mt-1.5 text-[11px] font-medium text-ink">{name}</span>
      <span className="text-[9.5px] uppercase tracking-[0.4px] text-ink/55">
        {role}
      </span>
    </button>
  );
}

function DetailColumn({
  lead,
  brief,
}: {
  lead: typeof ACTIVE_LEAD;
  brief: ReturnType<typeof aiBriefFor>;
}) {
  return (
    <aside className="flex flex-col overflow-hidden border-l border-black/[0.06] bg-white">
      <div className="border-b border-black/[0.06] px-7 py-6">
        <div className="flex items-baseline justify-between">
          <span className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
            Surplus
          </span>
          <span className="text-[10.5px] text-ink/55">
            Lead {lead.leadId}
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <div className="text-[38px] font-semibold tabular-nums tracking-[-0.025em] leading-none text-ink">
              {fmtMoney(lead.estimatedSurplus)}
            </div>
            <div className="mt-1 text-[11.5px] text-ink/65">
              Surplus on {lead.propertyAddress}, {lead.city}, {lead.state}.{" "}
              {lead.saleProcess.toLowerCase()} held {lead.saleDate}.
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-[0.4px] text-petrol-700">
              Net To Firm
            </div>
            <div className="text-[22px] font-semibold tabular-nums tracking-tight text-petrol-500">
              {fmtMoney(lead.estimatedNet)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-6">
        <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-700">
          AI Brief
        </div>
        <h3 className="m-0 mt-1.5 text-[16px] font-semibold leading-tight text-ink">
          {brief.headline}
        </h3>
        <p className="m-0 mt-2 text-[13px] leading-relaxed text-ink/80">
          {brief.tldr}
        </p>
        <ul className="m-0 mt-3 list-none space-y-1.5 pl-0">
          {brief.bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-ink">
              <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-petrol-500" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-md border-l-2 border-danger bg-danger-bg px-3 py-2">
          <div className="text-[10.5px] uppercase tracking-[0.4px] text-danger">
            Watch Out
          </div>
          <p className="m-0 mt-0.5 text-[12px] leading-snug text-ink/85">
            {brief.watchOuts[0]}
          </p>
        </div>

        <div className="mt-8 text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
          Up Next
        </div>
        <div className="mt-2 space-y-1.5">
          {QUEUE.slice(3, 7).map((q) => (
            <div
              key={q.id}
              className="flex items-baseline justify-between border-b border-black/[0.05] py-1.5 text-[12px]"
            >
              <span className="font-medium text-ink">{q.ownerName}</span>
              <span className="text-ink/55 tabular-nums">
                {fmtMoney(q.surplus)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Dock() {
  const dispositions = [
    "Interested",
    "Not Interested",
    "Callback",
    "Voicemail",
    "Wrong Number",
    "Do Not Contact",
  ];
  return (
    <footer className="shrink-0 border-t border-black/[0.07] bg-white px-7 py-3.5">
      <div className="flex items-center gap-3">
        <DockKey label="Mute" k="M" />
        <DockKey label="Hold" k="H" />
        <DockKey label="Voicemail Drop" k="V" />
        <DockKey label="Add Note" k="N" />
        <button className="rounded-md bg-danger px-4 py-2 text-[12.5px] font-medium text-white">
          End Call
          <kbd className="ml-2 rounded-sm border border-white/40 px-1 font-mono text-[9.5px] text-white/85">
            E
          </kbd>
        </button>

        <span className="ml-6 text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
          Disposition
        </span>
        <div className="flex flex-1 items-center gap-1.5 overflow-x-auto">
          {dispositions.map((d, i) => (
            <button
              key={d}
              className="shrink-0 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-[11.5px] text-ink hover:border-petrol-500 hover:text-petrol-500"
            >
              {d}{" "}
              <kbd className="ml-1 rounded-sm border border-ink/15 px-1 font-mono text-[9.5px] text-ink/55">
                {i + 1}
              </kbd>
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}

function DockKey({ label, k }: { label: string; k: string }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-md border border-ink/10 bg-white px-3 py-2 text-[12.5px] text-ink hover:border-ink/25">
      {label}
      <kbd className="rounded-sm border border-ink/15 px-1 font-mono text-[9.5px] text-ink/55">
        {k}
      </kbd>
    </button>
  );
}
