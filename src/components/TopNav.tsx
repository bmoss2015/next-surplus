"use client";

// Portal-wide top navigation — replaces the old left Sidebar + thin Topbar.
//
// Matches the mockup's `.topbar` design: white-ish background with backdrop
// blur, hairline bottom border, brand mark left, horizontal nav middle,
// search + notifications + Import Leads button + avatar right. Active nav
// item gets a subtle gray-pill background and weight-500 ink text — same
// treatment Settings uses for its sub-rail.
//
// User dropdown (click avatar) replaces the Sidebar's bottom user block —
// shows full name, email, role, and Sign Out. The old Sidebar's 200px
// fixed column is gone; (app) pages now get the full window width.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { IconLogout, IconPlus } from "@tabler/icons-react";
import { signOut } from "@/app/(auth)/_actions";
import { NotificationBell } from "./NotificationBell";
import { GlobalSearch } from "./GlobalSearch";
import { cn } from "@/lib/cn";

type NavItem = {
  label: string;
  href: string;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Leads", href: "/leads" },
  { label: "Tasks", href: "/tasks" },
  { label: "Inbox", href: "/inbox" },
  { label: "Mail", href: "/mail" },
  { label: "Claims", href: "/claims" },
  { label: "Imports", href: "/imports" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
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
  const items = NAV.filter((item) => isAdmin || !item.adminOnly);

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between gap-6 border-b border-gray-200 px-8"
      style={{
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-8">
        <Link
          href="/"
          className="shrink-0 text-[14.5px] font-semibold tracking-tight text-ink"
        >
          Moss Equity
        </Link>
        <nav className="flex items-center gap-0.5">
          {items.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-[11px] py-[6px] text-[13px] transition-colors",
                  isActive
                    ? "font-medium text-ink"
                    : "text-gray-500 hover:text-ink"
                )}
                style={
                  isActive
                    ? { background: "rgba(12, 13, 16, 0.06)" }
                    : undefined
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="w-80">
          <GlobalSearch />
        </div>
        <NotificationBell />
        <Link
          href="/imports"
          className="btn btn-primary btn-sm inline-flex items-center gap-[6px]"
        >
          <IconPlus size={13} stroke={2} />
          Import Leads
        </Link>
        <UserMenu
          userName={userName}
          userEmail={userEmail}
          roleLabel={isAdmin ? "Admin" : "Member"}
        />
      </div>
    </header>
  );
}

function UserMenu({
  userName,
  userEmail,
  roleLabel,
}: {
  userName: string;
  userEmail: string | null;
  roleLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  // Outside click closes the menu.
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
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[10.5px] font-semibold text-white"
        style={{
          background:
            "linear-gradient(135deg, #0d4b3a 0%, #04261c 100%)",
        }}
      >
        {initials(userName)}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: "var(--color-surface)",
            border: "1px solid var(--color-gray-200)",
            borderRadius: 10,
            boxShadow: "0 8px 28px -8px rgba(12,13,16,0.20)",
            minWidth: 220,
            padding: "10px 0",
            zIndex: 40,
          }}
        >
          <div style={{ padding: "4px 14px 10px" }}>
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
                background:
                  roleLabel === "Admin"
                    ? "var(--color-ink)"
                    : "var(--color-petrol-100)",
                color: roleLabel === "Admin" ? "#fff" : "var(--color-gray-700)",
              }}
            >
              {roleLabel}
            </div>
          </div>
          <div
            style={{
              height: 1,
              background: "var(--color-gray-200)",
              margin: "4px 0",
            }}
          />
          <button
            type="button"
            onClick={logout}
            disabled={pending}
            className="flex w-full cursor-pointer items-center gap-2 text-[13px] text-ink hover:bg-gray-50 disabled:opacity-50"
            style={{ padding: "10px 14px", textAlign: "left", background: "transparent", border: 0 }}
          >
            <IconLogout size={14} stroke={1.75} />
            {pending ? "Signing Out…" : "Sign Out"}
          </button>
        </div>
      )}
    </div>
  );
}
