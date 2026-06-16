import { notFound } from "next/navigation";
import Link from "next/link";
import { ACTIVE_LEAD, fmtMoney } from "../_sample";

export default async function V10Page() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <TopRibbon />
      <div className="grid flex-1 grid-cols-[260px_minmax(0,1fr)_340px] overflow-hidden">
        <ContextRail lead={lead} />
        <Transcript />
        <CoPilotRail />
      </div>
      <CallDock />
    </div>
  );
}

function TopRibbon() {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-surface px-7 py-3 text-[12px]">
      <div className="flex items-center gap-4">
        <Link href="/share/dialer-mockup" className="text-gray-500 hover:text-ink">
          ← Back to mockups
        </Link>
        <span className="text-gray-300">|</span>
        <span className="font-medium text-ink">Voice Co-Pilot</span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">Live transcript on</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-sm bg-petrol-100 px-1.5 py-[1px] text-[10.5px] font-medium text-petrol-700">
          Talk Score 78
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">Sentiment Warming</span>
      </div>
    </div>
  );
}

function ContextRail({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <aside className="overflow-y-auto border-r border-gray-200 bg-surface px-5 py-5">
      <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
        On Call
      </div>
      <div className="mt-1 text-[15px] font-semibold text-ink">
        Cornelius Jr.
      </div>
      <div className="font-mono text-[12.5px] text-gray-700">
        (216) 555-0147
      </div>

      <div className="mt-5 text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
        Lead
      </div>
      <div className="mt-1 text-[13px] font-medium text-ink">
        {lead.ownerName}
      </div>
      <div className="text-[11.5px] text-gray-700">
        {lead.propertyAddress}, {lead.city}, {lead.state}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Kv label="Surplus" value={fmtMoney(lead.estimatedSurplus)} mono />
        <Kv label="Est. Net" value={fmtMoney(lead.estimatedNet)} accent mono />
        <Kv label="Stage" value={lead.stageLabel} />
        <Kv label="Owner" value={lead.ownerStatus} />
      </div>

      <div className="mt-5 text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
        Tags
      </div>
      <div className="mt-2 flex flex-col gap-1">
        {lead.tags.map((t) => (
          <span
            key={t}
            className="rounded-sm border border-gray-200 bg-surface px-2 py-1 text-[11px] text-ink"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-5 text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
        Last Call Summary
      </div>
      <p className="m-0 mt-1.5 text-[11.5px] leading-relaxed text-gray-700">
        June 14, 2026 · He confirmed surplus, asked to speak with Yvette first,
        committed to Tuesday AM callback.
      </p>
    </aside>
  );
}

function Transcript() {
  const lines: Array<{
    id: string;
    who: "rep" | "lead" | "ai";
    at: string;
    text: string;
    flag?: "objection" | "opportunity";
  }> = [
    { id: "t1", who: "rep",  at: "00:04", text: "Cornelius, it's Bree from Moss Equity. Thanks for picking up. Last week you mentioned waiting until you spoke with Yvette." },
    { id: "t2", who: "lead", at: "00:18", text: "Right. Yeah, I talked to her over the weekend. We agreed we'd hear you out together but she's at work most days." },
    { id: "t3", who: "ai",   at: "00:22", text: "Opportunity: family aligned. Ask for the joint window now, do not pitch yet.", flag: "opportunity" },
    { id: "t4", who: "rep",  at: "00:30", text: "Totally understand. Would the 12:30 to 1:30 ET window she mentioned work for the three of us, say Tuesday?" },
    { id: "t5", who: "lead", at: "00:48", text: "I think so. She might be off on the second half of her lunch though, so closer to one would be better." },
    { id: "t6", who: "rep",  at: "01:06", text: "Perfect, we'll send you both a calendar hold for 1 PM Tuesday. Before I let you go, anything that's been bothering you about how this gets handled?" },
    { id: "t7", who: "lead", at: "01:22", text: "Honestly, the only thing is the fee. Twenty eight percent feels high. I want to understand what we're paying for." },
    { id: "t8", who: "ai",   at: "01:26", text: "Objection: pricing. Use the fixed-fee reframe and lean on attorney cost line. Don't discount.", flag: "objection" },
    { id: "t9", who: "rep",  at: "01:34", text: "Fair question. The twenty eight covers attorney filing, the title search, and the bond. Let me show that math when we're all together Tuesday." },
  ];
  return (
    <main className="overflow-y-auto bg-canvas px-7 py-6">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
            Live Transcript
          </div>
          <h2 className="m-0 mt-0.5 text-[18px] font-medium tracking-tight text-ink">
            Cornelius J. Hayes Jr. · Outbound
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <Dot color="#5db98a" /> Rep
          <Dot color="#0d4b3a" /> Lead
          <Dot color="#534ab7" /> AI Cue
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        {lines.map((l) => (
          <Line key={l.id} line={l} />
        ))}
      </div>

      <div className="mt-4 rounded-md border border-dashed border-gray-300 bg-surface px-4 py-3 text-[12px] italic text-gray-500">
        Listening… (live transcription would stream new lines here as they happen)
      </div>
    </main>
  );
}

function Line({
  line,
}: {
  line: {
    who: "rep" | "lead" | "ai";
    at: string;
    text: string;
    flag?: "objection" | "opportunity";
  };
}) {
  if (line.who === "ai") {
    const isObj = line.flag === "objection";
    return (
      <div
        className={
          isObj
            ? "flex items-start gap-3 rounded-md border border-danger-border bg-danger-bg px-3.5 py-2"
            : "flex items-start gap-3 rounded-md border border-petrol-300 bg-petrol-100 px-3.5 py-2"
        }
      >
        <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.5px] text-info-violet-deep">
          AI · {line.at}
        </span>
        <span className="text-[12.5px] text-ink">
          {line.text}
        </span>
      </div>
    );
  }
  const isRep = line.who === "rep";
  return (
    <div
      className={
        isRep
          ? "ml-12 flex flex-col items-end"
          : "mr-12 flex flex-col items-start"
      }
    >
      <div className="text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
        {isRep ? "Rep" : "Lead"} · {line.at}
      </div>
      <div
        className={
          isRep
            ? "mt-1 max-w-[80%] rounded-md bg-petrol-700 px-3.5 py-2 text-[13px] leading-relaxed text-white"
            : "mt-1 max-w-[80%] rounded-md border border-gray-200 bg-surface px-3.5 py-2 text-[13px] leading-relaxed text-ink"
        }
      >
        {line.text}
      </div>
    </div>
  );
}

function CoPilotRail() {
  const suggestions = [
    { tag: "Say Now", body: "\"The fee covers the attorney, title search, and bond. I'll show the math when we're all on Tuesday.\"" },
    { tag: "Avoid",   body: "Discounting the fee. Anchor on the value of the line items instead." },
    { tag: "Ask",     body: "\"What would make Tuesday's call feel like a win for both of you?\"" },
  ];
  const flags = [
    { kind: "Objection", at: "01:22", text: "Fee feels high (28%). Reframe attempted at 01:34." },
    { kind: "Commitment", at: "00:48", text: "Family agreed to a joint call. Tuesday around 1 PM ET." },
  ];
  return (
    <aside className="overflow-y-auto border-l border-gray-200 bg-surface px-5 py-5">
      <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
        Co-Pilot
      </div>
      <div className="mt-2 space-y-2.5">
        {suggestions.map((s) => (
          <div
            key={s.tag}
            className="rounded-md border border-gray-200 bg-surface px-3 py-2"
          >
            <div className="text-[10.5px] uppercase tracking-[0.4px] text-petrol-700">
              {s.tag}
            </div>
            <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-ink">
              {s.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
        Flagged Moments
      </div>
      <div className="mt-2 space-y-2.5">
        {flags.map((f) => (
          <div
            key={f.at}
            className="border-l-2 border-petrol-500 pl-3"
          >
            <div className="font-mono text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
              {f.at} · {f.kind}
            </div>
            <div className="mt-0.5 text-[12px] text-ink">{f.text}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
        Talk Time
      </div>
      <div className="mt-2 flex h-2 overflow-hidden rounded-sm bg-gray-150">
        <span className="block bg-petrol-700" style={{ width: "62%" }} />
        <span className="block bg-petrol-300" style={{ width: "38%" }} />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10.5px] text-gray-500">
        <span>Rep 62%</span>
        <span>Lead 38%</span>
      </div>
    </aside>
  );
}

function CallDock() {
  return (
    <div className="flex shrink-0 items-center justify-between border-t border-gray-200 bg-surface px-7 py-3">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-petrol-500" />
        <span className="text-[12px] font-medium text-ink">Connected</span>
        <span className="font-mono text-[16px] tabular-nums text-ink">02:14</span>
      </div>
      <div className="flex items-center gap-2">
        <DockBtn label="Mute" />
        <DockBtn label="Hold" />
        <DockBtn label="Voicemail Drop" />
        <DockBtn label="Note" />
        <button className="rounded-md bg-danger px-3.5 py-1.5 text-[12px] font-medium text-white">
          End Call
        </button>
      </div>
    </div>
  );
}

function DockBtn({ label }: { label: string }) {
  return (
    <button className="rounded-md border border-gray-200 bg-surface px-3 py-1.5 text-[12px] text-ink hover:border-gray-300">
      {label}
    </button>
  );
}

function Kv({
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
    <div className="rounded-md border border-gray-200 bg-surface px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-[0.4px] text-gray-500">
        {label}
      </div>
      <div
        className={
          (mono ? "font-mono " : "") +
          (accent ? "text-petrol-500 " : "text-ink ") +
          "mt-0.5 text-[12px] font-medium tabular-nums"
        }
      >
        {value}
      </div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ background: color }}
    />
  );
}
