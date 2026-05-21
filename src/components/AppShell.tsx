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
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string | null;
  isAdmin: boolean;
}) {
  return (
    <RoleProvider isAdmin={isAdmin}>
      <div className="flex h-screen w-screen overflow-hidden bg-canvas">
        <IconSidebar
          userName={userName}
          userEmail={userEmail}
          isAdmin={isAdmin}
        />
        <div className="flex flex-1 flex-col overflow-hidden bg-surface-muted">
          <Topbar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </RoleProvider>
  );
}
