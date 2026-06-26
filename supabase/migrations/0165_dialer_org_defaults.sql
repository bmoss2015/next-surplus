-- Org-wide Power Dialer defaults. Admin-only via parent panel gate.
-- Operators can override these on a per-session basis in the Setup Wizard.
-- Three telephony add-ons live here so cost-decisions are visible in one place:
--   call_recording_enabled        $0.002/min Telnyx pass-through
--   amd_enabled                   $0.002/call Telnyx pass-through
--   transcription_enabled         per-min pass-through varies by provider
--   transcription_provider        chosen STT vendor (deepgram_nova default)

create table if not exists org_dialer_defaults (
  org_id uuid primary key references orgs(id) on delete cascade,
  call_recording_enabled boolean not null default true,
  amd_enabled boolean not null default true,
  transcription_enabled boolean not null default false,
  transcription_provider text not null default 'deepgram_nova' check (
    transcription_provider in ('deepgram_nova', 'telnyx_stt', 'google_stt', 'assemblyai')
  ),
  wrap_up_seconds integer not null default 30 check (wrap_up_seconds between 0 and 300),
  caller_id_mode text not null default 'auto_by_state' check (
    caller_id_mode in ('auto_by_state', 'fixed_number')
  ),
  caller_id_fixed_phone_number_id uuid references phone_numbers(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table org_dialer_defaults enable row level security;
create policy org_dialer_defaults_org_isolation on org_dialer_defaults
  for all using (org_id = (select org_id from profiles where id = auth.uid()));

alter table session_calls add column if not exists transcription_url text;
alter table session_calls add column if not exists transcription_text text;
alter table session_calls add column if not exists transcription_status text
  check (transcription_status in ('pending', 'completed', 'failed'));
