"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconLogout } from "@tabler/icons-react";
import { useTransition } from "react";
import { signOut } from "@/app/(auth)/_actions";
import { cn } from "@/lib/cn";

type NavItem = {
  label: string;
  href: string;
  divider?: boolean;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Leads", href: "/leads" },
  { label: "Playbooks", href: "/playbooks", divider: true },
  { label: "Tasks", href: "/tasks" },
  { label: "Inbox", href: "/inbox" },
  { label: "Letters", href: "/mail" },
  { label: "Claims", href: "/claims" },
  { label: "Imports", href: "/imports", divider: true },
  { label: "Reports", href: "/reports", divider: true },
  // Fix ZZZZ2 PART 4: Settings is visible to members too — the page itself
  // shows only the member-allowed sections (admin-only sections stay hidden).
  { label: "Settings", href: "/settings" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Sidebar({
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
    <aside className="bg-sidebar-gradient relative flex w-[200px] flex-col pb-20 pt-[22px] text-white">
      <div className="mb-[18px] px-[22px] pb-5">
        <div className="text-sm font-medium text-white tracking-tight">
          Next Surplus
        </div>
      </div>

      <nav className="flex-1 px-[14px]">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <div key={item.href}>
              {item.divider && (
                <div className="my-[14px] mx-[6px] h-px bg-white/[0.08]" />
              )}
              <Link
                href={item.href}
                className={cn(
                  // Fix OOOO: clean active highlight — solid mid-petrol fill,
                  // full nav-item width, rounded corners, white text. No glow,
                  // outline, ring, or border artifact.
                  "mb-[2px] block w-full rounded-md border-0 px-3 py-2 text-[13px] outline-none ring-0 transition-colors focus:outline-none focus-visible:outline-none",
                  isActive
                    ? "bg-[#13644e] font-medium text-white"
                    : "bg-transparent text-white/70 hover:bg-white/10"
                )}
              >
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>

      <UserBlock
        userName={userName}
        userEmail={userEmail}
        roleLabel={isAdmin ? "Admin" : "Member"}
      />
    </aside>
  );
}

function UserBlock({
  userName,
  userEmail,
  roleLabel,
}: {
  userName: string;
  userEmail: string | null;
  roleLabel: string;
}) {
  const [pending, startTransition] = useTransition();
  function logout() {
    startTransition(async () => {
      await signOut();
    });
  }
  return (
    <div className="absolute bottom-0 left-0 flex w-[200px] items-center gap-[11px] border-t border-white/[0.08] px-[18px] py-4">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-[11px] font-medium">
        {initials(userName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs text-white" title={userEmail ?? undefined}>
          {userName}
        </div>
        <div className="text-[10px] text-white/55">{roleLabel}</div>
      </div>
      <button
        type="button"
        onClick={logout}
        disabled={pending}
        className="text-white/55 hover:text-white disabled:opacity-50"
        aria-label="Sign Out"
        title="Sign Out"
      >
        <IconLogout size={14} stroke={1.75} />
      </button>
    </div>
  );
}
