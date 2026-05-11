-- Invite tokens for the gated signup flow. Admins generate a token for a
-- specific email; signup requires both the email and a matching unused,
-- unexpired token.

create table invite_tokens (
  token text primary key,
  email text not null,
  used_at timestamptz,
  expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now()
);

create index invite_tokens_email_idx on invite_tokens(lower(email));

alter table invite_tokens enable row level security;
-- Reads/writes happen through the service-role client only.
