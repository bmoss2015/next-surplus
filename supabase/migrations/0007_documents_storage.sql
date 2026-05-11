-- Create the documents storage bucket for lead document uploads.
-- v0 uploads use the service-role client server-side so policies are
-- permissive for now; tighten when auth is wired and uploads route through
-- the user-scoped client.

insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 52428800)
on conflict (id) do nothing;

drop policy if exists "documents: authenticated read" on storage.objects;
drop policy if exists "documents: authenticated insert" on storage.objects;
drop policy if exists "documents: authenticated update" on storage.objects;
drop policy if exists "documents: authenticated delete" on storage.objects;

create policy "documents: authenticated read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documents');

create policy "documents: authenticated insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents');

create policy "documents: authenticated update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'documents');

create policy "documents: authenticated delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documents');
