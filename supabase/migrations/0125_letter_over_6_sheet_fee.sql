-- Letter over 6 sheet surcharge.
--
-- USPS bumps first-class letter postage to the next weight tier at 1 oz,
-- which 8.5x11 letters cross at roughly 7 sheets. Lob passes this through
-- as a flat per-piece fee of $2.435 (verified May 2026 on Lob's pricing
-- page for all tiers: Developer, Startup, Growth).
--
-- We track it on the same pricing config so the send pipeline can detect
-- "this piece will be over 6 sheets" and add the surcharge to both
-- cost_cents (what we charge customer) and provider_cost_cents (what
-- Lob will bill us). Customer rate seeded at $2.75 to leave a small
-- margin over the $2.435 wholesale; Bree can edit live in Owner UI.

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
