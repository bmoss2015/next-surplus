-- Third pass at the mailing_address repair. The 0109 version only
-- recognized 2-letter US state abbreviations. Legacy rows that were
-- imported with the state name spelled out (e.g. "Richmond, Texas 77406")
-- fell through both the canonical detector and the loose recovery, so
-- nothing was fixed.
--
-- This migration introduces a state-name → 2-letter lookup and re-runs
-- the recovery for rows whose tail matches "FullStateName ZIP". Once
-- normalized, the rows become canonical and won't be touched again on
-- subsequent runs.

do $$
declare
  r record;
  state_lookup constant text[] := array[
    'alabama','AL','alaska','AK','arizona','AZ','arkansas','AR','california','CA',
    'colorado','CO','connecticut','CT','delaware','DE','florida','FL','georgia','GA',
    'hawaii','HI','idaho','ID','illinois','IL','indiana','IN','iowa','IA',
    'kansas','KS','kentucky','KY','louisiana','LA','maine','ME','maryland','MD',
    'massachusetts','MA','michigan','MI','minnesota','MN','mississippi','MS','missouri','MO',
    'montana','MT','nebraska','NE','nevada','NV','new hampshire','NH','new jersey','NJ',
    'new mexico','NM','new york','NY','north carolina','NC','north dakota','ND','ohio','OH',
    'oklahoma','OK','oregon','OR','pennsylvania','PA','rhode island','RI','south carolina','SC',
    'south dakota','SD','tennessee','TN','texas','TX','utah','UT','vermont','VT',
    'virginia','VA','washington','WA','west virginia','WV','wisconsin','WI','wyoming','WY',
    'district of columbia','DC'
  ];
  full_re text := '\s+([A-Za-z][A-Za-z ]+?)\s+(\d{5}(?:-\d{4})?)\s*$';
  is_canonical boolean;
  parts text[];
  trimmed_parts text[];
  tail text;
  state_word text;
  zip_match text;
  state_abbr text;
  head text;
  head_parts text[];
  trimmed_head_parts text[];
  n_head_parts int;
  city text;
  line1 text;
  new_value text;
  fixed_count int := 0;
  skipped_count int := 0;
  i int;
begin
  for r in select id, value from contacts where channel = 'mailing_address'
  loop
    -- Canonical (already in "line1[, line2], city, ST ZIP" form)? Skip.
    parts := string_to_array(r.value, ',');
    trimmed_parts := array(select trim(x) from unnest(parts) as x where trim(x) != '');
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

    -- Pull a "<Word(s)> <ZIP>" tail off the end. The state word can be
    -- 2+ letters; we then look it up against the full-name table.
    state_word := (regexp_match(r.value, full_re))[1];
    zip_match := (regexp_match(r.value, full_re))[2];
    if state_word is null or zip_match is null then
      skipped_count := skipped_count + 1;
      continue;
    end if;

    -- Resolve "Texas" → "TX" (case-insensitive). 2-letter input that
    -- already matches one of the abbreviations is also accepted.
    state_abbr := null;
    if length(state_word) = 2 and upper(state_word) in (
      'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
      'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
      'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
    ) then
      state_abbr := upper(state_word);
    else
      i := 1;
      while i < array_length(state_lookup, 1) loop
        if lower(state_word) = state_lookup[i] then
          state_abbr := state_lookup[i + 1];
          exit;
        end if;
        i := i + 2;
      end loop;
    end if;
    if state_abbr is null then
      skipped_count := skipped_count + 1;
      continue;
    end if;

    head := trim(regexp_replace(r.value, full_re, ''));
    if head = '' then
      skipped_count := skipped_count + 1;
      continue;
    end if;

    if position(',' in head) > 0 then
      head_parts := string_to_array(head, ',');
      trimmed_head_parts := array(select trim(x) from unnest(head_parts) as x where trim(x) != '');
      n_head_parts := coalesce(array_length(trimmed_head_parts, 1), 0);
      if n_head_parts < 2 then
        skipped_count := skipped_count + 1;
        continue;
      end if;
      city := trimmed_head_parts[n_head_parts];
      line1 := array_to_string(trimmed_head_parts[1:n_head_parts - 1], ', ');
    else
      if position(' ' in head) = 0 then
        skipped_count := skipped_count + 1;
        continue;
      end if;
      city := trim(substring(head from length(head) - position(' ' in reverse(head)) + 2));
      line1 := trim(substring(head from 1 for length(head) - position(' ' in reverse(head))));
    end if;

    if line1 = '' or city = '' then
      skipped_count := skipped_count + 1;
      continue;
    end if;

    new_value := line1 || ', ' || city || ', ' || state_abbr || ' ' || zip_match;
    if new_value = r.value then
      continue;
    end if;
    update contacts set value = new_value where id = r.id;
    fixed_count := fixed_count + 1;
  end loop;

  raise notice 'Mailing address repair (state-name aware): fixed=%, skipped=%', fixed_count, skipped_count;
end $$;
