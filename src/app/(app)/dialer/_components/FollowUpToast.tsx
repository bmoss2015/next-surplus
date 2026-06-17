"use client";

import { IconCheck } from "@tabler/icons-react";
import { useEffect, useState } from "react";

export function FollowUpToast({
  visible,
  onUndo,
  onDismiss,
}: {
  visible: boolean;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!visible) {
      setCountdown(5);
      return;
    }
    setCountdown(5);
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(tick);
          onDismiss();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [visible, onDismiss]);

  return (
    <div
      className={[
        "fixed right-6 top-[80px] z-[60] flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,41,0.12),0_2px_6px_rgba(15,23,41,0.06)] ring-1 ring-gray-200 transition-all duration-200",
        visible
          ? "translate-x-0 opacity-100"
          : "pointer-events-none translate-x-6 opacity-0",
      ].join(" ")}
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-petrol-500 text-white">
        <IconCheck size={14} stroke={2.5} />
      </div>
      <div className="text-[13px] text-ink">
        <span className="font-semibold">Follow Up Email Queued</span>
        <span className="ml-2 text-gray-500">
          Sends in {countdown}s
        </span>
      </div>
      <button
        type="button"
        onClick={onUndo}
        className="ml-2 rounded-md px-2 py-1 text-[12.5px] font-semibold text-petrol-500 transition hover:bg-gray-100"
      >
        Undo
      </button>
    </div>
  );
}
