-- Fixes 56-59: lead Discussion tab + @mention notifications.
--
--   * discussion_comments: threaded (flat) comments on a lead. Org-scoped via
--     auth_org_id() like every other data table. mentioned_user_ids tracks the
--     auth.users referenced by @mentions in the body.
--   * notifications: per-recipient inbox rows (currently only 'mention' type).
--     Recipients can read/update only their own rows; any org member can insert
--     (so the comment author can notify teammates).

create table discussion_comments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade default auth_org_id(),
  lead_id uuid not null references leads(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null,
  mentioned_user_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
create index discussion_comments_lead_idx on discussion_comments(lead_id, created_at);
alter table discussion_comments enable row level security;
create policy "dc org all" on discussion_comments
  for all to authenticated
  using (org_id = auth_org_id())
  with check (org_id = auth_org_id());

create table notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade default auth_org_id(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null default 'mention',
  lead_id uuid references leads(id) on delete cascade,
  comment_id uuid references discussion_comments(id) on delete cascade,
  body_preview text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on notifications(recipient_id, read, created_at desc);
alter table notifications enable row level security;
create policy "notif own select" on notifications
  for select to authenticated
  using (recipient_id = auth.uid());
create policy "notif own update" on notifications
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
create policy "notif org insert" on notifications
  for insert to authenticated
  with check (org_id = auth_org_id());
