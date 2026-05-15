-- 0100_email_module.sql
--
-- Email + future SMS module ("Inbox").
--
-- Tables:
--   channel_accounts     — one row per connected provider account per user
--                          (Gmail, Outlook, QUO SMS); holds encrypted OAuth
--                          tokens and the sync cursor.
--   conversations        — one per email thread / SMS contact-pair; carries
--                          the lead_id (auto-linked or manual) and the
--                          aggregate state (last message, unread count).
--   messages             — one row per individual message; channel-agnostic
--                          (channel column), single FTS index on body+subject.
--   message_attachments  — per-message file refs, storage in the
--                          `email-attachments` bucket.
--   lead_parties         — flexible "Other Contacts" on a lead (attorney for
--                          owner, trustee, county clerk, opposing counsel,
--                          title company, realtor, notary, guardian, …).
--
-- Visibility model (hybrid):
--   * channel_accounts: per-user (only the connector reads/writes).
--   * conversations + messages + attachments: readable by the whole org when
--     `lead_id is not null and not is_private`; otherwise readable only by
--     the user whose channel_account owns the conversation.
--   * lead_parties: full org access (matches other lead data tables).
--
-- Notes:
--   * Each provider thread is its own conversation. A lead can have many
--     conversations (attorney thread + client thread + clerk thread); the
--     lead's Conversation tab unions them by timestamp.
--   * For SMS, `provider_thread_key` is the other party's E.164 phone.
--   * Email threading integrity preserved via in_reply_to + references_chain.
--   * FTS uses an English tsvector over coalesce(subject, '') || body_text.
--
-- See: discussion in conversation that produced this migration (email
-- module v1). Builds on 0011_multi_org_rls.sql which set up auth_org_id().

-------------------------------------------------------------------------------
-- 1. Enums
-------------------------------------------------------------------------------
create type channel_provider as enum ('gmail', 'outlook', 'quo_sms');

create type lead_party_role as enum (
  'attorney_for_owner',
  'trustee',
  'successor_heir',
  'county_clerk',
  'court',
  'opposing_counsel',
  'title_company',
  'realtor',
  'notary',
  'guardian',
  'other'
);

-------------------------------------------------------------------------------
-- 2. channel_accounts
-------------------------------------------------------------------------------
create table channel_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider channel_provider not null,
  address text not null,
  display_name text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  sync_cursor text,
  last_synced_at timestamptz,
  status text not null default 'active'
    check (status in ('active', 'reauth_required', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, address)
);

create index channel_accounts_org_id_idx on channel_accounts(org_id);
create index channel_accounts_user_id_idx on channel_accounts(user_id);

create trigger channel_accounts_updated_at before update on channel_accounts
  for each row execute function set_updated_at();

-------------------------------------------------------------------------------
-- 3. conversations
-------------------------------------------------------------------------------
create table conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs(id) on delete cascade,
  channel_account_id uuid not null references channel_accounts(id) on delete cascade,
  channel channel_provider not null,
  provider_thread_key text not null,
  subject text,
  lead_id uuid references leads(id) on delete set null,
  participants jsonb not null default '[]'::jsonb,
  last_message_at timestamptz,
  last_message_preview text,
  unread_count int not null default 0,
  is_archived boolean not null default false,
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel_account_id, provider_thread_key)
);

create index conversations_org_id_idx on conversations(org_id);
create index conversations_lead_id_idx on conversations(lead_id);
create index conversations_channel_account_id_idx on conversations(channel_account_id);
create index conversations_last_message_at_idx on conversations(last_message_at desc);

create trigger conversations_updated_at before update on conversations
  for each row execute function set_updated_at();

-------------------------------------------------------------------------------
-- 4. messages
-------------------------------------------------------------------------------
create table messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  channel channel_provider not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  from_address text not null,
  from_name text,
  to_addresses text[] not null default '{}',
  cc_addresses text[] not null default '{}',
  bcc_addresses text[] not null default '{}',
  subject text,
  body_text text,
  body_html text,
  snippet text,
  provider_message_id text,
  provider_thread_id text,
  in_reply_to text,
  references_chain text[] not null default '{}',
  sent_at timestamptz not null,
  is_read boolean not null default false,
  sent_by_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (conversation_id, provider_message_id)
);

create index messages_org_id_idx on messages(org_id);
create index messages_conversation_id_idx on messages(conversation_id);
create index messages_sent_at_idx on messages(sent_at desc);
create index messages_from_address_idx on messages(lower(from_address));

-- Full-text search across subject + body_text. English config is fine for v1;
-- the coalesces keep the tsvector deterministic for the partial index.
create index messages_fts_idx on messages using gin (
  to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(body_text, ''))
);

-------------------------------------------------------------------------------
-- 5. message_attachments
-------------------------------------------------------------------------------
-- document_id is a forward-looking column for the future "mirror into the
-- lead's Documents tab" feature. Left null in v1.
create table message_attachments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs(id) on delete cascade,
  message_id uuid not null references messages(id) on delete cascade,
  filename text not null,
  mime_type text,
  size_bytes bigint,
  storage_path text,
  provider_attachment_id text,
  is_inline boolean not null default false,
  document_id uuid references documents(id) on delete set null,
  created_at timestamptz not null default now()
);

create index message_attachments_org_id_idx on message_attachments(org_id);
create index message_attachments_message_id_idx on message_attachments(message_id);
create index message_attachments_document_id_idx on message_attachments(document_id);

-------------------------------------------------------------------------------
-- 6. lead_parties ("Other Contacts" on a lead)
-------------------------------------------------------------------------------
create table lead_parties (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  role lead_party_role not null,
  custom_role_label text,
  name text not null,
  organization text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (role <> 'other' or custom_role_label is not null)
);

create index lead_parties_org_id_idx on lead_parties(org_id);
create index lead_parties_lead_id_idx on lead_parties(lead_id);
create index lead_parties_email_idx on lead_parties(lower(email)) where email is not null;
create index lead_parties_phone_idx on lead_parties(phone) where phone is not null;

create trigger lead_parties_updated_at before update on lead_parties
  for each row execute function set_updated_at();

-------------------------------------------------------------------------------
-- 7. Storage bucket for email attachments
-------------------------------------------------------------------------------
-- 25MB matches the Gmail send-attachment cap. Path pattern:
--   <org_id>/<account_id>/<message_id>/<filename>
insert into storage.buckets (id, name, public, file_size_limit)
values ('email-attachments', 'email-attachments', false, 26214400)
on conflict (id) do nothing;

-------------------------------------------------------------------------------
-- 8. RLS — channel_accounts (per-user)
-------------------------------------------------------------------------------
alter table channel_accounts enable row level security;

create policy "channel_accounts: own read" on channel_accounts
  for select to authenticated
  using (org_id = auth_org_id() and user_id = auth.uid());
create policy "channel_accounts: own insert" on channel_accounts
  for insert to authenticated
  with check (org_id = auth_org_id() and user_id = auth.uid());
create policy "channel_accounts: own update" on channel_accounts
  for update to authenticated
  using (org_id = auth_org_id() and user_id = auth.uid())
  with check (org_id = auth_org_id() and user_id = auth.uid());
create policy "channel_accounts: own delete" on channel_accounts
  for delete to authenticated
  using (org_id = auth_org_id() and user_id = auth.uid());

-------------------------------------------------------------------------------
-- 9. RLS — conversations (hybrid)
-------------------------------------------------------------------------------
alter table conversations enable row level security;

create policy "conversations: hybrid read" on conversations
  for select to authenticated
  using (
    org_id = auth_org_id()
    and (
      (lead_id is not null and not is_private)
      or channel_account_id in (
        select id from channel_accounts where user_id = auth.uid()
      )
    )
  );

create policy "conversations: connector insert" on conversations
  for insert to authenticated
  with check (
    org_id = auth_org_id()
    and channel_account_id in (
      select id from channel_accounts where user_id = auth.uid()
    )
  );

create policy "conversations: hybrid update" on conversations
  for update to authenticated
  using (
    org_id = auth_org_id()
    and (
      (lead_id is not null and not is_private)
      or channel_account_id in (
        select id from channel_accounts where user_id = auth.uid()
      )
    )
  )
  with check (org_id = auth_org_id());

create policy "conversations: connector delete" on conversations
  for delete to authenticated
  using (
    org_id = auth_org_id()
    and channel_account_id in (
      select id from channel_accounts where user_id = auth.uid()
    )
  );

-------------------------------------------------------------------------------
-- 10. RLS — messages (hybrid via parent conversation)
-------------------------------------------------------------------------------
alter table messages enable row level security;

create policy "messages: hybrid read" on messages
  for select to authenticated
  using (
    org_id = auth_org_id()
    and conversation_id in (
      select id from conversations
      where org_id = auth_org_id()
        and (
          (lead_id is not null and not is_private)
          or channel_account_id in (
            select id from channel_accounts where user_id = auth.uid()
          )
        )
    )
  );

create policy "messages: connector insert" on messages
  for insert to authenticated
  with check (
    org_id = auth_org_id()
    and conversation_id in (
      select id from conversations
      where channel_account_id in (
        select id from channel_accounts where user_id = auth.uid()
      )
    )
  );

create policy "messages: hybrid update" on messages
  for update to authenticated
  using (
    org_id = auth_org_id()
    and conversation_id in (
      select id from conversations
      where org_id = auth_org_id()
        and (
          (lead_id is not null and not is_private)
          or channel_account_id in (
            select id from channel_accounts where user_id = auth.uid()
          )
        )
    )
  )
  with check (org_id = auth_org_id());

-------------------------------------------------------------------------------
-- 11. RLS — message_attachments (inherits via parent message)
-------------------------------------------------------------------------------
alter table message_attachments enable row level security;

create policy "message_attachments: hybrid read" on message_attachments
  for select to authenticated
  using (
    org_id = auth_org_id()
    and message_id in (select id from messages where org_id = auth_org_id())
  );

create policy "message_attachments: connector insert" on message_attachments
  for insert to authenticated
  with check (
    org_id = auth_org_id()
    and message_id in (select id from messages where org_id = auth_org_id())
  );

create policy "message_attachments: hybrid delete" on message_attachments
  for delete to authenticated
  using (
    org_id = auth_org_id()
    and message_id in (select id from messages where org_id = auth_org_id())
  );

-------------------------------------------------------------------------------
-- 12. RLS — lead_parties (full org)
-------------------------------------------------------------------------------
alter table lead_parties enable row level security;

create policy "lead_parties: org read" on lead_parties
  for select to authenticated
  using (org_id = auth_org_id());
create policy "lead_parties: org insert" on lead_parties
  for insert to authenticated
  with check (org_id = auth_org_id());
create policy "lead_parties: org update" on lead_parties
  for update to authenticated
  using (org_id = auth_org_id())
  with check (org_id = auth_org_id());
create policy "lead_parties: org delete" on lead_parties
  for delete to authenticated
  using (org_id = auth_org_id());

-------------------------------------------------------------------------------
-- 13. Storage bucket policies — email-attachments
-- Path: <org_id>/<account_id>/<message_id>/<filename>
-------------------------------------------------------------------------------
create policy "email-attachments: org read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'email-attachments'
    and split_part(name, '/', 1) = auth_org_id()::text
  );

create policy "email-attachments: org insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'email-attachments'
    and split_part(name, '/', 1) = auth_org_id()::text
  );

create policy "email-attachments: org delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'email-attachments'
    and split_part(name, '/', 1) = auth_org_id()::text
  );
