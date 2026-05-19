-- One-shot repair of mailing_address contacts that were imported with the
-- whole address jammed into a single text field. The Send Mail parser
-- requires "line1, city, ST ZIP" — anything else gets skipped and the
-- recipient never appears in the picker. This migration is idempotent:
-- rows already in canonical form are left alone, and rows whose tail
-- doesn't end with "ST ZIP" stay untouched (they need manual edit).
--
-- The "city" heuristic is the same one used by smartParseAddress in
-- src/lib/mail/address.ts — take the last whitespace-delimited word
-- before the state as the city. Multi-word cities ("Los Angeles",
-- "New York") only pick up the last word here; users fix those via the
-- per-card Edit button on each lead.
--
-- Safe to re-run. Going forward the import code normalizes addresses
-- before insert, so this migration only matters for legacy data.

do $$
declare
  r record;
  state_match text;
  zip_match text;
  head text;
  last_space int;
  city text;
  line1 text;
  new_value text;
  canonical_re text := '^[^,]+, [^,]+, [A-Z]{2} \d{5}(-\d{4})?$';
  tail_re text := '\s+([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)\s*$';
  fixed_count int := 0;
  skipped_count int := 0;
begin
  for r in
    select id, value from contacts where channel = 'mailing_address'
  loop
    -- Already in canonical form? Skip.
    if r.value ~ canonical_re then
      continue;
    end if;

    -- Pull a trailing "ST ZIP" off the end. If there isn't one, leave
    -- the row alone (manual fix required).
    state_match := upper((regexp_match(r.value, tail_re))[1]);
    zip_match := (regexp_match(r.value, tail_re))[2];
    if state_match is null or zip_match is null then
      skipped_count := skipped_count + 1;
      continue;
    end if;

    head := trim(regexp_replace(r.value, tail_re, ''));
    if head = '' then
      skipped_count := skipped_count + 1;
      continue;
    end if;

    -- Last whitespace-delimited token before the state = city.
    last_space := length(head) - position(' ' in reverse(head));
    if position(' ' in head) = 0 then
      skipped_count := skipped_count + 1;
      continue;
    end if;
    city := trim(substring(head from last_space + 1));
    line1 := trim(substring(head from 1 for last_space));

    if line1 = '' or city = '' then
      skipped_count := skipped_count + 1;
      continue;
    end if;

    new_value := line1 || ', ' || city || ', ' || state_match || ' ' || zip_match;
    if new_value = r.value then
      continue;
    end if;

    update contacts set value = new_value where id = r.id;
    fixed_count := fixed_count + 1;
  end loop;

  raise notice 'Mailing address repair: fixed=%, skipped=%', fixed_count, skipped_count;
end $$;
