import { CURRENT_LEAD, QUEUE, CONTACTS, ACTIVITY } from "../_data";
import {
  CanvasFrame,
  Logomark,
  StatsStrip,
  StatusBadge,
  CaseTypeChip,
  NewEstateFlashChip,
  HeroDivider,
  Control,
  DispositionRow,
  DispositionHeader,
  QuickNoteInput,
  CountdownBanner,
  AiSummary,
  FinancialBlock,
  QueueHeaderStats,
  QueueSearch,
  EstateFactsCard,
  LatestActivityCard,
  ContactTreeCard,
  PETROL_GRADIENT,
} from "./Shared";

export function V44({ wrap = false }: { wrap?: boolean }) {
  return (
    <CanvasFrame>
      <div className="flex h-full w-full flex-col">
        <div className="flex h-14 items-center gap-5 border-b border-gray-200 bg-white px-6">
          <Logomark />
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

          <section className={`relative flex flex-col text-white ${PETROL_GRADIENT}`}>
            {wrap && <CountdownBanner />}
            <div className="flex flex-1 flex-col px-9 pt-6 pb-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CaseTypeChip />
                  <NewEstateFlashChip />
                </div>
                <StatusBadge state={wrap ? "ended" : "live"} timer={CURRENT_LEAD.talkTimer} />
              </div>

              <div className="mt-6 flex items-start gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-white/10 text-[24px] font-bold">
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
                    <span className="font-mono text-[15px] tracking-wide text-white/90">
                      {CURRENT_LEAD.phone}
                    </span>
                    <span className="text-white/30">·</span>
                    <span className="text-[11.5px] text-white/65">
                      {CURRENT_LEAD.address}
                    </span>
                  </div>
                </div>
                <FinancialBlock />
              </div>

              <HeroDivider />

              <AiSummary dim={wrap} />

              <div className="mt-auto">
                {wrap ? (
                  <div>
                    <HeroDivider />
                    <DispositionHeader />
                    <DispositionRow />
                    <QuickNoteInput />
                  </div>
                ) : (
                  <>
                    <HeroDivider />
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
                  </>
                )}
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-3 bg-gray-50 p-4">
            <EstateFactsCard />
            <LatestActivityCard events={ACTIVITY} />
            <ContactTreeCard contacts={CONTACTS} />
          </aside>
        </div>
      </div>
    </CanvasFrame>
  );
}
