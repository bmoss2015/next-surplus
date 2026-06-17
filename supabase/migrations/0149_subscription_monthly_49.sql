-- Set subscription price to $49/month for the Founders Rate window.
-- Mid-2026 GA pricing shift: align all runtime readers (legal pages,
-- landing pricing block, billing UI) on $49 / month.

update public.app_pricing_config
set subscription_monthly_cents = 4900,
    updated_at = now()
where id = 1;
