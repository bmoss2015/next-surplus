"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { IconDots } from "@tabler/icons-react";
import {
  setMemberRole,
  removeMember,
} from "@/app/(app)/settings/_actions";
import type { OrgMemberRow } from "@/lib/settings/fetch";

const MENU_WIDTH = 200;
const MENU_GAP = 6;

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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );

  function close() {
    setOpen(false);
    setConfirmRemove(false);
    setErrMsg(null);
  }

  function toggle() {
    if (open) {
      close();
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setCoords({
        top: rect.bottom + MENU_GAP,
        left: rect.right - MENU_WIDTH,
      });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        menuRef.current?.contains(t) ||
        triggerRef.current?.contains(t)
      ) {
        return;
      }
      close();
    };
    const onScrollOrResize = () => close();
    window.addEventListener("mousedown", onClick);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
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
      close();
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
      close();
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
    <div className="overflow">
      <button
        ref={triggerRef}
        type="button"
        className="icon-btn"
        onClick={toggle}
        aria-label="Member actions"
      >
        <IconDots size={16} stroke={1.75} />
      </button>
      {open && coords && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                background: "var(--surface)",
                border: "1px solid var(--hairline)",
                borderRadius: 8,
                boxShadow: "0 8px 24px -8px rgba(12,13,16,0.15)",
                minWidth: MENU_WIDTH,
                padding: "6px 0",
                zIndex: 9999,
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
                    ? "Click Again To Confirm"
                    : "Remove From Org"
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
            </div>,
            document.body
          )
        : null}
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
