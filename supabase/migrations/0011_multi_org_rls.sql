-- Multi-org tenancy + enforced row level security.
--
-- What this does:
--   * Adds `orgs` (id, name, created_at) and `profiles` (auth user -> org + role).
--   * Adds an `org_id` column to every data table, backfilled to the founding
--     org, NOT NULL, with a column default of auth_org_id() so future inserts
--     self-assign the caller's org.
--   * Repoints the singleton/reference tables (app_settings, state_rules) so
--     their primary keys include org_id.
--   * Drops the old permissive / user-scoped RLS policies and replaces them with
--     org-scoped policies on every table (select/insert/update/delete).
--   * Scopes the `documents` storage bucket by org via a `<org_id>/...` path prefix.
--   * Seeds one org ("Moss Equity Partners") and makes every existing auth user
--     an admin of it.
--
-- Note: the per-user `settings` table and the `notes` table are intentionally
-- NOT given org_id here — they are dropped in a later migration (notes live in
-- `activities`; `app_settings` supersedes `settings`). There is no `messages`
-- table yet (Inbox is a future feature); it will get org_id when it is created.

-------------------------------------------------------------------------------
-- 1. Orgs + profiles
-------------------------------------------------------------------------------
create table orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_org_id_idx on profiles(org_id);
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Seed the founding org.
insert into orgs (name) values ('Moss Equity Partners');

-- Backfill: every existing auth user joins the founding org as an admin.
insert into profiles (id, org_id, role, full_name)
select u.id,
       (select id from orgs order by created_at limit 1),
       'admin',
       coalesce(u.raw_user_meta_data ->> 'full_name', u.email)
from auth.users u
on conflict (id) do nothing;

-------------------------------------------------------------------------------
-- 2. Helper functions. SECURITY DEFINER so RLS policies can call them without
--    recursing through profiles' own RLS.
-------------------------------------------------------------------------------
create or replace function auth_org_id() returns uuid
  language sql stable security definer set search_path = public, auth
as $$ select org_id from public.profiles where id = auth.uid() $$;

create or replace function auth_is_admin() returns boolean
  language sql stable security definer set search_path = public, auth
as $$ select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false) $$;

-------------------------------------------------------------------------------
-- 3. The FKs that pinned leads.state / templates.state to the global
--    state_rules PK have to go — state_rules becomes org-scoped below.
-------------------------------------------------------------------------------
alter table leads drop constraint if exists leads_state_fkey;
alter table templates drop constraint if exists templates_state_fkey;

-------------------------------------------------------------------------------
-- 4. Add org_id everywhere, backfill, lock down, default to auth_org_id().
-------------------------------------------------------------------------------
do $$
declare
  t text;
  founding uuid := (select id from orgs order by created_at limit 1);
  tables text[] := array[
    'leads','owners','contacts','verification_items','activities','tasks',
    'documents','imports','import_rows','attorneys','templates',
    'app_settings','state_rules','lost_reasons'
  ];
begin
  foreach t in array tables loop
    execute format('alter table %I add column org_id uuid references orgs(id) on delete cascade', t);
    execute format('update %I set org_id = %L where org_id is null', t, founding);
    execute format('alter table %I alter column org_id set not null', t);
    execute format('alter table %I alter column org_id set default auth_org_id()', t);
    execute format('create index %I on %I (org_id)', t || '_org_id_idx', t);
  end loop;
end $$;

-- Repoint singleton/reference PKs to be per-org.
alter table app_settings drop constraint app_settings_pkey;
alter table app_settings add primary key (org_id, key);

alter table state_rules drop constraint state_rules_pkey;
alter table state_rules add primary key (org_id, state);

-------------------------------------------------------------------------------
-- 5. Drop the old policies.
-------------------------------------------------------------------------------
drop policy if exists "leads: authenticated read all" on leads;
drop policy if exists "leads: authenticated insert" on leads;
drop policy if exists "leads: authenticated update" on leads;
drop policy if exists "leads: authenticated delete" on leads;
drop policy if exists "owners: authenticated all" on owners;
drop policy if exists "contacts: authenticated all" on contacts;
drop policy if exists "verification_items: authenticated all" on verification_items;
drop policy if exists "activities: authenticated read" on activities;
drop policy if exists "activities: authenticated insert" on activities;
drop policy if exists "tasks: own read" on tasks;
drop policy if exists "tasks: own insert" on tasks;
drop policy if exists "tasks: own update" on tasks;
drop policy if exists "tasks: own delete" on tasks;
drop policy if exists "documents: authenticated all" on documents;
drop policy if exists "imports: own read" on imports;
drop policy if exists "imports: own insert" on imports;
drop policy if exists "import_rows: own via parent" on import_rows;
drop policy if exists "attorneys: authenticated all" on attorneys;
drop policy if exists "templates: authenticated all" on templates;
drop policy if exists "state_rules: authenticated read" on state_rules;
drop policy if exists "lost_reasons: authenticated read" on lost_reasons;
drop policy if exists "lost_reasons: authenticated insert" on lost_reasons;
drop policy if exists "lost_reasons: authenticated update" on lost_reasons;
drop policy if exists "app_settings: authenticated all" on app_settings;

-------------------------------------------------------------------------------
-- 6. New org-scoped policies on every data table.
--    Role-aware delete restrictions (admin-only) land in the roles migration;
--    here every member of the org has full CRUD within their org.
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
    execute format('create policy %I on %I for select to authenticated using (org_id = auth_org_id())', t || ' org read', t);
    execute format('create policy %I on %I for insert to authenticated with check (org_id = auth_org_id())', t || ' org insert', t);
    execute format('create policy %I on %I for update to authenticated using (org_id = auth_org_id()) with check (org_id = auth_org_id())', t || ' org update', t);
    execute format('create policy %I on %I for delete to authenticated using (org_id = auth_org_id())', t || ' org delete', t);
  end loop;
end $$;

-------------------------------------------------------------------------------
-- 7. RLS on orgs + profiles.
-------------------------------------------------------------------------------
alter table orgs enable row level security;
create policy "orgs: read own" on orgs for select to authenticated
  using (id = auth_org_id());

alter table profiles enable row level security;
create policy "profiles: read own org" on profiles for select to authenticated
  using (org_id = auth_org_id());
create policy "profiles: admin write" on profiles for all to authenticated
  using (org_id = auth_org_id() and auth_is_admin())
  with check (org_id = auth_org_id() and auth_is_admin());

-------------------------------------------------------------------------------
-- 8. Scope the documents storage bucket by org: object paths are
--    `<org_id>/<lead_id>/<timestamp>_<filename>`. There are no objects yet, so
--    no data migration is needed.
-------------------------------------------------------------------------------
drop policy if exists "documents: authenticated read" on storage.objects;
drop policy if exists "documents: authenticated insert" on storage.objects;
drop policy if exists "documents: authenticated update" on storage.objects;
drop policy if exists "documents: authenticated delete" on storage.objects;

create policy "documents: org read" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and split_part(name, '/', 1) = auth_org_id()::text);
create policy "documents: org insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and split_part(name, '/', 1) = auth_org_id()::text);
create policy "documents: org update" on storage.objects for update to authenticated
  using (bucket_id = 'documents' and split_part(name, '/', 1) = auth_org_id()::text);
create policy "documents: org delete" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and split_part(name, '/', 1) = auth_org_id()::text);
