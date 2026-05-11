import {
  IconArrowRight,
  IconNote,
  IconSparkles,
  IconClock,
  IconFile,
  IconCircleDot,
} from "@tabler/icons-react";
import {
  fetchRecentActivity,
  formatActivity,
  relativeTime,
  activityActorName,
} from "@/lib/leads/activities";

const ICONS = {
  create: IconSparkles,
  stage: IconArrowRight,
  note: IconNote,
  review: IconClock,
  doc: IconFile,
  default: IconCircleDot,
} as const;

export async function RecentActivityCard({
  leadId,
  leadSource,
}: {
  leadId: string;
  leadSource: string | null;
}) {
  const rows = await fetchRecentActivity(leadId, 5);

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-4 shadow-card">
      <div className="mb-[11px] text-[10px] tracking-[0.5px] font-medium text-gray-500">
        Recent Activity
      </div>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-center text-[11.5px] text-gray-500">
          No Activity Yet
        </div>
      ) : (
        <div className="divide-y divide-gray-150">
          {rows.map((row) => {
            const { text, icon } = formatActivity(row, { leadSource });
            const Icon = ICONS[icon];
            const actor = activityActorName(row);
            return (
              <div
                key={row.id}
                className="flex gap-2 py-2 first:pt-0 last:pb-0 text-[11.5px]"
              >
                <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-gray-150">
                  <Icon size={11} stroke={1.75} className="text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="leading-[1.4] text-ink">{text}</div>
                  <div className="mt-[2px] text-[10.5px] text-gray-500">
                    {actor} · {relativeTime(row.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
