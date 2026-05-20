-- Templates can carry attachments that ride along with the main letter
-- in the same envelope. Stored as an array of storage paths; ordered by
-- array index so the user controls the page order. Same bucket as the
-- main file so the storage RLS already in place covers both.
alter table public.mail_templates
  add column if not exists attachment_paths text[] not null default '{}';
