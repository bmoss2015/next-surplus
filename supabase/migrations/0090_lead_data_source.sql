-- Fix FFFF2: "Data Source" — where the underlying record came from (distinct
-- from lead_source, which is the named acquisition channel). Inline-editable on
-- the new Property Info tab; read-only reference in Quick Facts.
alter table leads add column if not exists data_source text;
