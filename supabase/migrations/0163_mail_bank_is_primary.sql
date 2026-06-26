-- Adds is_primary to mail_bank_accounts so an org can designate one
-- bank as the default funding source for checks. Matches the pattern
-- Stripe Dashboard / Mercury / Bill.com use for multi-bank UX: one
-- account is the Primary at any time, set via an explicit button on
-- the bank card.
--
-- Partial unique index enforces single-primary-per-org at the DB
-- level so two concurrent Set-As-Primary clicks can't end up with
-- the org seeing two primaries.

alter table mail_bank_accounts
  add column if not exists is_primary boolean not null default false;

create unique index if not exists mail_bank_accounts_one_primary_per_org
  on mail_bank_accounts (org_id)
  where is_primary = true;

comment on column mail_bank_accounts.is_primary is
  'True when this is the org default funding source. Enforced single-per-org via partial unique index. Set via Set As Primary button on the Settings > Bank Accounts page.';
