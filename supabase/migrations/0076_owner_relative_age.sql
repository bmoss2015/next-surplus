-- Fix E (expanded): the Excess Elite import carries an owner age, relative
-- ages, and a relative primary email. Add the backing columns. All nullable.
-- (relatives.email already exists from migration 0014; the `if not exists`
-- guard keeps this idempotent.)

alter table owners add column if not exists age integer;
alter table relatives add column if not exists age integer;
alter table relatives add column if not exists email text;
