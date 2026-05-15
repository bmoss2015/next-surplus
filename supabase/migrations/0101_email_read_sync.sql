-- 0101_email_read_sync.sql
--
-- Per-account toggle: when ON, marking a message read inside the portal
-- also strips the UNREAD label from the corresponding Gmail message via
-- the API. Default OFF — portal read state stays separate from Gmail
-- read state unless the user opts in.

alter table channel_accounts
  add column sync_read_to_provider boolean not null default false;
