// Slim utility top bar — sits above the page content, alongside the icon
// sidebar. Just the global actions: search, notifications, Import Leads.
// Nav links moved to the sidebar; user dropdown moved to the sidebar's
// account block. This bar stays minimal so the page content gets the
// vertical real estate.

import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";
import { NotificationBell } from "./NotificationBell";
import { GlobalSearch } from "./GlobalSearch";

export function Topbar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-surface px-6">
      {/* GlobalSearch — leads, attorneys, members, templates. ⌘K focuses. */}
      <div className="w-80">
        <GlobalSearch />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <NotificationBell />
        <Link
          href="/imports"
          className="btn btn-primary btn-sm inline-flex items-center gap-[6px]"
        >
          <IconPlus size={13} stroke={2} />
          Import Leads
        </Link>
      </div>
    </header>
  );
}
