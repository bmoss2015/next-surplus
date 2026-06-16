-- Stripe subscription columns on orgs.
-- Populated by the Stripe webhook (/api/webhooks/stripe) on subscription
-- lifecycle events. Read by Settings > Billing, the founder-lock cron,
-- and the customer portal handoff.

alter table public.orgs
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists last_invoice_paid_at timestamptz,
  add column if not exists founder_notice_sent_at timestamptz;

create unique index if not exists orgs_stripe_customer_id_key
  on public.orgs (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists orgs_stripe_subscription_id_key
  on public.orgs (stripe_subscription_id)
  where stripe_subscription_id is not null;

comment on column public.orgs.subscription_status is
  'Stripe subscription status string (active, trialing, past_due, canceled, incomplete, etc). Updated by webhook.';
comment on column public.orgs.founder_notice_sent_at is
  'Set by founder-lock-expiration cron when the 10-month heads-up email goes out. Prevents duplicate sends.';
