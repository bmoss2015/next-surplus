-- Address verification result cache on contacts.
--
-- Lob /us_verifications is $0.05/call on Developer tier. Without
-- caching, every Send Mail session verifies the same address again,
-- even though USPS records change infrequently. Cache:
--   1. Stores the AddressVerifyResult JSON on the contact row.
--   2. Stores a hash of the address that was verified, so we can
--      detect when the address has changed and re-verify.
--   3. Stores the verification timestamp so we can re-verify after
--      a staleness window (default 90 days) to catch USPS database
--      updates.
--
-- A BEFORE UPDATE trigger clears the cache fields whenever the
-- contact's value (the stored address) changes, so a contact edit
-- forces a fresh verification on the next send.

alter table public.contacts
  add column if not exists address_verified_at timestamptz,
  add column if not exists address_verify_result jsonb,
  add column if not exists address_verify_hash text;

create index if not exists contacts_address_verified_at_idx
  on public.contacts(address_verified_at);

comment on column public.contacts.address_verified_at is
  'Timestamp of last successful address verification call for this contact. NULL = never verified. App code re-verifies after 90 days to catch USPS database updates.';
comment on column public.contacts.address_verify_result is
  'Cached AddressVerifyResult JSON. Used to skip the per-piece verifier charge on repeat sends. Cleared automatically when the contact value changes (see trigger).';
comment on column public.contacts.address_verify_hash is
  'Normalized hash of (line1 + city + state + zip) for cache validity check. App code compares before reusing the cache.';

-- Trigger to invalidate the cache when the contact's stored address
-- (value) changes. Means an inline contact edit in Settings forces
-- a fresh verify on the next Send Mail, without app code needing to
-- remember to null these out.
create or replace function public.invalidate_contact_address_cache()
returns trigger language plpgsql as $$
begin
  if new.value is distinct from old.value or new.channel is distinct from old.channel then
    new.address_verified_at = null;
    new.address_verify_result = null;
    new.address_verify_hash = null;
  end if;
  return new;
end;
$$;

drop trigger if exists invalidate_address_cache_on_contact_update on public.contacts;
create trigger invalidate_address_cache_on_contact_update
  before update on public.contacts
  for each row execute function public.invalidate_contact_address_cache();
