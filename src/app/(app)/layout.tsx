import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { fetchUrgentTaskCount } from "@/lib/tasks/fetch-urgent-count";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  // Signed-in but no profile (e.g. created outside an invite) — they have no
  // org and can't use the app. Send them back to sign in.
  if (!profile) redirect("/login");

  const urgent = await fetchUrgentTaskCount();

  return (
    <AppShell
      userName={profile.fullName}
      userEmail={profile.email}
      isAdmin={profile.isAdmin}
      isOwner={profile.isOwner}
      urgentOverdue={urgent.overdue}
      urgentDueToday={urgent.dueToday}
    >
      {children}
    </AppShell>
  );
}
