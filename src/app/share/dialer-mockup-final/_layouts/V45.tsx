import type { Lead, QueueItem } from "../_data";
import {
  CanvasFrame,
  TopHeader,
  QueueHeader,
  QueueSearch,
  QueueList,
  CaseDetailsCard,
  LatestActivityCard,
  ContactTreeCard,
  ShortcutHelpFab,
} from "./Shared";
import { Hero } from "./Hero";

export function V45({
  lead,
  queue,
  state = "live",
  nextLead,
  drawerOpen = false,
}: {
  lead: Lead;
  queue: QueueItem[];
  state?: "live" | "wrap";
  nextLead?: { name: string; relationship: string; countdown: string };
  drawerOpen?: boolean;
}) {
  const rightCol = drawerOpen ? "30%" : "16px";
  return (
    <CanvasFrame>
      <div className="flex h-full w-full flex-col">
        <TopHeader />

        <div
          className="grid flex-1"
          style={{ gridTemplateColumns: `15% 1fr ${rightCol}` }}
        >
          <aside className="flex flex-col gap-3 border-r border-gray-200 bg-white px-2.5 py-4">
            <QueueHeader />
            <QueueSearch />
            <QueueList items={queue} size="sm" />
          </aside>

          <section className="relative flex items-stretch justify-center bg-[#FAFAFA] px-7 py-6">
            <div
              className="relative flex h-full w-full max-w-[760px] overflow-hidden rounded-2xl shadow-[0_10px_32px_-12px_rgba(13,75,58,0.35)]"
            >
              <Hero lead={lead} state={state} nextLead={nextLead} />
            </div>
            <ShortcutHelpFab />
          </section>

          {drawerOpen ? (
            <aside className="flex flex-col border-l border-gray-200 bg-[#FAFAFA]">
              <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
                <div className="text-[12px] font-semibold tracking-tight text-ink">
                  Lead Data · {lead.title}
                </div>
                <div className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-gray-100">
                  ×
                </div>
              </div>
              <div className="flex flex-col gap-3 overflow-y-auto p-4">
                <CaseDetailsCard lead={lead} />
                <LatestActivityCard lead={lead} />
                <ContactTreeCard lead={lead} />
              </div>
            </aside>
          ) : (
            <aside
              className="relative flex flex-col items-center justify-between border-l border-gray-200 bg-white py-3"
              style={{ width: 16 }}
            >
              <div className="rotate-180 [writing-mode:vertical-rl] text-[8.5px] font-semibold uppercase tracking-[0.18em] text-petrol-700">
                Lead Data
              </div>
              <div className="rotate-180 [writing-mode:vertical-rl] text-[8px] uppercase tracking-[0.16em] text-gray-400">
                Estate · Activity · Contacts
              </div>
            </aside>
          )}
        </div>
      </div>
    </CanvasFrame>
  );
}
