-- Settings clone · Phase E.3 — profile + org columns and storage buckets.
--
-- Adds the four columns the new Settings UI needs to fully wire its
-- visually-present-but-disabled fields:
--   profiles.avatar_url     — storage path inside the `avatars` bucket
--   profiles.time_zone      — IANA tz string ("America/Chicago" etc.)
--   orgs.tax_id_ein         — EIN as string ("00-0000000")
--   orgs.logo_url           — storage path inside the `org-logos` bucket
--
-- Plus the two storage buckets + RLS so the upload actions in
-- src/app/(app)/settings/_upload-actions.ts can write to them.
--
-- Idempotent. Re-runnable.

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists time_zone text;

alter table public.orgs
  add column if not exists tax_id_ein text,
  add column if not exists logo_url text;

-- Storage buckets ----------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('avatars',   'avatars',   true),
  ('org-logos', 'org-logos', true)
on conflict (id) do nothing;

-- Public read on both (avatars + logos render in shared chrome).
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "org_logos_public_read" on storage.objects;
create policy "org_logos_public_read"
  on storage.objects for select
  using (bucket_id = 'org-logos');

-- Avatars: authenticated users can write only to their own folder
-- (folder name = their user id).
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

-- Org logos: only admins of the matching org can write (folder = org id).
drop policy if exists "org_logos_admin_upload" on storage.objects;
create policy "org_logos_admin_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'org-logos'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
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
        and p.role = 'admin'
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
        and p.role = 'admin'
        and p.org_id::text = (storage.foldername(name))[1]
    )
  );
