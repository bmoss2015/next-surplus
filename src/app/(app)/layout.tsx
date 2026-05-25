import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentProfile } from "@/lib/auth/current-user";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  // Signed-in but no profile (e.g. created outside an invite) — they have no
  // org and can't use the app. Send them back to sign in.
  if (!profile) redirect("/login");

  return (
    <AppShell
      userName={profile.fullName}
      userEmail={profile.email}
      isAdmin={profile.isAdmin}
      isOwner={profile.isOwner}
    >
      {children}
    </AppShell>
  );
}
