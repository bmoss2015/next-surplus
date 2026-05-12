-- Fix LLL: the surplus figure a lead source reports on the row it imported. It
-- is NOT the confirmed (county-verified) surplus and NOT the computed estimate —
-- it's the third tier in the active-surplus hierarchy. Nullable, additive.

alter table leads add column if not exists source_surplus numeric(12,2);
