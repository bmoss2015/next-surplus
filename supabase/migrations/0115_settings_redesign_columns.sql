-- Settings redesign — new columns + tables to support the new panels.
--
-- Profile: avatar + timezone.
-- Org: tax id (ein) + logo.
-- New table: user_notification_prefs (per-user toggles for the Notifications panel).

-- ---------------------------------------------------------------
-- profiles.avatar_url   — storage path inside the `avatars` bucket
-- profiles.time_zone    — IANA tz string, e.g. "America/Chicago"
-- ---------------------------------------------------------------
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists time_zone text;

-- ---------------------------------------------------------------
-- organizations.tax_id_ein  — EIN as string ("00-0000000")
-- organizations.logo_url    — storage path inside the `org-logos` bucket
-- ---------------------------------------------------------------
alter table public.organizations
  add column if not exists tax_id_ein text,
  add column if not exists logo_url text;

-- ---------------------------------------------------------------
-- user_notification_prefs — one row per (user_id, pref_key)
--
-- pref_key values are application-defined; current set:
--   mentions, lead_assigned, inbound_email_reply,
--   stage_changed_on_my_lead, daily_tasks_due, weekly_pipeline_summary
-- ---------------------------------------------------------------
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

drop policy if exists "user_notification_prefs_self_upsert" on public.user_notification_prefs;
create policy "user_notification_prefs_self_upsert"
  on public.user_notification_prefs for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_notification_prefs_self_update" on public.user_notification_prefs;
create policy "user_notification_prefs_self_update"
  on public.user_notification_prefs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- Storage buckets for avatars + org logos.
-- Created idempotently; existing buckets are not touched.
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('avatars',   'avatars',   true),
  ('org-logos', 'org-logos', true)
on conflict (id) do nothing;

-- Public read on both buckets (avatars + logos appear in shared chrome).
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "org_logos_public_read" on storage.objects;
create policy "org_logos_public_read"
  on storage.objects for select
  using (bucket_id = 'org-logos');

-- Authenticated users can upload their own avatar (folder = their user id).
drop policy if exists "avatars_self_upload" on storage.objects;
create policy "avatars_self_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_self_update" on storage.objects;
create policy "avatars_self_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_self_delete" on storage.objects;
create policy "avatars_self_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Org admins can upload logos for their org (folder = org_id).
drop policy if exists "org_logos_admin_upload" on storage.objects;
create policy "org_logos_admin_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'org-logos'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.is_admin = true
        and p.org_id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "org_logos_admin_update" on storage.objects;
create policy "org_logos_admin_update"
  on storage.objects for update
  using (
    bucket_id = 'org-logos'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.is_admin = true
        and p.org_id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "org_logos_admin_delete" on storage.objects;
create policy "org_logos_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'org-logos'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.is_admin = true
        and p.org_id::text = (storage.foldername(name))[1]
    )
  );
