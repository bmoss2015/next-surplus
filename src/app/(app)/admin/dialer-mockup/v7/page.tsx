import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";

export default async function V7Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <TopRibbon />
      <div className="grid flex-1 grid-cols-[300px_minmax(0,1fr)_320px] overflow-hidden">
        <InboxRail />
        <ThreadColumn lead={lead} />
        <ActionRail lead={lead} />
      </div>
    </div>
  );
}

function TopRibbon() {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-surface px-7 py-3 text-[12px]">
      <div className="flex items-center gap-4">
        <Link href="/admin/dialer-mockup" className="text-gray-500 hover:text-ink">
          ← Back to mockups
        </Link>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">
          Search threads · <kbd className="rounded-sm border border-gray-300 px-1 font-mono text-[10px]">⌘K</kbd>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-gray-500">Auto Triage On</span>
        <span className="text-gray-300">|</span>
        <span className="rounded-sm bg-petrol-100 px-1.5 py-[1px] text-[10.5px] text-petrol-700">
          Inbox Zero in 7
        </span>
      </div>
    </div>
  );
}

function InboxRail() {
  return (
    <aside className="overflow-y-auto border-r border-gray-200 bg-surface">
      <div className="px-5 pt-4">
        <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
          Today&apos;s Queue
        </div>
        <div className="mt-1 text-[12px] text-gray-500">
          10 threads · 3 done
        </div>
      </div>
      <div className="mt-3">
        {QUEUE.map((q, i) => {
          const isActive = q.status === "active";
          const isDone = q.status === "done";
          return (
            <div
              key={q.id}
              className={
                isActive
                  ? "border-l-2 border-petrol-500 bg-petrol-100 px-5 py-3"
                  : "border-l-2 border-transparent px-5 py-3 hover:bg-gray-50"
              }
            >
              <div className="flex items-center justify-between text-[10.5px] text-gray-500">
                <span>{q.estReady}</span>
                <span>{q.contactCount} contacts</span>
              </div>
              <div
                className={
                  isDone
                    ? "mt-0.5 truncate text-[12.5px] text-gray-400 line-through"
                    : isActive
                    ? "mt-0.5 truncate text-[12.5px] font-semibold text-ink"
                    : "mt-0.5 truncate text-[12.5px] font-medium text-ink"
                }
              >
                {q.ownerName}
              </div>
              <div className="truncate text-[11px] text-gray-600">
                {q.stageLabel} · {q.city}, {q.state}
              </div>
              {!isDone && (
                <div className="mt-1.5 truncate text-[11px] text-gray-500">
                  {i === 2 ? "Cornelius Jr. — \"call back Tuesday morning…\"" : i === 3 ? "Marlene — \"don't call after 6 pm\"" : "No conversation yet"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function ThreadColumn({ lead }: { lead: typeof ACTIVE_LEAD }) {
  const events: Array<{
    id: string;
    kind: "call" | "note" | "mail" | "voicemail" | "stage";
    side: "outbound" | "inbound" | "system";
    when: string;
    title: string;
    body?: string;
    actor?: string;
  }> = [
    { id: "e1", kind: "call",      side: "outbound", when: "June 14, 2026 · 10:42 AM",  title: "Outbound call to Cornelius Jr.", body: "Connected, 7 min 12 sec. He confirmed his father passed in late February, probate filed in Cuyahoga in March. Willing to talk after speaking with his sister Yvette. Wants a follow up Tuesday morning.", actor: "Bree Moss" },
    { id: "e2", kind: "stage",     side: "system",   when: "June 14, 2026",              title: "Stage moved to In Conversation", body: "From Qualifying" },
    { id: "e3", kind: "call",      side: "outbound", when: "June 8, 2026 · 12:18 PM",    title: "Outbound call to Yvette", body: "Connected, 2 min 06 sec. She had to step away. Asked us to call back during her lunch window, 12:30 to 1:30 PM ET.", actor: "Carla Linden" },
    { id: "e4", kind: "mail",      side: "outbound", when: "May 28, 2026",                title: "Certified letter delivered", body: "USPS tracking confirms delivered May 30." },
    { id: "e5", kind: "voicemail", side: "outbound", when: "May 26, 2026 · 4:08 PM",     title: "Voicemail left for Cornelius Jr.", actor: "Bree Moss" },
    { id: "e6", kind: "call",      side: "outbound", when: "May 22, 2026 · 11:30 AM",    title: "Outbound call to Karen Hayes", body: "Marked wrong number, says she's a cousin and not in contact.", actor: "Devon Park" },
    { id: "e7", kind: "call",      side: "outbound", when: "May 14, 2026 · 3:45 PM",     title: "Outbound call to estate line", body: "Number out of service.", actor: "Bree Moss" },
  ];

  return (
    <main className="flex flex-col overflow-hidden bg-canvas">
      <header className="shrink-0 border-b border-gray-200 bg-surface px-7 py-4">
        <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
          {lead.leadId} · {lead.stageLabel}
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
            {lead.ownerName}
          </h1>
          <div className="font-mono text-[13px] text-gray-700">
            {fmtMoney(lead.estimatedSurplus)} surplus · est. net {fmtMoney(lead.estimatedNet)}
          </div>
        </div>
        <div className="mt-1 text-[12.5px] text-gray-600">
          {lead.propertyAddress}, {lead.city}, {lead.state} · {lead.county} ·{" "}
          {lead.saleProcess} {lead.saleDate}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-7 py-7">
        <div className="mx-auto max-w-[640px] space-y-4">
          {events.map((e) => (
            <ThreadEntry key={e.id} ev={e} />
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-surface px-7 py-3">
        <div className="mx-auto flex max-w-[640px] items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-petrol-500" />
          <span className="text-[12px] font-medium text-ink">
            On Call · Cornelius Jr. · (216) 555-0147
          </span>
          <span className="font-mono text-[12px] text-gray-700">02:14</span>
          <button className="ml-auto rounded-md border border-gray-200 bg-surface px-3 py-1.5 text-[11.5px] text-ink hover:border-gray-300">
            Mute
          </button>
          <button className="rounded-md border border-gray-200 bg-surface px-3 py-1.5 text-[11.5px] text-ink hover:border-gray-300">
            Hold
          </button>
          <button className="rounded-md bg-danger px-3.5 py-1.5 text-[11.5px] font-medium text-white">
            End Call
          </button>
        </div>
      </div>
    </main>
  );
}

function ThreadEntry({
  ev,
}: {
  ev: {
    kind: "call" | "note" | "mail" | "voicemail" | "stage";
    side: "outbound" | "inbound" | "system";
    when: string;
    title: string;
    body?: string;
    actor?: string;
  };
}) {
  if (ev.side === "system") {
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
          {ev.title} · {ev.when}
        </span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>
    );
  }
  const isOutbound = ev.side === "outbound";
  return (
    <article
      className={
        isOutbound
          ? "ml-12 rounded-md border border-gray-200 bg-surface px-4 py-3"
          : "mr-12 rounded-md border border-gray-200 bg-gray-50 px-4 py-3"
      }
    >
      <div className="flex items-baseline justify-between text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
        <span>
          {ev.kind} {isOutbound ? "· outbound" : "· inbound"}
        </span>
        <span>{ev.when}</span>
      </div>
      <div className="mt-1 text-[13px] font-medium text-ink">{ev.title}</div>
      {ev.body && (
        <p className="m-0 mt-1.5 text-[12.5px] leading-relaxed text-gray-700">
          {ev.body}
        </p>
      )}
      {ev.actor && (
        <div className="mt-1.5 text-[10.5px] text-gray-500">by {ev.actor}</div>
      )}
    </article>
  );
}

function ActionRail({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <aside className="overflow-y-auto border-l border-gray-200 bg-surface px-5 py-5">
      <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
        Decide
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <TriageBtn label="Interested" k="I" />
        <TriageBtn label="Not Interested" k="N" />
        <TriageBtn label="Callback" k="C" />
        <TriageBtn label="Voicemail" k="V" />
        <TriageBtn label="Wrong Number" k="W" />
        <TriageBtn label="Do Not Contact" k="D" />
      </div>

      <div className="mt-6 text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
        Snooze
      </div>
      <div className="mt-2 flex flex-col gap-1.5 text-[12px]">
        <SnoozeRow label="Later Today" hint="6:00 PM ET" />
        <SnoozeRow label="Tomorrow Morning" hint="9:00 AM ET" />
        <SnoozeRow label="Tuesday AM" hint="June 17 · 10:00 AM ET" />
        <SnoozeRow label="Next Week" hint="Monday June 23" />
      </div>

      <div className="mt-6 text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
        Contacts on Thread
      </div>
      <div className="mt-2 space-y-2">
        {lead.contacts.slice(0, 3).map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-2.5 rounded-md border border-gray-200 bg-surface px-2.5 py-1.5"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[9.5px] font-semibold text-gray-700">
              {c.initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[11.5px] font-medium text-ink">
                {c.name}
              </div>
              <div className="text-[10px] text-gray-500">{c.role}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function TriageBtn({ label, k }: { label: string; k: string }) {
  return (
    <button className="flex flex-col items-start rounded-md border border-gray-200 bg-surface px-2.5 py-2 text-left hover:border-gray-300">
      <span className="text-[11.5px] text-ink">{label}</span>
      <span className="mt-0.5 font-mono text-[9.5px] text-gray-500">⌥ {k}</span>
    </button>
  );
}

function SnoozeRow({ label, hint }: { label: string; hint: string }) {
  return (
    <button className="flex items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-gray-50">
      <span className="text-ink">{label}</span>
      <span className="text-[11px] text-gray-500">{hint}</span>
    </button>
  );
}
