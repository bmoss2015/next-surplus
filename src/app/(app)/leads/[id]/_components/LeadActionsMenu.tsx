"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IconDots,
  IconArchiveOff,
  IconTrash,
  IconTrashFilled,
} from "@tabler/icons-react";
import { setLeadArchived, hardDeleteLead } from "../_actions";
import { Modal } from "@/components/Modal";
import { useRole } from "@/components/RoleProvider";
import { cn } from "@/lib/cn";

// Fix DDD / Fix YYY: shared ⋯ menu for a lead — Archive (soft delete, reversible,
// inline confirm) and Delete Permanently (hard delete, behind a modal). Used on
// the lead detail header, leads-table rows, Kanban cards, and Daily Work.
// The ⋯ trigger is a bare 14px #94a3b8 glyph (hosts pass triggerClassName to
// reveal it on row hover); the menu is a compact 160px popover that always opens
// to the LEFT of the trigger at z-index 9999.
export function LeadActionsMenu({
  leadId,
  archived,
  redirectTo,
  onDone,
  triggerClassName,
}: {
  leadId: string;
  archived: boolean;
  redirectTo?: string;
  onDone?: () => void;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const { isAdmin } = useRole();
  const [open, setOpen] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setArchiveConfirm(false);
      return;
    }
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function afterAction() {
    if (onDone) onDone();
    else if (redirectTo) router.push(redirectTo);
    else router.refresh();
  }

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function toggleMenu(e: React.MouseEvent) {
    stop(e);
    if (open) {
      setOpen(false);
      return;
    }
    setArchiveConfirm(false);
    setOpen(true);
  }

  function onArchiveClick(e: React.MouseEvent) {
    stop(e);
    if (archived) {
      setOpen(false);
      startTransition(async () => {
        const res = await setLeadArchived(leadId, false);
        if (res.ok) afterAction();
      });
      return;
    }
    setArchiveConfirm(true);
  }

  function confirmArchive(e: React.MouseEvent) {
    stop(e);
    startTransition(async () => {
      const res = await setLeadArchived(leadId, true);
      if (res.ok) {
        setOpen(false);
        afterAction();
      }
    });
  }

  function openDeleteConfirm(e: React.MouseEvent) {
    stop(e);
    setOpen(false);
    setError(null);
    setConfirmOpen(true);
  }

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const res = await hardDeleteLead(leadId);
      if (res.ok) {
        setConfirmOpen(false);
        afterAction();
      } else {
        setError(res.error);
      }
    });
  }

  const showTriggerOverride = open || confirmOpen;

  return (
    <>
      <div
        className={cn("relative shrink-0", !showTriggerOverride && triggerClassName)}
        ref={ref}
        draggable={false}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          draggable={false}
          onClick={toggleMenu}
          disabled={pending}
          aria-label="Lead actions"
          className="cursor-pointer p-1 text-[#94a3b8] transition-colors hover:text-ink disabled:opacity-50"
        >
          <IconDots size={14} stroke={1.75} />
        </button>
        {open && (
          <div className="absolute right-0 z-[9999] mt-1 w-[160px] overflow-hidden rounded-lg border border-[#e2e8f0] bg-surface shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
            {archiveConfirm ? (
              <div className="p-3">
                <div className="mb-2 text-[13px] font-medium text-ink">
                  Archive this lead?
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      stop(e);
                      setArchiveConfirm(false);
                    }}
                    disabled={pending}
                    className="flex-1 cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-[6px] text-[12px] text-ink hover:border-petrol-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmArchive}
                    disabled={pending}
                    className="btn-primary flex-1 rounded-md px-2 py-[6px] text-[12px] font-medium"
                  >
                    {pending ? "…" : "Yes"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onArchiveClick}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[13px] text-ink hover:bg-gray-50"
                >
                  {archived ? (
                    <IconArchiveOff size={14} stroke={1.75} className="shrink-0 text-gray-500" />
                  ) : (
                    <IconTrash size={14} stroke={1.75} className="shrink-0 text-gray-500" />
                  )}
                  {archived ? "Restore" : "Archive"}
                </button>
                {/* Fix U: hard delete is admin-only — hide it entirely otherwise. */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={openDeleteConfirm}
                    className="flex w-full cursor-pointer items-center gap-2 border-t border-gray-150 px-3 py-2 text-left text-[13px] text-danger hover:bg-danger-bg"
                  >
                    <IconTrashFilled size={14} className="shrink-0 text-danger" />
                    Delete Permanently
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <Modal
        open={isAdmin && confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete Lead"
      >
        <div onMouseDown={(e) => e.stopPropagation()}>
          <p className="m-0 text-[13px] leading-relaxed text-gray-600">
            This will permanently delete this lead and all associated data
            including contacts, notes, documents, and activity. This cannot be
            undone.
          </p>
          {error && (
            <div className="mt-3 rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
              {error}
            </div>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
              className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-2 text-xs text-ink hover:border-petrol-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={pending}
              className="cursor-pointer rounded-md bg-danger px-3 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Deleting" : "Delete Permanently"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
