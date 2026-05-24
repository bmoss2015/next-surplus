import { cn } from "@/lib/cn";
import type { MailStatus } from "@/lib/mail/fetch";

// Status pill anchored on the Settings Members "role-tab" pattern so
// pills look consistent across the portal.
//
// Labels match the rest of the app post-migration 0130:
//   processing (or legacy queued) -> "Printing" (at Lob print plant)
//   in_transit                    -> "In Transit" (USPS has it)
//   delivered                     -> "Delivered"
//   returned / failed             -> "Returned"

const LABELS: Record<MailStatus, string> = {
  processing: "Printing",
  queued: "Printing",
  in_transit: "In Transit",
  delivered: "Delivered",
  returned: "Returned",
  failed: "Returned",
};

const STYLES: Record<MailStatus, string> = {
  processing: "bg-white text-gray-600 border border-gray-300",
  queued: "bg-white text-gray-600 border border-gray-300",
  in_transit: "bg-ink text-white",
  delivered: "bg-petrol-500 text-white",
  returned: "bg-danger text-white",
  failed: "bg-danger text-white",
};

export function MailStatusPill({
  status,
  className,
}: {
  status: MailStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[4px] px-[10px] py-[5px]",
        "text-[9.5px] font-semibold uppercase leading-none tracking-[0.12em]",
        "min-w-[76px]",
        STYLES[status],
        className
      )}
    >
      {LABELS[status]}
    </span>
  );
}

export function mailStatusLabel(status: MailStatus): string {
  return LABELS[status];
}
