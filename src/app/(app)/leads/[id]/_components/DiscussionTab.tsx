import {
  listDiscussionComments,
  listTeamMembers,
} from "../_discussion-actions";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { DiscussionTabClient } from "./DiscussionTabClient";

export async function DiscussionTab({ leadId }: { leadId: string }) {
  const [comments, members, profile] = await Promise.all([
    listDiscussionComments(leadId),
    listTeamMembers(),
    getCurrentProfile(),
  ]);
  return (
    <DiscussionTabClient
      leadId={leadId}
      initialComments={comments}
      teamMembers={members}
      currentUserId={profile?.id ?? null}
    />
  );
}
