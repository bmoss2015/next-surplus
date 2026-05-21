-- Settings clone · Phase C.7 — per-user notification preferences.
--
-- Backs the Notifications panel in /settings. One row per (user_id,
-- pref_key); fetchMyNotificationPrefs() reads them, setMyNotificationPref()
-- writes via upsert.
--
-- pref_key values are application-defined; the current set is enumerated
-- in src/app/(app)/settings/_notification-prefs.ts:
--   mentions, lead_assigned, inbound_email_reply,
--   stage_changed_on_my_lead, daily_tasks_due, weekly_pipeline_summary
--
-- This is a focused subset of the larger 0115 migration from
-- feat/settings-redesign — the avatar/EIN/logo/time-zone columns and
-- storage buckets are intentionally NOT included here; they'll land in
-- a follow-up migration when those features are actually wired.

create table if not exists public.user_notification_prefs (
  user_id uuid not null references auth.users(id) on delete cascade,
  pref_key text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, pref_key)
);

alter table public.user_notification_prefs enable row level security;

-- Users can read + write only their own prefs.
drop policy if exists "user_notification_prefs_self_select" on public.user_notification_prefs;
create policy "user_notification_prefs_self_select"
  on public.user_notification_prefs for select
  using (auth.uid() = user_id);

drop policy if exists "user_notification_prefs_self_insert" on public.user_notification_prefs;
create policy "user_notification_prefs_self_insert"
  on public.user_notification_prefs for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_notification_prefs_self_update" on public.user_notification_prefs;
create policy "user_notification_prefs_self_update"
  on public.user_notification_prefs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
