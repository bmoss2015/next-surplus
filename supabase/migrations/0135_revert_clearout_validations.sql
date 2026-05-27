-- Revert all phone validation results stamped by Clearout (Standard, Smart,
-- and cache hits). Bree's call after discovering that Clearout Standard does
-- not actually verify live subscriber status — it's a syntax + carrier
-- allocation check, which is mostly redundant with libphonenumber. Rick was
-- still hitting dead numbers in the "Verified" bucket because Clearout said
-- valid for any number in a real carrier range, regardless of whether the
-- specific subscriber line was active.
--
-- This migration resets status / validation_checked_at / validation_provider
-- / validation_raw to defaults for every row whose validation came from a
-- Clearout code path. Rows where libphonenumber correctly caught a malformed
-- number (validation_provider = 'libphonenumber') are LEFT ALONE — those are
-- accurate, cost zero, and don't need re-running.
--
-- The org_addon_usage rows that recorded credit spend are NOT touched so the
-- billing history stays intact.

-- ---------------------------------------------------------------------------
-- contacts: owner-side phone channel rows
-- ---------------------------------------------------------------------------

update contacts
   set status = 'untested',
       validation_checked_at = null,
       validation_provider = null,
       validation_raw = null
 where channel = 'phone'
   and validation_provider in ('clearout', 'clearout-cache');

-- ---------------------------------------------------------------------------
-- relatives: 5 phone slots, each with its own audit columns. Apply the same
-- reset per slot.
-- ---------------------------------------------------------------------------

update relatives
   set phone_status = 'untested',
       phone_validation_checked_at = null,
       phone_validation_provider = null,
       phone_validation_raw = null
 where phone_validation_provider in ('clearout', 'clearout-cache');

update relatives
   set phone_2_status = 'untested',
       phone_2_validation_checked_at = null,
       phone_2_validation_provider = null,
       phone_2_validation_raw = null
 where phone_2_validation_provider in ('clearout', 'clearout-cache');

update relatives
   set phone_3_status = 'untested',
       phone_3_validation_checked_at = null,
       phone_3_validation_provider = null,
       phone_3_validation_raw = null
 where phone_3_validation_provider in ('clearout', 'clearout-cache');

update relatives
   set phone_4_status = 'untested',
       phone_4_validation_checked_at = null,
       phone_4_validation_provider = null,
       phone_4_validation_raw = null
 where phone_4_validation_provider in ('clearout', 'clearout-cache');

update relatives
   set phone_5_status = 'untested',
       phone_5_validation_checked_at = null,
       phone_5_validation_provider = null,
       phone_5_validation_raw = null
 where phone_5_validation_provider in ('clearout', 'clearout-cache');
