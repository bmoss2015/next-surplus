import { IconSidebar } from "./IconSidebar";
import { Topbar } from "./Topbar";
import { RoleProvider } from "./RoleProvider";

// Portal chrome — modernized to match where 2024-2026 CRMs are. Icon
// sidebar on the left (collapsed 60px → expanded 220px), slim utility
// top bar above the content. Same shell on every (app) page including
// /settings, so users never feel like they jumped to a different
// product.
export function AppShell({
  children,
  userName,
  userEmail,
  isAdmin,
  isOwner,
  canViewFeedback,
  urgentOverdue,
  urgentDueToday,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string | null;
  isAdmin: boolean;
  isOwner: boolean;
  canViewFeedback?: boolean;
  urgentOverdue?: number;
  urgentDueToday?: number;
}) {
  return (
    <RoleProvider isAdmin={isAdmin} isOwner={isOwner}>
      <div className="flex h-screen w-screen overflow-hidden bg-canvas">
        <IconSidebar
          userName={userName}
          userEmail={userEmail}
          isAdmin={isAdmin}
          isOwner={isOwner}
          canViewFeedback={canViewFeedback ?? false}
        />
        <div className="flex flex-1 flex-col overflow-hidden bg-surface-muted">
          <Topbar urgentOverdue={urgentOverdue ?? 0} urgentDueToday={urgentDueToday ?? 0} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </RoleProvider>
  );
}
