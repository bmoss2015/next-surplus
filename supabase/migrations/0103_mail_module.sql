-- Mail module: send physical letters and checks programmatically via
-- Click2Mail (letters) and Lob (checks). Adds settings to orgs, plus three
-- new tables — bank accounts (for checks), templates, and jobs (one per
-- mailpiece). A "batch" is a group of mail_jobs that share batch_id; a
-- batch of one is just a single send.
--
-- Provider split: letters route to Click2Mail (cheaper per piece), checks
-- route to Lob (better check API + Lob holds the bank credentials). The
-- abstraction lives in src/lib/mail/.

-------------------------------------------------------------------------------
-- 1. Mail-specific settings on orgs
-------------------------------------------------------------------------------
-- Company address (return address on outgoing mail) and contact info were
-- added in 0102. Here we add the human-side fields: who signs the letter,
-- and the org's default postal class.

alter table orgs
  add column if not exists signer_name text,
  add column if not exists signer_title text,
  add column if not exists signature_image_path text,
  add column if not exists default_mail_class text not null default 'first_class'
    check (default_mail_class in ('standard', 'first_class', 'certified'));

-------------------------------------------------------------------------------
-- 1b. Address columns on lead_parties so we can mail to county clerks etc.
-------------------------------------------------------------------------------
alter table lead_parties
  add column if not exists street text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zip text;

alter table lead_parties drop constraint if exists lead_parties_state_len;
alter table lead_parties add constraint lead_parties_state_len
  check (state is null or char_length(state) <= 2);

-------------------------------------------------------------------------------
-- 2. mail_bank_accounts — verified bank accounts for sending checks
-------------------------------------------------------------------------------
-- We never store the raw routing/account numbers. Lob holds the credentials
-- and returns a `bnk_xxx` ID; we store the reference plus a few display
-- bits (bank name, last four, account holder name) for the UI. Status
-- transitions: unverified -> verified once Lob's microdeposits confirm.

create table mail_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs(id) on delete cascade,
  lob_bank_account_id text not null,
  bank_name text,
  account_holder_name text not null,
  routing_last_four text,
  account_last_four text,
  status text not null default 'unverified'
    check (status in ('unverified', 'verified', 'disabled')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, lob_bank_account_id)
);
create index mail_bank_accounts_org_id_idx on mail_bank_accounts(org_id);

create trigger mail_bank_accounts_updated_at before update on mail_bank_accounts
  for each row execute function set_updated_at();

alter table mail_bank_accounts enable row level security;
create policy "mail_bank_accounts org read" on mail_bank_accounts
  for select to authenticated using (org_id = auth_org_id());
create policy "mail_bank_accounts admin insert" on mail_bank_accounts
  for insert to authenticated
  with check (org_id = auth_org_id() and auth_is_admin());
create policy "mail_bank_accounts admin update" on mail_bank_accounts
  for update to authenticated
  using (org_id = auth_org_id() and auth_is_admin())
  with check (org_id = auth_org_id() and auth_is_admin());
create policy "mail_bank_accounts admin delete" on mail_bank_accounts
  for delete to authenticated
  using (org_id = auth_org_id() and auth_is_admin());

-------------------------------------------------------------------------------
-- 3. mail_templates — reusable letter templates
-------------------------------------------------------------------------------
-- Two formats coexist:
--   * body_html: in-portal rich-text template (with {{merge_fields}})
--   * docx_storage_path: uploaded Word doc with merge tags (rendered server-
--     side via docxtemplater). Either-or — never both populated.
-- Category determines where the template surfaces in the Send Mail modal:
-- outreach templates appear on lead contacts; records_request appears on
-- county clerk / records-request flows; other is unfiltered.

create table mail_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs(id) on delete cascade,
  name text not null,
  category text not null default 'other'
    check (category in ('outreach', 'records_request', 'other')),
  body_html text,
  docx_storage_path text,
  default_mail_class text not null default 'first_class'
    check (default_mail_class in ('standard', 'first_class', 'certified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index mail_templates_org_id_idx on mail_templates(org_id);
create index mail_templates_category_idx on mail_templates(category);

create trigger mail_templates_updated_at before update on mail_templates
  for each row execute function set_updated_at();

alter table mail_templates enable row level security;
create policy "mail_templates org read" on mail_templates
  for select to authenticated using (org_id = auth_org_id());
create policy "mail_templates org insert" on mail_templates
  for insert to authenticated with check (org_id = auth_org_id());
create policy "mail_templates org update" on mail_templates
  for update to authenticated
  using (org_id = auth_org_id()) with check (org_id = auth_org_id());
create policy "mail_templates admin delete" on mail_templates
  for delete to authenticated
  using (org_id = auth_org_id() and auth_is_admin());

-------------------------------------------------------------------------------
-- 4. mail_jobs — one row per mailpiece (letter or check)
-------------------------------------------------------------------------------
-- A single click of "Send Mail" with N recipients creates N rows with a
-- shared batch_id. lead_id / relative_id are nullable because future
-- list-driven campaigns may not be tied to a record.
--
-- The provider-side fields (provider_id, tracking_number, tracking_url,
-- status, delivered_at, returned_at, cost_cents) are populated on send
-- and updated by the provider webhooks. Body fields are snapshotted at
-- send time so later template edits don't change the historical record.

create table mail_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs(id) on delete cascade,
  batch_id uuid not null,
  lead_id uuid references leads(id) on delete set null,
  relative_id uuid references relatives(id) on delete set null,
  lead_party_id uuid references lead_parties(id) on delete set null,
  template_id uuid references mail_templates(id) on delete set null,

  -- recipient snapshot
  recipient_name text not null,
  recipient_address_line1 text not null,
  recipient_address_line2 text,
  recipient_city text not null,
  recipient_state text not null,
  recipient_postal_code text not null,
  recipient_country text not null default 'US',

  -- sender snapshot
  from_name text not null,
  from_address_line1 text not null,
  from_address_line2 text,
  from_city text not null,
  from_state text not null,
  from_postal_code text not null,
  from_country text not null default 'US',

  -- body snapshot (after merge fields filled)
  body_html text,
  body_pdf_storage_path text,

  -- mail config
  mail_class text not null default 'first_class'
    check (mail_class in ('standard', 'first_class', 'certified')),

  -- check (optional, only when sending letter+check via Lob)
  include_check boolean not null default false,
  check_amount_cents integer,
  check_memo text,
  bank_account_id uuid references mail_bank_accounts(id) on delete set null,

  -- provider tracking
  provider text not null
    check (provider in ('click2mail', 'lob', 'stub')),
  provider_id text,
  tracking_number text,
  tracking_url text,
  status text not null default 'queued'
    check (status in ('queued', 'in_transit', 'delivered', 'returned', 'failed')),
  cost_cents integer,
  error_message text,

  -- lifecycle
  created_by uuid references profiles(id) on delete set null,
  sent_at timestamptz,
  delivered_at timestamptz,
  returned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- guardrails
  constraint mail_jobs_check_consistency check (
    (include_check = false) or
    (include_check = true and check_amount_cents is not null and check_amount_cents > 0)
  )
);
create index mail_jobs_org_id_idx on mail_jobs(org_id);
create index mail_jobs_lead_id_idx on mail_jobs(lead_id);
create index mail_jobs_relative_id_idx on mail_jobs(relative_id);
create index mail_jobs_lead_party_id_idx on mail_jobs(lead_party_id);
create index mail_jobs_batch_id_idx on mail_jobs(batch_id);
create index mail_jobs_status_idx on mail_jobs(status);
create index mail_jobs_created_at_idx on mail_jobs(created_at desc);
create index mail_jobs_provider_id_idx on mail_jobs(provider, provider_id);

create trigger mail_jobs_updated_at before update on mail_jobs
  for each row execute function set_updated_at();

alter table mail_jobs enable row level security;
create policy "mail_jobs org read" on mail_jobs
  for select to authenticated using (org_id = auth_org_id());
create policy "mail_jobs org insert" on mail_jobs
  for insert to authenticated with check (org_id = auth_org_id());
create policy "mail_jobs org update" on mail_jobs
  for update to authenticated
  using (org_id = auth_org_id()) with check (org_id = auth_org_id());
create policy "mail_jobs admin delete" on mail_jobs
  for delete to authenticated
  using (org_id = auth_org_id() and auth_is_admin());

-------------------------------------------------------------------------------
-- 5. Activity record for sent mail
-------------------------------------------------------------------------------
-- Status updates from the provider webhook also fire a fresh activities
-- row so the lead's activity timeline reflects delivery/return events
-- without needing a join. payload carries { mail_job_id, status,
-- recipient_name, tracking_url, batch_id }.

-- (No DDL needed here — the existing activities table is fine; just
-- documenting the convention.)
