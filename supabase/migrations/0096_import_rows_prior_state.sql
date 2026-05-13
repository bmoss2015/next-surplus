-- Fix FFFF4: Revert now supports replacements and updates, not just new
-- inserts. To make that possible we snapshot the pre-update state of every
-- row the import touches into `import_rows.prior_state` (a JSONB blob with
-- the full leads row plus its primary owner row, captured *before* the
-- UPDATE runs). On revert, an `updated_replace` / `updated_blank` row is
-- restored from this snapshot; an `imported` row is still removed via DELETE
-- as before. NULL on every existing row — older imports stay revert-by-
-- delete only (no snapshot, no restore).

alter table import_rows add column if not exists prior_state jsonb null;
