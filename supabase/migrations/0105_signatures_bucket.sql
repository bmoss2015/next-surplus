-- Signatures storage bucket. The org admin uploads a transparent PNG (or JPEG)
-- of a handwritten signature; the path is stored on orgs.signature_image_path
-- (column added in 0103) and rendered inline on outgoing mail letters via the
-- {{sender.signature_image}} merge field.
--
-- Bucket is private — the printer (Click2Mail / Lob) fetches the image via a
-- short-lived signed URL generated at send time. Same pattern as the existing
-- `documents` bucket from 0007: uploads go through the server-side service
-- client, so RLS is a coarse authenticated-only check rather than per-row.

insert into storage.buckets (id, name, public, file_size_limit)
values ('signatures', 'signatures', false, 5242880)  -- 5 MB cap
on conflict (id) do nothing;

drop policy if exists "signatures: authenticated read" on storage.objects;
drop policy if exists "signatures: authenticated insert" on storage.objects;
drop policy if exists "signatures: authenticated update" on storage.objects;
drop policy if exists "signatures: authenticated delete" on storage.objects;

create policy "signatures: authenticated read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'signatures');

create policy "signatures: authenticated insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'signatures');

create policy "signatures: authenticated update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'signatures');

create policy "signatures: authenticated delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'signatures');
