-- ALTER TYPE ... ADD VALUE cannot run inside the same transaction that uses
-- the new values, so the mail-related activity_type values get their own
-- migration file. Each statement is its own transaction; idempotent.

alter type activity_type add value if not exists 'mail_sent';
alter type activity_type add value if not exists 'mail_delivered';
alter type activity_type add value if not exists 'mail_returned';
