-- Fix 6: soft delete for leads. `archived = true` hides a lead from every
-- default view; nothing is hard-deleted. A partial index keeps the common
-- "not archived" scans cheap.

alter table leads add column archived boolean not null default false;

create index leads_active_idx on leads(archived) where not archived;
