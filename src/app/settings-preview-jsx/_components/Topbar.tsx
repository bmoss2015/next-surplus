// Settings clone · Phase C — top bar with real user identity.
//
// Lifts the mockup's <div class="topbar"> markup into JSX. Avatar initials
// and the brand mark stay visual-only for now; the top nav links and search
// box are non-functional placeholders that match the mockup. Phase D wires
// nav to the real portal routes when /settings-preview-jsx moves to
// /settings.

import type { CurrentUser } from "./SettingsPreviewJsx";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Topbar({ currentUser }: { currentUser?: CurrentUser }) {
  const av = currentUser ? initials(currentUser.fullName) : "BM";

  return (
    <div className="topbar sticky top-0 z-30 flex items-center justify-between px-8 h-14">
      <div className="flex items-center gap-8">
        <span className="brand-mark">Moss Equity</span>
        <nav className="nav-top flex items-center gap-0.5">
          <a>Leads</a>
          <a>Tasks</a>
          <a>Inbox</a>
          <a>Mail</a>
          <a>Reports</a>
          <a className="active">Settings</a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="topbar-search">
          <i className="icon icon-search" />
          <span>Search settings</span>
          <span className="flex items-center gap-1 ml-auto">
            <span className="kbd">⌘</span>
            <span className="kbd">K</span>
          </span>
        </div>
        <div className="avatar av-self">{av}</div>
      </div>
    </div>
  );
}
