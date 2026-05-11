-- Fix 99 — the State Rules settings section is removed. Drop the backing
-- table. templates.state had a foreign key into state_rules(state); drop that
-- first, then drop the table (cascade clears the org-scoped RLS policies and
-- any other dependents).

alter table templates drop constraint if exists templates_state_fkey;

drop table if exists state_rules cascade;
