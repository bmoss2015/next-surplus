-- Drop superseded tables.
--   * notes         — notes are stored as activities (activity_type = 'note').
--   * settings       — per-user settings table; app_settings (per-org) supersedes it.
--   * invite_tokens  — the old token-based signup flow; replaced by Supabase
--                      inviteUserByEmail + the on_auth_user_created trigger.
-- Nothing references these tables; DROP cascades their triggers, indexes and
-- RLS policies automatically.

drop table if exists notes;
drop table if exists settings;
drop table if exists invite_tokens;
