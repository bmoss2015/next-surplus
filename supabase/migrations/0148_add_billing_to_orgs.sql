-- Stripe billing fields on orgs. The portal goes paid at the closed-beta
-- launch ($69/mo flat, 14 day trial via Stripe Checkout). billing_status
-- mirrors Stripe's lifecycle:
--   none        - org has never started a Stripe checkout
--   incomplete  - checkout abandoned or first invoice not paid
--   trialing    - inside 14 day trial
--   active      - paid subscription
--   past_due    - payment failed, in 7-day grace window
--   cancelled   - subscription deleted, read-only after grace
-- grace_period_days is configurable per org so support can extend a
-- failing customer without a deploy.

alter table orgs
  add column if not exists billing_status text not null default 'none',
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists grace_period_days integer not null default 7;

alter table orgs
  drop constraint if exists orgs_billing_status_check;

alter table orgs
  add constraint orgs_billing_status_check
  check (billing_status in ('none','incomplete','trialing','active','past_due','cancelled'));

create unique index if not exists orgs_stripe_customer_id_key
  on orgs (stripe_customer_id)
  where stripe_customer_id is not null;
