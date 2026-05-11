-- Fix 90: imports may not be able to resolve a recovery type for a given
-- state + sale type. Allow 'unknown' on the recovery_type enum so the importer
-- has a safe default. (alter type ... add value must live alone in its own
-- migration file — see migration 0021 for the same pattern.)

alter type recovery_type add value if not exists 'unknown';
