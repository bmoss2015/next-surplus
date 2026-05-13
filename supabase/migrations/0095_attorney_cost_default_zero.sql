-- Fix LLLL3 PART 2: a freshly imported lead with no attorney_cost column in
-- the CSV should default to $0, not $2,500. The historical default was set in
-- 0001_v0_schema.sql (numeric(10,2) not null default 2500.00) and the matching
-- app_settings seed was inserted in 0009_app_settings.sql with value '2500'.
-- Existing leads keep whatever value they were imported with; only the column
-- default changes, so future inserts without an attorney_cost column take 0.

alter table leads alter column attorney_cost set default 0;

-- Same intent for the user-facing "Default Attorney Cost" on the Settings
-- page: if the row still holds the seeded 2500 (i.e. no one has customized
-- it), nudge it to 0 so the Settings page reflects the new default. If the
-- user has already changed the value, leave it alone.
update app_settings
   set value = '0'::jsonb
 where key = 'default_attorney_cost'
   and value = '2500'::jsonb;
