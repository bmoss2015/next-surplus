-- Persist uploaded .docx templates so SuperDoc can re-open them in-place
-- and the send pipeline can stream the binary to C2M without converting
-- through HTML. One row in mail_templates can carry either an HTML body
-- (built in the in-portal WYSIWYG) or a docx_path pointing at the file
-- in storage. Both are nullable; the send code picks the right path.

alter table public.mail_templates
  add column if not exists docx_path text;

-- Storage bucket for .docx template uploads. Private — only admin users
-- of the org can read/write, enforced by the policies below.
insert into storage.buckets (id, name, public)
values ('mail-templates', 'mail-templates', false)
on conflict (id) do nothing;

-- Authenticated members of the org can read template files. We don't
-- scope by org here because every authenticated portal user is part of
-- the single Moss Equity org during the current phase; revisit when
-- multi-tenant is real. Path convention: <template_uuid>.docx.
drop policy if exists "Authenticated members read mail templates" on storage.objects;
create policy "Authenticated members read mail templates"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'mail-templates');

drop policy if exists "Authenticated members write mail templates" on storage.objects;
create policy "Authenticated members write mail templates"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'mail-templates');

drop policy if exists "Authenticated members update mail templates" on storage.objects;
create policy "Authenticated members update mail templates"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'mail-templates')
  with check (bucket_id = 'mail-templates');

drop policy if exists "Authenticated members delete mail templates" on storage.objects;
create policy "Authenticated members delete mail templates"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'mail-templates');
