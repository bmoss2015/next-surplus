import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, QUEUE, fmtMoney } from "../_sample";

export default async function V5Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const lead = ACTIVE_LEAD;
  const lines = [
    { id: "L1", lead: QUEUE[2], status: "connected" as const, contact: "Cornelius Jr.", number: "(216) 555-0147" },
    { id: "L2", lead: QUEUE[3], status: "ringing"   as const, contact: "Otis Crockett", number: "(865) 555-0148" },
    { id: "L3", lead: QUEUE[4], status: "ringing"   as const, contact: "Roosevelt Bell", number: "(845) 555-0136" },
    { id: "L4", lead: QUEUE[5], status: "voicemail" as const, contact: "Patricia Donnelly", number: "(610) 555-0111" },
  ];

  return (
    <div className="min-h-screen bg-ink text-white">
      <TopRibbon />

      <div className="grid h-[calc(100vh-49px)] grid-cols-[minmax(0,1fr)_300px]">
        <main className="overflow-hidden p-6">
          <ModeStrip />
          <div className="mt-5 grid h-[calc(100%-100px)] grid-cols-2 gap-4">
            {lines.map((line) => (
              <LineCard
                key={line.id}
                line={line}
                expanded={line.status === "connected"}
                lead={line.status === "connected" ? lead : undefined}
              />
            ))}
          </div>
        </main>

        <aside className="overflow-y-auto border-l border-white/10 bg-[#0a1722] p-5">
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-white/55">
            Session
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <SideStat label="Dials" value="42" />
            <SideStat label="Connects" value="6" />
            <SideStat label="Rate" value="14%" />
            <SideStat label="Talk" value="18:24" />
          </div>

          <div className="mt-6 text-[10.5px] uppercase tracking-[0.5px] text-white/55">
            Burn Down
          </div>
          <BurnDown />

          <div className="mt-6 text-[10.5px] uppercase tracking-[0.5px] text-white/55">
            Up Next
          </div>
          <div className="mt-2 space-y-2">
            {QUEUE.slice(6, 10).map((q) => (
              <div
                key={q.id}
                className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2"
              >
                <div className="flex items-center justify-between text-[10.5px] text-white/55">
                  <span>#{q.position}</span>
                  <span>{q.estReady}</span>
                </div>
                <div className="mt-0.5 truncate text-[12.5px] text-white">
                  {q.ownerName}
                </div>
                <div className="text-[10.5px] text-white/55">
                  {q.city}, {q.state} · {fmtMoney(q.surplus)}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function TopRibbon() {
  return (
    <div className="flex items-center justify-between border-b border-white/10 bg-[#04140d] px-6 py-3 text-[12px]">
      <div className="flex items-center gap-4">
        <Link href="/admin/dialer-mockup" className="text-white/55 hover:text-white">
          ← Back to mockups
        </Link>
        <span className="text-white/20">|</span>
        <span className="text-white/55">Parallel Power · 4 Lines</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-white/55">Caller ID Rotation On</span>
        <span className="text-white/20">|</span>
        <button className="rounded-md bg-danger px-3 py-1.5 text-[11.5px] font-medium text-white">
          Stop Session
        </button>
      </div>
    </div>
  );
}

function ModeStrip() {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[12px]">
      <div className="flex items-center gap-1.5">
        <ModeBtn label="Power Dial · 1 Line" />
        <ModeBtn label="Parallel · 4 Lines" active />
        <ModeBtn label="Parallel · 8 Lines" />
      </div>
      <div className="flex items-center gap-3 text-white/55">
        <span>Auto Connect On</span>
        <span className="text-white/20">|</span>
        <span>Voicemail Drop Ready</span>
      </div>
    </div>
  );
}

function ModeBtn({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={
        active
          ? "rounded-md bg-petrol-500 px-3 py-1.5 text-[11.5px] font-medium text-white"
          : "rounded-md bg-transparent px-3 py-1.5 text-[11.5px] text-white/65 hover:bg-white/5"
      }
    >
      {label}
    </button>
  );
}

function LineCard({
  line,
  expanded,
  lead,
}: {
  line: {
    id: string;
    lead: { ownerName: string; city: string; state: string; surplus: number; stageLabel: string };
    status: "connected" | "ringing" | "voicemail";
    contact: string;
    number: string;
  };
  expanded: boolean;
  lead?: typeof ACTIVE_LEAD;
}) {
  const statusColor: Record<typeof line.status, string> = {
    connected: "#5db98a",
    ringing:   "#534ab7",
    voicemail: "#9ca3af",
  };
  const statusLabel: Record<typeof line.status, string> = {
    connected: "Connected",
    ringing:   "Ringing",
    voicemail: "Voicemail Detected",
  };

  return (
    <article
      className={
        expanded
          ? "relative overflow-hidden rounded-lg border border-petrol-300 bg-[#0c2a1f] p-5"
          : "relative overflow-hidden rounded-lg border border-white/10 bg-[#0a1722] p-4"
      }
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: statusColor[line.status] }}
          />
          <span className="text-[10.5px] uppercase tracking-[0.5px] text-white/55">
            {line.id} · {statusLabel[line.status]}
          </span>
        </div>
        <button className="text-[10.5px] text-white/55 hover:text-white">
          {line.status === "connected" ? "Hand Off" : "Cancel"}
        </button>
      </div>

      <div className="mt-3">
        <div
          className={
            expanded
              ? "text-[20px] font-medium tracking-tight text-white"
              : "text-[14px] font-medium text-white"
          }
        >
          {line.contact}
        </div>
        <div
          className={
            expanded
              ? "font-mono text-[15px] text-white/75"
              : "font-mono text-[12px] text-white/55"
          }
        >
          {line.number}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11.5px]">
        <span className="text-white/55">{line.lead.ownerName}</span>
        <span className="text-right text-white/55">
          {line.lead.city}, {line.lead.state}
        </span>
        <span className="text-white/55">{line.lead.stageLabel}</span>
        <span className="text-right font-mono text-white">
          {fmtMoney(line.lead.surplus)}
        </span>
      </div>

      {expanded && lead && (
        <>
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[28px] font-medium tabular-nums leading-none text-white">
                02:14
              </div>
              <div className="flex items-center gap-1.5">
                <DarkBtn label="Mute" />
                <DarkBtn label="Hold" />
                <DarkBtn label="VM Drop" />
                <button className="rounded-md bg-danger px-3 py-1.5 text-[11.5px] font-medium text-white">
                  End
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-[10.5px] uppercase tracking-[0.5px] text-white/55">
              Live Context
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11.5px]">
              <KV label="Surplus" value={fmtMoney(lead.estimatedSurplus)} />
              <KV label="Est. Net" value={fmtMoney(lead.estimatedNet)} accent />
              <KV label="Owner" value={lead.ownerStatus} />
              <KV label="Stage" value={lead.stageLabel} />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-[10.5px] uppercase tracking-[0.5px] text-white/55">
              Last Note · June 14, 2026
            </div>
            <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-white/85">
              {lead.notes[0].body}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {["Interested", "Not Interested", "Callback", "Voicemail", "Wrong Number", "Do Not Contact"].map(
              (d) => (
                <button
                  key={d}
                  className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11.5px] text-white hover:bg-white/10"
                >
                  {d}
                </button>
              )
            )}
          </div>
        </>
      )}
    </article>
  );
}

function KV({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
      <span className="text-white/55">{label}</span>
      <span
        className={accent ? "font-mono text-petrol-300" : "font-mono text-white"}
      >
        {value}
      </span>
    </div>
  );
}

function DarkBtn({ label }: { label: string }) {
  return (
    <button className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11.5px] text-white hover:bg-white/10">
      {label}
    </button>
  );
}

function SideStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <div className="text-[10.5px] uppercase tracking-[0.5px] text-white/55">
        {label}
      </div>
      <div className="mt-1 font-mono text-[18px] font-medium tabular-nums text-white">
        {value}
      </div>
    </div>
  );
}

function BurnDown() {
  const remaining = [42, 39, 35, 32, 27, 23, 18, 14, 10, 7];
  const max = remaining[0];
  return (
    <div className="mt-2 flex h-16 items-end gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
      {remaining.map((r, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${(r / max) * 100}%`,
            background: i === remaining.length - 1 ? "#5db98a" : "#1a8a9c",
            opacity: i === remaining.length - 1 ? 1 : 0.45 + (i / remaining.length) * 0.5,
          }}
        />
      ))}
    </div>
  );
}
