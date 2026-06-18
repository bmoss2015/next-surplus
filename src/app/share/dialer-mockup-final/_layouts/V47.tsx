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
  AiSummary,
  QueueHeaderStats,
  QueueSearch,
  EstateFactsList,
  PETROL_GRADIENT,
} from "./Shared";

export function V47({ wrap = false }: { wrap?: boolean }) {
  return (
    <CanvasFrame>
      <div className="flex h-full w-full flex-col bg-canvas">
        <div className="flex h-12 items-center gap-5 border-b border-gray-200 bg-white px-6">
          <Logomark />
          <div className="ml-auto">
            <StatsStrip compact />
          </div>
        </div>

        <div className="grid flex-1 grid-rows-3 gap-3 px-5 py-4">
          <section
            className={`relative row-span-1 flex flex-col rounded-2xl px-6 py-5 text-white shadow-elevated ${PETROL_GRADIENT}`}
          >
            {wrap && (
              <div className="absolute left-6 right-6 top-4 z-10">
                <CountdownBanner onDark />
              </div>
            )}
            <div className={`flex flex-1 items-center gap-5 ${wrap ? "mt-12" : ""}`}>
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[24px] font-bold ring-1 ring-inset ring-white/15">
                {CURRENT_LEAD.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <SameEstateChip />
                  <span className="text-[10px] tabular-nums text-white/55">
                    {CURRENT_LEAD.leadId}
                  </span>
                </div>
                <div className="mt-1 text-[24px] font-semibold leading-tight tracking-tight">
                  {CURRENT_LEAD.name}
                </div>
                <div className="text-[12px] text-white/75">
                  {CURRENT_LEAD.relationship}
                </div>
                <div className="mt-1 font-mono text-[13px] text-white/85 tracking-wide">
                  {CURRENT_LEAD.phone}
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-center rounded-lg bg-white/10 px-5 py-3">
                <div className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white/65">
                  Net to Firm
                </div>
                <div className="text-[22px] font-semibold tabular-nums leading-none">
                  {CURRENT_LEAD.surplus}
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-center rounded-lg bg-white/10 px-5 py-3">
                <div className="flex items-center gap-1.5">
                  <LiveDot tone="light" />
                  <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white/65">
                    {wrap ? "Ended" : "Talk"}
                  </span>
                </div>
                <div className="font-mono text-[22px] font-semibold tabular-nums leading-none">
                  {CURRENT_LEAD.talkTimer}
                </div>
              </div>
              <div className="shrink-0">
                {wrap ? (
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white/65">
                      Disposition
                    </div>
                    <DispositionRow onDark size="md" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Control label="Mute" />
                    <Control label="Hold" />
                    <Control label="Add Note" intent="primary" />
                    <Control label="End Call" intent="danger" size="md" />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4">
              <AiSummary variant="dark" compact />
            </div>
          </section>

          <section className="row-span-1 grid grid-cols-[1.1fr_0.9fr_1fr] gap-3">
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
                  Estate Detail
                </div>
                <span className="text-[10px] text-gray-400">Hayes Estate</span>
              </div>
              <div className="mt-2.5">
                <EstateFactsList />
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white px-5 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
                Latest Activity
              </div>
              <div className="mt-3 flex items-baseline gap-2 rounded-lg bg-gray-50 px-3 py-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-petrol-500" />
                <div className="flex-1">
                  <div className="text-[11.5px] font-medium text-ink">
                    {ACTIVITY[0].what}
                  </div>
                  <div className="text-[10px] tabular-nums text-gray-500">
                    {ACTIVITY[0].when}
                  </div>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {ACTIVITY.slice(1, 4).map((a) => (
                  <li key={a.when} className="flex items-baseline gap-2 text-[10.5px]">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                    <span className="flex-1 text-gray-700">{a.what}</span>
                    <span className="tabular-nums text-gray-400">
                      {a.when.replace(", 2026", "")}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-3 text-[10px] text-gray-500">
                <span className="cursor-pointer underline decoration-gray-300 underline-offset-2">
                  Open Full Timeline
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
                  Contact Tree
                </div>
                <span className="text-[10px] text-gray-400">{CONTACTS.length} Members</span>
              </div>
              <div className="mt-2.5 space-y-1.5">
                {CONTACTS.map((c) => (
                  <div key={c.name} className="rounded-lg px-2 py-1.5 hover:bg-gray-50">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className={`font-medium ${c.active ? "text-petrol-700" : "text-ink"}`}>
                        {c.name}
                      </span>
                      <span className="font-mono text-[10px] text-gray-500">
                        {c.phone}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500">{c.relationship}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 inline-flex h-7 cursor-pointer items-center rounded-lg bg-gray-100 px-3 text-[10.5px] font-semibold text-ink">
                Open Notes Overlay
              </div>
            </div>
          </section>

          <section className="row-span-1 flex flex-col rounded-2xl border border-gray-200 bg-white px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
                Queue
              </div>
              <div className="flex flex-1 items-center gap-3">
                <div className="max-w-[280px] flex-1">
                  <QueueSearch />
                </div>
                <QueueHeaderStats />
              </div>
            </div>
            <div className="mt-3 flex flex-1 items-stretch gap-2 overflow-hidden">
              {QUEUE.map((q, i) => {
                const active = q.state === "active";
                return (
                  <div
                    key={q.id}
                    className={`flex w-[156px] shrink-0 flex-col rounded-lg border px-3 py-2.5 ${
                      active
                        ? "border-petrol-700 bg-white"
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
                      {q.relationship}
                    </div>
                    <div className="mt-auto pt-1.5 truncate text-[9.5px] text-gray-400">
                      {q.estate} · {q.county}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </CanvasFrame>
  );
}
