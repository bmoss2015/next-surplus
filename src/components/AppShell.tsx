import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { RoleProvider } from "./RoleProvider";

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
        <Sidebar userName={userName} userEmail={userEmail} isAdmin={isAdmin} />
        <div className="flex flex-1 flex-col overflow-hidden bg-surface-muted">
          <Topbar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </RoleProvider>
  );
}
