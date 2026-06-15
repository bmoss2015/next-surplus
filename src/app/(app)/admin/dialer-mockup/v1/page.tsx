import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, fmtMoney } from "../_sample";

export default async function V1Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  const lead = ACTIVE_LEAD;
  const dispositions = [
    { key: "I", label: "Interested",          tone: "good"     },
    { key: "N", label: "Not Interested",      tone: "neutral"  },
    { key: "C", label: "Callback Requested",  tone: "info"     },
    { key: "V", label: "Left Voicemail",      tone: "muted"    },
    { key: "W", label: "Wrong Number",        tone: "bad"      },
    { key: "D", label: "Do Not Contact",      tone: "stop"     },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      <TopRibbon leadId={lead.leadId} stageLabel={lead.stageLabel} />

      <main className="mx-auto max-w-[760px] px-7 pb-[200px] pt-12">
        <div className="text-[11px] uppercase tracking-[0.5px] text-gray-500">
          Calling Now · Lead 3 of 10
        </div>
        <h1 className="m-0 mt-2 text-[52px] font-medium leading-[1.02] tracking-[-0.025em] text-ink">
          {lead.ownerName}
        </h1>
        <p className="mt-4 max-w-[60ch] text-[16px] leading-[1.55] text-gray-700">
          {lead.saleProcess} surplus on {lead.propertyAddress}, {lead.city},{" "}
          {lead.state}. Sale held {lead.saleDate} in {lead.county}. Estimated
          surplus{" "}
          <span className="font-medium text-ink">
            {fmtMoney(lead.estimatedSurplus)}
          </span>
          , estimated net to the firm{" "}
          <span className="font-medium text-ink">
            {fmtMoney(lead.estimatedNet)}
          </span>
          .
        </p>

        <div className="mt-6 inline-flex items-center gap-3 border-l-2 border-petrol-500 pl-3 text-[12px] text-gray-700">
          <span className="font-medium text-ink">{lead.ownerStatus}</span>
          <span className="text-gray-400">·</span>
          <span>Last contact {lead.daysSinceContact} day ago</span>
          <span className="text-gray-400">·</span>
          <span>{lead.tags.join(" · ")}</span>
        </div>

        <section className="mt-12">
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
            Contacts on This Lead
          </div>
          <div className="mt-4 flex items-end gap-5">
            {lead.contacts.map((c, idx) => {
              const isActive = idx === 0;
              return (
                <div key={c.id} className="flex flex-col items-center">
                  <div
                    className={
                      isActive
                        ? "flex h-16 w-16 items-center justify-center rounded-full bg-petrol-700 text-[15px] font-semibold text-white ring-4 ring-petrol-300 ring-offset-2 ring-offset-canvas"
                        : "flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-[12px] font-semibold text-gray-700"
                    }
                  >
                    {c.initials}
                  </div>
                  <div
                    className={
                      isActive
                        ? "mt-2.5 text-[12.5px] font-semibold text-ink"
                        : "mt-2.5 text-[11.5px] text-gray-700"
                    }
                  >
                    {c.name.split(" ").slice(0, 2).join(" ")}
                  </div>
                  <div className="text-[10.5px] text-gray-500">{c.role}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-12">
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
            Notes · Newest First
          </div>
          <div className="mt-4 space-y-7">
            {lead.notes.map((n) => (
              <article key={n.id}>
                <div className="flex items-baseline gap-3 text-[11px] text-gray-500">
                  <span className="font-medium text-ink">{n.author}</span>
                  <span>{n.createdAt}</span>
                </div>
                <p className="mt-1 max-w-[60ch] text-[14.5px] leading-[1.6] text-gray-800">
                  {n.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <CallDock dispositions={dispositions} />
    </div>
  );
}

function TopRibbon({ leadId, stageLabel }: { leadId: string; stageLabel: string }) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-surface px-7 py-3 text-[12px]">
      <div className="flex items-center gap-4">
        <Link href="/admin/dialer-mockup" className="text-gray-500 hover:text-ink">
          ← Back to mockups
        </Link>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">{leadId}</span>
        <span className="text-gray-300">|</span>
        <span className="text-ink">{stageLabel}</span>
      </div>
      <div className="text-gray-500">Press <Kbd>?</Kbd> for shortcuts</div>
    </div>
  );
}

function CallDock({
  dispositions,
}: {
  dispositions: Array<{ key: string; label: string; tone: string }>;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[760px] items-center gap-6 px-7 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-2 w-2 items-center justify-center">
            <span className="h-2 w-2 animate-ping rounded-full bg-petrol-500 opacity-75" />
            <span className="absolute h-2 w-2 rounded-full bg-petrol-500" />
          </div>
          <div className="font-mono text-[14px] tabular-nums text-ink">02:14</div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-medium text-ink">
            Cornelius J. Hayes Jr.
          </div>
          <div className="font-mono text-[12px] text-gray-500">
            (216) 555-0147 · Mobile · Caller ID (216) 555-0105
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DockBtn label="Mute" k="M" />
          <DockBtn label="Hold" k="H" />
          <DockBtn label="Notes" k="N" />
          <button
            type="button"
            className="rounded-md bg-danger px-3.5 py-2 text-[12px] font-medium text-white hover:brightness-110"
          >
            End Call <Kbd light>E</Kbd>
          </button>
        </div>
      </div>

      <div className="border-t border-gray-150 bg-gray-50 px-7 py-2.5">
        <div className="mx-auto flex max-w-[760px] items-center gap-2 overflow-x-auto">
          <span className="shrink-0 text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
            Disposition
          </span>
          {dispositions.map((d) => (
            <button
              key={d.key}
              type="button"
              className={toneClasses(d.tone)}
              title={`Press ${d.key}`}
            >
              {d.label}
              <Kbd>{d.key}</Kbd>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DockBtn({ label, k }: { label: string; k: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-surface px-3 py-1.5 text-[12px] text-ink hover:border-gray-300"
    >
      {label}
      <Kbd>{k}</Kbd>
    </button>
  );
}

function Kbd({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span
      className={
        light
          ? "ml-1 inline-flex h-4 min-w-[14px] items-center justify-center rounded-sm border border-white/40 px-1 font-mono text-[9.5px] font-semibold uppercase tracking-wide text-white/85"
          : "ml-1 inline-flex h-4 min-w-[14px] items-center justify-center rounded-sm border border-gray-300 px-1 font-mono text-[9.5px] font-semibold uppercase tracking-wide text-gray-500"
      }
    >
      {children}
    </span>
  );
}

function toneClasses(tone: string): string {
  const base =
    "inline-flex shrink-0 items-center rounded-md border px-2.5 py-1 text-[11.5px] transition-colors";
  if (tone === "good")
    return `${base} border-gray-200 bg-surface text-ink hover:border-petrol-500 hover:text-petrol-500`;
  if (tone === "info")
    return `${base} border-gray-200 bg-surface text-ink hover:border-info-violet hover:text-info-violet-deep`;
  if (tone === "bad")
    return `${base} border-gray-200 bg-surface text-ink hover:border-danger hover:text-danger`;
  if (tone === "stop")
    return `${base} border-gray-200 bg-surface text-ink hover:border-ink`;
  return `${base} border-gray-200 bg-surface text-gray-700 hover:border-gray-300`;
}
