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

export function V44({
  lead,
  queue,
  state = "live",
  nextLead,
  queuePosition,
}: {
  lead: Lead;
  queue: QueueItem[];
  state?: "live" | "wrap";
  nextLead?: { name: string; relationship: string; countdown: string };
  queuePosition?: number;
}) {
  return (
    <CanvasFrame>
      <div className="flex h-full w-full flex-col">
        <TopHeader />

        <div className="grid flex-1 grid-cols-[20%_55%_25%]">
          <aside className="flex flex-col gap-3 border-r border-gray-200 bg-white px-3 py-4">
            <QueueHeader position={queuePosition} />
            <QueueSearch />
            <QueueList items={queue} />
          </aside>

          <section className="relative">
            <Hero lead={lead} state={state} nextLead={nextLead} />
            <ShortcutHelpFab />
          </section>

          <aside className="flex flex-col gap-3 bg-[#FAFAFA] p-4">
            <CaseDetailsCard lead={lead} />
            <LatestActivityCard lead={lead} />
            <ContactTreeCard lead={lead} />
          </aside>
        </div>
      </div>
    </CanvasFrame>
  );
}
