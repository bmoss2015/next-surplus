import { cn } from "@/lib/cn";
import type { MailStatus } from "@/lib/mail/fetch";

// Status pill anchored on the Settings Members "role-tab" pattern so
// pills look consistent across the portal:
//   border-radius: 4px (rectangular rounded, NOT oval)
//   font-size: 9.5px, weight 600, letter-spacing 0.12em, uppercase
//   filled background with white text for the active state
//
// queued + in_transit collapse to "In Transit"; failed collapses to
// "Returned" (the drawer distinguishes them for actions). Three
// dashboard buckets total.

const LABELS: Record<MailStatus, string> = {
  queued: "In Transit",
  in_transit: "In Transit",
  delivered: "Delivered",
  returned: "Returned",
  failed: "Returned",
};

const STYLES: Record<MailStatus, string> = {
  queued: "bg-ink text-white",
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
