import {
  CURRENT_LEAD,
  LAST_CONVERSATION,
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

export function V45() {
  return (
    <CanvasFrame>
      <div className="flex h-full w-full flex-col">
        <div className="flex h-12 items-center gap-4 border-b border-gray-200 bg-white px-6">
          <Logomark />
          <div className="ml-auto">
            <StatChrome />
          </div>
        </div>

        <div className="grid flex-1 grid-cols-[15%_1fr_56px]">
          <aside className="flex flex-col bg-white px-2 py-4">
            <Eyebrow tone="gray">Queue</Eyebrow>
            <div className="mt-3 space-y-1.5">
              {QUEUE.map((q, i) => {
                const active = q.state === "active";
                return (
                  <div
                    key={q.id}
                    className={`rounded-lg px-2 py-2 ${
                      active
                        ? "bg-petrol-700 text-white"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 text-right text-[9.5px] font-semibold tabular-nums ${
                          active ? "text-white/60" : "text-gray-400"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`truncate text-[11.5px] font-semibold ${
                            active ? "text-white" : "text-ink"
                          }`}
                        >
                          {q.name}
                        </div>
                        <div
                          className={`truncate text-[10px] ${
                            active ? "text-white/70" : "text-gray-500"
                          }`}
                        >
                          {q.surplus} · {q.city}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="relative flex items-center justify-center bg-canvas px-8 py-8">
            <div className="flex h-full w-full max-w-[680px] flex-col rounded-3xl bg-gradient-to-br from-[#04261c] via-[#0a3d4a] to-[#0d6c7d] p-8 text-white shadow-elevated">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 ring-1 ring-inset ring-white/20">
                  <LiveDot />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/85">
                    {CURRENT_LEAD.state}
                  </span>
                </div>
                <div className="font-mono text-[20px] font-semibold tabular-nums">
                  {CURRENT_LEAD.talkTimer}
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center text-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/10 text-[32px] font-bold ring-2 ring-inset ring-white/25">
                  {CURRENT_LEAD.initials}
                </div>
                <div className="mt-5 text-[30px] font-semibold tracking-tight">
                  {CURRENT_LEAD.name}
                </div>
                <div className="mt-1 font-mono text-[16px] text-white/85 tracking-wide">
                  {CURRENT_LEAD.phone}
                </div>
                <div className="mt-1 text-[12px] text-white/60">
                  {CURRENT_LEAD.address}
                </div>
                <div className="mt-4 inline-flex items-baseline gap-3 rounded-lg bg-white/10 px-4 py-2 ring-1 ring-inset ring-white/15">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                    Surplus
                  </span>
                  <span className="text-[22px] font-semibold tabular-nums">
                    {CURRENT_LEAD.surplus}
                  </span>
                  <span className="text-[10px] text-white/55">
                    {CURRENT_LEAD.leadId}
                  </span>
                </div>
              </div>

              <div className="mt-auto rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-inset ring-white/12">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                    Last Conversation · {LAST_CONVERSATION.date}
                  </div>
                  <div className="text-[10px] text-white/55">
                    {LAST_CONVERSATION.duration}, {LAST_CONVERSATION.mood}
                  </div>
                </div>
                <div className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-white/90">
                  {LAST_CONVERSATION.summary}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-center gap-2">
                <ControlButton label="Mute" />
                <ControlButton label="Keypad" />
                <ControlButton label="Hold" />
                <ControlButton label="Add Note" intent="primary" />
                <ControlButton label="End Call" intent="danger" size="lg" />
              </div>
            </div>
          </section>

          <aside className="relative flex flex-col items-center justify-start border-l border-gray-200 bg-white py-6">
            <div className="rotate-180 [writing-mode:vertical-rl] text-[10px] font-semibold uppercase tracking-[0.18em] text-petrol-700">
              Lead Data
            </div>
            <div className="mt-3 flex h-6 w-6 items-center justify-center rounded-full border border-petrol-700/40 text-petrol-700">
              <span className="text-[12px]">‹</span>
            </div>
            <div className="mt-auto rotate-180 [writing-mode:vertical-rl] text-[9px] uppercase tracking-[0.16em] text-gray-400">
              Estate · Notes · Contacts
            </div>
          </aside>
        </div>
      </div>
    </CanvasFrame>
  );
}
