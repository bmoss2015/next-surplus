-- Multi-address support for relatives and lead parties.
--
-- Before this migration:
--   * `contacts` rows always pointed at an `owner_id` (NOT NULL).
--   * Mailing addresses for relatives lived in `relatives.street/city/state/zip`
--     (one per relative), with optional duplicate rows in `contacts` using the
--     lead's primary owner as a fallback owner_id and a "Jane Doe (Relative)"
--     recipient_label tag.
--   * Mailing addresses for lead_parties lived in `lead_parties.street/city/state/zip`
--     with no `contacts` mirror at all — so the Overview picker never saw them.
--
-- After this migration:
--   * `contacts` is the single source of truth for mailing addresses.
--   * `owner_id` is nullable. Two new nullable FKs — `relative_id` and
--     `lead_party_id` — let a contact belong to a relative or lead_party
--     directly. A CHECK constraint guarantees exactly one FK is set.
--   * Existing addresses on relatives + lead_parties are migrated into
--     contacts rows tagged with the appropriate FK. Legacy address columns
--     are kept (not dropped) so the Send Mail flow and any external read
--     paths keep working until they switch over; a follow-up migration can
--     drop them once verified.
--
-- Note on org_id: contacts.org_id is NOT NULL with default auth_org_id(),
-- but during a migration auth.uid() is null so the default returns null.
-- All backfill INSERTs pull org_id from the source row's lead/lead_party.

-------------------------------------------------------------------------------
-- 1. Add the new nullable FK columns to contacts.
-------------------------------------------------------------------------------

alter table contacts
  add column if not exists relative_id uuid references relatives(id) on delete cascade,
  add column if not exists lead_party_id uuid references lead_parties(id) on delete cascade;

create index if not exists contacts_relative_id_idx on contacts(relative_id);
create index if not exists contacts_lead_party_id_idx on contacts(lead_party_id);

-------------------------------------------------------------------------------
-- 2. Drop NOT NULL on owner_id so relative_id-only and lead_party_id-only
--    rows can land without a placeholder owner.
-------------------------------------------------------------------------------

alter table contacts alter column owner_id drop not null;

-------------------------------------------------------------------------------
-- 3. Backfill: copy each relative's address into a contacts row with
--    relative_id set (owner_id stays null). Skip relatives that have no
--    address fields, and skip if the same value already exists for the lead
--    (idempotent / avoids dupes with legacy Overview-panel adds).
-------------------------------------------------------------------------------

insert into contacts (
  org_id,
  lead_id,
  relative_id,
  channel,
  value,
  status,
  is_primary,
  mailed,
  mailed_at,
  recipient_label
)
select
  l.org_id,
  r.lead_id,
  r.id,
  'mailing_address'::contact_channel,
  trim(r.street) || ', ' || trim(r.city) || ', ' || upper(trim(r.state)) || ' ' || trim(r.zip),
  'untested'::contact_status,
  false,
  false,
  null,
  trim(coalesce(r.full_name, 'Unknown')) || ' (' || coalesce(r.relationship, 'Relative') || ')'
from relatives r
join leads l on l.id = r.lead_id
where r.street is not null and trim(r.street) <> ''
  and r.city is not null and trim(r.city) <> ''
  and r.state is not null and trim(r.state) <> ''
  and r.zip is not null and trim(r.zip) <> ''
  and not exists (
    select 1 from contacts c
    where c.lead_id = r.lead_id
      and c.channel = 'mailing_address'
      and c.relative_id = r.id
  );

-------------------------------------------------------------------------------
-- 4. Backfill: lead_party addresses → contacts rows with lead_party_id set.
-------------------------------------------------------------------------------

insert into contacts (
  org_id,
  lead_id,
  lead_party_id,
  channel,
  value,
  status,
  is_primary,
  mailed,
  mailed_at,
  recipient_label
)
select
  lp.org_id,
  lp.lead_id,
  lp.id,
  'mailing_address'::contact_channel,
  trim(lp.street) || ', ' || trim(lp.city) || ', ' || upper(trim(lp.state)) || ' ' || trim(lp.zip),
  'untested'::contact_status,
  false,
  false,
  null,
  trim(coalesce(lp.name, 'Recipient'))
    || ' ('
    || case
         when lp.role = 'other' and lp.custom_role_label is not null and trim(lp.custom_role_label) <> ''
           then trim(lp.custom_role_label)
         else
           case lp.role::text
             when 'attorney_for_owner' then 'Attorney'
             when 'trustee' then 'Trustee'
             when 'successor_heir' then 'Heir'
             when 'county_clerk' then 'County Clerk'
             when 'court' then 'Court'
             when 'opposing_counsel' then 'Opposing Counsel'
             when 'title_company' then 'Title Company'
             when 'realtor' then 'Realtor'
             when 'notary' then 'Notary'
             when 'guardian' then 'Guardian'
             else 'Other'
           end
       end
    || ')'
from lead_parties lp
where lp.street is not null and trim(lp.street) <> ''
  and lp.city is not null and trim(lp.city) <> ''
  and lp.state is not null and trim(lp.state) <> ''
  and lp.zip is not null and trim(lp.zip) <> ''
  and not exists (
    select 1 from contacts c
    where c.lead_id = lp.lead_id
      and c.channel = 'mailing_address'
      and c.lead_party_id = lp.id
  );

-------------------------------------------------------------------------------
-- 5. Enforce exactly-one-of (owner_id, relative_id, lead_party_id) for any
--    row that has at least one set. Phone + email rows always have owner_id;
--    mailing address rows now have exactly one of the three.
-------------------------------------------------------------------------------

alter table contacts drop constraint if exists contacts_subject_xor;
alter table contacts add constraint contacts_subject_xor check (
  (case when owner_id      is not null then 1 else 0 end)
  + (case when relative_id   is not null then 1 else 0 end)
  + (case when lead_party_id is not null then 1 else 0 end)
  = 1
);
