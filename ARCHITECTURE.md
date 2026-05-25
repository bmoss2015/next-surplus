# Architecture

One-page reference for how the Moss Equity Portal fits together. Update when topology changes.

## Topology

```
                    ┌─────────────────────────┐
                    │  Browser                │
                    └────────────┬────────────┘
                                 │
                       ┌─────────▼─────────┐
                       │  Vercel           │
                       │  Next.js 16       │
                       │  App Router       │
                       │  src/proxy.ts     │
                       └─────────┬─────────┘
                                 │
        ┌────────────────────────┼─────────────────────────────┐
        │                        │                             │
┌───────▼──────────┐  ┌──────────▼──────────┐  ┌───────────────▼─────────────┐
│ Supabase         │  │ Vendor APIs         │  │ Cloudflare Workers          │
│  Postgres        │  │  Resend             │  │  moss-equity-email-poller   │
│  Auth            │  │  Lob                │  │   cron */2 * * * *          │
│  Storage         │  │  Click2Mail         │  │   hits /api/email/sync      │
│ (staging + prod) │  │  Google OAuth       │  │                             │
│                  │  │  HLR Lookup         │  │  workflow-minds-quo-poller  │
│                  │  │  OpenPhone (QUO)    │  │   cron * * * * *            │
│                  │  │  Veriphone (paused) │  │   polls QUO, emails codes   │
└──────────────────┘  └─────────────────────┘  └─────────────────────────────┘
```

## Hosting

- App: Vercel, auto-deployed from `main` branch of `github.com/bmoss2015/MossEquityPartners`
- Custom domain: `portal.mossequitypartners.com`
- Supabase projects: staging (`sghfmudgnddybsayfqbd`), production (`qvyhdexoicoppgrvvtov`)
- Two Cloudflare Workers in their own repos (see "Workers" below)

A third Supabase project (`hkubwxpyyejxffncxrez`) belongs to a separate MD research agent and must never be linked from this repo.

## Code layout

```
src/
  app/                Next.js App Router pages
    (app)/            Authenticated routes (sidebar layout)
    (auth)/           Sign-in, password reset, accept-invite
    api/              Server routes (email sync, webhooks, etc.)
    auth/callback/    Supabase OAuth callback (runs unauth'd)
  components/         Shared UI components
  lib/                Domain logic, keyed by feature
    auth/             Supabase client factories
    email/            Inbound Gmail sync, encryption
    leads/            Lead CRUD + computed fields
    mail/             Lob + Click2Mail integrations
    notifications/    In-app + email notifications
    phone-validate.ts HLR phone validation
    reports/          Reporting queries
    settings/         App settings reads/writes
    supabase/         Browser + server + service-role clients
    tasks/            Task CRUD
  proxy.ts            Auth middleware (was middleware.ts pre-Next 16)
supabase/
  migrations/         Numbered SQL migrations, source of truth for schema
  functions/          Edge Functions (currently: notify-mention)
  config.toml         Pinned to staging project ref
scripts/              Operational scripts (admin user, invite, seed, harness)
docs/                 Original spec and reference material
```

## Data model

Multi-tenant by `org_id`. Every data table has `org_id` NOT NULL, defaulting to `auth_org_id()`, a SECURITY DEFINER function that reads the caller's profile row. RLS policies on every table restrict select / insert / update / delete to `org_id = auth_org_id()`. The canonical pattern is in `supabase/migrations/0011_multi_org_rls.sql`; every later migration follows the same shape.

Key tables:

- `orgs`, `profiles` — tenant + user identity (with admin / member role)
- `leads`, `owners`, `contacts`, `verification_items`, `tasks`, `activities` — core operational data
- `documents` — Supabase storage bucket, path-scoped by `<org_id>/...`
- `app_settings`, `state_rules`, `lost_reasons`, `lead_sources`, `data_sources` — per-org reference data
- `mail_*`, `email_*` — outbound mail and inbound email modules
- `import_*`, `templates`, `notification_*` — supporting modules
- `audit_log` — admin-write, org-read, sensitive action trail

Migrations are numbered with intentional gaps (0001–0030, 0040, 0050, 0065, 0070, 0080…) to leave room for inserts. Apply with `npx supabase db push --linked`. Never use the Supabase dashboard SQL editor, never use MCP `apply_migration`, never run DDL through `execute_sql`. If the file isn't in git, the change doesn't exist.

## Auth flow

`src/proxy.ts` runs Supabase SSR `getUser()` on every non-asset request. Behavior:

- Bypass: `/_next/*`, `/api/*`, `/auth/callback`, favicon
- Public paths (signed-out only, signed-in users get bounced home): `/login`, `/forgot`
- Auth-flow paths (reachable with or without a session, used to set a password while holding a recovery / invite token): `/reset`, `/accept-invite`
- Everything else requires a session, otherwise redirect to `/login?redirectTo=<path>`

Cookie refresh tokens are propagated through redirects so the session doesn't flap.

## Workers

Each worker lives in a separate repo and is deployed independently via Wrangler.

**moss-equity-email-poller** — `C:\Users\info\moss-equity-email-poller`
- Cron: `*/2 * * * *`
- Action: POST `${PORTAL_URL}/api/email/sync` with the `INTERNAL_TRIGGER_SECRET` header
- Purpose: drives Gmail mailbox sync so inbox doesn't require manual refresh
- Replaces the previous Vercel cron

**workflow-minds-quo-poller** — `C:\Users\info\workflow-minds-quo-poller`
- Cron: `* * * * *`
- Action: poll `api.openphone.com/v1/messages`, email new verification codes to `workflowminds@gmail.com` via Resend
- KV namespace `SEEN_MESSAGES` for dedup
- Replaces n8n workflow `R2oSjgxNiYBvmuCK`

## Deploy

The default path is git-driven, no `vercel --prod` from local. Full sequence in `CLAUDE.md`. Short version: branch → push → preview auto-builds → confirm on preview → `gh pr merge` → Vercel auto-deploys main to production within seconds.

## Decisions worth knowing

- **Mail provider split**: Lob handles ONLY checks. Click2Mail handles ALL letters. No silent fallback for letters (pricing call: Lob letters cost ~50% more). See `src/lib/mail/`.
- **Phone validation**: currently paused. HLR Lookup is the chosen provider, replacing Clearout, which replaced Veriphone. Clearout env vars still sit on Vercel and are pending removal.
- **HTML to PDF**: the print vendor handles rendering. No live server-side LibreOffice or Gotenberg in the request path, despite `GOTENBERG_URL` existing as an env var.
- **Type checking off in prod builds**: `next.config.ts` has `typescript.ignoreBuildErrors: true` to ship through 4 known errors in the mail module. To be removed once those are fixed; CI typecheck is wired but kept off the required path until then.
