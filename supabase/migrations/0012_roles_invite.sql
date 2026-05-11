-- User roles + invite flow.
--
--   * `profiles` already carries `role` (admin|member) from 0011. This adds
--     `profiles.email` (mirrored from auth.users) so the team UI can show it
--     without reaching for the admin API.
--   * Trigger on auth.users: when a user is created via inviteUserByEmail with
--     { org_id, role } in their metadata, their profile is auto-created in that
--     org with that role. Users created without org metadata get no profile
--     (and therefore no access) — signup is invite-only.
--   * RLS tightening:
--       - DELETE on every data table is admin-only.
--       - INSERT/UPDATE on the Settings-managed tables (app_settings,
--         state_rules, attorneys, templates) is admin-only.
--       - Operational tables keep org-scoped insert/update for all members.
--         lost_reasons stays member-writable too (the Mark Lost dialog adds
--         custom reasons), but its DELETE is admin-only like everything else.

-------------------------------------------------------------------------------
-- 1. profiles.email, backfilled from auth.users.
-------------------------------------------------------------------------------
alter table profiles add column email text;
update profiles p set email = u.email from auth.users u where u.id = p.id;

-------------------------------------------------------------------------------
-- 2. Auto-provision a profile when an invited user is created.
-------------------------------------------------------------------------------
create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public, auth
as $$
begin
  if new.raw_user_meta_data ? 'org_id' then
    insert into public.profiles (id, org_id, role, full_name, email)
    values (
      new.id,
      (new.raw_user_meta_data ->> 'org_id')::uuid,
      case when new.raw_user_meta_data ->> 'role' = 'admin' then 'admin' else 'member' end,
      coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), new.email),
      new.email
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-------------------------------------------------------------------------------
-- 3. Admin-only DELETE on every data table.
-------------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'leads','owners','contacts','verification_items','activities','tasks',
    'documents','imports','import_rows','attorneys','templates',
    'app_settings','state_rules','lost_reasons'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I on %I', t || ' org delete', t);
    execute format('create policy %I on %I for delete to authenticated using (org_id = auth_org_id() and auth_is_admin())', t || ' org delete', t);
  end loop;
end $$;

-------------------------------------------------------------------------------
-- 4. Admin-only INSERT/UPDATE on the Settings-managed tables.
-------------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array['app_settings','state_rules','attorneys','templates'];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I on %I', t || ' org insert', t);
    execute format('drop policy if exists %I on %I', t || ' org update', t);
    execute format('create policy %I on %I for insert to authenticated with check (org_id = auth_org_id() and auth_is_admin())', t || ' org insert', t);
    execute format('create policy %I on %I for update to authenticated using (org_id = auth_org_id() and auth_is_admin()) with check (org_id = auth_org_id() and auth_is_admin())', t || ' org update', t);
  end loop;
end $$;

-- Deleting a stored document is an admin action too.
drop policy if exists "documents: org delete" on storage.objects;
create policy "documents: org delete" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and split_part(name, '/', 1) = auth_org_id()::text and auth_is_admin());
