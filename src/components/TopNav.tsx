"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { IconLogout, IconPlus, IconSearch } from "@tabler/icons-react";
import { signOut } from "@/app/(auth)/_actions";
import { NotificationBell } from "./NotificationBell";
import { cn } from "@/lib/cn";

type NavItem = {
  label: string;
  href: string;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Leads",     href: "/leads" },
  { label: "Tasks",     href: "/tasks" },
  { label: "Inbox",     href: "/inbox" },
  { label: "Mail",      href: "/mail" },
  { label: "Claims",    href: "/claims" },
  { label: "Imports",   href: "/imports" },
  { label: "Reports",   href: "/reports" },
  { label: "Settings",  href: "/settings" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TopNav({
  userName,
  userEmail,
  isAdmin,
}: {
  userName: string;
  userEmail: string | null;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const items = NAV.filter((item) => isAdmin || !item.adminOnly);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  // ⌘K (or Ctrl+K) opens the search input
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const el = document.getElementById("topnav-search");
        if (el) (el as HTMLInputElement).focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function logout() {
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-surface/85 backdrop-blur">
      <div className="flex h-14 items-center gap-6 px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center text-[15px] font-semibold tracking-tight text-ink">
          Moss Equity
        </Link>

        {/* Horizontal nav */}
        <nav className="flex flex-1 items-center gap-0.5">
          {items.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                  isActive ? "bg-gray-100 text-ink" : "text-gray-500 hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        <label className="hidden md:inline-flex h-8 cursor-text items-center gap-2 rounded-md border border-transparent bg-gray-100 px-3 text-[12.5px] text-gray-500 hover:bg-gray-150 focus-within:border-gray-200 focus-within:bg-surface">
          <IconSearch size={13} stroke={1.75} />
          <input
            id="topnav-search"
            type="search"
            placeholder="Search"
            className="w-44 bg-transparent text-ink outline-none placeholder:text-gray-500"
          />
          <kbd className="rounded border border-gray-200 bg-surface px-1.5 py-0.5 text-[10px] font-medium text-gray-500 font-mono">⌘K</kbd>
        </label>

        <Link
          href="/imports"
          className="hidden lg:inline-flex items-center gap-[6px] rounded-md btn-primary px-3 py-1.5 text-[12.5px] font-medium text-white"
        >
          <IconPlus size={13} stroke={2} />
          Import Leads
        </Link>

        <NotificationBell />

        {/* User menu */}
        <div className="relative" data-user-menu>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[11px] font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #0d4b3a 0%, #04261c 100%)" }}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title={userName}
          >
            {initials(userName)}
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-56 overflow-hidden rounded-md border border-gray-200 bg-surface shadow-card-hover"
            >
              <div className="border-b border-gray-150 px-3 py-2.5">
                <div className="truncate text-[13px] font-medium text-ink">{userName}</div>
                <div className="truncate text-[11.5px] text-gray-500">{userEmail}</div>
                <div className="mt-1 text-[10.5px] uppercase tracking-wide text-gray-400">{isAdmin ? "Admin" : "Member"}</div>
              </div>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-[12.5px] text-ink hover:bg-gray-50"
              >
                Settings
              </Link>
              <button
                type="button"
                onClick={logout}
                disabled={pending}
                className="flex w-full items-center gap-2 border-t border-gray-150 px-3 py-2 text-left text-[12.5px] text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <IconLogout size={14} stroke={1.75} />
                {pending ? "Signing out…" : "Sign out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
