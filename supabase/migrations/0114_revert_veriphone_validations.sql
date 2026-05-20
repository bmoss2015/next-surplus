-- Revert all Veriphone-set validation results.
--
-- Veriphone's `phone_valid: true` only confirms the number is well-formed and
-- allocated to a carrier; it does NOT mean the line is currently in service.
-- Their data is static, not live HLR. After Rik's calls showed ~95% of
-- "Verified" numbers were actually disconnected, we're rolling back all
-- Veriphone verdicts so the rows can be re-checked by a real HLR-based
-- provider.
--
-- libphonenumber-set 'invalid' rows are kept — those flagged truly malformed
-- numbers based on format/allocation rules and are still accurate.
--
-- Also clears this month's phone_validation usage from org_addon_usage,
-- since the backfill credits were consumed by the staging Veriphone account
-- (not prod's), so the prod meter should read 0 used.

-- Contacts: phone-channel rows the validator touched.
update contacts
   set status = 'untested',
       validation_checked_at = null,
       validation_provider = null,
       validation_raw = null
 where validation_provider = 'veriphone';

-- Relatives: 5 phone slots, same revert per slot.
update relatives
   set phone_status = 'untested',
       phone_validation_checked_at = null,
       phone_validation_provider = null,
       phone_validation_raw = null
 where phone_validation_provider = 'veriphone';

update relatives
   set phone_2_status = 'untested',
       phone_2_validation_checked_at = null,
       phone_2_validation_provider = null,
       phone_2_validation_raw = null
 where phone_2_validation_provider = 'veriphone';

update relatives
   set phone_3_status = 'untested',
       phone_3_validation_checked_at = null,
       phone_3_validation_provider = null,
       phone_3_validation_raw = null
 where phone_3_validation_provider = 'veriphone';

update relatives
   set phone_4_status = 'untested',
       phone_4_validation_checked_at = null,
       phone_4_validation_provider = null,
       phone_4_validation_raw = null
 where phone_4_validation_provider = 'veriphone';

update relatives
   set phone_5_status = 'untested',
       phone_5_validation_checked_at = null,
       phone_5_validation_provider = null,
       phone_5_validation_raw = null
 where phone_5_validation_provider = 'veriphone';

-- Clear this month's phone_validation usage so the prod meter resets to 0.
-- The backfill consumed staging credits; prod's Veriphone account is untouched.
delete from org_addon_usage
 where addon_key = 'phone_validation'
   and period_month = date_trunc('month', current_date)::date;
