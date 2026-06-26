-- SMS runtime tables: contact opt-outs (TCPA STOP keyword tracking) and
-- sms_messages (outbound + inbound log). Both org-scoped with RLS.

create table if not exists contact_opt_outs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  e164 text not null,
  reason text not null default 'STOP',
  opted_out_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (org_id, e164)
);
create index if not exists contact_opt_outs_org_e164_idx on contact_opt_outs (org_id, e164);

alter table contact_opt_outs enable row level security;
create policy contact_opt_outs_org_isolation on contact_opt_outs
  for all using (org_id = (select org_id from profiles where id = auth.uid()));

create table if not exists sms_messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  direction text not null check (direction in ('outbound', 'inbound')),
  from_e164 text not null,
  to_e164 text not null,
  body text not null,
  telnyx_message_id text,
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'failed', 'received')),
  error_code text,
  stop_appended boolean not null default false,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz
);
create index if not exists sms_messages_org_created_idx on sms_messages (org_id, created_at desc);
create index if not exists sms_messages_lead_idx on sms_messages (lead_id, created_at desc);
create index if not exists sms_messages_telnyx_id_idx on sms_messages (telnyx_message_id);

alter table sms_messages enable row level security;
create policy sms_messages_org_isolation on sms_messages
  for all using (org_id = (select org_id from profiles where id = auth.uid()));

-- Tracks last time a STOP append was sent per contact, so the 30-day refresh
-- rule (re-append STOP instructions on first message after 30d gap) can fire.
alter table contacts add column if not exists last_stop_appended_at timestamptz;
