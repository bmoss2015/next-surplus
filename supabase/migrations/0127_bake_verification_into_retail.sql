-- Bump customer-facing per-piece retail rates by $0.10 to fund the
-- pre-flight Lob address verification ($0.05/call on Developer tier).
--
-- Math: each piece costs us $1.029 wholesale + $0.05 verification =
-- $1.079 all-in. At the old $1.25 retail, margin was $0.171. After this
-- bump to $1.35, margin is $0.271 — actually higher than the original
-- $0.22 margin we had before verification cost was modelled, because we
-- pass through MORE than we incur.
--
-- Surcharge for over-6 sheets and extra-page fees don't move — those
-- are postage / page-count passthroughs, not per-piece verification
-- costs. Checks DO bump since each check send also triggers a
-- verification call.
--
-- Migration 0123 will already have seeded the singleton with the
-- pre-bump values on a fresh prod install; this migration overwrites
-- those to the new defaults so the owner sees consistent rates on
-- first login. Owner can edit any field live in /owner anyway.

update public.app_pricing_config
   set customer_mail_pricing_cents = jsonb_set(
         jsonb_set(
           jsonb_set(
             jsonb_set(
               jsonb_set(
                 jsonb_set(
                   jsonb_set(
                     customer_mail_pricing_cents,
                     '{letter_first_class_bw}',
                     to_jsonb(135)
                   ),
                   '{letter_first_class_color}',
                   to_jsonb(155)
                 ),
                 '{letter_standard_bw}',
                 to_jsonb(109)
               ),
               '{letter_standard_color}',
               to_jsonb(128)
             ),
             '{letter_certified_bw}',
             to_jsonb(905)
           ),
           '{letter_certified_color}',
           to_jsonb(1005)
         ),
         '{check_base}',
         to_jsonb(155)
       )
 where id = 1;
