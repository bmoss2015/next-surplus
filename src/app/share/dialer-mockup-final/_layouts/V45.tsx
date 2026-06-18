import {
  CURRENT_LEAD,
  QUEUE,
  ESTATE,
} from "../_data";
import {
  CanvasFrame,
  Logomark,
  StatsStrip,
  LiveDot,
  Control,
  DispositionRow,
  CountdownBanner,
  SameEstateChip,
  AiSummary,
  QueueHeaderStats,
  QueueSearch,
  PETROL_GRADIENT,
} from "./Shared";

export function V45({ wrap = false }: { wrap?: boolean }) {
  return (
    <CanvasFrame>
      <div className="flex h-full w-full flex-col">
        <div className="flex h-14 items-center gap-5 border-b border-gray-200 bg-white px-6">
          <Logomark />
          <div className="ml-auto">
            <StatsStrip compact />
          </div>
        </div>

        <div className="grid flex-1 grid-cols-[18%_1fr_60px]">
          <aside className="flex flex-col bg-white px-3 py-4">
            <QueueHeaderStats />
            <div className="mt-3">
              <QueueSearch />
            </div>
            <div className="mt-3 space-y-1.5">
              {QUEUE.map((q, i) => {
                const active = q.state === "active";
                return (
                  <div
                    key={q.id}
                    className={`rounded-lg px-2.5 py-2 ${
                      active ? "bg-petrol-700 text-white" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 text-right text-[9.5px] font-semibold tabular-nums ${
                          active ? "text-white/60" : "text-gray-400"
                        }`}
                      >
                        {i + 1}
                      </span>
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
                            active ? "text-white/75" : "text-gray-500"
                          }`}
                        >
                          {q.relationship}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="relative flex items-center justify-center bg-canvas px-8 py-7">
            <div
              className={`flex h-full w-full max-w-[700px] flex-col rounded-2xl p-7 text-white shadow-elevated ${PETROL_GRADIENT}`}
            >
              {wrap && (
                <div className="mb-4">
                  <CountdownBanner onDark />
                </div>
              )}
              <div className="flex items-center justify-between">
                <SameEstateChip />
                <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1">
                  <LiveDot tone="light" />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/85">
                    {wrap ? "Call Ended" : CURRENT_LEAD.state}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-white">
                    {CURRENT_LEAD.talkTimer}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-white/10 text-[24px] font-bold ring-1 ring-inset ring-white/15">
                  {CURRENT_LEAD.initials}
                </div>
                <div className="mt-3.5 text-[26px] font-semibold leading-tight tracking-tight">
                  {CURRENT_LEAD.name}
                </div>
                <div className="mt-1 text-[12px] text-white/75">
                  {CURRENT_LEAD.relationship}
                </div>
                <div className="mt-2 font-mono text-[14.5px] text-white/85 tracking-wide">
                  {CURRENT_LEAD.phone}
                </div>
                <div className="mt-3 inline-flex items-baseline gap-3 rounded-lg bg-white/10 px-4 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65">
                    Net to Firm
                  </span>
                  <span className="text-[22px] font-semibold tabular-nums">
                    {CURRENT_LEAD.surplus}
                  </span>
                  <span className="text-[10px] text-white/55">
                    Case {ESTATE.caseNumber.replace("2026-PR-", "")}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <AiSummary variant="dark" compact />
              </div>

              <div className="mt-auto pt-5">
                {wrap ? (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                      Disposition
                    </div>
                    <div className="mt-2.5 flex justify-center">
                      <DispositionRow onDark size="md" />
                    </div>
                    <div className="mt-2 text-center text-[10px] text-white/55">
                      Logs during ring time of next call. Defers if next connects first.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Control label="Mute" />
                    <Control label="Keypad" />
                    <Control label="Hold" />
                    <Control label="Add Note" intent="primary" />
                    <Control label="End Call" intent="danger" size="lg" />
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="relative flex flex-col items-center justify-start border-l border-gray-200 bg-white py-6">
            <div className="rotate-180 [writing-mode:vertical-rl] text-[10px] font-semibold uppercase tracking-[0.18em] text-petrol-700">
              Lead Data Drawer
            </div>
            <div className="mt-3 flex h-7 w-7 items-center justify-center rounded-lg bg-petrol-700 text-white">
              <span className="text-[14px] leading-none">‹</span>
            </div>
            <div className="mt-auto rotate-180 [writing-mode:vertical-rl] text-[9px] uppercase tracking-[0.16em] text-gray-400">
              Estate · Activity · Contacts
            </div>
          </aside>
        </div>
      </div>
    </CanvasFrame>
  );
}
