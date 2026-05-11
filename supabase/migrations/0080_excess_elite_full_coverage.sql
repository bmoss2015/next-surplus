-- Fix G: complete the Excess Elite import field coverage.
--
-- The Excess Elite export carries, per phone, a "Type" (Mobile / Residential /
-- Other) and a "DNC/Litigator" flag; it also carries owner age + "Deceased",
-- and up to 5 relatives each with 5 phones (with the same Type / DNC / Litigator
-- detail) and 5 emails. The owners / contacts / relatives tables didn't have
-- columns for any of that — this migration adds them. Everything is additive and
-- guarded with `if not exists`, so it's safe to re-run.

-- --- contacts: per-phone classification --------------------------------------
alter table contacts add column if not exists phone_type text;        -- 'Mobile' | 'Residential' | 'Other' | null
alter table contacts add column if not exists is_dnc boolean not null default false;
alter table contacts add column if not exists is_litigator boolean not null default false;

-- --- owners: age + deceased flag --------------------------------------------
alter table owners add column if not exists age integer;              -- already added in 0076; guarded
alter table owners add column if not exists is_deceased boolean not null default false;

-- A deceased owner always reads as status = 'deceased'. Keep the two in sync so
-- the "Deceased" column from Excess Elite (and the manual toggle) flow straight
-- through to owner status without any app-side bookkeeping.
create or replace function sync_owner_deceased() returns trigger as $$
begin
  if new.is_deceased then
    new.status := 'deceased';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists owners_sync_deceased on owners;
create trigger owners_sync_deceased before insert or update on owners
  for each row execute function sync_owner_deceased();

-- --- relatives: age, 5 phones (each with type/dnc/litigator), 5 emails -------
alter table relatives add column if not exists age integer;          -- already added in 0076; guarded

-- Phone 1 lives in the existing `phone` column; add its classification columns.
alter table relatives add column if not exists phone_type text;
alter table relatives add column if not exists phone_is_dnc boolean not null default false;
alter table relatives add column if not exists phone_is_litigator boolean not null default false;

-- Phones 2..5.
alter table relatives add column if not exists phone_2 text;
alter table relatives add column if not exists phone_2_type text;
alter table relatives add column if not exists phone_2_is_dnc boolean not null default false;
alter table relatives add column if not exists phone_2_is_litigator boolean not null default false;

alter table relatives add column if not exists phone_3 text;
alter table relatives add column if not exists phone_3_type text;
alter table relatives add column if not exists phone_3_is_dnc boolean not null default false;
alter table relatives add column if not exists phone_3_is_litigator boolean not null default false;

alter table relatives add column if not exists phone_4 text;
alter table relatives add column if not exists phone_4_type text;
alter table relatives add column if not exists phone_4_is_dnc boolean not null default false;
alter table relatives add column if not exists phone_4_is_litigator boolean not null default false;

alter table relatives add column if not exists phone_5 text;
alter table relatives add column if not exists phone_5_type text;
alter table relatives add column if not exists phone_5_is_dnc boolean not null default false;
alter table relatives add column if not exists phone_5_is_litigator boolean not null default false;

-- Email 1 lives in the existing `email` column; add Emails 2..5.
alter table relatives add column if not exists email text;           -- already added in 0014/0076; guarded
alter table relatives add column if not exists email_2 text;
alter table relatives add column if not exists email_3 text;
alter table relatives add column if not exists email_4 text;
alter table relatives add column if not exists email_5 text;

-- Lets the Litigator badge query relatives cheaply.
create index if not exists relatives_litigator_idx on relatives(lead_id)
  where phone_is_litigator or phone_2_is_litigator or phone_3_is_litigator
     or phone_4_is_litigator or phone_5_is_litigator;
create index if not exists contacts_litigator_idx on contacts(lead_id)
  where is_litigator;
