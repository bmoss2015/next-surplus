"use client";

import { IconX, IconPhone, IconMail, IconNote, IconFileText, IconChevronRight } from "@tabler/icons-react";
import type { DialerActivity, DialerLead } from "../_mock-data";

const ACTIVITY_ICON: Record<DialerActivity["type"], React.ComponentType<{ size?: number; stroke?: number }>> = {
  Call: IconPhone,
  Email: IconMail,
  Letter: IconFileText,
  Note: IconNote,
  Stage: IconChevronRight,
};

export function ActivityTimelinePanel({
  open,
  lead,
  onClose,
}: {
  open: boolean;
  lead: DialerLead;
  onClose: () => void;
}) {
  return (
    <>
      <div
        onClick={onClose}
        className={[
          "absolute inset-0 z-40 bg-black/15 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />
      <aside
        className={[
          "absolute right-0 top-0 z-50 flex h-full w-[420px] flex-col bg-white shadow-[-12px_0_28px_-12px_rgba(15,23,41,0.18)] transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-5">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold tracking-tight text-ink">
              Activity Timeline
            </h2>
            <div className="truncate text-[12px] text-gray-500">
              {lead.primaryName}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-ink"
          >
            <IconX size={16} stroke={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <ol className="relative ml-3 border-l border-gray-200">
            {[...lead.activities].reverse().map((a) => {
              const Icon = ACTIVITY_ICON[a.type] ?? IconNote;
              return (
                <li key={a.id} className="relative mb-6 pl-6">
                  <span className="absolute -left-[11px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-1 ring-gray-200">
                    <Icon size={11} stroke={2} />
                  </span>
                  <div className="text-[11.5px] text-gray-500">{a.at}</div>
                  <div className="mt-0.5 text-[13px] font-semibold text-ink">
                    {a.title}
                  </div>
                  <div className="mt-1 text-[12.5px] leading-relaxed text-gray-700">
                    {a.detail}
                  </div>
                  <div className="mt-1.5 text-[11.5px] text-gray-500">
                    by {a.author} ({a.type})
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </aside>
    </>
  );
}
