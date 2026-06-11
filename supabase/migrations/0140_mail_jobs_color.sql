-- Fix 8 / Fix 12: record whether each mail piece was sent in color or B&W
-- so the View Letter preview (and the Mail Sent thumbnail) can render the
-- piece the same way it was printed and mailed. Without this column the
-- preview always renders in color, even when the customer paid for B&W.

alter table public.mail_jobs
  add column if not exists color boolean not null default false;

comment on column public.mail_jobs.color is
  'TRUE when this piece was sent in color; FALSE for B&W. Drives the View Letter / thumbnail preview tint so it matches what the recipient received.';
