-- Persist user-managed lost-reason options so they survive across leads,
-- sessions, and the eventual Settings UI. Seeded with the v0 standard list;
-- users can append custom reasons via the Mark Lost dialog.

create table lost_reasons (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  is_default boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness on label so "Owner Uncooperative" and
-- "owner uncooperative" can't both exist.
create unique index lost_reasons_label_lower_unique
  on lost_reasons (lower(label));

create index lost_reasons_active_idx
  on lost_reasons (label) where not archived;

alter table lost_reasons enable row level security;

create policy "lost_reasons: authenticated read"
  on lost_reasons for select to authenticated using (true);
create policy "lost_reasons: authenticated insert"
  on lost_reasons for insert to authenticated with check (true);
create policy "lost_reasons: authenticated update"
  on lost_reasons for update to authenticated using (true) with check (true);

insert into lost_reasons (label, is_default) values
  ('Owner Uncooperative', true),
  ('Asked to be Removed', true),
  ('DNC Requested', true),
  ('Already Claimed by Heir', true),
  ('Surplus Already Claimed', true),
  ('Contested by Another Firm', true),
  ('Active Bankruptcy Stay', true),
  ('Title Issue', true),
  ('Below Floor After Research', true),
  ('Surplus Too Small', true);
