-- Fix L: the import wizard can now map a "Parcel Number" / APN / Tax ID column.
-- Store it on the lead. Nullable; additive; idempotent.

alter table leads add column if not exists parcel_number text;
