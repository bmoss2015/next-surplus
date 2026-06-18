import { CURRENT_LEAD, QUEUE, CONTACTS, ACTIVITY } from "../_data";
import {
  CanvasFrame,
  Logomark,
  StatsStrip,
  StatusBadge,
  CaseTypeChip,
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

export function V45({
  wrap = false,
  drawerOpen = false,
}: {
  wrap?: boolean;
  drawerOpen?: boolean;
}) {
  const rightCol = drawerOpen ? "360px" : "60px";
  return (
    <CanvasFrame>
      <div className="flex h-full w-full flex-col">
        <div className="flex h-14 items-center gap-5 border-b border-gray-200 bg-white px-6">
          <Logomark />
          <div className="ml-auto">
            <StatsStrip />
          </div>
        </div>

        <div
          className="grid flex-1"
          style={{ gridTemplateColumns: `18% 1fr ${rightCol}` }}
        >
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

          <section className="relative flex items-stretch justify-center bg-canvas px-7 py-6">
            <div
              className={`relative flex h-full w-full max-w-[740px] flex-col overflow-hidden rounded-2xl text-white shadow-elevated ${PETROL_GRADIENT}`}
            >
              {wrap && <CountdownBanner />}
              <div className="flex flex-1 flex-col px-8 pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <CaseTypeChip />
                  <StatusBadge
                    state={wrap ? "ended" : "live"}
                    timer={CURRENT_LEAD.talkTimer}
                  />
                </div>

                <div className="mt-5 flex items-start gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-white/10 text-[24px] font-bold">
                    {CURRENT_LEAD.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[26px] font-semibold leading-tight tracking-tight">
                      {CURRENT_LEAD.name}
                    </div>
                    <div className="mt-1 text-[12px] text-white/75">
                      {CURRENT_LEAD.relationship}
                    </div>
                    <div className="mt-2 font-mono text-[14.5px] tracking-wide text-white/90">
                      {CURRENT_LEAD.phone}
                    </div>
                    <div className="mt-0.5 text-[11px] text-white/60">
                      {CURRENT_LEAD.address}
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
            </div>
          </section>

          {drawerOpen ? (
            <aside className="flex flex-col gap-3 border-l border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
                  Lead Data
                </div>
                <div className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-white text-petrol-700 ring-1 ring-inset ring-gray-200">
                  <span className="text-[12px] leading-none">›</span>
                </div>
              </div>
              <EstateFactsCard />
              <LatestActivityCard events={ACTIVITY} />
              <ContactTreeCard contacts={CONTACTS} />
            </aside>
          ) : (
            <aside className="relative flex flex-col items-center justify-start border-l border-gray-200 bg-white py-6">
              <div className="rotate-180 [writing-mode:vertical-rl] text-[10px] font-semibold uppercase tracking-[0.18em] text-petrol-700">
                Lead Data Drawer
              </div>
              <div className="mt-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-petrol-700 text-white">
                <span className="text-[14px] leading-none">‹</span>
              </div>
              <div className="mt-auto rotate-180 [writing-mode:vertical-rl] text-[9px] uppercase tracking-[0.16em] text-gray-400">
                Estate · Activity · Contacts
              </div>
            </aside>
          )}
        </div>
      </div>
    </CanvasFrame>
  );
}
