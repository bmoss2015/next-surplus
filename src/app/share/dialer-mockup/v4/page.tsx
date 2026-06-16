import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ACTIVE_LEAD,
  DAY_LABELS,
  HOUR_LABELS,
  QUEUE,
  fmtMoney,
} from "../_sample";

export default async function V4Page() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const lead = ACTIVE_LEAD;
  const matrix = lead.bestTimeMatrix;
  const matrixMax = Math.max(...matrix.flat());

  return (
    <div className="min-h-screen bg-canvas">
      <TopRibbon leadId={lead.leadId} ownerName={lead.ownerName} />

      <div className="grid h-[calc(100vh-49px)] grid-cols-[260px_minmax(0,1fr)_320px]">
        <QueueRail />

        <main className="overflow-y-auto bg-surface px-7 py-7">
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
            Best Time To Reach · {lead.ownerName}
          </div>
          <h2 className="m-0 mt-1 text-[22px] font-medium tracking-tight text-ink">
            Pickup probability by day and hour
          </h2>
          <p className="mt-1.5 max-w-[60ch] text-[12.5px] text-gray-500">
            Based on twelve attempts across this lead and stage-matched lookalikes.
            Darker cells = higher chance of an answer in that hour. Current
            window is highlighted.
          </p>

          <div className="mt-7 overflow-hidden rounded-md border border-gray-200">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-[60px] border-r border-gray-200 bg-gray-50 px-2 py-2 text-left text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
                    Day
                  </th>
                  {HOUR_LABELS.map((h) => (
                    <th
                      key={h}
                      className="border-r border-gray-200 bg-gray-50 px-2 py-2 text-[10.5px] uppercase tracking-[0.4px] text-gray-500 last:border-r-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAY_LABELS.map((d, di) => (
                  <tr key={d}>
                    <td className="border-r border-gray-200 bg-gray-50 px-2 py-3 text-[11.5px] font-medium text-ink">
                      {d}
                    </td>
                    {matrix[di].map((v, hi) => {
                      const isPeak = di === 4 && hi === 3;
                      const intensity = v / matrixMax;
                      const bg =
                        v === 0
                          ? "#fafbfc"
                          : `rgba(13, 75, 58, ${0.12 + intensity * 0.75})`;
                      return (
                        <td
                          key={hi}
                          className={
                            isPeak
                              ? "relative border-r border-gray-200 px-0 py-0 ring-2 ring-petrol-500 last:border-r-0"
                              : "relative border-r border-gray-200 px-0 py-0 last:border-r-0"
                          }
                          style={{ background: bg, height: 46 }}
                          title={`${d} ${HOUR_LABELS[hi]} · ${v} previous answers`}
                        >
                          {v > 0 && (
                            <span
                              className={
                                intensity > 0.5
                                  ? "absolute inset-0 flex items-center justify-center text-[10.5px] font-medium text-white"
                                  : "absolute inset-0 flex items-center justify-center text-[10.5px] font-medium text-petrol-700"
                              }
                            >
                              {v}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-center justify-between text-[11.5px] text-gray-500">
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <ScaleBar />
              <span>More</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm ring-2 ring-petrol-500" />
              <span>Recommended Window · Thursday 3 PM ET</span>
            </div>
          </div>

          <div className="mt-9 grid grid-cols-3 gap-4">
            <Metric label="Average Connect Rate" value="42%" />
            <Metric label="Best Day This Week" value="Thursday" />
            <Metric label="Avg Talk Time" value="3:48" />
          </div>

          <Block title="What This Matrix Sees">
            <ul className="m-0 list-none space-y-2 pl-0 text-[13px] leading-relaxed text-gray-700">
              <li>
                <strong className="text-ink">5 prior outbound attempts</strong>{" "}
                on this lead, two answered, one returned the call later in the
                same evening window.
              </li>
              <li>
                <strong className="text-ink">7 stage-matched lookalikes</strong>{" "}
                (deceased owner + heir reachable, OH) show a Tue / Thu evening
                spike, weak weekend pickup.
              </li>
              <li>
                <strong className="text-ink">Yvette Hayes-Brown</strong>{" "}
                explicitly asked for the 12:30 to 1:30 PM ET window on her last
                call.
              </li>
            </ul>
          </Block>
        </main>

        <CallRail lead={lead} />
      </div>
    </div>
  );
}

function TopRibbon({
  leadId,
  ownerName,
}: {
  leadId: string;
  ownerName: string;
}) {
  return (
    <div className="border-b border-gray-200 bg-surface">
      <div className="flex items-center justify-between px-7 py-3 text-[12px]">
        <div className="flex items-center gap-4">
          <Link
            href="/share/dialer-mockup"
            className="text-gray-500 hover:text-ink"
          >
            ← Back to mockups
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500">{leadId}</span>
          <span className="text-ink font-medium">{ownerName}</span>
        </div>
        <div className="text-gray-500">
          12 Calls Today · 5 Connects · Avg 3:48
        </div>
      </div>
    </div>
  );
}

function QueueRail() {
  return (
    <aside className="overflow-y-auto border-r border-gray-200 bg-surface-muted py-4">
      <div className="px-5 text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
        Queue · 10 Leads
      </div>
      <div className="mt-2">
        {QUEUE.map((q) => (
          <div
            key={q.id}
            className={
              q.status === "active"
                ? "border-l-2 border-petrol-500 bg-surface px-5 py-2.5"
                : "border-l-2 border-transparent px-5 py-2.5 hover:bg-surface"
            }
          >
            <div className="flex items-center justify-between text-[10.5px] text-gray-500">
              <span>#{q.position}</span>
              <span>{q.estReady}</span>
            </div>
            <div
              className={
                q.status === "active"
                  ? "mt-0.5 truncate text-[12.5px] font-semibold text-ink"
                  : q.status === "done"
                  ? "mt-0.5 truncate text-[12px] text-gray-400 line-through"
                  : "mt-0.5 truncate text-[12px] text-ink"
              }
            >
              {q.ownerName}
            </div>
            <div className="text-[10.5px] text-gray-500">
              {q.city}, {q.state} · {fmtMoney(q.surplus)}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function CallRail({
  lead,
}: {
  lead: typeof ACTIVE_LEAD;
}) {
  return (
    <aside className="flex flex-col gap-4 border-l border-gray-200 bg-surface-muted p-5">
      <div className="rounded-md border border-gray-200 bg-surface px-4 py-4">
        <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
          On Call · Connected
        </div>
        <div className="mt-1 text-[14px] font-semibold text-ink">
          Cornelius J. Hayes Jr.
        </div>
        <div className="font-mono text-[12px] text-gray-700">(216) 555-0147 · Mobile</div>
        <div className="mt-3 font-mono text-[30px] font-medium tabular-nums leading-none text-ink">
          02:14
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <SideBtn label="Mute" />
          <SideBtn label="Hold" />
          <button className="ml-auto rounded-md bg-danger px-3 py-1.5 text-[11.5px] font-medium text-white">
            End Call
          </button>
        </div>
      </div>

      <div className="rounded-md border border-gray-200 bg-surface px-4 py-4">
        <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
          Lead Card
        </div>
        <div className="mt-2 text-[13px] font-medium text-ink">
          {lead.ownerName}
        </div>
        <div className="text-[11.5px] text-gray-700">
          {lead.propertyAddress}, {lead.city}, {lead.state}
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[11.5px]">
          <div className="text-gray-500">Surplus</div>
          <div className="text-right font-mono text-ink">
            {fmtMoney(lead.estimatedSurplus)}
          </div>
          <div className="text-gray-500">Est. Net</div>
          <div className="text-right font-mono text-petrol-500">
            {fmtMoney(lead.estimatedNet)}
          </div>
          <div className="text-gray-500">Last Contact</div>
          <div className="text-right text-ink">
            {lead.daysSinceContact} Day Ago
          </div>
        </div>
      </div>

      <div className="rounded-md border border-gray-200 bg-surface">
        <div className="border-b border-gray-200 px-4 py-2 text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
          Disposition
        </div>
        <div className="grid grid-cols-2 gap-px bg-gray-200 p-px">
          <DispTile label="Interested" />
          <DispTile label="Not Interested" />
          <DispTile label="Callback" />
          <DispTile label="Voicemail" />
          <DispTile label="Wrong Number" />
          <DispTile label="Do Not Contact" />
        </div>
      </div>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-surface px-4 py-3">
      <div className="text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
        {label}
      </div>
      <div className="mt-1 font-mono text-[22px] font-medium tabular-nums text-ink">
        {value}
      </div>
    </div>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9 rounded-md border border-gray-200 bg-surface px-5 py-4">
      <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ScaleBar() {
  const cells = [0.12, 0.3, 0.5, 0.7, 0.87];
  return (
    <span className="inline-flex overflow-hidden rounded-sm border border-gray-200">
      {cells.map((c, i) => (
        <span
          key={i}
          className="block h-3 w-4"
          style={{ background: `rgba(13, 75, 58, ${c})` }}
        />
      ))}
    </span>
  );
}

function SideBtn({ label }: { label: string }) {
  return (
    <button className="rounded-md border border-gray-200 bg-surface px-2.5 py-1.5 text-[11.5px] text-ink hover:border-gray-300">
      {label}
    </button>
  );
}

function DispTile({ label }: { label: string }) {
  return (
    <button className="bg-surface px-3 py-2.5 text-left text-[11.5px] text-ink hover:bg-gray-50">
      {label}
    </button>
  );
}
