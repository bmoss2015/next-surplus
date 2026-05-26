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

The assistant should drive the entire flow without manual GitHub clicks. `gh` CLI is installed at `~/.local/bin/gh` and pre-authed as bmoss2015 with repo scope. Use it.

1. Branch off main: `git checkout -b fix/<short-name>` (never commit directly to main from local)

2. Commit the change with the Fix [number]: [name] format

3. Push the branch: `git push -u origin fix/<short-name>` — Vercel auto-builds a preview URL on every branch push

4. Open the PR: `gh pr create --base main --head fix/<short-name> --title "..." --body "..."` (no browser tab needed)

5. Wait for the Vercel preview deploy to land. Confirm the fix on the preview URL — paste login creds inline (info@mossyland.com / MossEquity-858dc58d33!) so Bree doesn't have to look them up

6. After Bree confirms on preview, merge from the terminal: `gh pr merge <number> --merge --delete-branch`. Vercel auto-deploys main to production within seconds.

7. Monitor the prod deploy and report the final status — do not assume "merged" means "shipped". Poll `npx vercel ls` until the new Production deployment reaches Ready (or Error). If the deploy fails, surface the actual error from the build log via `npx vercel inspect <url> --logs`.

`vercel --prod` from local is only an emergency path (broken auto-deploy integration). Default workflow is git push → `gh pr create` → preview verify → `gh pr merge` → auto-deploy, so prod always matches what's on GitHub main and nothing drifts.

\#### Quick gh commands

\- `gh pr list --state open` — see open PRs

\- `gh pr view <number>` — see status, checks, comments

\- `gh pr checks <number>` — see CI / Vercel build status

\- `gh pr merge <number> --merge --delete-branch` — merge + clean up branch in one shot (use --squash if you prefer squash-merge)



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

\- Schema changes only via `supabase/migrations/*.sql` + `npx supabase db push --linked`. Never use Supabase MCP `apply_migration`, MCP `execute_sql` for DDL, or the dashboard SQL editor. If the file isn't in git, the change doesn't exist.

\- Every migration file is committed in the same PR as the code that depends on it. Local file + remote tracking + git stay in lockstep.

\- File naming: `NNNN_<short_name>.sql` where NNNN = max existing + 1. Never reuse a number.

\- Before pushing: `cat supabase/.temp/project-ref` must read `sghfmudgnddybsayfqbd` (staging). Verify every time.

\- Never edit the database directly through any UI or raw SQL tool.

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

---

## Slash Command Doc Updates

For updating the Product Build Status & Roadmap and the Architecture documentation, use slash command triggers. The skill at `.claude/skills/roadmap/SKILL.md` handles classification, preview, and commit.

**Triggers (any of these activate the skill):**

- `/roadmap [description]` — for product priorities, features, timeline changes (may also update Architecture if technically warranted)
- `/architecture [description]` — for pure technical decisions (no roadmap implication)
- `/docs [description]` — alias for `/roadmap`

**Behavior:**

1. Read the user's content after the slash command
2. Classify as Roadmap-only, Architecture-only, or Both
3. **Show a preview** of what will be added and to which file
4. Wait for user confirmation: `yes` / `edit` / `cancel`
5. On `yes`: edit files, commit with `chore(docs):` prefix, ask whether to trigger Worker rebuild

**Files this skill edits:**

- `product-build-status-roadmap-content.md` — the Roadmap source (rendered weekly into the Drive doc)
- `ARCHITECTURE.md` — the technical reference (ADRs, RFCs, tech stack, deploy, integrations)

**What this skill does NOT edit:**

- `CHANGELOG.md` (handled by git post-commit hook)
- `CLAUDE.md` (operational rules — manual edits only)

**Example interaction:**

User: `/roadmap We're going to add SMS outreach in Q3 using Twilio with per-org subaccounts.`

Claude Code response:
```
I'm interpreting this as TWO updates:

1. ROADMAP (product-build-status-roadmap-content.md)
   Section: Later This Year
   Adding:
   - SMS outreach via Twilio (Q3 launch)

2. ARCHITECTURE (ARCHITECTURE.md)
   Adding new ADR-015:
   Title: Twilio per-org subaccounts for SMS outreach
   Decision: ...
   Why: ...
   Decided: 2026-05-26

Commit message: "chore(docs): add SMS outreach to roadmap + ADR-015 for Twilio architecture"

Confirm? (yes / edit / cancel)
```


