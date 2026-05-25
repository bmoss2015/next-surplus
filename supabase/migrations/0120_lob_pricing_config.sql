-- Per-org Lob pricing override. Lob's API doesn't return per-piece cost
-- at send time, so the portal computes spend from a rate schedule. The
-- schedule defaults to Lob's published Developer-tier rates but each
-- org's actual contract can override (volume discounts, Growth/Startup
-- tier, custom enterprise pricing). Admin edits the schedule from the
-- Settings UI; mail_jobs.cost_cents on new sends pulls from here.
--
-- Shape: JSONB so adding new mail products doesn't need a schema change.
-- The mail send code reads with safe accessors and falls back to the
-- published defaults if a key is missing.

alter table public.orgs
  add column if not exists lob_pricing_cents jsonb not null default jsonb_build_object(
    'tier_label', 'Developer (published)',
    'check_base', 116,
    'check_extra_attachment_page', 22,
    'letter_first_class_bw', 103,
    'letter_first_class_color', 119,
    'letter_standard_bw', 81,
    'letter_standard_color', 97,
    'letter_certified_bw', 103,
    'letter_certified_color', 119,
    'letter_extra_page_bw', 10,
    'letter_extra_page_color', 20
  );

comment on column public.orgs.lob_pricing_cents is
  'Per-org Lob rate schedule in cents. Defaults match Lob Developer tier published rates. Admin editable from Settings to reflect actual contract pricing.';
