-- Fix the certified wholesale rate.
--
-- Migration 0123 seeded app_pricing_config.wholesale_pricing_cents with
-- certified at $1.029 (B&W) and $1.189 (color). Those were first-class
-- rates copied as a fallback because the cron's parser couldn't find a
-- separate certified line in Lob's published docs. That was wrong:
-- certified mail isn't available on Lob's Developer tier at all (the
-- pricing table shows "-"). The real certified rate kicks in at Lob's
-- Startup tier ($260/mo) and is $6.70 per piece.
--
-- We patch the existing row to set certified wholesale to $6.70 (the
-- price you'd actually pay the moment you upgrade to Startup), no color
-- premium since Lob doesn't differentiate.
--
-- The customer-facing certified rates ($1.75 / $1.95 from the 0123
-- seed) are also wrong because they were built off the wrong wholesale.
-- Resetting them to $8.95 / $9.95 which leaves real margin once
-- certified is actually available. Owner can edit in the UI anytime.

update public.app_pricing_config
   set wholesale_pricing_cents = jsonb_set(
         jsonb_set(
           wholesale_pricing_cents,
           '{letter_certified_bw}',
           to_jsonb(670)
         ),
         '{letter_certified_color}',
         to_jsonb(670)
       ),
       customer_mail_pricing_cents = jsonb_set(
         jsonb_set(
           customer_mail_pricing_cents,
           '{letter_certified_bw}',
           to_jsonb(895)
         ),
         '{letter_certified_color}',
         to_jsonb(995)
       )
 where id = 1;
