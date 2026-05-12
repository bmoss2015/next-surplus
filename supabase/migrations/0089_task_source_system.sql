-- Fix CCCC2: a "Needs Review" task auto-created when a lead is flagged for
-- review is a system task, not a manual one. Add the value to the enum.
alter type task_source add value if not exists 'system';
