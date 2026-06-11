alter type activity_type add value if not exists 'email_sent';
alter type activity_type add value if not exists 'email_opened';

create table email_send_tokens (
  token text primary key,
  org_id uuid not null default auth_org_id() references orgs(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  activity_id uuid references activities(id) on delete cascade,
  account_id uuid references channel_accounts(id) on delete set null,
  sender_user_id uuid references auth.users(id) on delete set null,
  recipient_name text,
  recipient_email text not null,
  subject text not null default '',
  template_id uuid references email_templates(id) on delete set null,
  sent_at timestamptz not null default now(),
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  open_count int not null default 0,
  open_classifications jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index email_send_tokens_org_id_idx on email_send_tokens(org_id);
create index email_send_tokens_lead_id_idx on email_send_tokens(lead_id);
create index email_send_tokens_template_id_idx on email_send_tokens(template_id);
create index email_send_tokens_sent_at_idx on email_send_tokens(sent_at desc);

alter table email_send_tokens enable row level security;

create policy "email_send_tokens org read" on email_send_tokens
  for select to authenticated using (org_id = auth_org_id());
create policy "email_send_tokens org insert" on email_send_tokens
  for insert to authenticated with check (org_id = auth_org_id());
create policy "email_send_tokens org update" on email_send_tokens
  for update to authenticated
  using (org_id = auth_org_id())
  with check (org_id = auth_org_id());
