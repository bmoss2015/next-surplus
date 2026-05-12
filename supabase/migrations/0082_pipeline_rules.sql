-- Fix R: Pipeline Rules — a single configurable "Needs Action" inactivity
-- threshold that drives automatic flagging on the Daily Work board.
--
-- Stored in the per-org app_settings key/value table under the key
-- `needs_action_days_threshold`. The default is JSON null (blank = disabled):
-- with no threshold set, only manually flagged leads appear in Needs Action.
-- When set to an integer N, leads with no activity for more than N days that
-- are in the qualifying / outreach / in_conversation stages are also surfaced.
-- (Clearing the field in Settings removes the row; an absent row reads the same
-- as JSON null — disabled.)
insert into app_settings (org_id, key, value)
select id, 'needs_action_days_threshold', 'null'::jsonb from orgs
on conflict (org_id, key) do nothing;
