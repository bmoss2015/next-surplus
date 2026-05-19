-- Company / Address info on orgs.
--
-- Admin-only Settings card lets the org fill in their legal company name,
-- contact info, and mailing address. These values get used on outgoing
-- letterhead, email footers, and (eventually) generated contracts. The
-- `name` column already exists from migration 0011 — we keep it as the
-- short display name and add a separate `legal_name` for documents.

alter table orgs
  add column if not exists legal_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists region text,
  add column if not exists postal_code text,
  add column if not exists country text;

-- Admins of the org may update their own org row. Reading was already allowed
-- by the "orgs: read own" policy from migration 0011; no read policy change
-- is needed here.
drop policy if exists "orgs: admin update" on orgs;
create policy "orgs: admin update" on orgs for update to authenticated
  using (id = auth_org_id() and auth_is_admin())
  with check (id = auth_org_id() and auth_is_admin());
