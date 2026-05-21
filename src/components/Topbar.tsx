"use client";

// Slim utility top bar sitting above the page content. Left = page title
// (so the bar doesn't read empty on the left now that the brand + nav
// moved into the sidebar). Right = global utility chrome — search,
// notifications, Import Leads.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
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

export function Topbar() {
  const pathname = usePathname();
  const title = pageTitle(pathname);

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
