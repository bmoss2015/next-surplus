import {
  IconCircleCheck,
  IconCircleDot,
  IconArrowBackUp,
} from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import type { MailStatus } from "@/lib/mail/fetch";

// One canonical status renderer for the whole portal. `queued` + `in_transit`
// collapse to "In Transit"; `failed` collapses to "Returned". The drawer
// distinguishes those two for action affordances (resend vs delete) but
// the dashboard chrome only ever shows three buckets.
//
// Design choice: inline icon + text (Linear pattern), no rounded chip
// background. Pills with backgrounds read as "AI-built SaaS"; quiet
// inline marks read as deliberate.

const LABELS: Record<MailStatus, string> = {
  queued: "In Transit",
  in_transit: "In Transit",
  delivered: "Delivered",
  returned: "Returned",
  failed: "Returned",
};

const STYLES: Record<MailStatus, { text: string; icon: string }> = {
  queued: { text: "text-ink", icon: "text-gray-400" },
  in_transit: { text: "text-ink", icon: "text-gray-400" },
  delivered: { text: "text-petrol-700", icon: "text-petrol-500" },
  returned: { text: "text-danger", icon: "text-danger" },
  failed: { text: "text-danger", icon: "text-danger" },
};

export function MailStatusPill({
  status,
  className,
}: {
  status: MailStatus;
  className?: string;
}) {
  const style = STYLES[status];
  const Icon =
    status === "delivered"
      ? IconCircleCheck
      : status === "returned" || status === "failed"
        ? IconArrowBackUp
        : IconCircleDot;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px] font-medium",
        style.text,
        className
      )}
    >
      <Icon size={13} stroke={2} className={style.icon} />
      {LABELS[status]}
    </span>
  );
}

export function mailStatusLabel(status: MailStatus): string {
  return LABELS[status];
}
