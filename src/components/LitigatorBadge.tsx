import { cn } from "@/lib/cn";

// Maroon "Litigator" pill — shown on a lead anywhere it appears (table, Daily
// Work, Kanban) when any of its contacts or relatives carries a litigator-risk
// phone. Has to be readable at a glance without opening the lead.
export function LitigatorBadge({ className }: { className?: string }) {
  return (
    <span
      title="A phone on this lead is flagged as a litigation risk"
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full bg-[#7f1d1d] px-1.5 py-[1px] text-[10px] font-medium leading-none text-white",
        className
      )}
    >
      Litigator
    </span>
  );
}
