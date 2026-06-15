-- IMAP / SMTP support for channel_accounts.
--
-- Adds the columns needed to connect arbitrary email providers
-- (Fastmail, Zoho, Apple iCloud, generic IMAP) alongside the
-- existing Gmail and Outlook OAuth integrations. Credentials are
-- stored encrypted (same encryptToken helper as access tokens).

alter table public.channel_accounts
  add column if not exists imap_host text,
  add column if not exists imap_port integer,
  add column if not exists imap_secure boolean default true,
  add column if not exists imap_username text,
  add column if not exists imap_password_encrypted text,
  add column if not exists smtp_host text,
  add column if not exists smtp_port integer,
  add column if not exists smtp_secure boolean default true,
  add column if not exists smtp_username text,
  add column if not exists smtp_password_encrypted text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'channel_accounts_provider_check'
  ) then
    return;
  end if;
  alter table public.channel_accounts
    drop constraint channel_accounts_provider_check;
end $$;

alter table public.channel_accounts
  add constraint channel_accounts_provider_check
  check (provider in ('gmail', 'outlook', 'imap', 'quo_sms'));
