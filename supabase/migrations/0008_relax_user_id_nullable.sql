-- v0 has no auth yet, but the Tasks page and Imports flow need to work.
-- Relax NOT NULL on user_id for tasks and imports until auth is wired.
-- When auth lands, we'll backfill these to the actual user and reinstate NOT NULL.

alter table tasks alter column user_id drop not null;
alter table imports alter column user_id drop not null;
