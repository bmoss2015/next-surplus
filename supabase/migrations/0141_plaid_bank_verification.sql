-- Plaid-backed bank account verification, replacing the manual Lob
-- micro-deposit flow. With Plaid Link the user signs into their bank
-- inline, Plaid returns a public_token, we exchange it for a Plaid
-- access_token, then mint a Lob processor_token. Lob creates the bank
-- account already marked verified, so the operator never sees a "wait
-- 1-2 business days" step.
--
-- We keep the existing mail_bank_accounts schema for the Lob-side ids
-- and last-four digits. New columns track:
--   * plaid_access_token   — Plaid access_token for this Item, used if
--                            we ever need to re-mint a processor_token
--                            or pull balances. Treat as a secret.
--   * plaid_item_id        — Plaid Item id (one Item = one bank login).
--   * verified_via         — provenance of the verification, so we can
--                            grandfather any pre-existing micro-deposit
--                            records and route new flows through Plaid.

create type bank_account_verified_via as enum ('micro_deposits', 'plaid');

alter table public.mail_bank_accounts
  add column if not exists plaid_access_token text,
  add column if not exists plaid_item_id text,
  add column if not exists verified_via bank_account_verified_via;

comment on column public.mail_bank_accounts.plaid_access_token is
  'Plaid access_token for this bank Item. Secret — never expose to client. NULL for legacy rows added via the deprecated micro-deposit flow.';
comment on column public.mail_bank_accounts.plaid_item_id is
  'Plaid Item id (one row per Item / bank login).';
comment on column public.mail_bank_accounts.verified_via is
  'How this bank account was verified. plaid = instant via Plaid Link. micro_deposits = legacy Lob path (deprecated).';

-- Backfill: any existing verified rows came in via the old micro-deposit
-- flow, since that was the only path before this migration.
update public.mail_bank_accounts
   set verified_via = 'micro_deposits'
 where verified_via is null
   and status = 'verified';
