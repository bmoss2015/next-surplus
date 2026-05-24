-- Remove the app_pricing_config.preflight_verify_enabled column.
--
-- The toggle was added in 0128 as an owner-level lever to skip Lob
-- /us_verifications and save $0.05/send. Bree's UX bar is zero
-- post-click errors, which makes the toggle a footgun — flipping it
-- off downgrades address-error reporting from inline pills to
-- post-click errors. We're committing to the always-on pre-flight
-- model; the cost is already baked into retail rates (migration 0127).
--
-- Dropping the column also removes the associated owner action and
-- the /owner > Customer Pricing > Address Verification subsection.

alter table public.app_pricing_config
  drop column if exists preflight_verify_enabled;
