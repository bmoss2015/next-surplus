"use client";

// Settings clone · Phase D — shared right-side slide-in drawer.
//
// Mounts a backdrop + a 480px panel that animates in via .open. Caller owns
// the open boolean and content. Body is scrollable so long forms don't break
// the layout; footer pins to the bottom with the save/discard pattern that
// the mockup uses for every drawer (left = primary action, right = ghost
// dismiss).

import { useEffect, type ReactNode } from "react";

export function Drawer({
  open,
  onClose,
  eyebrow,
  title,
  children,
  footer,
  width,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  // Override the default 480px width (e.g. for a two-pane editor body). The
  // CSS still caps at 92vw so very wide values stay responsive.
  width?: number;
}) {
  // Lock body scroll while the drawer is open, and close on Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={"drawer-backdrop" + (open ? " open" : "")}
        onClick={onClose}
      />
      <aside
        className={"drawer" + (open ? " open" : "")}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        style={width ? { width } : undefined}
      >
        <div className="drawer-head">
          <div>
            {eyebrow && <div className="drawer-eyebrow">{eyebrow}</div>}
            <div className="drawer-title">{title}</div>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </aside>
    </>
  );
}
