-- Replace the hardcoded mail_templates.category enum with user-defined
-- folders. The previous "outreach / records_request / other" categories
-- were our guess at what customers would want — Bree's right that every
-- org has its own organization, so make it user-defined.
--
-- Each org gets its own set of folders. Templates can live in one folder
-- or none ("Unfiled"). Deleting a folder leaves its templates with
-- folder_id = null (they fall back to Unfiled) rather than cascading.

create table mail_template_folders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mail_template_folders_org_id_idx on mail_template_folders(org_id);
create unique index mail_template_folders_org_name_unique
  on mail_template_folders(org_id, lower(name));

alter table mail_template_folders enable row level security;

create policy "mail_template_folders org read" on mail_template_folders
  for select to authenticated using (org_id = auth_org_id());
create policy "mail_template_folders admin insert" on mail_template_folders
  for insert to authenticated
  with check (org_id = auth_org_id() and auth_is_admin());
create policy "mail_template_folders admin update" on mail_template_folders
  for update to authenticated
  using (org_id = auth_org_id() and auth_is_admin())
  with check (org_id = auth_org_id() and auth_is_admin());
create policy "mail_template_folders admin delete" on mail_template_folders
  for delete to authenticated
  using (org_id = auth_org_id() and auth_is_admin());

-- Add folder_id to templates; drop the old category enum. Existing rows
-- get folder_id = null ("Unfiled") — admins can move them into folders
-- after creating folders.

alter table mail_templates
  add column folder_id uuid references mail_template_folders(id) on delete set null;

create index mail_templates_folder_id_idx on mail_templates(folder_id);

alter table mail_templates drop column if exists category;
