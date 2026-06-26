import { redirect } from "next/navigation";
import { AppShell } from "@/Components/AppShell";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { fetchUrgentTaskCount } from "@/lib/tasks/fetch-urgent-count";
import { createServiceClient } from "@/lib/supabase/service";

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

  let newFeedbackCount = 0;
  if (profile.canViewFeedback) {
    const admin = createServiceClient();
    const [newRes, unreadRes] = await Promise.all([
      admin
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
      admin
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("inbound_unread", true),
    ]);
    newFeedbackCount = (newRes.count ?? 0) + (unreadRes.count ?? 0);
  }

  return (
    <AppShell
      userName={profile.fullName}
      userEmail={profile.email}
      isAdmin={profile.isAdmin}
      isOwner={profile.isOwner}
      canViewFeedback={profile.canViewFeedback}
      newFeedbackCount={newFeedbackCount}
      urgentOverdue={urgent.overdue}
      urgentDueToday={urgent.dueToday}
    >
      {children}
    </AppShell>
  );
}
