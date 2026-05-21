"use client";

// Modern icon sidebar — replaces the old 200px dark-gradient text-label
// rail. Defaults to a slim 60px collapsed strip showing icons only; hover
// or click the toggle to expand to ~220px with labels visible. Same
// pattern HubSpot 2024 / Linear / Notion use. Brand mark at top, account
// dropdown at bottom. Active item gets a solid emerald pill + brand bar
// on the left for muscle-memory cues.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  IconDashboard,
  IconUsers,
  IconChecklist,
  IconInbox,
  IconMail,
  IconScale,
  IconFileUpload,
  IconChartBar,
  IconSettings,
  IconLogout,
  IconChevronsRight,
  IconChevronsLeft,
} from "@tabler/icons-react";
import { signOut } from "@/app/(auth)/_actions";
import { cn } from "@/lib/cn";

type NavItem = {
  label: string;
  href: string;
  Icon: typeof IconDashboard;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/",         Icon: IconDashboard },
  { label: "Leads",     href: "/leads",    Icon: IconUsers },
  { label: "Tasks",     href: "/tasks",    Icon: IconChecklist },
  { label: "Inbox",     href: "/inbox",    Icon: IconInbox },
  { label: "Mail",      href: "/mail",     Icon: IconMail },
  { label: "Claims",    href: "/claims",   Icon: IconScale },
  { label: "Imports",   href: "/imports",  Icon: IconFileUpload },
  { label: "Reports",   href: "/reports",  Icon: IconChartBar },
  { label: "Settings",  href: "/settings", Icon: IconSettings },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function IconSidebar({
  userName,
  userEmail,
  isAdmin,
}: {
  userName: string;
  userEmail: string | null;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const items = NAV.filter((item) => isAdmin || !item.adminOnly);
  const [expanded, setExpanded] = useState(false);
  const width = expanded ? 220 : 60;

  return (
    <aside
      className="relative flex shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-surface transition-all duration-200"
      style={{ width }}
    >
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 px-[18px]">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[12px] font-bold text-white"
          style={{
            background:
              "linear-gradient(135deg, #0d4b3a 0%, #04261c 100%)",
          }}
        >
          M
        </div>
        {expanded && (
          <span className="truncate text-[13.5px] font-semibold tracking-tight text-ink">
            Moss Equity
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-[10px] py-3">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!expanded ? item.label : undefined}
              className={cn(
                "group relative mb-0.5 flex h-9 items-center gap-2.5 overflow-hidden rounded-md px-2 text-[13px] transition-colors",
                isActive
                  ? "text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-ink"
              )}
              style={
                isActive
                  ? { background: "#0d4b3a" }
                  : undefined
              }
            >
              <item.Icon
                size={18}
                stroke={isActive ? 2 : 1.75}
                className="shrink-0"
              />
              {expanded && (
                <span
                  className={cn(
                    "truncate",
                    isActive ? "font-medium" : "font-normal"
                  )}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Expand/collapse toggle + account dropdown */}
      <div className="shrink-0 border-t border-gray-200 px-[10px] py-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mb-2 flex h-8 w-full cursor-pointer items-center justify-center gap-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-ink"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          title={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? (
            <IconChevronsLeft size={16} stroke={1.75} />
          ) : (
            <IconChevronsRight size={16} stroke={1.75} />
          )}
          {expanded && <span className="text-[12px]">Collapse</span>}
        </button>
        <AccountMenu
          userName={userName}
          userEmail={userEmail}
          isAdmin={isAdmin}
          expanded={expanded}
        />
      </div>
    </aside>
  );
}

function AccountMenu({
  userName,
  userEmail,
  isAdmin,
  expanded,
}: {
  userName: string;
  userEmail: string | null;
  isAdmin: boolean;
  expanded: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  function logout() {
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full cursor-pointer items-center gap-2 overflow-hidden rounded-md px-1 hover:bg-gray-100"
        title={expanded ? undefined : userName}
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold text-white"
          style={{
            background:
              "linear-gradient(135deg, #0d4b3a 0%, #04261c 100%)",
          }}
        >
          {initials(userName)}
        </div>
        {expanded && (
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-[12px] font-medium text-ink">
              {userName}
            </div>
            <div className="truncate text-[10.5px] text-gray-500">
              {isAdmin ? "Admin" : "Member"}
            </div>
          </div>
        )}
      </button>
      {open && (
        <div
          className="absolute z-40 rounded-[10px] border border-gray-200 bg-surface shadow-elevated"
          style={{
            bottom: "calc(100% + 8px)",
            left: 0,
            minWidth: 220,
            padding: "10px 0",
          }}
        >
          <div className="px-3.5 pb-2.5">
            <div className="truncate text-[13px] font-medium text-ink">
              {userName}
            </div>
            {userEmail && (
              <div
                className="truncate text-[11.5px] text-gray-500"
                title={userEmail}
              >
                {userEmail}
              </div>
            )}
            <div
              className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                background: isAdmin
                  ? "var(--color-ink)"
                  : "var(--color-petrol-100)",
                color: isAdmin ? "#fff" : "var(--color-gray-700)",
              }}
            >
              {isAdmin ? "Admin" : "Member"}
            </div>
          </div>
          <div className="h-px bg-gray-200" />
          <button
            type="button"
            onClick={logout}
            disabled={pending}
            className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2.5 text-left text-[13px] text-ink hover:bg-gray-50 disabled:opacity-50"
          >
            <IconLogout size={14} stroke={1.75} />
            {pending ? "Signing Out…" : "Sign Out"}
          </button>
        </div>
      )}
    </div>
  );
}
