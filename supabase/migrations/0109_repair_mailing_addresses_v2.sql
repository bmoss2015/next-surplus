-- Second pass at the mailing_address repair. The 0106 version had two
-- problems:
--   1. Its "canonical" regex only matched the 3-segment form
--      "line1, city, ST ZIP" — so 4-segment rows that include a line2
--      ("line1, Apt 4, city, ST ZIP") fell into the loose recovery path
--      and got corrupted (double-comma after line1).
--   2. Its loose recovery ignored existing commas inside the head, so
--      rows like "line1, city ST ZIP" (missing only the final comma) got
--      mangled by the last-space heuristic instead of split on the comma
--      they already had.
--
-- This migration:
--   - Treats a row as canonical iff splitting on "," yields ≥3 non-empty
--     trimmed parts and the last part matches "ST ZIP" — exactly what
--     parseAddressString in src/lib/mail/address.ts does.
--   - In the recovery path, uses commas if the head already has them
--     (preserving line2), and falls back to the last-space heuristic
--     only when the head is comma-free.
--   - Is idempotent: re-running this migration on already-fixed data is
--     a no-op.

do $$
declare
  r record;
  parts text[];
  trimmed_parts text[];
  tail text;
  is_canonical boolean;
  state_match text;
  zip_match text;
  head text;
  head_parts text[];
  trimmed_head_parts text[];
  n_head_parts int;
  last_space int;
  city text;
  line1 text;
  new_value text;
  tail_re text := '\s+([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)\s*$';
  fixed_count int := 0;
  skipped_count int := 0;
begin
  for r in
    select id, value from contacts where channel = 'mailing_address'
  loop
    -- Canonical detection mirrors parseAddressString:
    --   split on ',', trim each, drop empties; need ≥3 parts; last
    --   part matches "ST ZIP".
    parts := string_to_array(r.value, ',');
    trimmed_parts := array(select trim(p) from unnest(parts) as p where trim(p) != '');
    is_canonical := false;
    if array_length(trimmed_parts, 1) >= 3 then
      tail := trimmed_parts[array_length(trimmed_parts, 1)];
      if tail ~ '^[A-Z]{2}\s+\d{5}(-\d{4})?$' then
        is_canonical := true;
      end if;
    end if;
    if is_canonical then
      continue;
    end if;

    -- Need a "ST ZIP" tail to recover. If there isn't one, leave the
    -- row for the user to fix manually via the per-card edit form.
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

    if position(',' in head) > 0 then
      -- Head already has commas. Use them — the last comma-segment is
      -- the city, everything before joins as line1 (preserving line2).
      head_parts := string_to_array(head, ',');
      trimmed_head_parts := array(select trim(p) from unnest(head_parts) as p where trim(p) != '');
      n_head_parts := coalesce(array_length(trimmed_head_parts, 1), 0);
      if n_head_parts < 2 then
        skipped_count := skipped_count + 1;
        continue;
      end if;
      city := trimmed_head_parts[n_head_parts];
      line1 := array_to_string(trimmed_head_parts[1:n_head_parts - 1], ', ');
    else
      -- No commas. Last whitespace-delimited token before the state is
      -- the city. Multi-word cities only pick up the last word here.
      if position(' ' in head) = 0 then
        skipped_count := skipped_count + 1;
        continue;
      end if;
      last_space := length(head) - position(' ' in reverse(head));
      city := trim(substring(head from last_space + 1));
      line1 := trim(substring(head from 1 for last_space));
    end if;

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

  raise notice 'Mailing address repair v2: fixed=%, skipped=%', fixed_count, skipped_count;
end $$;
