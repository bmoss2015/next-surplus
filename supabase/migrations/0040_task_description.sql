-- Fix 26: every task now has both a title and a longer free-text description.
-- The existing `notes` column is left untouched for backward compatibility;
-- `description` is the primary detail field shown on the create/edit forms.

alter table tasks add column description text not null default '';
