// Plain (non-"use server") module for types shared between the Discussion /
// notification server actions and their client components.

export type TeamMemberOption = {
  id: string;
  fullName: string;
  firstName: string;
  email: string | null;
};

export type DiscussionCommentRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string | null;
  author_first_name: string | null;
  author_full_name: string | null;
  mentioned_user_ids: string[];
};

export type NotificationRow = {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  lead_id: string | null;
  comment_id: string | null;
  body_preview: string | null;
  actor_id: string | null;
  actor_first_name: string | null;
  lead_label: string | null;
};

export type PostCommentResult =
  | { ok: true; comment: DiscussionCommentRow }
  | { ok: false; error: string };

export type ActionResult = { ok: true } | { ok: false; error: string };
