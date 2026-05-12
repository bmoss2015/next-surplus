-- Fix GGG: a removed team member is deactivated (kept for audit/FK integrity but
-- hidden from the team list and treated as no longer a member). Additive.

alter table profiles add column if not exists deactivated boolean not null default false;
