import { cn } from "@/lib/cn";
import type { MailStatus } from "@/lib/mail/fetch";

// Single source of truth for how mail status renders across the portal.
// `queued` and `in_transit` collapse to one user-facing "In Transit"
// state — the DB still tracks them separately for debugging, but to a
// human the distinction is meaningless (once we hand off to the printer,
// it's on its way).
const LABELS: Record<MailStatus, string> = {
  queued: "In Transit",
  in_transit: "In Transit",
  delivered: "Delivered",
  returned: "Returned",
  failed: "Failed",
};

const PILL_CLASSES: Record<MailStatus, string> = {
  // Neutral chip for in-flight states — no green/yellow per design rules.
  queued: "bg-white text-ink ring-1 ring-inset ring-gray-200",
  in_transit: "bg-white text-ink ring-1 ring-inset ring-gray-200",
  delivered: "bg-white text-petrol-700 ring-1 ring-inset ring-petrol-200",
  returned: "bg-white text-danger ring-1 ring-inset ring-danger/30",
  failed: "bg-white text-danger ring-1 ring-inset ring-danger/30",
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
        "inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[10.5px] font-medium tracking-wide",
        PILL_CLASSES[status],
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-[5px] w-[5px] rounded-full",
          status === "delivered" && "bg-petrol-500",
          (status === "returned" || status === "failed") && "bg-danger",
          (status === "queued" || status === "in_transit") && "bg-gray-400"
        )}
      />
      {LABELS[status]}
    </span>
  );
}

export function mailStatusLabel(status: MailStatus): string {
  return LABELS[status];
}
