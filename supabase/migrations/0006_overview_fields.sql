-- Fields for the Lead Detail Overview tab body.
--
-- research_notes: free-text user research findings (replaces the spec's
-- automated Research Report card). Manual entry only in v0.
--
-- viability: user's manual recommendation. Soft signal, separate from stage.
-- Pursue / Review / Skip — the "Decision card" defaults but as a stored hint.

alter table leads
  add column research_notes text,
  add column viability text check (viability in ('pursue', 'review', 'skip'));
