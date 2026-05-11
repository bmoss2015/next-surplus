import { fetchNotes } from "@/lib/leads/fetch-tab-data";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { firstNameFrom } from "@/lib/leads/activity-format";
import { NotesTabClient } from "./NotesTabClient";

export async function NotesTab({ leadId }: { leadId: string }) {
  const [notes, profile] = await Promise.all([
    fetchNotes(leadId),
    getCurrentProfile(),
  ]);
  return (
    <NotesTabClient
      leadId={leadId}
      initialNotes={notes}
      currentUserId={profile?.id ?? null}
      currentUserFirstName={
        profile ? firstNameFrom(profile.fullName, profile.email) : null
      }
    />
  );
}
