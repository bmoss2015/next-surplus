import { notFound } from "next/navigation";
import Link from "next/link";
import { ACTIVE_LEAD, fmtMoney } from "../_sample";

export default async function V3Page() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="min-h-screen bg-canvas">
      <TopRibbon leadId={lead.leadId} stageLabel={lead.stageLabel} />

      <div className="mx-auto grid max-w-[1180px] grid-cols-[minmax(0,1fr)_320px] gap-0 px-0 py-0">
        <main className="overflow-y-auto bg-surface px-12 py-10 min-h-[calc(100vh-49px)]">
          <Breadcrumb />

          <h1 className="m-0 mt-3 text-[36px] font-medium tracking-[-0.02em] text-ink">
            {lead.ownerName}
          </h1>
          <p className="mt-2 text-[14px] text-gray-500">
            Lead {lead.leadId} · {lead.stageLabel} · Last contact{" "}
            {lead.daysSinceContact} day ago
          </p>

          <Hr />

          <Heading>Property</Heading>
          <p className="m-0 text-[14.5px] leading-[1.65] text-gray-800">
            <strong className="text-ink">{lead.propertyAddress}</strong>,{" "}
            {lead.city}, {lead.state}. Sale held{" "}
            <strong className="text-ink">{lead.saleDate}</strong> in{" "}
            {lead.county} as a {lead.saleProcess.toLowerCase()}. Estimated
            surplus{" "}
            <strong className="text-ink">{fmtMoney(lead.estimatedSurplus)}</strong>{" "}
            against a {lead.recoveryFeePercent}% recovery fee. Estimated net to
            the firm{" "}
            <strong className="text-petrol-500">{fmtMoney(lead.estimatedNet)}</strong>
            .
          </p>

          <Heading>Owners and Heirs</Heading>
          <p className="m-0 text-[14.5px] leading-[1.65] text-gray-800">
            Primary owner is deceased. Estate enters probate March 2026, case{" "}
            <code className="rounded-sm bg-gray-100 px-1 py-[1px] font-mono text-[12.5px]">
              2026-PR-0488
            </code>
            . Two children of record, both reachable.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {lead.contacts.map((c, idx) => (
              <ContactCard key={c.id} contact={c} active={idx === 0} />
            ))}
          </div>

          <Heading>Conversation Log</Heading>
          {lead.notes.map((n) => (
            <blockquote
              key={n.id}
              className="mt-4 border-l-2 border-petrol-500 pl-4"
            >
              <div className="text-[11px] text-gray-500">
                <span className="font-medium text-ink">{n.author}</span> ·{" "}
                {n.createdAt}
              </div>
              <p className="m-0 mt-1 text-[14px] leading-[1.6] text-gray-800">
                {n.body}
              </p>
            </blockquote>
          ))}

          <Heading>Timeline</Heading>
          <ul className="m-0 mt-2 list-none pl-0">
            {lead.activity.map((a) => (
              <li
                key={a.id}
                className="flex items-baseline gap-3 border-b border-gray-150 py-2 text-[13px] last:border-b-0"
              >
                <span className="w-[150px] shrink-0 text-[11.5px] text-gray-500">
                  {a.at}
                </span>
                <span className="font-medium text-ink">{a.label}</span>
                {a.detail && (
                  <span className="text-gray-500">{a.detail}</span>
                )}
              </li>
            ))}
          </ul>

          <div className="h-24" />
        </main>

        <aside className="sticky top-[49px] flex h-[calc(100vh-49px)] flex-col gap-4 border-l border-gray-200 bg-canvas px-5 py-6">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
              On Call · Connected
            </div>
            <div className="mt-1.5 text-[14px] font-semibold text-ink">
              Cornelius J. Hayes Jr.
            </div>
            <div className="font-mono text-[12.5px] text-gray-700">
              (216) 555-0147
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-surface px-4 py-4 text-center">
            <div className="font-mono text-[32px] font-medium tabular-nums leading-none text-ink">
              02:14
            </div>
            <div className="mt-1 text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
              Talk Time
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <SideBtn label="Mute" />
              <SideBtn label="Hold" />
              <button className="rounded-md bg-danger px-3 py-1.5 text-[11.5px] font-medium text-white">
                End Call
              </button>
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-surface">
            <div className="border-b border-gray-200 px-4 py-2.5 text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
              Quick Note
            </div>
            <textarea
              className="block w-full resize-none border-0 bg-transparent px-4 py-3 text-[12.5px] text-ink outline-none"
              rows={5}
              placeholder="Type what was said. Cmd+Enter to save."
              defaultValue=""
            />
          </div>

          <div className="rounded-md border border-gray-200 bg-surface px-4 py-3 text-[11.5px]">
            <div className="text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
              Quick Actions
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              <CmdItem k="⌘D" label="Disposition" />
              <CmdItem k="⌘E" label="Compose Follow Up Email" />
              <CmdItem k="⌘S" label="Schedule Callback" />
              <CmdItem k="⌘P" label="Promote to Contract" />
            </div>
          </div>

          <div className="mt-auto text-[10.5px] text-gray-500">
            Press <code className="rounded-sm border border-gray-300 px-1 font-mono">⌘K</code> for the full command palette
          </div>
        </aside>
      </div>
    </div>
  );
}

function TopRibbon({ leadId, stageLabel }: { leadId: string; stageLabel: string }) {
  return (
    <div className="border-b border-gray-200 bg-surface">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-7 py-3 text-[12px]">
        <Link href="/share/dialer-mockup" className="text-gray-500 hover:text-ink">
          ← Back to mockups
        </Link>
        <div className="flex items-center gap-3 text-gray-500">
          <span>{leadId}</span>
          <span className="text-gray-300">|</span>
          <span className="rounded-sm border border-gray-200 bg-gray-50 px-1.5 py-[1px] text-[10.5px] font-medium text-ink">
            {stageLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

function Breadcrumb() {
  return (
    <div className="text-[11px] text-gray-500">
      <span>Dialer</span>
      <span className="px-1 text-gray-300">/</span>
      <span>Queue</span>
      <span className="px-1 text-gray-300">/</span>
      <span className="text-ink">Cornelius J. Hayes</span>
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="m-0 mb-2 mt-9 text-[18px] font-medium tracking-tight text-ink">
      {children}
    </h2>
  );
}

function Hr() {
  return <hr className="my-7 border-0 border-t border-gray-200" />;
}

function ContactCard({
  contact,
  active,
}: {
  contact: {
    initials: string;
    name: string;
    role: string;
    numbers: Array<{ formatted: string; state: string; label: string }>;
  };
  active: boolean;
}) {
  return (
    <div
      className={
        active
          ? "rounded-md border border-petrol-500 bg-surface px-3.5 py-3"
          : "rounded-md border border-gray-200 bg-surface px-3.5 py-3"
      }
    >
      <div className="flex items-center gap-2.5">
        <div
          className={
            active
              ? "flex h-7 w-7 items-center justify-center rounded-full bg-petrol-700 text-[10px] font-semibold text-white"
              : "flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700"
          }
        >
          {contact.initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[12.5px] font-semibold text-ink">
            {contact.name}
          </div>
          <div className="text-[10.5px] text-gray-500">{contact.role}</div>
        </div>
      </div>
      <div className="mt-2 space-y-1">
        {contact.numbers.map((n) => (
          <div
            key={n.formatted}
            className="flex items-center justify-between text-[11.5px]"
          >
            <span className="font-mono text-ink">{n.formatted}</span>
            <span className="text-[10.5px] text-gray-500">{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SideBtn({ label }: { label: string }) {
  return (
    <button className="rounded-md border border-gray-200 bg-surface px-2.5 py-1.5 text-[11.5px] text-ink hover:border-gray-300">
      {label}
    </button>
  );
}

function CmdItem({ k, label }: { k: string; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-sm px-2 py-1.5 hover:bg-gray-50">
      <span className="text-ink">{label}</span>
      <code className="rounded-sm border border-gray-300 px-1 font-mono text-[10px] text-gray-500">
        {k}
      </code>
    </div>
  );
}
