-- Fix 95: the importer can now update an existing (duplicate) lead instead of
-- only inserting or skipping. Widen the import_rows.action_taken check to allow
-- the two new outcomes: 'updated_blank' (only blank fields filled) and
-- 'updated_replace' (all importable fields overwritten).

alter table import_rows drop constraint if exists import_rows_action_taken_check;

alter table import_rows add constraint import_rows_action_taken_check
  check (action_taken in (
    'imported',
    'skipped_duplicate',
    'skipped_user',
    'updated_blank',
    'updated_replace',
    'error'
  ));
