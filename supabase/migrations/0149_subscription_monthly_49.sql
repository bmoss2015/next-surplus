-- Drop subscription price to $49/month for the Founders Rate window.
-- Mid-2026 GA pricing shift: pull from $69 default to $49 across all
-- runtime readers (legal pages, landing pricing block, billing UI).

update public.app_pricing_config
set subscription_monthly_cents = 4900,
    updated_at = now()
where id = 1;
