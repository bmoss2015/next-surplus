"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconBell } from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/(app)/leads/[id]/_discussion-actions";
import type { NotificationRow } from "@/lib/notifications/types";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "Just Now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m Ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h Ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d Ago`;
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return `${diffMo}mo Ago`;
  return `${Math.floor(diffMo / 12)}y Ago`;
}

const POLL_MS = 30_000;

// Plays a soft two-tone chime (Web Audio, synthesized — no asset needed).
// Safe to call from browsers without AudioContext (it just no-ops).
function playChime() {
  if (typeof window === "undefined") return;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return;
  try {
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.12, now);
    master.connect(ctx.destination);

    const tone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + start);
      g.gain.setValueAtTime(0.0001, now + start);
      g.gain.exponentialRampToValueAtTime(1, now + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(g);
      g.connect(master);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    };

    // E5 then A5 — short and bright, total well under 1 second.
    tone(659.25, 0, 0.18);
    tone(880.0, 0.13, 0.32);

    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 800);
  } catch {
    // ignore — audio is non-essential
  }
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  // Previous unread count, so we only chime when it actually goes up — never
  // on first load (starts null until the baseline count is established).
  const prevUnreadRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await getNotifications();
      setItems(res.notifications);
      setUnread(res.unreadCount);
      const prev = prevUnreadRef.current;
      if (prev !== null && res.unreadCount > prev) {
        playChime();
      }
      prevUnreadRef.current = res.unreadCount;
    } catch {
      // ignore — bell stays in its last state
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function onClickItem(n: NotificationRow) {
    setOpen(false);
    if (!n.read) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
      setUnread((u) => {
        const next = Math.max(0, u - 1);
        prevUnreadRef.current = next;
        return next;
      });
      startTransition(async () => {
        await markNotificationRead(n.id);
      });
    }
    if (n.lead_id) {
      const anchor = n.comment_id ? `#comment-${n.comment_id}` : "";
      router.push(`/leads/${n.lead_id}?tab=notes${anchor}`);
    }
  }

  function onMarkAll() {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
    prevUnreadRef.current = 0;
    startTransition(async () => {
      await markAllNotificationsRead();
    });
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative inline-flex cursor-pointer items-center justify-center rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-ink"
      >
        <IconBell size={18} stroke={1.75} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-lg border border-gray-200 bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
            <span className="text-[13px] font-medium text-ink">
              Notifications
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={onMarkAll}
                className="cursor-pointer text-[11px] font-medium text-petrol-500 hover:text-petrol-700"
              >
                Mark All As Read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12px] text-gray-500">
                No Notifications Yet.
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onClickItem(n)}
                  className={cn(
                    "flex w-full cursor-pointer flex-col gap-0.5 border-b border-gray-100 px-3 py-2.5 text-left transition-colors hover:bg-gray-50",
                    !n.read && "bg-petrol-50/60"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] text-ink">
                      <span className="font-medium">
                        {n.actor_first_name ?? "Someone"}
                      </span>{" "}
                      Mentioned You
                    </span>
                    <span className="flex-none text-[10.5px] text-gray-400">
                      {relativeTime(n.created_at)}
                    </span>
                  </div>
                  {n.lead_label && (
                    <span className="truncate text-[11.5px] text-gray-500">
                      {n.lead_label}
                    </span>
                  )}
                  {n.body_preview && (
                    <span className="line-clamp-2 text-[11.5px] text-gray-500">
                      {n.body_preview}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
