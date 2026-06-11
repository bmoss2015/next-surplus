"use client";

// Slim utility top bar sitting above the page content. Left = page title
// (so the bar doesn't read empty on the left now that the brand + nav
// moved into the sidebar). Right = global utility chrome — search,
// notifications, Import Leads.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { IconAlarm } from "@tabler/icons-react";
import { NotificationBell } from "./NotificationBell";
import { GlobalSearch } from "./GlobalSearch";

// Page-title lookup. Lead detail, task detail, inbox thread, etc. all
// land under their section's title so the bar always has something
// meaningful on the left.
function pageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/leads")) return "Leads";
  if (pathname.startsWith("/tasks")) return "Tasks";
  if (pathname.startsWith("/inbox")) return "Inbox";
  if (pathname.startsWith("/mail")) return "Mail";
  if (pathname.startsWith("/claims")) return "Claims";
  if (pathname.startsWith("/imports")) return "Imports";
  if (pathname.startsWith("/reports")) return "Reports";
  if (pathname.startsWith("/settings")) return "Settings";
  return "";
}

export function Topbar({
  urgentOverdue,
  urgentDueToday,
}: {
  urgentOverdue: number;
  urgentDueToday: number;
}) {
  const pathname = usePathname();
  const title = pageTitle(pathname);
  const urgentTotal = urgentOverdue + urgentDueToday;
  const urgentLabel =
    urgentOverdue > 0 && urgentDueToday > 0
      ? `${urgentOverdue} overdue, ${urgentDueToday} due today`
      : urgentOverdue > 0
        ? `${urgentOverdue} overdue ${urgentOverdue === 1 ? "task" : "tasks"}`
        : `${urgentDueToday} due today`;

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-surface px-6">
      {title && (
        <div className="text-[15px] font-semibold tracking-tight text-ink">
          {title}
        </div>
      )}
      <div className="ml-auto flex items-center gap-3">
        <div className="w-80">
          <GlobalSearch />
        </div>
        {urgentTotal > 0 && (
          <Link
            href="/tasks?filter=urgent"
            aria-label={urgentLabel}
            title={urgentLabel}
            className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-ink"
          >
            <IconAlarm size={18} stroke={1.6} />
            <span
              className={
                urgentOverdue > 0
                  ? "absolute -right-0.5 -top-0.5 inline-flex min-w-[16px] items-center justify-center rounded-full bg-danger px-[4px] text-[10px] font-semibold leading-[16px] text-white"
                  : "absolute -right-0.5 -top-0.5 inline-flex min-w-[16px] items-center justify-center rounded-full bg-warn-strong px-[4px] text-[10px] font-semibold leading-[16px] text-white"
              }
            >
              {urgentTotal > 99 ? "99+" : urgentTotal}
            </span>
          </Link>
        )}
        <NotificationBell />
        <Link
          href="/imports"
          className="btn btn-primary btn-sm inline-flex items-center gap-[6px]"
        >
          <Plus size={13} strokeWidth={2} />
          Import Leads
        </Link>
      </div>
    </header>
  );
}
