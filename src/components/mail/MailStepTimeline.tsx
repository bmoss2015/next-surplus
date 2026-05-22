import { IconCheck, IconMailFast, IconTruckDelivery, IconHomeCheck, IconArrowBackUp, IconAlertCircle } from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import type { MailJobDetailRow } from "@/lib/mail/fetch";

// Horizontal step timeline rendered in the mail detail panel. Each step
// is either "complete" (we have a timestamp for it), "current" (we're
// here), or "upcoming" (not reached yet). Returned and Failed branch
// off the happy path — when one of them lands we still show the steps
// leading up to it, then a red terminal step.

type StepKey = "sent" | "in_transit" | "delivered";

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MailStepTimeline({ job }: { job: MailJobDetailRow }) {
  const sentAt = job.sent_at;
  const deliveredAt = job.delivered_at;
  const returnedAt = job.returned_at;
  const isReturned = job.status === "returned";
  const isFailed = job.status === "failed";

  // Determine each step's state
  const sentDone = Boolean(sentAt);
  // Treat "in_transit" as complete once the DB status leaves queued
  // (provider has acknowledged the piece left their facility).
  const inTransitDone = job.status !== "queued" || Boolean(deliveredAt) || Boolean(returnedAt);
  const deliveredDone = job.status === "delivered" && Boolean(deliveredAt);

  const happyPath: Array<{
    key: StepKey;
    label: string;
    Icon: typeof IconMailFast;
    timestamp: string | null;
    done: boolean;
    current: boolean;
  }> = [
    {
      key: "sent",
      label: "Sent",
      Icon: IconMailFast,
      timestamp: sentAt,
      done: sentDone,
      current: sentDone && !inTransitDone,
    },
    {
      key: "in_transit",
      label: "In Transit",
      Icon: IconTruckDelivery,
      timestamp: null,
      done: inTransitDone,
      current: inTransitDone && !deliveredDone && !isReturned && !isFailed,
    },
    {
      key: "delivered",
      label: "Delivered",
      Icon: IconHomeCheck,
      timestamp: deliveredAt,
      done: deliveredDone,
      current: deliveredDone,
    },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-surface p-5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-4">
        Lifecycle
      </div>
      <ol className="flex items-center gap-2">
        {happyPath.map((step, idx) => {
          const isLast = idx === happyPath.length - 1;
          // If this is the delivered step but the piece was returned/failed,
          // replace the visual with the terminal state.
          const overrideTerminal =
            step.key === "delivered" && (isReturned || isFailed);
          return (
            <li key={step.key} className="flex-1 min-w-0">
              <div className="flex items-center">
                <StepCircle
                  Icon={
                    overrideTerminal
                      ? isReturned
                        ? IconArrowBackUp
                        : IconAlertCircle
                      : step.done
                        ? IconCheck
                        : step.Icon
                  }
                  done={step.done && !overrideTerminal}
                  current={step.current && !overrideTerminal}
                  terminal={overrideTerminal}
                />
                {!isLast && (
                  <div
                    className={cn(
                      "h-px flex-1 mx-2",
                      step.done ? "bg-petrol-300" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
              <div className="mt-2 text-[12px] text-ink">
                {overrideTerminal
                  ? isReturned
                    ? "Returned to Sender"
                    : "Failed"
                  : step.label}
              </div>
              <div className="text-[10.5px] text-gray-500">
                {overrideTerminal
                  ? fmtDate(returnedAt ?? null) || "—"
                  : step.timestamp
                    ? fmtDate(step.timestamp)
                    : step.current
                      ? "Now"
                      : ""}
              </div>
            </li>
          );
        })}
      </ol>
      {(isReturned || isFailed) && job.error_message && (
        <div className="mt-4 rounded-md border border-danger/30 bg-danger-bg/40 px-3 py-2 text-[12px] text-danger">
          {job.error_message}
        </div>
      )}
    </div>
  );
}

function StepCircle({
  Icon,
  done,
  current,
  terminal,
}: {
  Icon: typeof IconCheck;
  done: boolean;
  current: boolean;
  terminal: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
        terminal && "border-danger bg-danger/5 text-danger",
        !terminal && done && "border-petrol-500 bg-petrol-50 text-petrol-700",
        !terminal && !done && current && "border-ink bg-white text-ink",
        !terminal && !done && !current && "border-gray-200 bg-white text-gray-400"
      )}
    >
      <Icon size={14} stroke={1.75} />
    </div>
  );
}
