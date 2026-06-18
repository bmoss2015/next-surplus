import type { Lead, QueueItem } from "../_data";
import {
  CanvasFrame,
  TopHeader,
  QueueHeader,
  QueueSearch,
  QueueList,
  RightPanel,
  ShortcutHelpFab,
  FollowUpToast,
} from "./Shared";
import { Hero } from "./Hero";

export function V44({
  lead,
  queue,
  state = "live",
  nextLead,
  queuePosition,
  overlay,
  selectedOutcome = null,
  showToast = false,
}: {
  lead: Lead;
  queue: QueueItem[];
  state?: "live" | "wrap";
  nextLead?: { name: string; relationship: string; countdown: string };
  queuePosition?: number;
  overlay?: "timeline";
  selectedOutcome?: string | null;
  showToast?: boolean;
}) {
  return (
    <CanvasFrame>
      <div className="flex h-full w-full flex-col">
        <TopHeader />

        <div className="grid flex-1 grid-cols-[20%_55%_25%] min-h-0">
          <aside className="flex min-h-0 flex-col gap-3 border-r border-gray-200 bg-white px-3 py-4">
            <QueueHeader position={queuePosition} />
            <QueueSearch />
            <QueueList items={queue} />
          </aside>

          <section className="relative min-h-0">
            <Hero
              lead={lead}
              state={state}
              nextLead={nextLead}
              selectedOutcome={selectedOutcome}
            />
            {showToast && <FollowUpToast />}
            <ShortcutHelpFab />
          </section>

          <aside className="flex min-h-0 flex-col bg-[#FAFAFA] p-4">
            <RightPanel lead={lead} overlay={overlay} />
          </aside>
        </div>
      </div>
    </CanvasFrame>
  );
}
