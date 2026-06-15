import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";
import { aiBriefFor } from "../_brief";

export default async function V17Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const lead = ACTIVE_LEAD;
  const brief = aiBriefFor(lead);

  return (
    <div
      className="relative flex h-screen flex-col overflow-hidden text-ink"
      style={{
        background:
          "radial-gradient(circle at 12% 18%, #d6e6df 0%, transparent 45%), radial-gradient(circle at 88% 82%, #e8e0f6 0%, transparent 50%), radial-gradient(circle at 88% 12%, #f1e6d0 0%, transparent 45%), linear-gradient(180deg, #f6f9fb 0%, #eef2f7 100%)",
      }}
    >
      <TopThin />
      <main className="relative flex flex-1 items-center justify-center px-10 pb-6">
        <div className="grid w-full max-w-[1280px] grid-cols-12 grid-rows-6 gap-5">
          <CallGlass lead={lead} className="col-span-7 row-span-4" />
          <BriefGlass brief={brief} className="col-span-5 row-span-3" />
          <SurplusGlass lead={lead} className="col-span-5 row-span-1" />
          <ContactsGlass lead={lead} className="col-span-7 row-span-2" />
          <DispoGlass className="col-span-12 row-span-1" />
        </div>
      </main>
    </div>
  );
}

const GLASS = "backdrop-blur-xl border border-white/45 bg-white/55";
const SOFT_SHADOW = "shadow-[0_20px_60px_-30px_rgba(13,75,58,0.35),0_4px_14px_-4px_rgba(15,23,41,0.08)]";

function TopThin() {
  return (
    <div className="flex shrink-0 items-center justify-between px-7 py-3 text-[11.5px] text-ink/75">
      <Link href="/admin/dialer-mockup" className="hover:text-ink">
        ← Back to mockups
      </Link>
      <div className="flex items-center gap-3 rounded-full border border-white/45 bg-white/55 px-3 py-1 backdrop-blur-xl">
        <span>42 Dials</span>
        <span className="text-ink/30">·</span>
        <span>6 Connects</span>
        <span className="text-ink/30">·</span>
        <span>14% Rate</span>
        <span className="text-ink/30">·</span>
        <span>3:48 Avg Talk</span>
      </div>
      <button className="rounded-full bg-danger/95 px-3 py-1 text-[11px] font-medium text-white">
        End Session
      </button>
    </div>
  );
}

function CallGlass({
  lead,
  className,
}: {
  lead: typeof ACTIVE_LEAD;
  className?: string;
}) {
  return (
    <section className={`flex flex-col rounded-3xl px-9 py-8 ${GLASS} ${SOFT_SHADOW} ${className ?? ""}`}>
      <div className="flex items-baseline justify-between">
        <span className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-700">
          On Call · Connected
        </span>
        <span className="rounded-full border border-petrol-700/40 bg-white/65 px-2.5 py-[2px] text-[10px] font-semibold uppercase tracking-[0.6px] text-petrol-700">
          {lead.stageLabel}
        </span>
      </div>

      <div className="mt-6 flex items-center gap-6">
        <div className="relative">
          <div
            className="absolute inset-0 -m-2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(93,185,138,0.35) 0%, transparent 70%)",
            }}
          />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-petrol-500 to-petrol-700 text-[26px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(13,75,58,0.7)]">
            CH
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[0.6px] text-ink/55">
            Calling Heir
          </div>
          <h1 className="m-0 mt-1 text-[36px] font-semibold leading-[1.05] tracking-[-0.025em] text-ink">
            Cornelius J. Hayes Jr.
          </h1>
          <div className="mt-1 text-[14px] text-ink/75 tabular-nums">
            (216) 555-0147 · Mobile
          </div>
        </div>
      </div>

      <div className="mt-7 flex items-end justify-between">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
            Talk Time
          </div>
          <div className="mt-1 text-[58px] font-semibold tabular-nums tracking-[-0.025em] leading-none text-ink">
            02:14
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CtrlBtn label="Mute" k="M" />
          <CtrlBtn label="Hold" k="H" />
          <CtrlBtn label="Voicemail" k="V" />
          <button className="rounded-2xl bg-danger px-5 py-3 text-[13px] font-medium text-white shadow-[0_10px_30px_-10px_rgba(185,28,28,0.6)]">
            End Call
          </button>
        </div>
      </div>
    </section>
  );
}

function CtrlBtn({ label, k }: { label: string; k: string }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-2xl border border-white/55 bg-white/70 px-4 py-3 text-[13px] text-ink shadow-[0_6px_20px_-12px_rgba(15,23,41,0.18)] hover:bg-white/85">
      {label}
      <kbd className="rounded-sm border border-ink/15 px-1 font-mono text-[9.5px] text-ink/55">{k}</kbd>
    </button>
  );
}

function BriefGlass({
  brief,
  className,
}: {
  brief: ReturnType<typeof aiBriefFor>;
  className?: string;
}) {
  return (
    <section className={`flex flex-col rounded-3xl px-7 py-6 ${GLASS} ${SOFT_SHADOW} ${className ?? ""}`}>
      <div className="flex items-baseline justify-between">
        <span className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-700">
          What You Already Know
        </span>
        <span className="text-[10px] text-ink/55">AI Brief</span>
      </div>
      <h3 className="m-0 mt-2 text-[16px] font-semibold leading-tight text-ink">
        {brief.headline}
      </h3>
      <p className="m-0 mt-2 text-[13px] leading-relaxed text-ink/85">
        {brief.tldr}
      </p>
      <ul className="m-0 mt-3 list-none space-y-1.5 pl-0">
        {brief.bullets.slice(0, 3).map((b, i) => (
          <li key={i} className="flex gap-2 text-[12px] leading-snug text-ink">
            <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-petrol-500" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-3 text-[11px] uppercase tracking-[0.4px] text-danger">
        Watch Out · {brief.watchOuts[0]}
      </div>
    </section>
  );
}

function SurplusGlass({
  lead,
  className,
}: {
  lead: typeof ACTIVE_LEAD;
  className?: string;
}) {
  return (
    <section
      className={`flex items-center justify-between rounded-3xl px-7 py-5 ${GLASS} ${SOFT_SHADOW} ${className ?? ""}`}
    >
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
          Estimated Surplus
        </div>
        <div className="mt-0.5 text-[28px] font-semibold tabular-nums tracking-[-0.02em] leading-none text-ink">
          {fmtMoney(lead.estimatedSurplus)}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[10.5px] uppercase tracking-[0.6px] text-petrol-700">
          Net To Firm
        </div>
        <div className="mt-0.5 text-[28px] font-semibold tabular-nums tracking-[-0.02em] leading-none text-petrol-500">
          {fmtMoney(lead.estimatedNet)}
        </div>
      </div>
    </section>
  );
}

function ContactsGlass({
  lead,
  className,
}: {
  lead: typeof ACTIVE_LEAD;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl px-7 py-5 ${GLASS} ${SOFT_SHADOW} ${className ?? ""}`}>
      <div className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
        Contacts On This Lead
      </div>
      <div className="mt-3 flex items-end gap-5">
        {lead.contacts.map((c, i) => {
          const isActive = i === 0;
          return (
            <div key={c.id} className="flex flex-col items-center">
              <div
                className={
                  isActive
                    ? "flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-petrol-500 to-petrol-700 text-[14px] font-semibold text-white shadow-[0_8px_22px_-10px_rgba(13,75,58,0.65)]"
                    : "flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-[11.5px] font-semibold text-ink ring-1 ring-ink/10"
                }
              >
                {c.initials}
              </div>
              <div
                className={
                  isActive
                    ? "mt-1.5 text-[12px] font-semibold text-ink"
                    : "mt-1.5 text-[11px] text-ink/80"
                }
              >
                {c.name.split(" ").slice(0, 2).join(" ")}
              </div>
              <div className="text-[9.5px] uppercase tracking-[0.4px] text-ink/55">
                {c.role}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DispoGlass({ className }: { className?: string }) {
  const items = [
    { label: "Interested", k: "1" },
    { label: "Not Interested", k: "2" },
    { label: "Callback", k: "3" },
    { label: "Voicemail", k: "4" },
    { label: "Wrong Number", k: "5" },
    { label: "Do Not Contact", k: "6" },
  ];
  return (
    <section
      className={`flex items-center gap-3 rounded-3xl px-7 py-3 ${GLASS} ${SOFT_SHADOW} ${className ?? ""}`}
    >
      <span className="text-[10.5px] uppercase tracking-[0.6px] text-ink/55">
        End With A Disposition
      </span>
      <div className="flex flex-1 items-center gap-1.5">
        {items.map((d) => (
          <button
            key={d.label}
            className="flex-1 rounded-full border border-white/45 bg-white/75 px-3 py-1.5 text-[11.5px] text-ink hover:border-petrol-500 hover:text-petrol-500"
          >
            {d.label}{" "}
            <kbd className="ml-1 rounded-sm border border-ink/15 px-1 font-mono text-[9.5px] text-ink/55">
              {d.k}
            </kbd>
          </button>
        ))}
      </div>
    </section>
  );
}
