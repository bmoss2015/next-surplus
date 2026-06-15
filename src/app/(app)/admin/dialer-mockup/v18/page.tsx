import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, fmtMoney } from "../_sample";
import { QUEUE } from "../_sample";
import { aiBriefFor } from "../_brief";

export default async function V18Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const lead = ACTIVE_LEAD;
  const brief = aiBriefFor(lead);

  return (
    <div className="flex h-screen flex-col bg-[#f7f8fa] text-ink">
      <Toolbar />
      <div className="grid flex-1 grid-cols-[240px_minmax(0,1fr)_320px] overflow-hidden">
        <LayersPanel />
        <Canvas lead={lead} brief={brief} />
        <Inspector lead={lead} />
      </div>
    </div>
  );
}

function Toolbar() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-black/[0.08] bg-white px-4 py-2 text-[12px]">
      <div className="flex items-center gap-3">
        <Link href="/admin/dialer-mockup" className="text-ink/55 hover:text-ink">
          ← Back
        </Link>
        <span className="text-ink/25">|</span>
        <span className="font-semibold text-ink">Power Dial Session</span>
        <Tool label="Mute" k="M" />
        <Tool label="Hold" k="H" />
        <Tool label="Voicemail Drop" k="V" />
        <Tool label="Add Note" k="N" />
        <Tool label="Dial Next Contact" k="→" />
      </div>
      <div className="flex items-center gap-3">
        <Counter label="Dials" value="42" />
        <Counter label="Connects" value="6" />
        <Counter label="Rate" value="14%" />
        <Counter label="Avg Talk" value="3:48" />
        <button className="rounded-md bg-danger px-3 py-1 text-[11.5px] font-medium text-white">
          End Session
        </button>
      </div>
    </header>
  );
}

function Tool({ label, k }: { label: string; k: string }) {
  return (
    <button className="ml-1 inline-flex items-center gap-1.5 rounded-md border border-black/[0.08] bg-white px-2.5 py-1 text-[11.5px] text-ink hover:border-black/20">
      {label}
      <kbd className="rounded-sm border border-ink/15 px-1 font-mono text-[9.5px] text-ink/55">
        {k}
      </kbd>
    </button>
  );
}

function Counter({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10.5px] uppercase tracking-[0.4px] text-ink/55">
        {label}
      </span>
      <span className="text-[13px] font-semibold tabular-nums text-ink">
        {value}
      </span>
    </div>
  );
}

function LayersPanel() {
  const sections = [
    {
      label: "Active Lead",
      items: [{ name: "Cornelius J. Hayes Estate", meta: "OH · $521,900" }],
    },
    {
      label: "Up Next",
      items: QUEUE.slice(3, 8).map((q) => ({
        name: q.ownerName,
        meta: `${q.state} · ${fmtMoney(q.surplus)}`,
      })),
    },
    {
      label: "Done Today",
      items: QUEUE.slice(0, 2).map((q) => ({
        name: q.ownerName,
        meta: `${q.state} · Dispositioned`,
      })),
    },
  ];
  return (
    <aside className="overflow-y-auto border-r border-black/[0.08] bg-[#fcfcfe] px-3 py-3">
      {sections.map((s) => (
        <div key={s.label} className="mb-5">
          <div className="px-1.5 text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
            {s.label}
          </div>
          <div className="mt-1.5 space-y-0.5">
            {s.items.map((it, i) => (
              <div
                key={i}
                className={
                  s.label === "Active Lead"
                    ? "rounded-md bg-petrol-500 px-2.5 py-1.5"
                    : s.label === "Done Today"
                    ? "rounded-md px-2.5 py-1.5 opacity-55 hover:bg-black/[0.04]"
                    : "rounded-md px-2.5 py-1.5 hover:bg-black/[0.04]"
                }
              >
                <div
                  className={
                    s.label === "Active Lead"
                      ? "truncate text-[12px] font-semibold text-white"
                      : "truncate text-[12px] font-medium text-ink"
                  }
                >
                  {it.name}
                </div>
                <div
                  className={
                    s.label === "Active Lead"
                      ? "truncate text-[10.5px] text-white/75"
                      : "truncate text-[10.5px] text-ink/55"
                  }
                >
                  {it.meta}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}

function Canvas({
  lead,
  brief,
}: {
  lead: typeof ACTIVE_LEAD;
  brief: ReturnType<typeof aiBriefFor>;
}) {
  return (
    <main className="overflow-y-auto px-10 py-9">
      <div className="mx-auto max-w-[760px]">
        <div className="flex items-baseline justify-between">
          <span className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-700">
            On Call · Connected · 02:14
          </span>
          <span className="text-[10.5px] uppercase tracking-[0.4px] text-ink/55">
            {lead.leadId} · {lead.stageLabel}
          </span>
        </div>

        <h1 className="m-0 mt-3 text-[56px] font-semibold leading-[1] tracking-[-0.03em] text-ink">
          Cornelius J. Hayes Jr.
        </h1>
        <div className="mt-2 text-[15px] text-ink/75">
          <span className="font-medium text-ink">Heir</span> ·{" "}
          <span className="tabular-nums">(216) 555-0147</span> · Mobile · Son of{" "}
          {lead.ownerName}
        </div>

        <section className="mt-9 rounded-2xl border border-petrol-700/25 bg-white px-7 py-6 shadow-[0_2px_0_rgba(13,75,58,0.06)]">
          <div className="flex items-baseline justify-between">
            <span className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-700">
              AI Brief · What You Already Know
            </span>
            <span className="text-[10.5px] text-ink/55">Refresh</span>
          </div>
          <h2 className="m-0 mt-2 text-[20px] font-semibold leading-snug text-ink">
            {brief.headline}
          </h2>
          <p className="m-0 mt-2 text-[14px] leading-relaxed text-ink/80">
            {brief.tldr}
          </p>
          <ul className="m-0 mt-3 list-none space-y-2 pl-0">
            {brief.bullets.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[13px] leading-relaxed text-ink"
              >
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-petrol-500" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-l-2 border-danger pl-3">
            <div className="text-[10.5px] uppercase tracking-[0.4px] text-danger">
              Watch Out
            </div>
            <p className="m-0 mt-0.5 text-[13px] leading-snug text-ink/85">
              {brief.watchOuts[0]}
            </p>
          </div>
        </section>

        <section className="mt-7">
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
            Other Contacts On This Lead
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {lead.contacts.slice(1).map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-black/[0.06] bg-white px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.06] text-[11px] font-semibold text-ink">
                    {c.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-semibold text-ink">
                      {c.name.split(" ").slice(0, 2).join(" ")}
                    </div>
                    <div className="text-[10.5px] uppercase tracking-[0.4px] text-ink/55">
                      {c.role}
                    </div>
                  </div>
                </div>
                <button className="mt-2 w-full rounded-md border border-petrol-500/40 bg-white px-2 py-1 text-[11px] font-medium text-petrol-700 hover:bg-petrol-500/5">
                  Dial Next
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Inspector({ lead }: { lead: typeof ACTIVE_LEAD }) {
  const dispositions = [
    { label: "Interested", k: "1" },
    { label: "Not Interested", k: "2" },
    { label: "Callback Requested", k: "3" },
    { label: "Left Voicemail", k: "4" },
    { label: "Wrong Number", k: "5" },
    { label: "Do Not Contact", k: "6" },
  ];
  return (
    <aside className="overflow-y-auto border-l border-black/[0.08] bg-white px-5 py-5">
      <div className="text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
        Inspector
      </div>

      <SectionHead>Surplus</SectionHead>
      <div className="mt-1 grid grid-cols-2 gap-2">
        <Field label="Estimated" value={fmtMoney(lead.estimatedSurplus)} />
        <Field label="Net To Firm" value={fmtMoney(lead.estimatedNet)} accent />
        <Field label="Fee" value={`${lead.recoveryFeePercent}%`} />
        <Field label="Stage" value={lead.stageLabel} />
      </div>

      <SectionHead>Property</SectionHead>
      <div className="text-[12.5px] text-ink">
        {lead.propertyAddress}
        <br />
        {lead.city}, {lead.state}
      </div>
      <div className="mt-1 text-[11px] text-ink/55">
        {lead.saleProcess} · {lead.saleDate}
      </div>

      <SectionHead>Disposition</SectionHead>
      <div className="grid grid-cols-1 gap-1">
        {dispositions.map((d) => (
          <button
            key={d.label}
            className="flex items-center justify-between rounded-md border border-black/[0.08] bg-white px-2.5 py-1.5 text-[11.5px] text-ink hover:border-black/20"
          >
            <span>{d.label}</span>
            <kbd className="rounded-sm border border-ink/15 px-1 font-mono text-[9.5px] text-ink/55">
              {d.k}
            </kbd>
          </button>
        ))}
      </div>

      <SectionHead>Quick Note</SectionHead>
      <textarea
        rows={3}
        placeholder="Type what was said. Saves on disposition."
        className="block w-full resize-none rounded-md border border-black/[0.08] bg-white px-2.5 py-2 text-[12px] text-ink outline-none focus:border-petrol-500"
      />
    </aside>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 text-[10.5px] uppercase tracking-[0.5px] text-ink/55">
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-black/[0.06] bg-[#fafbfc] px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-[0.4px] text-ink/55">
        {label}
      </div>
      <div
        className={
          accent
            ? "mt-0.5 text-[13.5px] font-semibold tabular-nums text-petrol-500"
            : "mt-0.5 text-[13.5px] font-semibold tabular-nums text-ink"
        }
      >
        {value}
      </div>
    </div>
  );
}
