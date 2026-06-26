"use client";

import { useEffect } from "react";
import { IconX } from "@tabler/icons-react";

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  width = 460,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="flex flex-col bg-surface shadow-elevated"
        style={{ width: `${width}px` }}
      >
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="m-0 text-[15px] font-medium tracking-tight text-ink">
              {title}
            </h2>
            {description && (
              <div className="mt-[2px] text-[12px] text-gray-500">
                {description}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-ink"
            aria-label="Close"
          >
            <IconX size={16} stroke={1.75} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
