-- Dialer Phase 1: sessions, phone numbers, call log.
--
-- Three tables to back the new /dialer/setup flow:
--
--   * dialer_sessions   — one row per session a user kicks off. Holds the
--                          list_filter_snapshot (the picked base set + active
--                          filters at start-time, as JSONB), the lead queue
--                          (lead_ids array), the cursor (which lead is next),
--                          and lifecycle state (active / paused / completed).
--                          Resumeable via Resume Last Session card on /dialer.
--
--   * phone_numbers      — purchased Telnyx numbers per org. Tracks Telnyx-side
--                          ID, E.164 number, capabilities (voice always true on
--                          purchase, sms gated by A2P 10DLC approval), monthly
--                          cost. Status flows pending -> active -> released.
--                          Per-state rotation is computed at dial-time, not
--                          stored here.
--
--   * session_calls      — log of each individual call placed during a session.
--                          Disposition is null until the user logs an outcome
--                          (spoke / voicemail / no_answer / wrong_number /
--                          busy / failed). Links session, lead, outbound number
--                          used. Recording URL filled in by Telnyx webhook.
--
-- RLS scoped to org via the existing auth_org_id() helper. Users only see
-- rows in their own org.

-------------------------------------------------------------------------------
-- 1. dialer_sessions
-------------------------------------------------------------------------------
create table public.dialer_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade default auth_org_id(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- The list selection + filter combo used to assemble the queue, snapshotted
  -- at session start so resuming dials the SAME leads even if filters change.
  list_filter_snapshot jsonb not null default '{}'::jsonb,

  -- The ordered queue of lead_ids and where the next dial happens.
  lead_ids uuid[] not null default '{}'::uuid[],
  current_cursor int not null default 0,

  -- Lifecycle.
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed', 'abandoned')),
  paused_at timestamptz,
  completed_at timestamptz,

  -- Defaults snapshot for this session (caller_id_mode, voicemail_id,
  -- wrap_up_seconds, skip_dnc, skip_litigated). Snapshotted so a settings
  -- change mid-session doesn't bork the in-flight queue.
  defaults_snapshot jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dialer_sessions_org_id_idx on public.dialer_sessions(org_id);
create index dialer_sessions_user_status_idx on public.dialer_sessions(user_id, status);
create index dialer_sessions_resumable_idx on public.dialer_sessions(user_id, status)
  where status = 'paused';

alter table public.dialer_sessions enable row level security;

create policy dialer_sessions_select on public.dialer_sessions
  for select using (org_id = auth_org_id());
create policy dialer_sessions_insert on public.dialer_sessions
  for insert with check (org_id = auth_org_id() and user_id = auth.uid());
create policy dialer_sessions_update on public.dialer_sessions
  for update using (org_id = auth_org_id() and user_id = auth.uid());
create policy dialer_sessions_delete on public.dialer_sessions
  for delete using (org_id = auth_org_id() and user_id = auth.uid());

-------------------------------------------------------------------------------
-- 2. phone_numbers
-------------------------------------------------------------------------------
create table public.phone_numbers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade default auth_org_id(),

  -- Telnyx-side identifier and the E.164 phone (e.g. "+15125550188").
  telnyx_phone_number_id text unique,
  e164 text not null,

  -- Display name and location for the picker UI ("Austin TX", "Charlotte NC").
  friendly_name text,
  state text,
  city text,

  -- Capabilities. Voice is live on purchase. SMS is gated by A2P 10DLC brand
  -- approval; sms_enabled flips to true only after the brand campaign is
  -- approved by carriers.
  voice_enabled boolean not null default true,
  sms_enabled boolean not null default false,

  -- Lifecycle. pending while Telnyx is provisioning, active when ready to
  -- dial, released when the org gave the number back.
  status text not null default 'pending'
    check (status in ('pending', 'active', 'released')),

  -- Monthly cost from Telnyx in cents (e.g. 150 = $1.50).
  monthly_cost_cents int not null default 150,

  purchased_at timestamptz default now(),
  released_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index phone_numbers_org_id_idx on public.phone_numbers(org_id);
create unique index phone_numbers_org_e164_idx on public.phone_numbers(org_id, e164);
create index phone_numbers_state_status_idx on public.phone_numbers(org_id, state, status);

alter table public.phone_numbers enable row level security;

create policy phone_numbers_select on public.phone_numbers
  for select using (org_id = auth_org_id());
create policy phone_numbers_insert on public.phone_numbers
  for insert with check (org_id = auth_org_id());
create policy phone_numbers_update on public.phone_numbers
  for update using (org_id = auth_org_id());
create policy phone_numbers_delete on public.phone_numbers
  for delete using (org_id = auth_org_id());

-------------------------------------------------------------------------------
-- 3. session_calls
-------------------------------------------------------------------------------
create table public.session_calls (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade default auth_org_id(),

  -- Which session this call belongs to and which lead was dialed.
  session_id uuid not null references public.dialer_sessions(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,

  -- The outbound number we dialed from (local presence) or null if the
  -- number has been released since.
  outbound_number_id uuid references public.phone_numbers(id) on delete set null,

  -- Telnyx call control identifier; null until Telnyx returns it.
  telnyx_call_control_id text,

  dialed_at timestamptz not null default now(),
  duration_seconds int,

  -- Disposition is null until the operator clicks an outcome button on the
  -- dialer screen. Drives the auto-followup behavior.
  disposition text
    check (disposition in ('spoke', 'voicemail', 'no_answer', 'wrong_number', 'busy', 'failed')),

  -- Free-text note the operator wrote during wrap-up.
  note text,

  -- Telnyx-hosted recording URL when call recording is enabled.
  recording_url text,

  created_at timestamptz not null default now()
);

create index session_calls_session_idx on public.session_calls(session_id);
create index session_calls_lead_idx on public.session_calls(lead_id);
create index session_calls_org_disposition_idx on public.session_calls(org_id, disposition);

alter table public.session_calls enable row level security;

create policy session_calls_select on public.session_calls
  for select using (org_id = auth_org_id());
create policy session_calls_insert on public.session_calls
  for insert with check (org_id = auth_org_id());
create policy session_calls_update on public.session_calls
  for update using (org_id = auth_org_id());
create policy session_calls_delete on public.session_calls
  for delete using (org_id = auth_org_id());

-------------------------------------------------------------------------------
-- updated_at triggers
-------------------------------------------------------------------------------
create trigger dialer_sessions_set_updated_at
  before update on public.dialer_sessions
  for each row execute function set_updated_at();

create trigger phone_numbers_set_updated_at
  before update on public.phone_numbers
  for each row execute function set_updated_at();
