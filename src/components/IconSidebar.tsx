"use client";

// Modern dark-emerald icon sidebar. Pattern: Linear / Apollo / Outreach /
// Salesloft. Dark chrome on the left so the brand has presence; light
// content area on the right keeps the actual work surface clean. Collapsed
// rail is 72px (icons only); expanded is 220px (icons + labels). State
// persists across reloads via localStorage. Active item gets a solid
// emerald pill + a 3px brand-light accent on the left edge so it reads at
// a glance even when collapsed.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Inbox,
  Mail,
  Scale,
  FileUp,
  BarChart3,
  Settings,
  LogOut,
  ChevronsLeft,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/app/(auth)/_actions";
import { cn } from "@/lib/cn";

type NavItem = {
  label: string;
  href: string;
  Icon: LucideIcon;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/",         Icon: LayoutDashboard },
  { label: "Leads",     href: "/leads",    Icon: Users },
  { label: "Tasks",     href: "/tasks",    Icon: CheckSquare },
  { label: "Inbox",     href: "/inbox",    Icon: Inbox },
  { label: "Mail",      href: "/mail",     Icon: Mail },
  { label: "Claims",    href: "/claims",   Icon: Scale },
  { label: "Imports",   href: "/imports",  Icon: FileUp },
  { label: "Reports",   href: "/reports",  Icon: BarChart3 },
  { label: "Settings",  href: "/settings", Icon: Settings },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const STORAGE_KEY = "moss-sidebar-expanded";

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
  // Default collapsed (icons only). Hydrate from localStorage on mount.
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setExpanded(true);
  }, []);

  function toggle() {
    setExpanded((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next ? "true" : "false");
      }
      return next;
    });
  }

  const width = expanded ? 220 : 72;

  return (
    <aside
      className="relative flex shrink-0 flex-col overflow-hidden text-white transition-all duration-200"
      style={{
        width,
        background:
          "linear-gradient(180deg, #04261c 0%, #0d4b3a 100%)",
      }}
    >
      {/* Brand row — collapse toggle lives here at the top instead of buried
          near the account menu. Collapsed: the ME monogram is the expand
          button (one tap to expand). Expanded: full wordmark on the left,
          dedicated collapse chevron on the right. Two states, never both
          monogram + wordmark together. */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-[18px]">
        {expanded ? (
          <>
            <div
              className="min-w-0 flex-1 truncate text-[14px] font-semibold tracking-tight"
              title="Moss Equity Partners"
            >
              Moss Equity Partners
            </div>
            <button
              type="button"
              onClick={toggle}
              aria-label="Collapse sidebar"
              title="Collapse"
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-white/55 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronsLeft size={15} strokeWidth={2} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={toggle}
            aria-label="Expand sidebar"
            title="Expand"
            className="mx-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-[11.5px] font-bold tracking-tight text-white transition-all hover:brightness-125"
            style={{ background: "rgba(255,255,255,0.10)" }}
          >
            ME
          </button>
        )}
      </div>

      <div className="mx-3 h-px bg-white/[0.08]" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
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
                "group relative mb-0.5 flex h-10 items-center gap-3 overflow-hidden rounded-md px-3 text-[13px] transition-colors",
                isActive
                  ? "font-medium text-white"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              )}
              style={
                isActive
                  ? { background: "rgba(255,255,255,0.16)" }
                  : undefined
              }
            >
              {/* Active brand bar on left edge — reads at a glance even when
                  the rail is collapsed (the icon alone could be ambiguous).
                  Brighter brand emerald + taller bar so the active row pops
                  against the dark chrome. */}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 -translate-y-1/2"
                  style={{
                    width: 3,
                    height: 22,
                    background: "#5db98a",
                    borderRadius: "0 2px 2px 0",
                  }}
                />
              )}
              <item.Icon
                size={18}
                strokeWidth={isActive ? 2.25 : 1.75}
                className="shrink-0"
              />
              {expanded && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 h-px bg-white/[0.08]" />

      {/* Account menu — collapse toggle is now in the brand row up top, so
          the bottom of the rail is reserved for identity / sign-out only. */}
      <div className="shrink-0 px-3 py-3">
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
        className="flex h-10 w-full cursor-pointer items-center gap-2.5 overflow-hidden rounded-md px-2 hover:bg-white/10"
        title={expanded ? undefined : userName}
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold text-white"
          style={{ background: "rgba(255,255,255,0.18)" }}
        >
          {initials(userName)}
        </div>
        {expanded && (
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-[12px] font-medium text-white">
              {userName}
            </div>
            <div className="truncate text-[10.5px] text-white/55">
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
            <LogOut size={14} strokeWidth={1.75} />
            {pending ? "Signing Out…" : "Sign Out"}
          </button>
        </div>
      )}
    </div>
  );
}
