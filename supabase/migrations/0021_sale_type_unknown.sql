-- Fix 8: imports may not specify a sale type. Allow 'unknown' so rows with only
-- address/city/state/zip can still be imported. (alter type ... add value must
-- live alone in its own migration file.)

alter type sale_type add value if not exists 'unknown';
