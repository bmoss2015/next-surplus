import { TopNav } from "./TopNav";
import { RoleProvider } from "./RoleProvider";

// Step 2 — replaced the left Sidebar + thin Topbar with a single horizontal
// TopNav. The whole portal now flows top-to-bottom: nav at the top, page
// content fills the rest. Sidebar.tsx + Topbar.tsx are retired (kept
// around in git history; not imported anywhere).
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
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas">
        <TopNav userName={userName} userEmail={userEmail} isAdmin={isAdmin} />
        <main className="flex-1 overflow-auto bg-surface-muted">
          {children}
        </main>
      </div>
    </RoleProvider>
  );
}
