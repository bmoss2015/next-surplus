import {
  CURRENT_LEAD,
  ESTATE,
  LAST_CONVERSATION,
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

export function V44() {
  return (
    <CanvasFrame>
      <div className="flex h-full w-full flex-col">
        <div className="flex h-12 items-center gap-4 border-b border-gray-200 bg-white px-6">
          <Logomark />
          <div className="ml-6 flex items-center gap-2">
            <LiveDot />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
              Session Active
            </span>
          </div>
          <StatChrome />
        </div>

        <div className="grid flex-1 grid-cols-[20%_55%_25%] divide-x divide-gray-200">
          <aside className="flex flex-col bg-white px-4 py-5">
            <Eyebrow tone="petrol">Next</Eyebrow>
            <div className="mt-3 rounded-xl bg-petrol-700 px-3 py-3 text-white">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                  Up Now
                </span>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold tabular-nums">
                  00:00
                </span>
              </div>
              <div className="mt-2 text-[13px] font-semibold tracking-tight">
                {QUEUE[1].name}
              </div>
              <div className="mt-0.5 text-[11px] text-white/80">
                {QUEUE[1].surplus} · {QUEUE[1].city}
              </div>
            </div>

            <div className="mt-5 flex-1 space-y-1.5 overflow-hidden">
              {QUEUE.slice(2).map((q, i) => (
                <div
                  key={q.id}
                  className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-gray-50"
                >
                  <div className="w-4 text-right text-[10px] font-semibold tabular-nums text-gray-400">
                    {i + 2}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold text-ink">
                      {q.name}
                    </div>
                    <div className="text-[10.5px] text-gray-500">
                      {q.surplus} · {q.city}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 border-t border-gray-200 pt-3 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
              7 Calls Remaining
            </div>
          </aside>

          <section className="relative flex flex-col bg-gradient-to-br from-[#04261c] via-[#0a3d4a] to-[#0d6c7d] px-10 pt-10 pb-8 text-white">
            <div className="flex items-center justify-between">
              <Eyebrow tone="light">Current</Eyebrow>
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 ring-1 ring-inset ring-white/20">
                <LiveDot />
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/85">
                  {CURRENT_LEAD.state}
                </span>
                <span className="text-[10.5px] font-semibold tabular-nums text-white">
                  {CURRENT_LEAD.talkTimer}
                </span>
              </div>
            </div>

            <div className="mt-10 flex items-start gap-7">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-[28px] font-bold ring-2 ring-inset ring-white/25">
                {CURRENT_LEAD.initials}
              </div>
              <div className="flex-1">
                <div className="text-[34px] font-semibold leading-tight tracking-tight">
                  {CURRENT_LEAD.name}
                </div>
                <div className="mt-2 font-mono text-[18px] text-white/90 tracking-wide">
                  {CURRENT_LEAD.phone}
                </div>
                <div className="mt-1 text-[12.5px] text-white/65">
                  {CURRENT_LEAD.address}
                </div>
                <div className="mt-5 inline-flex items-baseline gap-3 rounded-lg bg-white/8 px-4 py-2.5 ring-1 ring-inset ring-white/15">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/70">
                    Estimated Surplus
                  </span>
                  <span className="text-[24px] font-semibold tabular-nums">
                    {CURRENT_LEAD.surplus}
                  </span>
                  <span className="text-[10.5px] text-white/55">
                    {CURRENT_LEAD.leadId}
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
                <ControlButton label="End and Next" intent="primary" size="lg" />
              </div>
            </div>
          </section>

          <aside className="flex flex-col bg-white px-4 py-5">
            <Eyebrow tone="petrol">Lead Context</Eyebrow>

            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                Estate Facts
              </div>
              <dl className="mt-2 space-y-1.5 text-[11.5px]">
                {[
                  ["Cause No.", ESTATE.causeNumber],
                  ["Closing Bid", ESTATE.closingBid],
                  ["Surplus", ESTATE.estimatedSurplus],
                  ["Floor", ESTATE.surplusFloor],
                  ["Fee", `${ESTATE.recoveryFee} (Net ${ESTATE.netToOwner})`],
                  ["Probate Filed", ESTATE.probateFiled],
                  ["Attorney", ESTATE.attorney],
                  ["Heirs", `${ESTATE.heirsOfRecord} of Record`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-gray-500">{k}</dt>
                    <dd className="text-right font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-3 rounded-xl border border-petrol-300/30 bg-white px-3 py-3 shadow-card">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
                  Last Conversation
                </div>
                <div className="text-[10px] font-medium tabular-nums text-gray-400">
                  {LAST_CONVERSATION.date}
                </div>
              </div>
              <div className="mt-2 text-[11.5px] leading-snug text-ink">
                {LAST_CONVERSATION.summary}
              </div>
              <div className="mt-2 flex items-center gap-2 text-[10.5px]">
                <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-700">
                  Mood: {LAST_CONVERSATION.mood}
                </span>
                <span className="text-gray-500">
                  {LAST_CONVERSATION.duration}
                </span>
              </div>
            </div>

            <details className="mt-3 rounded-xl border border-gray-200 bg-white px-3 py-2">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                <span>Contact Tree ({CONTACTS.length})</span>
                <span className="text-[14px] text-gray-300">+</span>
              </summary>
              <div className="mt-2 space-y-1.5">
                {CONTACTS.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <div className="font-medium text-ink">{c.name}</div>
                      <div className="text-[10px] text-gray-500">{c.role}</div>
                    </div>
                    <div className="font-mono text-[10.5px] text-gray-600">
                      {c.phone}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </aside>
        </div>
      </div>
    </CanvasFrame>
  );
}
