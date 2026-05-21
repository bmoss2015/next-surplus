\## CRITICAL — READ BEFORE EVERY COMMAND

Before running ANY supabase command, run: cat supabase/.temp/project-ref

If the output is NOT sghfmudgnddybsayfqbd, stop immediately and run:
npx supabase link --project-ref sghfmudgnddybsayfqbd

Then verify again before proceeding.

Never assume the link state is correct. Always verify first. Every time. No exceptions.



@AGENTS.md



\# Moss Equity Operations Portal — Standing Instructions



\## Project

Next.js operations portal for surplus funds recovery.

Built for internal use and future public SaaS release.

Every decision must be intuitive to a first-time user

with no onboarding.



\## Repo

C:\\Users\\info\\moss-equity-portal



\## Environments



\### Staging (work here first, always)

\- Supabase project: sghfmudgnddybsayfqbd

\- .env.local points here by default

\- Login: info@mossyland.com / MossEquity-858dc58d33!

\- 42 test leads for visual verification

\- Start: npm run dev → localhost:3000



\### Production (never touch without Bree approval)

\- Supabase project: qvyhdexoicoppgrvvtov

\- URL: moss-equity-portal.vercel.app

\- DB changes: npx supabase db push --linked

\- Only after Bree confirms fix on localhost:3000

\#### Deploy flow — GitHub first, never `vercel --prod` from local

1. Branch off main: `git checkout -b fix/<short-name>` (never commit directly to main from local)

2. Commit the change with the Fix [number]: [name] format

3. Push the branch: `git push -u origin fix/<short-name>` — Vercel auto-builds a preview URL on every branch push

4. Open a PR to main (gh CLI if available, otherwise the URL GitHub returns)

5. Wait for the Vercel preview deploy to land. Confirm the fix on the preview URL before merging

6. Bree merges the PR → Vercel auto-deploys main to production

7. After merge, monitor the prod deploy and report the final status — do not assume "merged" means "shipped". If the deploy fails, surface the actual error from the build log

`vercel --prod` from local is only an emergency path (broken auto-deploy integration). Default workflow is git push → PR → merge → auto-deploy, so prod always matches what's on GitHub main and nothing drifts



\### NEVER touch this project

\- hkubwxpyyejxffncxrez

\- This is a separate automations project, not the portal

\- Never link to it, never push migrations there



\## Non Negotiable Rules



\### Git

\- One commit per fix, every time, no exceptions

\- Commit message format: "Fix \[number]: \[name]"

&#x20; Example: "Fix 12: Confirmed surplus editable"

\- Never bundle multiple fixes into one commit

\- Never push to production without explicit instruction

&#x20; from Bree



\### Database

\- Always write a migration file in supabase/migrations/

\- Never edit the database directly

\- Never run migrations against hkubwxpyyejxffncxrez



\### After Each Fix

\- State what file changed and what changed in

&#x20; one sentence

\- Stop and wait for Bree to review at localhost:3000

\- Do not proceed to next fix without approval



\### If A Fix Is Ambiguous

\- Ask one clarifying question before touching code

\- Do not guess and build the wrong thing



\## Design System

\- Palette: #0a3d4a (dark), #0d6c7d (mid), #1a8a9c (light)

\- Text: charcoal #0f1729

\- Font: Inter

\- Icons: Tabler icons only

\- No emojis anywhere

\- Proper Case on all headers and labels

\- No dashes in compound words (use spaces instead)

\- cursor-pointer on every interactive element

\- Teal gradient (#0a3d4a to #0d6c7d) on all primary

&#x20; action buttons via shared class btn-primary



\## Product Principles

\- This is a SaaS product being sold publicly

\- Every label must be clear to a stranger on day one

\- No instructional static text in the UI

\- No placeholder labels that were never reviewed

\- Proper Case everywhere, no exceptions

\- Currency always formatted with commas

\- Phone numbers always formatted (555) 555-5555

\- No field ever wraps to two rows in a table



\## Key Business Logic

\- Est. Net To You = recovery fee dollar amount minus

&#x20; attorney cost

\- Recovery fee dollar amount = estimated surplus times

&#x20; (recovery fee percent divided by 100)

\- The owner take home figure never appears anywhere

\- Recovery fee percent lives once per lead in

&#x20; leads.recovery\_fee\_percent

\- below\_floor only flags true when estimated\_surplus

&#x20; is less than surplus\_floor and closing\_bid is not null

\- Lead ID generated once on insert, never edited

\- Stage changes always log an activity record



\## Architecture Notes

\- Staging Supabase: sghfmudgnddybsayfqbd

&#x20; (full portal schema, 42 test leads,

&#x20; migrations 0001-0014 applied)

\- Production Supabase: qvyhdexoicoppgrvvtov

&#x20; (empty until migrations run)

\- hkubwxpyyejxffncxrez is the MD research agent

&#x20; project, completely separate, never touch it

&#x20; from this repo

