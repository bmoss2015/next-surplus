"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { IconSend, IconAt } from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import { postComment } from "../_discussion-actions";
import type {
  DiscussionCommentRow,
  TeamMemberOption,
} from "@/lib/notifications/types";

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

function avatarInitial(name: string | null): string {
  const n = (name ?? "").trim();
  return n.length > 0 ? n[0].toUpperCase() : "?";
}

// Renders a comment body with @Name spans (matched against the comment's
// mentioned team members) highlighted in teal.
function CommentBody({
  body,
  mentionNames,
}: {
  body: string;
  mentionNames: string[];
}) {
  const pieces = useMemo(() => {
    if (mentionNames.length === 0) {
      return [{ text: body, mention: false }];
    }
    // Longest names first so "Jane Doe" wins over "Jane".
    const sorted = [...mentionNames].sort((a, b) => b.length - a.length);
    const escaped = sorted
      .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    const re = new RegExp(`@(?:${escaped})`, "g");
    const out: { text: string; mention: boolean }[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) {
      if (m.index > last) out.push({ text: body.slice(last, m.index), mention: false });
      out.push({ text: m[0], mention: true });
      last = m.index + m[0].length;
    }
    if (last < body.length) out.push({ text: body.slice(last), mention: false });
    return out;
  }, [body, mentionNames]);

  return (
    <span className="whitespace-pre-wrap text-[13px] text-ink">
      {pieces.map((p, i) =>
        p.mention ? (
          <span
            key={i}
            className="rounded bg-petrol-50 px-1 font-medium text-petrol-500"
          >
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </span>
  );
}

type Mention = { id: string; label: string };

export function DiscussionTabClient({
  leadId,
  initialComments,
  teamMembers,
  currentUserId,
}: {
  leadId: string;
  initialComments: DiscussionCommentRow[];
  teamMembers: TeamMemberOption[];
  currentUserId: string | null;
}) {
  const [comments, setComments] = useState(initialComments);
  const [draft, setDraft] = useState("");
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // @mention picker state.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerIndex, setPickerIndex] = useState(0);
  // Position (in the draft string) where the active "@" lives.
  const atPosRef = useRef<number | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  const membersById = useMemo(
    () => new Map(teamMembers.map((m) => [m.id, m])),
    [teamMembers]
  );

  const filteredMembers = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    const list = q
      ? teamMembers.filter((m) => m.fullName.toLowerCase().includes(q))
      : teamMembers;
    return list.slice(0, 6);
  }, [teamMembers, pickerQuery]);

  // Auto scroll to newest on mount and when a comment is added.
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [comments.length]);

  // If the URL has a #comment-<id> anchor, scroll to it after render.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.startsWith("#comment-")) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ block: "center" });
        el.classList.add("ring-2", "ring-petrol-300");
        const t = setTimeout(
          () => el.classList.remove("ring-2", "ring-petrol-300"),
          2500
        );
        return () => clearTimeout(t);
      }
    }
  }, []);

  function recomputePicker(value: string, caret: number) {
    // Find the last "@" at or before the caret with no whitespace between it
    // and the caret.
    let i = caret - 1;
    while (i >= 0) {
      const ch = value[i];
      if (ch === "@") break;
      if (ch === " " || ch === "\n" || ch === "\t") {
        i = -1;
        break;
      }
      i--;
    }
    if (i < 0) {
      setPickerOpen(false);
      atPosRef.current = null;
      return;
    }
    atPosRef.current = i;
    setPickerQuery(value.slice(i + 1, caret));
    setPickerIndex(0);
    setPickerOpen(true);
  }

  function onDraftChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setDraft(value);
    setError(null);
    const caret = e.target.selectionStart ?? value.length;
    recomputePicker(value, caret);
  }

  function selectMember(m: TeamMemberOption) {
    const at = atPosRef.current;
    if (at === null) return;
    const ta = taRef.current;
    const caret = ta?.selectionStart ?? draft.length;
    const before = draft.slice(0, at);
    const after = draft.slice(caret);
    const insert = `@${m.fullName} `;
    const next = `${before}${insert}${after}`;
    setDraft(next);
    setMentions((prev) =>
      prev.some((x) => x.id === m.id)
        ? prev
        : [...prev, { id: m.id, label: `@${m.fullName}` }]
    );
    setPickerOpen(false);
    atPosRef.current = null;
    // Restore focus + caret after the inserted mention.
    requestAnimationFrame(() => {
      if (ta) {
        const pos = before.length + insert.length;
        ta.focus();
        ta.setSelectionRange(pos, pos);
      }
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (pickerOpen && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setPickerIndex((i) => (i + 1) % filteredMembers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setPickerIndex(
          (i) => (i - 1 + filteredMembers.length) % filteredMembers.length
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectMember(filteredMembers[pickerIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setPickerOpen(false);
        atPosRef.current = null;
        return;
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const body = draft.trim();
    if (!body || isPending) return;
    // Only keep mentions whose label still appears in the body.
    const active = mentions.filter((m) => body.includes(m.label));
    setError(null);
    startTransition(async () => {
      const res = await postComment({
        leadId,
        body,
        mentionedUserIds: active.map((m) => m.id),
      });
      if (res.ok) {
        setComments((prev) => [...prev, res.comment]);
        setDraft("");
        setMentions([]);
        setPickerOpen(false);
        atPosRef.current = null;
      } else {
        setError(res.error);
      }
    });
  }

  function mentionNamesFor(c: DiscussionCommentRow): string[] {
    const names: string[] = [];
    for (const id of c.mentioned_user_ids) {
      const m = membersById.get(id);
      if (m) names.push(m.fullName);
    }
    return names;
  }

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-4">
        <h3 className="section-subheader">
          Notes
        </h3>
      </div>

      {/* Feed (oldest at top, newest at bottom) */}
      {comments.length === 0 ? (
        <div className="mb-4 rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-[12px] text-gray-500">
          No Notes Yet. Add The First One Below.
        </div>
      ) : (
        <div className="mb-4 space-y-3">
          {comments.map((c) => (
            <div
              key={c.id}
              id={`comment-${c.id}`}
              className="flex gap-3 rounded-md transition-shadow"
            >
              <div className="mt-[2px] flex h-7 w-7 flex-none items-center justify-center rounded-full bg-petrol-100 text-[12px] font-medium text-petrol-700">
                {avatarInitial(c.author_first_name ?? c.author_full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[13px] font-medium text-ink">
                    {c.author_first_name ?? "System"}
                  </span>
                  <span className="text-[10.5px] text-gray-500">
                    {formatTimestamp(c.created_at)}
                  </span>
                </div>
                <div className="mt-[2px]">
                  <CommentBody body={c.body} mentionNames={mentionNamesFor(c)} />
                </div>
              </div>
            </div>
          ))}
          <div ref={feedEndRef} />
        </div>
      )}

      {/* Composer */}
      <div className="relative">
        <textarea
          ref={taRef}
          value={draft}
          onChange={onDraftChange}
          onKeyDown={onKeyDown}
          onBlur={() => {
            // Delay so a click on a picker row registers first.
            setTimeout(() => setPickerOpen(false), 150);
          }}
          rows={3}
          placeholder="Add A Note. Type @ To Mention A Teammate. Cmd Enter To Save."
          className="w-full resize-y rounded-md border border-gray-200 bg-surface px-3 py-2 text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
        />

        {pickerOpen && filteredMembers.length > 0 && (
          <div className="absolute bottom-full left-2 z-20 mb-1 w-64 overflow-hidden rounded-md border border-gray-200 bg-surface shadow-card">
            {filteredMembers.map((m, i) => (
              <button
                key={m.id}
                type="button"
                // Use onMouseDown so it fires before the textarea blur.
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectMember(m);
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[13px]",
                  i === pickerIndex
                    ? "bg-petrol-50 text-petrol-700"
                    : "text-ink hover:bg-gray-100"
                )}
              >
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-petrol-100 text-[10px] font-medium text-petrol-700">
                  {avatarInitial(m.firstName)}
                </span>
                <span className="truncate">{m.fullName}</span>
                {m.id === currentUserId && (
                  <span className="ml-auto text-[10px] text-gray-400">You</span>
                )}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-2 text-[12px] text-danger">{error}</div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
            <IconAt size={13} stroke={1.75} />
            Type @ To Mention
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim() || isPending}
            className="btn-primary inline-flex cursor-pointer items-center gap-[6px] rounded-md px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            <IconSend size={13} stroke={2} />
            {isPending ? "Saving…" : "Add Note"}
          </button>
        </div>
      </div>
    </div>
  );
}
