-- PDF caching for rendered docx letters/checks.
--
-- When sendMail runs the docx -> Gotenberg -> PDF pipeline, we already
-- pay the 2-5s render cost to produce the PDF Lob receives. Caching
-- that PDF means every subsequent View Letter is instant — no re-render
-- through LibreOffice. The original View Letter takes ~5s on docx
-- sends; with the cache it drops to ~200ms.
--
-- Plumbing:
--   1. mail_jobs.rendered_pdf_path: text path into the new storage
--      bucket. NULL for HTML-body sends (no render to cache).
--   2. Storage bucket 'mail-renders' (private). Each PDF stored at
--      {org_id}/{mail_job_id}.pdf so cleanup-by-org is one prefix.
--
-- Read/write uses the service client only (sendMail action + the
-- previewMailJob action). No customer-side RLS policies needed since
-- the bucket is never accessed directly from the browser.

alter table public.mail_jobs
  add column if not exists rendered_pdf_path text;

comment on column public.mail_jobs.rendered_pdf_path is
  'Path into the mail-renders storage bucket. Set when the docx -> PDF render pipeline runs at send time. previewMailJob checks this first and serves the cached PDF if present, skipping the Gotenberg round-trip. NULL for HTML-body sends.';

insert into storage.buckets (id, name, public)
values ('mail-renders', 'mail-renders', false)
on conflict (id) do nothing;
