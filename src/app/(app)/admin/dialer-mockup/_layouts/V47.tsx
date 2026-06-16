import {
  CURRENT_LEAD,
  ESTATE,
  LAST_CONVERSATION,
  ACTIVITY,
  QUEUE,
  COMPLETED_TODAY,
} from "../_data";
import {
  CanvasFrame,
  StatChrome,
  Logomark,
  LiveDot,
  ControlButton,
  Eyebrow,
} from "./Shared";

export function V47() {
  return (
    <CanvasFrame>
      <div className="flex h-full w-full flex-col bg-canvas">
        <div className="flex h-11 items-center gap-4 border-b border-gray-200 bg-white px-6">
          <Logomark />
          <div className="ml-auto">
            <StatChrome compact />
          </div>
        </div>

        <div className="grid flex-1 grid-rows-3 gap-3 px-5 py-4">
          <div className="row-span-1 rounded-2xl bg-gradient-to-r from-[#04261c] via-[#0a3d4a] to-[#0d6c7d] px-6 py-5 text-white shadow-elevated">
            <div className="flex h-full items-center gap-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/10 text-[24px] font-bold ring-2 ring-inset ring-white/25">
                {CURRENT_LEAD.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <LiveDot />
                  <Eyebrow tone="light">Current</Eyebrow>
                  <span className="text-[10.5px] tabular-nums text-white/65">
                    {CURRENT_LEAD.leadId}
                  </span>
                </div>
                <div className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">
                  {CURRENT_LEAD.name}
                </div>
                <div className="mt-0.5 font-mono text-[14.5px] text-white/85 tracking-wide">
                  {CURRENT_LEAD.phone}
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-center rounded-xl bg-white/10 px-5 py-3 ring-1 ring-inset ring-white/15">
                <div className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/65">
                  Surplus
                </div>
                <div className="text-[22px] font-semibold tabular-nums leading-none">
                  {CURRENT_LEAD.surplus}
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-center rounded-xl bg-white/10 px-5 py-3 ring-1 ring-inset ring-white/15">
                <div className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/65">
                  Talk
                </div>
                <div className="font-mono text-[22px] font-semibold tabular-nums leading-none">
                  {CURRENT_LEAD.talkTimer}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <ControlButton label="Mute" />
                <ControlButton label="Hold" />
                <ControlButton label="Note" intent="primary" />
                <ControlButton label="End" intent="danger" />
              </div>
            </div>
          </div>

          <div className="row-span-1 grid grid-cols-[1.1fr_1.6fr_0.9fr] gap-3">
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
              <Eyebrow tone="petrol">Estate Facts</Eyebrow>
              <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-[11.5px]">
                {[
                  ["Cause No.", ESTATE.causeNumber],
                  ["Closing Bid", ESTATE.closingBid],
                  ["Surplus", ESTATE.estimatedSurplus],
                  ["Fee / Net", `${ESTATE.recoveryFee} / ${ESTATE.netToOwner}`],
                  ["Probate", ESTATE.probateFiled],
                  ["Attorney", ESTATE.attorney],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                      {k}
                    </dt>
                    <dd className="mt-0.5 font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-2xl border border-petrol-300/30 bg-white px-5 py-4 shadow-card">
              <div className="flex items-center justify-between">
                <Eyebrow tone="petrol">Last Conversation</Eyebrow>
                <div className="text-[10px] tabular-nums text-gray-500">
                  {LAST_CONVERSATION.date} · {LAST_CONVERSATION.duration}
                </div>
              </div>
              <div className="mt-2 text-[12px] leading-snug text-ink">
                {LAST_CONVERSATION.summary}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-700">
                  Mood: {LAST_CONVERSATION.mood}
                </span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-700">
                  Next: Documentation Packet
                </span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-700">
                  Loop In Sister Loretta
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
              <Eyebrow tone="petrol">Activity</Eyebrow>
              <ul className="mt-2.5 space-y-2">
                {ACTIVITY.slice(0, 4).map((a) => (
                  <li
                    key={a.when}
                    className="flex items-baseline gap-2.5 text-[11px]"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-petrol-500" />
                    <div className="flex-1">
                      <div className="text-ink">{a.what}</div>
                      <div className="text-[9.5px] tabular-nums text-gray-400">
                        {a.when}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="row-span-1 rounded-2xl border border-gray-200 bg-white px-5 py-4">
            <div className="flex items-center justify-between">
              <Eyebrow tone="petrol">Queue</Eyebrow>
              <div className="text-[10.5px] tabular-nums text-gray-500">
                {COMPLETED_TODAY.length} Done · 1 Live · {QUEUE.length - 1} Next
              </div>
            </div>
            <div className="mt-3 flex items-stretch gap-2 overflow-hidden">
              {COMPLETED_TODAY.map((c) => (
                <div
                  key={c.id}
                  className="flex w-[148px] shrink-0 flex-col rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    Done
                  </span>
                  <span className="mt-0.5 truncate text-[11.5px] font-medium text-gray-400 line-through">
                    {c.name}
                  </span>
                  <span className="text-[10px] text-gray-400">{c.outcome}</span>
                </div>
              ))}
              {QUEUE.slice(0, 6).map((q, i) => {
                const active = q.state === "active";
                return (
                  <div
                    key={q.id}
                    className={`flex w-[148px] shrink-0 flex-col rounded-lg border px-3 py-2 ${
                      active
                        ? "border-petrol-700 bg-white shadow-card"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9.5px] font-semibold uppercase tracking-[0.14em] ${
                          active ? "text-petrol-700" : "text-gray-400"
                        }`}
                      >
                        {active ? "Live" : `Next ${i}`}
                      </span>
                      <span className="text-[10px] font-semibold tabular-nums text-ink">
                        {q.surplus}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-[11.5px] font-semibold text-ink">
                      {q.name}
                    </div>
                    <div className="truncate text-[10px] text-gray-500">
                      {q.city}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </CanvasFrame>
  );
}
