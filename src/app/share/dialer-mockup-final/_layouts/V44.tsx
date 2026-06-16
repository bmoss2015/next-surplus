import {
  CURRENT_LEAD,
  QUEUE,
  CONTACTS,
  ACTIVITY,
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
  NewEstateFlashChip,
  AiSummary,
  QueueHeaderStats,
  QueueSearch,
  EstateFactsList,
  PETROL_GRADIENT,
} from "./Shared";

export function V44({ wrap = false }: { wrap?: boolean }) {
  return (
    <CanvasFrame>
      <div className="flex h-full w-full flex-col">
        <div className="flex h-14 items-center gap-5 border-b border-gray-200 bg-white px-6">
          <Logomark />
          <div className="flex items-center gap-2">
            <LiveDot />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
              Session Active
            </span>
          </div>
          <div className="ml-auto">
            <StatsStrip />
          </div>
        </div>

        <div className="grid flex-1 grid-cols-[20%_55%_25%] divide-x divide-gray-200">
          <aside className="flex flex-col bg-white px-3 py-4">
            <QueueHeaderStats />
            <div className="mt-3">
              <QueueSearch />
            </div>
            <div className="mt-3 flex flex-col gap-1.5 overflow-hidden">
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
                        <div
                          className={`mt-0.5 truncate text-[9.5px] ${
                            active ? "text-white/55" : "text-gray-400"
                          }`}
                        >
                          {q.surplus} · {q.county}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <section
            className={`relative flex flex-col px-9 pt-6 pb-7 text-white ${PETROL_GRADIENT}`}
          >
            {wrap && (
              <div className="absolute left-9 right-9 top-5 z-10">
                <CountdownBanner onDark />
              </div>
            )}

            <div className={`flex items-center justify-between ${wrap ? "mt-14" : ""}`}>
              <div className="flex items-center gap-2">
                <SameEstateChip />
                <NewEstateFlashChip />
              </div>
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

            <div className="mt-6 flex items-start gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-white/10 text-[24px] font-bold ring-1 ring-inset ring-white/15">
                {CURRENT_LEAD.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[28px] font-semibold leading-tight tracking-tight">
                  {CURRENT_LEAD.name}
                </div>
                <div className="mt-1 text-[12.5px] text-white/75">
                  {CURRENT_LEAD.relationship}
                </div>
                <div className="mt-2.5 flex items-center gap-3">
                  <span className="font-mono text-[15px] text-white/90 tracking-wide">
                    {CURRENT_LEAD.phone}
                  </span>
                  <span className="text-white/30">·</span>
                  <span className="text-[11.5px] text-white/65">
                    {CURRENT_LEAD.address}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white/65">
                  {CURRENT_LEAD.surplusLabel}
                </span>
                <span className="text-[24px] font-semibold tabular-nums">
                  {CURRENT_LEAD.surplus}
                </span>
                <span className="text-[10px] text-white/55">
                  {CURRENT_LEAD.leadId} · {CURRENT_LEAD.estate}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <AiSummary variant="dark" />
            </div>

            <div className="mt-auto">
              {wrap ? (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                    Disposition
                  </div>
                  <div className="mt-2.5">
                    <DispositionRow onDark size="lg" />
                  </div>
                  <div className="mt-2 text-[10.5px] text-white/55">
                    Select during ring time of next call. If next call connects first, the prompt defers.
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Control label="Mute" />
                  <Control label="Keypad" />
                  <Control label="Hold" />
                  <Control label="Transfer" />
                  <Control label="Add Note" intent="primary" />
                  <div className="ml-auto">
                    <Control label="End Call" intent="danger" size="lg" />
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="flex flex-col bg-white px-4 py-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                Estate Detail
              </div>
              <div className="mt-2">
                <EstateFactsList />
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-3">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                  Latest Activity
                </div>
                <span className="text-[10px] tabular-nums text-gray-400">
                  {ACTIVITY[0].when.replace(", 2026", "")}
                </span>
              </div>
              <div className="mt-1.5 text-[11.5px] text-ink">
                {ACTIVITY[0].what}
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-gray-500">
                <span>4 More Events</span>
                <span>·</span>
                <span className="cursor-pointer underline decoration-gray-300 underline-offset-2">
                  Open Timeline
                </span>
              </div>
            </div>

            <details className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                <span>Contact Tree ({CONTACTS.length})</span>
                <span className="text-[14px] text-gray-300">−</span>
              </summary>
              <div className="mt-2 space-y-2">
                {CONTACTS.map((c) => (
                  <div key={c.name} className="text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-medium ${c.active ? "text-petrol-700" : "text-ink"}`}>
                        {c.name}
                      </span>
                      <span className="font-mono text-[10.5px] text-gray-500">
                        {c.phone}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {c.relationship}
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
