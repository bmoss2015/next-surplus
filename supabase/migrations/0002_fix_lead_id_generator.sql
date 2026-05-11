-- Fix: generate_lead_id used FOR UPDATE with an aggregate, which Postgres rejects
-- (0A000: FOR UPDATE is not allowed with aggregate functions).
-- Replace the row lock with a transaction-scoped advisory lock keyed by the prefix.
-- This serializes concurrent inserts for the same (state, sale_type, year) tuple
-- without blocking unrelated insertions.

create or replace function generate_lead_id(
  p_state text,
  p_sale_type sale_type,
  p_year int
) returns text
language plpgsql
volatile
as $$
declare
  next_seq int;
  prefix text;
  type_part text;
begin
  type_part := upper(p_sale_type::text);
  prefix := upper(p_state) || '-' || type_part || '-' || p_year::text || '-';

  -- Serialize generation across concurrent inserts for this prefix.
  -- Released automatically at end of transaction.
  perform pg_advisory_xact_lock(hashtext(prefix));

  select coalesce(max(
    (regexp_match(lead_id, '-(\d{4})$'))[1]::int
  ), 0) + 1
  into next_seq
  from leads
  where lead_id like prefix || '%';

  return prefix || lpad(next_seq::text, 4, '0');
end;
$$;
