"use client";

// Owns the Board/List view toggle for a single playbook page. Auto-defaults
// to List when the playbook has more than AUTO_LIST_THRESHOLD steps (Kanban
// horizontal scroll gets painful past that). Persists the user's manual
// override per-playbook in localStorage so their choice sticks across page
// loads.

import { useEffect, useState } from "react";
import type { PlaybookBoard } from "@/lib/playbooks/types";
import { PlaybookBoard as PlaybookBoardView } from "./PlaybookBoard";
import { PlaybookListView } from "./PlaybookListView";
import { cn } from "@/lib/cn";

const AUTO_LIST_THRESHOLD = 8;

type View = "board" | "list";

function storageKey(templateId: string): string {
  return `playbook-view:${templateId}`;
}

export function PlaybookViewSwitcher({ board }: { board: PlaybookBoard }) {
  const autoDefault: View =
    board.steps.length > AUTO_LIST_THRESHOLD ? "list" : "board";
  // SSR + first paint always uses the auto-default; the stored override is
  // hydrated in the effect below so we don't differ between server and
  // client output.
  const [view, setView] = useState<View>(autoDefault);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey(board.templateId));
    if (stored === "board" || stored === "list") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView(stored);
    }
  }, [board.templateId]);

  function pick(next: View) {
    setView(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey(board.templateId), next);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-end">
        <div className="inline-flex overflow-hidden rounded-md border border-gray-200 bg-surface">
          <button
            type="button"
            onClick={() => pick("board")}
            className={cn(
              "cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors",
              view === "board"
                ? "bg-petrol-500 text-white"
                : "text-gray-600 hover:bg-gray-50"
            )}
            aria-pressed={view === "board"}
          >
            Board
          </button>
          <button
            type="button"
            onClick={() => pick("list")}
            className={cn(
              "cursor-pointer border-l border-gray-200 px-3 py-1.5 text-xs font-medium transition-colors",
              view === "list"
                ? "bg-petrol-500 text-white"
                : "text-gray-600 hover:bg-gray-50"
            )}
            aria-pressed={view === "list"}
          >
            List
          </button>
        </div>
      </div>

      {view === "board" ? (
        <PlaybookBoardView board={board} />
      ) : (
        <PlaybookListView board={board} />
      )}
    </div>
  );
}
