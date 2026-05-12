"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IconDots,
  IconArchive,
  IconArchiveOff,
  IconTrash,
} from "@tabler/icons-react";
import { setLeadArchived, hardDeleteLead } from "../_actions";
import { Modal } from "@/components/Modal";
import { useRole } from "@/components/RoleProvider";
import { cn } from "@/lib/cn";

// Fix U: shared ⋯ menu for a lead — Archive (soft delete, reversible, with an
// inline confirm) and Delete Permanently (hard delete, behind a modal). Used on
// the lead detail header, leads-table rows, Kanban cards, and Daily Work.
//
//  - `triggerClassName` lets a host hide the trigger until the row/card is
//    hovered (e.g. "opacity-0 group-hover:opacity-100"); when the menu or the
//    delete modal is open the trigger stays visible regardless.
//  - After a successful action: `onDone()` if given, else `router.push(
//    redirectTo)` if given (used by the detail page to return to /leads),
//    else `router.refresh()`.
//  - Fix FF: the dropdown opens to the LEFT when the trigger sits in the right
//    30% of the viewport (otherwise to the right), so it never clips off-screen.
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
  const [openLeft, setOpenLeft] = useState(true);
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
    // Smart direction: if the trigger is in the right 30% of the viewport, open
    // the dropdown leftward; otherwise rightward.
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setOpenLeft(rect.right > window.innerWidth * 0.7);
    setArchiveConfirm(false);
    setOpen(true);
  }

  function onArchiveClick(e: React.MouseEvent) {
    stop(e);
    if (archived) {
      // Restoring is harmless — do it immediately, no confirm.
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
          className="cursor-pointer rounded-md border border-gray-200 bg-surface p-[6px] text-gray-500 hover:bg-gray-50 hover:text-ink disabled:opacity-50"
        >
          <IconDots size={16} stroke={1.75} />
        </button>
        {open && (
          <div
            className={cn(
              "absolute z-30 mt-1 w-[220px] overflow-hidden rounded-md border border-gray-200 bg-surface shadow-elevated",
              openLeft ? "right-0" : "left-0"
            )}
          >
            {archiveConfirm ? (
              <div className="p-3">
                <div className="mb-2 text-[12.5px] font-medium text-ink">
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
                    {pending ? "Archiving" : "Confirm Archive"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onArchiveClick}
                  className="flex w-full cursor-pointer items-start gap-2 px-3 py-2 text-left hover:bg-gray-50"
                >
                  {archived ? (
                    <IconArchiveOff size={15} stroke={1.75} className="mt-[2px] shrink-0 text-gray-500" />
                  ) : (
                    <IconArchive size={15} stroke={1.75} className="mt-[2px] shrink-0 text-gray-500" />
                  )}
                  <span className="min-w-0">
                    <span className="block text-[12.5px] text-ink">
                      {archived ? "Restore" : "Archive"}
                    </span>
                    <span className="block text-[11px] leading-snug text-gray-400">
                      {archived
                        ? "Move back to active views"
                        : "Hide from active views, recoverable"}
                    </span>
                  </span>
                </button>
                {/* Fix U: hard delete is admin-only — hide it entirely otherwise. */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={openDeleteConfirm}
                    className="flex w-full cursor-pointer items-start gap-2 border-t border-gray-150 px-3 py-2 text-left hover:bg-danger-bg"
                  >
                    <IconTrash size={15} stroke={1.75} className="mt-[2px] shrink-0 text-danger" />
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-medium text-danger">
                        Delete Permanently
                      </span>
                      <span className="block text-[11px] leading-snug text-gray-400">
                        Cannot be undone
                      </span>
                    </span>
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
