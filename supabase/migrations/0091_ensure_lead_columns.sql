-- Fix GGGG2: defensive guard against runtime error 42703 (undefined column).
-- Ensure every leads column that recent code references actually exists. Each
-- statement is a no-op if the column is already present.
alter table leads add column if not exists source_surplus numeric(12,2);
alter table leads add column if not exists data_source text;
alter table leads add column if not exists parcel_number text;
