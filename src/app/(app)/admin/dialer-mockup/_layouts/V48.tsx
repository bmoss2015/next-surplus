import {
  CURRENT_LEAD,
  ESTATE,
  LAST_CONVERSATION,
  ACTIVITY,
  CONTACTS,
  QUEUE,
} from "../_data";
import {
  CanvasFrame,
  StatChrome,
  Logomark,
  LiveDot,
  ControlButton,
  Eyebrow,
} from "./Shared";

export function V48() {
  return (
    <CanvasFrame>
      <div className="flex h-full w-full flex-col bg-canvas">
        <div className="flex h-11 items-center gap-4 border-b border-gray-200 bg-white px-6">
          <Logomark />
          <div className="ml-auto">
            <StatChrome compact />
          </div>
        </div>

        <div className="grid flex-1 grid-cols-[65%_35%] gap-3 p-4">
          <div className="grid grid-rows-[65%_35%] gap-3">
            <section className="relative flex flex-col rounded-2xl bg-gradient-to-br from-[#04261c] via-[#0a3d4a] to-[#0d6c7d] px-8 py-7 text-white shadow-elevated">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 ring-1 ring-inset ring-white/20">
                  <LiveDot />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/85">
                    {CURRENT_LEAD.state}
                  </span>
                  <span className="text-[10.5px] tabular-nums text-white">
                    {CURRENT_LEAD.talkTimer}
                  </span>
                </div>
                <span className="text-[10.5px] tabular-nums text-white/55">
                  {CURRENT_LEAD.leadId}
                </span>
              </div>

              <div className="mt-6 flex items-start gap-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-[28px] font-bold ring-2 ring-inset ring-white/25">
                  {CURRENT_LEAD.initials}
                </div>
                <div className="flex-1">
                  <div className="text-[32px] font-semibold leading-tight tracking-tight">
                    {CURRENT_LEAD.name}
                  </div>
                  <div className="mt-2 font-mono text-[17px] text-white/90 tracking-wide">
                    {CURRENT_LEAD.phone}
                  </div>
                  <div className="mt-0.5 text-[12px] text-white/65">
                    {CURRENT_LEAD.address}
                  </div>
                  <div className="mt-5 inline-flex items-baseline gap-3 rounded-lg bg-white/10 px-4 py-2 ring-1 ring-inset ring-white/15">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/70">
                      Surplus
                    </span>
                    <span className="text-[22px] font-semibold tabular-nums">
                      {CURRENT_LEAD.surplus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2">
                <ControlButton label="Mute" />
                <ControlButton label="Keypad" />
                <ControlButton label="Hold" />
                <ControlButton label="Transfer" />
                <ControlButton label="Add Note" intent="primary" />
                <div className="ml-auto flex items-center gap-2">
                  <ControlButton label="End Call" intent="danger" size="lg" />
                </div>
              </div>
            </section>

            <section className="grid grid-cols-[1fr_1.4fr_0.9fr] gap-3">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <Eyebrow tone="petrol">Estate</Eyebrow>
                <dl className="mt-2 space-y-1 text-[11px]">
                  {[
                    ["Cause", ESTATE.causeNumber],
                    ["Bid", ESTATE.closingBid],
                    ["Surplus", ESTATE.estimatedSurplus],
                    ["Fee", `${ESTATE.recoveryFee}, Net ${ESTATE.netToOwner}`],
                    ["Probate", ESTATE.probateFiled],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-gray-500">{k}</dt>
                      <dd className="text-right font-medium text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-2xl border border-petrol-300/30 bg-white px-4 py-3 shadow-card">
                <div className="flex items-center justify-between">
                  <Eyebrow tone="petrol">Last Conversation</Eyebrow>
                  <span className="text-[10px] tabular-nums text-gray-500">
                    {LAST_CONVERSATION.date}
                  </span>
                </div>
                <div className="mt-1.5 text-[11.5px] leading-snug text-ink">
                  {LAST_CONVERSATION.summary}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-700">
                    Mood: {LAST_CONVERSATION.mood}
                  </span>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-700">
                    {LAST_CONVERSATION.duration}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <Eyebrow tone="petrol">Recent</Eyebrow>
                <ul className="mt-2 space-y-1.5">
                  {ACTIVITY.slice(0, 4).map((a) => (
                    <li
                      key={a.when}
                      className="flex items-baseline gap-2 text-[10.5px]"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-petrol-500" />
                      <span className="flex-1 text-ink">{a.what}</span>
                      <span className="tabular-nums text-gray-400">
                        {a.when.replace(", 2026", "")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-3">
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white px-4 py-4">
              <div className="flex items-center justify-between">
                <Eyebrow tone="petrol">Queue</Eyebrow>
                <span className="text-[10px] tabular-nums text-gray-500">
                  {QUEUE.length - 1} Remaining
                </span>
              </div>
              <div className="mt-2.5 space-y-1">
                {QUEUE.slice(1, 7).map((q, i) => (
                  <div
                    key={q.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50"
                  >
                    <div className="w-4 text-right text-[9.5px] font-semibold tabular-nums text-gray-400">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11.5px] font-semibold text-ink">
                        {q.name}
                      </div>
                      <div className="truncate text-[10px] text-gray-500">
                        {q.surplus} · {q.city}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <Eyebrow tone="petrol">Notes</Eyebrow>
              <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
                Type a note. Saves to the lead timeline on hangup.
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-700">
                  Send Documentation
                </span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-700">
                  Add Loretta
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <Eyebrow tone="petrol">Contact Tree</Eyebrow>
              <div className="mt-2 space-y-1.5">
                {CONTACTS.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between text-[11px]"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-ink">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-gray-500">{c.role}</div>
                    </div>
                    <span className="font-mono text-[10.5px] text-gray-600">
                      {c.phone}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </CanvasFrame>
  );
}
