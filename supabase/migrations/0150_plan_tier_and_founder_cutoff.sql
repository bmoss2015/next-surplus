-- Plan tier enum + Founder Rate cutoff.
--
-- Three tiers:
--   founder       -> legacy/comp/lifetime locks. Never auto-promoted.
--   beta_founder  -> $49/month or $470/year while founder window is open.
--                    Auto-promoted to standard 12 months after activation
--                    via the founder-lock-expiration cron.
--   standard      -> $69/month default after founder window closes.
--
-- Signup behavior: app_pricing_config.founder_cutoff_date controls which
-- tier a new org lands on. A BEFORE INSERT trigger reads the cutoff and
-- assigns beta_founder if now() < cutoff, else standard. Lets us keep
-- assignment policy centralized whether the org is created via API,
-- migration, or future signup handler.

do $$
begin
  create type plan_tier_enum as enum ('founder', 'beta_founder', 'standard');
exception
  when duplicate_object then null;
end
$$;

alter table public.orgs
  add column if not exists plan_tier plan_tier_enum not null default 'beta_founder';

alter table public.app_pricing_config
  add column if not exists founder_cutoff_date timestamptz;

update public.app_pricing_config
set founder_cutoff_date = (current_date + interval '60 days')::timestamptz,
    updated_at = now()
where id = 1
  and founder_cutoff_date is null;

create or replace function public.assign_org_plan_tier()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff timestamptz;
begin
  if new.plan_tier is not null and new.plan_tier <> 'beta_founder' then
    return new;
  end if;

  select founder_cutoff_date into cutoff
  from public.app_pricing_config
  where id = 1;

  if cutoff is not null and now() >= cutoff then
    new.plan_tier := 'standard';
  else
    new.plan_tier := 'beta_founder';
  end if;

  return new;
end
$$;

drop trigger if exists orgs_assign_plan_tier on public.orgs;
create trigger orgs_assign_plan_tier
  before insert on public.orgs
  for each row
  execute function public.assign_org_plan_tier();

update public.orgs
set plan_tier = 'founder'
where name = 'Moss Equity Partners'
  and plan_tier <> 'founder';

comment on column public.orgs.plan_tier is
  'Pricing tier: founder (locked), beta_founder (founder window), standard (post-cutoff). Assigned by orgs_assign_plan_tier trigger on insert.';
comment on column public.app_pricing_config.founder_cutoff_date is
  'When the Founder Rate window closes. New orgs created at or after this timestamp land on standard pricing.';
