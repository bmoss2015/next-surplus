-- Owner role.
--
-- Adds 'owner' as a third valid value for profiles.role, alongside 'admin'
-- and 'member'. Owner is intended for the SaaS operator (Bree). It is a
-- superset of admin: every admin gate passes for an owner, plus the
-- owner-only screens (Provider Costs, cross-customer margin reporting,
-- future owner panels under /owner/*) are visible only when role = 'owner'.
--
-- Owner is NEVER exposed in any role-picker UI. Org admins cannot promote
-- themselves or anyone else to owner. The role is set directly in the
-- database (this migration for staging, a one-line update for prod).
--
-- auth_is_admin() is extended to return true for owner as well so every
-- existing RLS policy that checks "is the caller an admin?" continues to
-- pass for the owner without rewriting each policy.
--
-- Staging seed: info@mossyland.com is promoted to owner here so the new
-- owner UI is visible on the next preview deploy. Production is seeded
-- separately by Bree running the equivalent UPDATE for her own profile
-- (see PR description). Production seed is not in this migration so that
-- the wrong email isn't auto-promoted on prod.

-- 1. Expand the role check constraint to include 'owner'.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'member', 'owner'));

-- 2. Extend auth_is_admin() so owners also pass admin gates in RLS.
create or replace function auth_is_admin() returns boolean
  language sql stable security definer set search_path = public, auth
as $$ select coalesce((select role in ('admin', 'owner') from public.profiles where id = auth.uid()), false) $$;

-- 3. New auth_is_owner() helper. Used by RLS on owner-only tables and by
--    owner-only server actions.
create or replace function auth_is_owner() returns boolean
  language sql stable security definer set search_path = public, auth
as $$ select coalesce((select role = 'owner' from public.profiles where id = auth.uid()), false) $$;

-- 4. Staging seed. The matching prod UPDATE is run by Bree separately and
--    is not in this migration so prod doesn't auto-promote the wrong row.
--    Wrapped in DO so it's a no-op if the email doesn't exist (e.g. on a
--    fresh prod that hasn't seen this user yet).
do $$
begin
  update public.profiles
     set role = 'owner'
   where id in (select id from auth.users where lower(email) = 'info@mossyland.com');
end $$;

comment on column public.profiles.role is
  'admin | member | owner. Owner is the SaaS operator role. Owner inherits all admin powers via auth_is_admin(). Never exposed in role-picker UI.';
