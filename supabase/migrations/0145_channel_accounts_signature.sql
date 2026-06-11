alter table channel_accounts
  add column if not exists signature_html text not null default '';
