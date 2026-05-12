"use client";

import { useState, useTransition } from "react";
import { IconTrash } from "@tabler/icons-react";
import { addNote, deleteNote } from "../_actions";
import type { NoteActivityRow } from "@/lib/leads/fetch-tab-data";
import { noteByline } from "@/lib/leads/activity-format";
import { useRole } from "@/components/RoleProvider";

export function NotesTabClient({
  leadId,
  initialNotes,
  currentUserId,
  currentUserFirstName,
}: {
  leadId: string;
  initialNotes: NoteActivityRow[];
  currentUserId: string | null;
  currentUserFirstName: string | null;
}) {
  const { isAdmin } = useRole();
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [, startTransition] = useTransition();

  function add() {
    const body = draft.trim();
    if (!body) return;
    startTransition(async () => {
      const result = await addNote(leadId, body);
      if (result.ok) {
        setNotes((prev) => [
          {
            id: result.id,
            activity_type: "note",
            payload: { body, kind: "note" },
            created_at: new Date().toISOString(),
            user_id: currentUserId,
            actor_first_name: currentUserFirstName,
          },
          ...prev,
        ]);
        setDraft("");
      }
    });
  }

  function remove(noteId: string) {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    startTransition(async () => {
      await deleteNote(noteId, leadId);
    });
  }

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-4">
        <h3 className="section-subheader">
          Notes
        </h3>
      </div>

      {/* Composer */}
      <div className="mb-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          rows={3}
          placeholder="Add A Note. Cmd Enter To Save."
          className="w-full resize-y rounded-md border border-gray-200 bg-surface px-3 py-2 text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={add}
            disabled={!draft.trim()}
            className="cursor-pointer rounded-md border border-petrol-500 bg-petrol-500 px-3 py-[6px] text-xs font-medium text-white hover:bg-petrol-700 disabled:opacity-50"
          >
            Add Note
          </button>
        </div>
      </div>

      {/* Feed */}
      {notes.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-[12px] text-gray-500">
          No Notes Yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const body = (note.payload?.body as string) ?? "";
            return (
              <div
                key={note.id}
                className="group rounded-md border border-gray-200 bg-surface px-3 py-[10px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[10.5px] text-gray-500">
                    {noteByline(note.created_at, note)}
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => remove(note.id)}
                      className="invisible cursor-pointer text-gray-400 hover:text-danger group-hover:visible"
                      aria-label="Delete Note"
                    >
                      <IconTrash size={13} stroke={1.75} />
                    </button>
                  )}
                </div>
                <div className="mt-1 whitespace-pre-wrap text-[13px] text-ink">
                  {body}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
