-- Track how many times each mailing address has been mailed.
--
-- The Mailing Addresses chip on the lead Overview tab currently
-- shows "Mailed May 24" after one send. With repeat sends we want
-- "Mailed 2x · last May 24" (Pipedrive / HubSpot / Attio pattern:
-- count + last-touch date on the chip).
--
-- contacts.mailed_at already stores the most-recent send timestamp,
-- so it doubles as "last mailed." This migration adds the count.
-- Backfill is best-effort: count existing mail_jobs rows by
-- matching lead_id + line1 (case-insensitive) for contacts where
-- mailed=true. New sends increment via the sendMail action.

alter table public.contacts
  add column if not exists mail_count int not null default 0;

comment on column public.contacts.mail_count is
  'Number of physical mailings to this contact address. Incremented by sendMail after each successful provider send. Pairs with mailed_at (most recent send) for the "Mailed 2x . last May 24" chip on the lead Overview tab.';

-- Backfill from mail_jobs where we can match. Match on (lead_id,
-- line1 ilike) since contacts.value stores the full address string
-- while mail_jobs has line1 as a discrete field. Rough but adequate
-- for one-off backfill — going forward sendMail keeps the count
-- accurate via the same matching rule.
update public.contacts c
set mail_count = sub.cnt
from (
  select
    mj.lead_id as lead_id,
    lower(mj.recipient_address_line1) as line1_lower,
    count(*) as cnt
  from public.mail_jobs mj
  where mj.recipient_address_line1 is not null
  group by mj.lead_id, lower(mj.recipient_address_line1)
) sub
where c.lead_id = sub.lead_id
  and c.channel = 'mailing_address'
  and c.value is not null
  and lower(c.value) like '%' || sub.line1_lower || '%';
