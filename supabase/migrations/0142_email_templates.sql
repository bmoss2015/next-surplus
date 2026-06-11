create table email_template_folders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index email_template_folders_org_id_idx on email_template_folders(org_id);
create unique index email_template_folders_org_name_unique
  on email_template_folders(org_id, lower(name));

alter table email_template_folders enable row level security;

create policy "email_template_folders org read" on email_template_folders
  for select to authenticated using (org_id = auth_org_id());
create policy "email_template_folders admin insert" on email_template_folders
  for insert to authenticated
  with check (org_id = auth_org_id() and auth_is_admin());
create policy "email_template_folders admin update" on email_template_folders
  for update to authenticated
  using (org_id = auth_org_id() and auth_is_admin())
  with check (org_id = auth_org_id() and auth_is_admin());
create policy "email_template_folders admin delete" on email_template_folders
  for delete to authenticated
  using (org_id = auth_org_id() and auth_is_admin());

create trigger email_template_folders_updated_at before update on email_template_folders
  for each row execute function set_updated_at();

create table email_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs(id) on delete cascade,
  folder_id uuid references email_template_folders(id) on delete set null,
  name text not null,
  subject text not null default '',
  body_html text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index email_templates_org_id_idx on email_templates(org_id);
create index email_templates_folder_id_idx on email_templates(folder_id);

alter table email_templates enable row level security;

create policy "email_templates org read" on email_templates
  for select to authenticated using (org_id = auth_org_id());
create policy "email_templates org insert" on email_templates
  for insert to authenticated
  with check (org_id = auth_org_id());
create policy "email_templates org update" on email_templates
  for update to authenticated
  using (org_id = auth_org_id())
  with check (org_id = auth_org_id());
create policy "email_templates admin delete" on email_templates
  for delete to authenticated
  using (org_id = auth_org_id() and auth_is_admin());

create trigger email_templates_updated_at before update on email_templates
  for each row execute function set_updated_at();
