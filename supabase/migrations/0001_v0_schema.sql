-- Moss Equity Operations Portal — v0 schema
-- Source of truth: docs/moss_equity_portal_spec.docx §2, plus v0 ambiguities resolved with Bree:
--   * verification_items table for the manual checklist
--   * contacts.mailed + mailed_at instead of a separate mailing-addresses table
--   * leads.court_records jsonb (normalize later)
--   * leads.needs_action_flag + needs_action_note
--   * leads.custom_data jsonb for user-defined fields
--   * Single user for v0; RLS enabled from day one to keep multi-user clean

-------------------------------------------------------------------------------
-- Extensions
-------------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-------------------------------------------------------------------------------
-- Enums
-------------------------------------------------------------------------------
create type lead_stage as enum (
  'new_leads',
  'qualifying',
  'outreach',
  'in_conversation',
  'contract',
  'with_attorney',
  'claim_filed',
  'won',
  'lost'
);

create type sale_type as enum ('TAX', 'MTG');
create type recovery_type as enum ('judicial', 'non_judicial');
create type owner_status as enum ('living', 'deceased', 'unknown', 'incarcerated');
create type contact_channel as enum ('phone', 'email', 'mailing_address');
create type contact_status as enum ('untested', 'valid', 'invalid', 'dnc');
create type connection_status as enum ('connected', 'no_answer', 'voicemail', 'disconnected', 'wrong_number');
create type document_category as enum ('agreement', 'id_copy', 'deed', 'court_filing', 'settlement_statement', 'other');
create type task_priority as enum ('high', 'medium', 'low');
create type task_source as enum ('manual', 'auto_reply_received', 'auto_notary_reminder', 'auto_county_followup');
create type activity_type as enum (
  'stage_change',
  'note',
  'lead_created',
  'lead_updated',
  'document_uploaded',
  'agreement_sent',
  'agreement_signed',
  'verification_added',
  'verification_checked',
  'mailer_marked_sent',
  'task_created',
  'task_completed'
);

-------------------------------------------------------------------------------
-- Reference tables
-------------------------------------------------------------------------------

-- State rules: redemption period and filing window per state.
-- v0 seeds SC with real values; TN/PA stubbed for the user to refine in Settings.
create table state_rules (
  state text primary key,
  state_name text not null,
  redemption_period_months int,
  filing_window_years int,
  funds_custodian text,
  default_recovery_type recovery_type,
  notes text,
  updated_at timestamptz not null default now()
);

-- Attorneys
create table attorneys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  states_covered text[] not null default '{}',
  default_cost numeric(10,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Templates (SMS/email; stored in v0, used in composer in v0.5+)
create table templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null check (channel in ('sms', 'email')),
  state text references state_rules(state),
  subject text,
  body text not null,
  variables text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Per-user settings (v0 has one user; schema allows multi-user)
create table settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_recovery_fee_percent numeric(5,2) not null default 30.00,
  default_attorney_cost numeric(10,2) not null default 2500.00,
  surplus_floor numeric(12,2) not null default 35000.00,
  sender_phone_by_state jsonb not null default '{}'::jsonb,
  sender_email text,
  signature_html text,
  custom_field_definitions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-------------------------------------------------------------------------------
-- Core tables
-------------------------------------------------------------------------------

-- Leads
create table leads (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null unique,
  address text not null,
  city text not null,
  state text not null references state_rules(state),
  zip text not null,
  county text,
  sale_type sale_type not null,
  sale_date date,
  sale_year int generated always as (extract(year from sale_date)::int) stored,
  closing_bid numeric(12,2),
  opening_bid numeric(12,2),
  outstanding_debt numeric(12,2) default 0,
  court_costs numeric(12,2) default 0,
  junior_liens numeric(12,2) not null default 0,
  estimated_surplus numeric(12,2) generated always as (
    coalesce(closing_bid, 0)
    - coalesce(outstanding_debt, 0)
    - coalesce(court_costs, 0)
    - coalesce(junior_liens, 0)
  ) stored,
  confirmed_surplus numeric(12,2),
  recovery_fee_percent numeric(5,2) not null default 30.00,
  attorney_cost numeric(10,2) not null default 2500.00,
  estimated_net_payout numeric(12,2) generated always as (
    (
      coalesce(closing_bid, 0)
      - coalesce(outstanding_debt, 0)
      - coalesce(court_costs, 0)
      - coalesce(junior_liens, 0)
    ) * (1 - recovery_fee_percent / 100)
    - attorney_cost
  ) stored,
  stage lead_stage not null default 'new_leads',
  stage_changed_at timestamptz not null default now(),
  lost_reason text,
  below_floor boolean not null default false,
  recovery_type recovery_type,
  redemption_period_months int,
  redemption_ends date,
  filing_deadline date,
  lead_source text,
  imported_at timestamptz not null default now(),
  assigned_to uuid references auth.users(id) on delete set null,
  attorney_id uuid references attorneys(id) on delete set null,
  dnc boolean not null default false,
  dnc_logged_at timestamptz,
  needs_action_flag boolean not null default false,
  needs_action_note text,
  court_records jsonb not null default '{}'::jsonb,
  custom_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lost_requires_reason check (
    stage <> 'lost' or (lost_reason is not null and length(trim(lost_reason)) > 0)
  )
);

create index leads_stage_idx on leads(stage);
create index leads_state_idx on leads(state);
create index leads_assigned_to_idx on leads(assigned_to);
create index leads_imported_at_idx on leads(imported_at desc);
create index leads_estimated_surplus_idx on leads(estimated_surplus desc);
create index leads_below_floor_idx on leads(below_floor) where below_floor;

-- Owners
create table owners (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  full_name text not null,
  status owner_status not null default 'unknown',
  date_of_death date,
  is_primary boolean not null default false,
  relationship text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index owners_lead_id_idx on owners(lead_id);
create unique index owners_one_primary_per_lead on owners(lead_id) where is_primary;

-- Contacts (phone, email, mailing addresses for owners)
create table contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references owners(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  channel contact_channel not null,
  value text not null,
  status contact_status not null default 'untested',
  connection_status connection_status,
  source text,
  last_attempted timestamptz,
  is_primary boolean not null default false,
  -- Mailing-address-specific fields (extension per v0 ambiguity resolution)
  mailed boolean not null default false,
  mailed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contacts_lead_id_idx on contacts(lead_id);
create index contacts_owner_id_idx on contacts(owner_id);
create index contacts_channel_idx on contacts(channel);

-- Verification items (manual checklist on Lead Detail; powers Needs Verification metric)
create table verification_items (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  label text not null,
  checked boolean not null default false,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index verification_items_lead_id_idx on verification_items(lead_id);
create index verification_items_unchecked_idx on verification_items(lead_id) where not checked;

-- Activities (universal log)
create table activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  activity_type activity_type not null,
  payload jsonb not null default '{}'::jsonb,
  channel text,
  created_at timestamptz not null default now()
);

create index activities_lead_id_idx on activities(lead_id);
create index activities_created_at_idx on activities(created_at desc);
create index activities_lead_created_idx on activities(lead_id, created_at desc);

-- Tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date date,
  due_time time,
  completed boolean not null default false,
  completed_at timestamptz,
  source task_source not null default 'manual',
  priority task_priority not null default 'medium',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_id_idx on tasks(user_id);
create index tasks_lead_id_idx on tasks(lead_id);
create index tasks_due_date_idx on tasks(due_date);
create index tasks_completed_idx on tasks(completed);

-- Documents (Supabase Storage paths)
create table documents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  category document_category not null,
  filename text not null,
  storage_path text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  required boolean not null default false,
  received boolean not null default true,
  notes text
);

create index documents_lead_id_idx on documents(lead_id);
create index documents_category_idx on documents(category);

-- Notes
create table notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_lead_id_idx on notes(lead_id);
create index notes_pinned_idx on notes(lead_id, pinned) where pinned;

-- Imports (CSV upload runs)
create table imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  uploaded_at timestamptz not null default now(),
  total_rows int not null default 0,
  imported_count int not null default 0,
  skipped_count int not null default 0,
  error_count int not null default 0,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'failed', 'cancelled'))
);

create index imports_user_id_idx on imports(user_id);

-- Import rows (raw row data for audit / dedupe history)
create table import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references imports(id) on delete cascade,
  raw_row jsonb not null,
  lead_id uuid references leads(id) on delete set null,
  action_taken text not null check (action_taken in ('imported', 'skipped_duplicate', 'skipped_user', 'error')),
  dedupe_match_id uuid references leads(id) on delete set null,
  error_message text,
  created_at timestamptz not null default now()
);

create index import_rows_import_id_idx on import_rows(import_id);

-------------------------------------------------------------------------------
-- Lead ID generator
-- Format: <STATE>-<TYPE>-<YEAR>-<4-digit sequence>
-- e.g. SC-TAX-2025-0247
-- Sequence is per (state, sale_type, year).
-------------------------------------------------------------------------------
create or replace function generate_lead_id(
  p_state text,
  p_sale_type sale_type,
  p_year int
) returns text
language plpgsql
volatile
as $$
declare
  next_seq int;
  prefix text;
  type_part text;
begin
  type_part := case p_sale_type
    when 'TAX' then 'TAX'
    when 'MTG' then 'MTG'
  end;
  prefix := upper(p_state) || '-' || type_part || '-' || p_year::text || '-';

  -- Lock & count existing leads for this prefix to compute the next sequence.
  -- Uses a sequence table-like approach via aggregate with row lock.
  select coalesce(max(
    (regexp_match(lead_id, '-(\d{4})$'))[1]::int
  ), 0) + 1
  into next_seq
  from leads
  where lead_id like prefix || '%'
  for update;

  return prefix || lpad(next_seq::text, 4, '0');
end;
$$;

-- Trigger: on insert, if lead_id is null/empty, generate one.
create or replace function leads_assign_lead_id()
returns trigger
language plpgsql
as $$
begin
  if new.lead_id is null or new.lead_id = '' then
    new.lead_id := generate_lead_id(
      new.state,
      new.sale_type,
      coalesce(extract(year from new.sale_date)::int, extract(year from now())::int)
    );
  end if;
  return new;
end;
$$;

create trigger leads_assign_lead_id_trg
  before insert on leads
  for each row
  execute function leads_assign_lead_id();

-------------------------------------------------------------------------------
-- Stage-change activity logger
-- Spec invariant: "Stage changes always log an activity record. Never change stage silently."
-------------------------------------------------------------------------------
create or replace function leads_log_stage_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into activities (lead_id, activity_type, payload)
    values (new.id, 'lead_created', jsonb_build_object('initial_stage', new.stage::text));
    return new;
  elsif tg_op = 'UPDATE' and old.stage is distinct from new.stage then
    new.stage_changed_at := now();
    insert into activities (lead_id, activity_type, payload)
    values (
      new.id,
      'stage_change',
      jsonb_build_object(
        'from', old.stage::text,
        'to', new.stage::text
      )
    );
    return new;
  end if;
  return new;
end;
$$;

create trigger leads_log_stage_change_trg
  before insert or update on leads
  for each row
  execute function leads_log_stage_change();

-------------------------------------------------------------------------------
-- Below-floor flag — set automatically based on user's surplus_floor
-- Soft warning per spec; users can still pursue. We compute it on insert/update
-- using the assigned user's floor (or the global default 35000 if no settings row).
-------------------------------------------------------------------------------
create or replace function leads_compute_below_floor()
returns trigger
language plpgsql
as $$
declare
  user_floor numeric;
begin
  select coalesce(s.surplus_floor, 35000)
    into user_floor
    from settings s
   where s.user_id = new.assigned_to
   limit 1;

  if user_floor is null then
    user_floor := 35000;
  end if;

  new.below_floor := coalesce(new.estimated_surplus, 0) < user_floor;
  return new;
end;
$$;

create trigger leads_compute_below_floor_trg
  before insert or update of closing_bid, outstanding_debt, court_costs, junior_liens, assigned_to
  on leads
  for each row
  execute function leads_compute_below_floor();

-------------------------------------------------------------------------------
-- Redemption + filing date computation from state_rules
-------------------------------------------------------------------------------
create or replace function leads_compute_dates()
returns trigger
language plpgsql
as $$
declare
  rule record;
begin
  if new.sale_date is not null and new.state is not null then
    select redemption_period_months, filing_window_years, default_recovery_type
      into rule
      from state_rules
     where state = new.state;

    if rule.redemption_period_months is not null then
      new.redemption_period_months := rule.redemption_period_months;
      new.redemption_ends := new.sale_date + (rule.redemption_period_months || ' months')::interval;
    end if;
    if rule.filing_window_years is not null then
      new.filing_deadline := new.sale_date + (rule.filing_window_years || ' years')::interval;
    end if;
    if new.recovery_type is null and rule.default_recovery_type is not null then
      new.recovery_type := rule.default_recovery_type;
    end if;
  end if;
  return new;
end;
$$;

create trigger leads_compute_dates_trg
  before insert or update of sale_date, state on leads
  for each row
  execute function leads_compute_dates();

-------------------------------------------------------------------------------
-- updated_at touchers
-------------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger leads_updated_at before update on leads
  for each row execute function set_updated_at();
create trigger owners_updated_at before update on owners
  for each row execute function set_updated_at();
create trigger contacts_updated_at before update on contacts
  for each row execute function set_updated_at();
create trigger verification_items_updated_at before update on verification_items
  for each row execute function set_updated_at();
create trigger tasks_updated_at before update on tasks
  for each row execute function set_updated_at();
create trigger notes_updated_at before update on notes
  for each row execute function set_updated_at();
create trigger attorneys_updated_at before update on attorneys
  for each row execute function set_updated_at();
create trigger templates_updated_at before update on templates
  for each row execute function set_updated_at();
create trigger settings_updated_at before update on settings
  for each row execute function set_updated_at();

-- Verification item: stamp checked_at when checked toggles to true
create or replace function verification_items_stamp_checked_at()
returns trigger
language plpgsql
as $$
begin
  if new.checked = true and (old.checked is null or old.checked = false) then
    new.checked_at := now();
  elsif new.checked = false then
    new.checked_at := null;
  end if;
  return new;
end;
$$;

create trigger verification_items_stamp_checked_at_trg
  before insert or update on verification_items
  for each row execute function verification_items_stamp_checked_at();

-- Tasks: stamp completed_at when completed toggles to true
create or replace function tasks_stamp_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.completed = true and (old.completed is null or old.completed = false) then
    new.completed_at := now();
  elsif new.completed = false then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger tasks_stamp_completed_at_trg
  before insert or update on tasks
  for each row execute function tasks_stamp_completed_at();

-------------------------------------------------------------------------------
-- Row Level Security
-- v0 has one user, but RLS is on so multi-user works the moment a second user
-- is added. Policies: users can do anything with rows they own (by assigned_to,
-- user_id, or via lead ownership).
-------------------------------------------------------------------------------

alter table leads enable row level security;
alter table owners enable row level security;
alter table contacts enable row level security;
alter table verification_items enable row level security;
alter table activities enable row level security;
alter table tasks enable row level security;
alter table documents enable row level security;
alter table notes enable row level security;
alter table imports enable row level security;
alter table import_rows enable row level security;
alter table attorneys enable row level security;
alter table templates enable row level security;
alter table settings enable row level security;
alter table state_rules enable row level security;

-- Helper: predicate for "I own this lead" (assigned_to = me OR I created it OR no assignee)
-- For v0 with one user, every authenticated user sees everything. We narrow when multi-user lands.
create policy "leads: authenticated read all"
  on leads for select to authenticated using (true);
create policy "leads: authenticated insert"
  on leads for insert to authenticated with check (true);
create policy "leads: authenticated update"
  on leads for update to authenticated using (true) with check (true);
create policy "leads: authenticated delete"
  on leads for delete to authenticated using (true);

-- Same permissive policy on related tables; multi-user narrowing is a v1+ task.
create policy "owners: authenticated all" on owners for all to authenticated using (true) with check (true);
create policy "contacts: authenticated all" on contacts for all to authenticated using (true) with check (true);
create policy "verification_items: authenticated all" on verification_items for all to authenticated using (true) with check (true);
create policy "activities: authenticated read" on activities for select to authenticated using (true);
create policy "activities: authenticated insert" on activities for insert to authenticated with check (true);

-- Tasks scoped to the user
create policy "tasks: own read" on tasks for select to authenticated using (auth.uid() = user_id);
create policy "tasks: own insert" on tasks for insert to authenticated with check (auth.uid() = user_id);
create policy "tasks: own update" on tasks for update to authenticated using (auth.uid() = user_id);
create policy "tasks: own delete" on tasks for delete to authenticated using (auth.uid() = user_id);

create policy "documents: authenticated all" on documents for all to authenticated using (true) with check (true);
create policy "notes: authenticated all" on notes for all to authenticated using (true) with check (true);

-- Imports scoped to the uploader
create policy "imports: own read" on imports for select to authenticated using (auth.uid() = user_id);
create policy "imports: own insert" on imports for insert to authenticated with check (auth.uid() = user_id);
create policy "import_rows: own via parent" on import_rows for all to authenticated
  using (exists (select 1 from imports i where i.id = import_rows.import_id and i.user_id = auth.uid()))
  with check (exists (select 1 from imports i where i.id = import_rows.import_id and i.user_id = auth.uid()));

-- Attorneys and templates are shared org-wide
create policy "attorneys: authenticated all" on attorneys for all to authenticated using (true) with check (true);
create policy "templates: authenticated all" on templates for all to authenticated using (true) with check (true);

-- Settings: each user sees only their own row
create policy "settings: own" on settings for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- State rules are read-only reference data
create policy "state_rules: authenticated read" on state_rules for select to authenticated using (true);

-------------------------------------------------------------------------------
-- Seed: state_rules
-- SC has authoritative values; TN/PA stubbed for refinement in Settings.
-------------------------------------------------------------------------------
insert into state_rules (state, state_name, redemption_period_months, filing_window_years, funds_custodian, default_recovery_type, notes) values
  ('SC', 'South Carolina', 12, 5, 'County Treasurer', 'non_judicial',
    'Tax sale: 12-month redemption from date of sale. Filing window: 5 years post-sale. Surplus funds held by County Treasurer until claimed.'),
  ('TN', 'Tennessee', 12, 10, 'County Clerk and Master', 'judicial',
    'STUB — placeholder values. Verify and refine in Settings before relying on dates.'),
  ('PA', 'Pennsylvania', 9, 5, 'County Tax Claim Bureau', 'judicial',
    'STUB — placeholder values. Verify and refine in Settings before relying on dates.')
on conflict (state) do nothing;
