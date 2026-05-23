-- Reset the over-6-sheet fee values on app_pricing_config.
--
-- Migration 0125 set them ($244 wholesale, $275 customer), but the
-- owner-side save action's PRICING_KEYS list didn't include the field,
-- so any Save Changes click since 0125 wiped the key out of the JSONB.
-- Re-seed to the original defaults; future saves carry the field
-- through correctly now that PRICING_KEYS includes it.

update public.app_pricing_config
   set wholesale_pricing_cents = jsonb_set(
         wholesale_pricing_cents,
         '{letter_over_6_sheet_fee}',
         to_jsonb(244)
       ),
       customer_mail_pricing_cents = jsonb_set(
         customer_mail_pricing_cents,
         '{letter_over_6_sheet_fee}',
         to_jsonb(275)
       )
 where id = 1;
