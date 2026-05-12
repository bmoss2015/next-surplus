-- Fix BB: changing a lead's assignee writes an `assignment_change` activity
-- ("Lead Assigned To <name>" / "Lead Unassigned"). Additive; idempotent.

alter type activity_type add value if not exists 'assignment_change';
