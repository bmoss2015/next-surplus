-- Web Forms (inbound lead capture from public form embeds).
--
-- Each org gets one or more web_forms records. The public form lives at
-- /f/<web_form_id>; submissions go through a server action that creates a
-- lead + owner + contacts, assigns it via specific-user or round-robin, and
-- emails / tasks the assignee. Spam protection = honeypot field + per-IP
-- per-form rate limit table (cleaned up by the same server action on each
-- submit, so no cron required).
--
-- Schema-vs-brief note: the brief lists first_name/last_name/email/phone on
-- leads. The actual portal model is property-centric (leads = property,
-- owners = people, contacts = phone/email channels), so the submission
-- server action splits the payload across all three tables. The submission
-- row itself keeps the raw fields for audit + display.

-------------------------------------------------------------------------------
-- 1. web_forms (per-org configuration for one inbound form)
-------------------------------------------------------------------------------
create table public.web_forms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade default auth_org_id(),
  name text not null default 'Website Contact Form',
  is_active boolean not null default true,

  -- Assignment config. 'specific' uses assigned_to; 'round_robin' rotates
  -- through round_robin_users by last_assigned_index.
  assignment_type text not null default 'specific'
    check (assignment_type in ('specific', 'round_robin')),
  assigned_to uuid references auth.users(id) on delete set null,
  round_robin_users uuid[] not null default '{}',
  last_assigned_index int not null default 0,

  -- Lead config. default_stage refers to org_stages.key (or the lead_stage
  -- enum if no per-org stages are configured). lead_source becomes the
  -- string written to leads.lead_source.
  default_stage text not null default 'new_leads',
  lead_source text not null default 'Website',

  -- Form presentation.
  success_message text not null default
    'Thank you. We received your request and a member of our team will follow up within one business day.',

  -- Spam protection.
  honeypot_field_name text not null default 'website_url',
  rate_limit_per_minute int not null default 5,

  -- SMS consent storage.
  store_sms_consent boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index web_forms_org_id_idx on public.web_forms(org_id);

create trigger web_forms_updated_at before update on public.web_forms
  for each row execute function set_updated_at();

alter table public.web_forms enable row level security;

create policy "web_forms: org read" on public.web_forms
  for select to authenticated using (org_id = auth_org_id());
create policy "web_forms: admin write" on public.web_forms
  for all to authenticated
  using (org_id = auth_org_id() and auth_is_admin())
  with check (org_id = auth_org_id() and auth_is_admin());

-------------------------------------------------------------------------------
-- 2. web_form_submissions (one row per public form POST)
-------------------------------------------------------------------------------
create table public.web_form_submissions (
  id uuid primary key default gen_random_uuid(),
  web_form_id uuid not null references public.web_forms(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,

  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  state text,
  sms_consent_service boolean not null default false,
  sms_consent_marketing boolean not null default false,

  created_lead_id uuid references public.leads(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  ip_address inet,

  created_at timestamptz not null default now()
);

create index web_form_submissions_form_id_idx on public.web_form_submissions(web_form_id);
create index web_form_submissions_org_id_idx on public.web_form_submissions(org_id);
create index web_form_submissions_created_at_idx on public.web_form_submissions(created_at desc);

alter table public.web_form_submissions enable row level security;

-- Inserts happen via the public server action under the service role, so the
-- table only needs org-scoped SELECT for authenticated users.
create policy "web_form_submissions: org read" on public.web_form_submissions
  for select to authenticated using (org_id = auth_org_id());

-------------------------------------------------------------------------------
-- 3. web_form_rate_limits (per-IP per-form sliding window)
--
-- Rows are written on each submit, queried for a count in the last minute,
-- and pruned (>1 hour old) by the same action. No anon access; service role
-- only.
-------------------------------------------------------------------------------
create table public.web_form_rate_limits (
  ip_address inet not null,
  web_form_id uuid not null references public.web_forms(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  primary key (ip_address, web_form_id, submitted_at)
);

create index web_form_rate_limits_form_id_idx on public.web_form_rate_limits(web_form_id);
create index web_form_rate_limits_submitted_at_idx on public.web_form_rate_limits(submitted_at);

alter table public.web_form_rate_limits enable row level security;
-- No policies = no row visible to authenticated; service role bypasses RLS.

-------------------------------------------------------------------------------
-- 4. lead_source default convention.
--
-- 'website' is added to the lead_sources lookup so the Reports / filter UI
-- recognizes web-form leads. Insert is idempotent and quiet if the lookup
-- table doesn't exist on a given environment (older migrations).
-------------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'lead_sources'
  ) then
    insert into public.lead_sources (org_id, name)
    select o.id, 'Website'
      from public.orgs o
     on conflict (org_id, name) do nothing;
  end if;
end $$;

-------------------------------------------------------------------------------
-- 5. Seed one web_forms row per existing org so every tenant starts with a
--    configured form. The owner / admin can flip is_active off if they
--    don't want to use it yet.
-------------------------------------------------------------------------------
insert into public.web_forms (org_id)
select o.id from public.orgs o
 where not exists (
   select 1 from public.web_forms wf where wf.org_id = o.id
 );
