-- Fix D: store where a relative lives, for mailer purposes. All optional.
-- The relatives table already has full_name / relationship / phone / email /
-- notes (migration 0014); this adds a structured mailing address.

alter table relatives add column if not exists street text;
alter table relatives add column if not exists city text;
alter table relatives add column if not exists state text;
alter table relatives add column if not exists zip text;

alter table relatives add constraint relatives_state_len
  check (state is null or char_length(state) <= 2);
