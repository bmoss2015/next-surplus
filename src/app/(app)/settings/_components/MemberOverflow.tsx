"use client";

// Settings clone · Phase D.2 — per-row overflow menu for the Members list.
//
// Renders the three-dot trigger and a small popover with "Make Admin / Make
// Member" and "Remove from Org". Both actions guard against the caller
// editing their own row (server-side too, but the menu is also hidden when
// the row is the current user). Remove uses a two-step confirm.

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconDots } from "@tabler/icons-react";
import {
  setMemberRole,
  removeMember,
} from "@/app/(app)/settings/_actions";
import type { OrgMemberRow } from "@/lib/settings/fetch";

export function MemberOverflow({
  member,
  isSelf,
}: {
  member: OrgMemberRow;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmRemove(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  function flipRole() {
    setErrMsg(null);
    const next = member.role === "admin" ? "member" : "admin";
    startTransition(async () => {
      const res = await setMemberRole(member.id, next);
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  function remove() {
    setErrMsg(null);
    startTransition(async () => {
      const res = await removeMember(member.id);
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (isSelf) {
    return (
      <div className="overflow">
        <div
          className="icon-btn"
          title="That's you"
          style={{ opacity: 0.3, pointerEvents: "none" }}
        >
          <IconDots size={16} stroke={1.75} />
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="overflow" style={{ position: "relative" }}>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Member actions"
      >
        <IconDots size={16} stroke={1.75} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 6,
            background: "var(--surface)",
            border: "1px solid var(--hairline)",
            borderRadius: 8,
            boxShadow: "0 8px 24px -8px rgba(12,13,16,0.15)",
            minWidth: 200,
            padding: "6px 0",
            zIndex: 20,
          }}
        >
          <MenuItem
            label={member.role === "admin" ? "Make Member" : "Make Admin"}
            onClick={flipRole}
            disabled={pending}
          />
          <div
            style={{
              height: 1,
              background: "var(--divider)",
              margin: "6px 0",
            }}
          />
          <MenuItem
            label={
              confirmRemove
                ? "Click again to confirm"
                : "Remove from Org"
            }
            onClick={() => (confirmRemove ? remove() : setConfirmRemove(true))}
            disabled={pending}
            danger
          />
          {errMsg && (
            <div
              style={{
                padding: "8px 12px",
                color: "var(--danger)",
                fontSize: 11.5,
                lineHeight: 1.4,
              }}
            >
              {errMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "8px 14px",
        fontSize: 12.5,
        color: danger ? "var(--danger)" : "var(--ink)",
        background: "transparent",
        border: 0,
        cursor: disabled ? "default" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          e.currentTarget.style.background = "rgba(12,13,16,0.04)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {label}
    </button>
  );
}
