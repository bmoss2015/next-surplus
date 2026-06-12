-- Per-template default attachments. Stored inline as JSONB
-- ({ filename, mime_type, size, base64 }[]) so we don't need a separate
-- storage bucket flow for the common SMB case. Combined 24MB Gmail cap
-- enforced client-side at send/save time, same as the SendEmail modal.
alter table email_templates
add column if not exists attachments jsonb not null default '[]'::jsonb;
