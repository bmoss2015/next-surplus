-- Fix 90: recovery type prefill lookup.
-- Maps (state + sale_type) -> recovery_type so the import pipeline can stamp a
-- recovery type onto each created lead. Global reference table (no org scoping);
-- authenticated users get read access. Seeded with the known state / sale-type
-- combinations; anything not in the table defaults to 'unknown' in the importer.

create table recovery_type_lookup (
  state text not null,
  sale_type sale_type not null,
  recovery_type recovery_type not null,
  updated_at timestamptz not null default now(),
  primary key (state, sale_type)
);

alter table recovery_type_lookup enable row level security;

create policy "recovery_type_lookup: authenticated read" on recovery_type_lookup
  for select to authenticated using (true);

create trigger recovery_type_lookup_updated_at before update on recovery_type_lookup
  for each row execute function set_updated_at();

-- Seed: MTG = mortgage sale, TAX = tax sale (matching the sale_type enum).
insert into recovery_type_lookup (state, sale_type, recovery_type) values
  ('GA', 'MTG', 'non_judicial'),
  ('SC', 'MTG', 'non_judicial'),
  ('SC', 'TAX', 'non_judicial'),
  ('TN', 'MTG', 'non_judicial'),
  ('PA', 'TAX', 'judicial'),
  ('MD', 'MTG', 'judicial'),
  ('OH', 'MTG', 'judicial'),
  ('NY', 'MTG', 'judicial')
on conflict (state, sale_type) do nothing;
