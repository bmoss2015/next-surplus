# Moss Equity Operations Portal

Multi-tenant Next.js portal for surplus funds recovery operations. Built for Moss Equity Partners, designed for public SaaS release.

## Stack

- Next.js 16 (App Router) on Vercel
- Supabase Postgres (multi-org RLS) for data, auth, and storage
- React 19, Tailwind 4
- Resend (transactional email)
- Gmail OAuth + Cloudflare Worker poller (inbound mailbox sync)
- Lob (check sending), Click2Mail (letter sending)
- HLR Lookup (phone validation, currently paused)
- OpenPhone / QUO (SMS, via separate Cloudflare Worker)
- SuperDoc + Tiptap (in-app document editing)

## Prerequisites

- Node 22+
- npm
- Supabase CLI (already a devDependency, invoked via `npx supabase`)
- A Supabase account with two projects: staging + production
- A Vercel account, project linked to this repo

## Local setup

1. Clone and install:
   ```
   git clone https://github.com/bmoss2015/next-surplus.git
   cd next-surplus
   npm install
   ```

2. Copy the env template and fill in values from the staging Supabase project:
   ```
   cp .env.example .env.local
   ```

3. Verify the Supabase CLI is linked to staging, not production:
   ```
   cat supabase/.temp/project-ref
   ```
   Output should be `qfanroxcoepunmrmjabo`. If not:
   ```
   npx supabase link --project-ref qfanroxcoepunmrmjabo
   ```

4. Start the dev server:
   ```
   npm run dev
   ```
   Open http://localhost:3000.

Login credentials for the staging tenant live in `CLAUDE.md`.

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build (note: type errors currently suppressed in next.config.ts pending cleanup)
- `npm run start` — start the built app
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`

## Branch and deploy flow

See `CLAUDE.md` for the full branch → PR → preview → merge → auto-deploy workflow. Short version:

1. Branch off main: `git checkout -b <type>/<short-name>` (never commit to main directly)
2. Push the branch, Vercel auto-builds a preview URL
3. Open the PR with `gh pr create`
4. Confirm the change on the preview URL
5. Merge with `gh pr merge <n> --merge --delete-branch`
6. Vercel auto-deploys main to production within seconds

## Documentation

- `CLAUDE.md` — standing instructions, env map, deploy flow, design system, business rules
- `ARCHITECTURE.md` — one-page topology and data model reference
- `RUNBOOKS.md` — what to do when X breaks
- `docs/` — original product spec and reference material

## Environments

| | Staging | Production |
|---|---|---|
| Supabase project | qfanroxcoepunmrmjabo | rsdmyydyhqgkkvwlklif |
| Dev URL | http://localhost:3000 (or Vercel preview) | https://portal.mossequitypartners.com |
| Vendor mode | Test / sandbox keys | Live keys |

## Related repos

- `workflow-minds-quo-poller` — Cloudflare Worker, polls OpenPhone for inbound SMS verification codes
- `moss-equity-email-poller` — Cloudflare Worker, drives Gmail mailbox sync every 2 minutes
